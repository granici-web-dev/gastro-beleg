"""Run one document through the real pipeline and print what came back.

    uv run python scripts/extract.py fixtures/metro-kassenbon.jpg

This is the spike's measuring instrument, not a product entry point. It prints
the extraction *and* the validation findings side by side, because the question
the spike has to answer is not "did it read something" but "did the checks
catch what it got wrong".
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

from dotenv import load_dotenv

from app.domain import DocumentSource, ExtractedDocument
from app.extraction.classify import classify
from app.extraction.client import Residency, build_client
from app.extraction.erechnung import ERechnungProvider
from app.extraction.provider import STRUCTURED_SYNTAXES, ExtractionError, IntakeFile
from app.extraction.vision import ClaudeVisionProvider
from app.money import format_cents
from app.validation.rules import Severity, ValidationContext, validate


def main(argv: list[str]) -> int:
    if len(argv) != 2:
        print(__doc__)
        return 2

    load_dotenv()
    path = Path(argv[1])
    if not path.is_file():
        print(f"no such file: {path}")
        return 2

    file = IntakeFile(
        filename=path.name,
        content=path.read_bytes(),
        source=DocumentSource.PHOTO,
    )
    syntax = classify(file)
    print(f"file      {path}  ({len(file.content):,} bytes)")
    print(f"classified {syntax}")

    try:
        documents = _extract(file, syntax)
    except ExtractionError as exc:
        print(f"\nEXTRACTION FAILED: {exc}")
        return 1

    for index, document in enumerate(documents, start=1):
        print(f"\n{'=' * 72}\ndocument {index} of {len(documents)}   via {document.provider}")
        _print_document(document)

    return 0


def _extract(file: IntakeFile, syntax: str) -> tuple[ExtractedDocument, ...]:
    if syntax in STRUCTURED_SYNTAXES:
        print("route     deterministic parser (no model call)")
        return ERechnungProvider().extract(file)

    residency = Residency(os.environ.get("GASTROBELEG_RESIDENCY", "dev-unrestricted"))
    allow_non_eu = os.environ.get("GASTROBELEG_ALLOW_NON_EU", "").lower() == "true"
    print(f"route     vision model, residency={residency}")

    client = build_client(residency, allow_non_eu=allow_non_eu)
    return ClaudeVisionProvider(client, residency=residency).extract(file)


def _print_document(document: ExtractedDocument) -> None:
    print(
        f"  {document.doc_type}  {document.doc_number or '(no number)'}  "
        f"{document.doc_date or '(no date)'}  confidence {document.confidence:.2f}"
    )
    print(f"  supplier  {document.supplier.name}  {document.supplier.vat_id or ''}")

    print(f"\n  {'#':>2} {'description':<34} {'qty':>9} {'price':>10} {'total':>10}  VAT  P  conf")
    for line in document.lines:
        print(
            f"  {line.position:>2} {line.description[:34]:<34} {line.quantity:>9} "
            f"{line.unit_price:>10} {format_cents(line.line_total_cents):>10} "
            f"{line.vat_rate.value:>4}  {'Y' if line.is_pfand else '.'}  {line.confidence:.2f}"
        )

    for label, value in (
        ("net", document.total_net_cents),
        ("VAT", document.total_vat_cents),
        ("gross", document.total_gross_cents),
    ):
        print(f"  {label:>5}   {format_cents(value) if value is not None else '(not printed)'}")

    findings = validate(document, ValidationContext())
    if not findings:
        print("\n  checks    clean — bookable")
        return

    blocking = [f for f in findings if f.severity is Severity.BLOCKING]
    print(f"\n  checks    {len(blocking)} blocking, {len(findings) - len(blocking)} warnings")
    for finding in findings:
        mark = "BLOCK" if finding.severity is Severity.BLOCKING else "warn "
        print(f"    [{mark}] {finding.code}: {finding.message}")


if __name__ == "__main__":
    sys.exit(main(sys.argv))
