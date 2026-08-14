"""Reading photos and scanned PDFs with a Claude vision model.

This provider exists for the documents that carry no structure: a Metro receipt
on thermal paper, a butcher's handwritten delivery note, a PDF that is really a
scan. Structured e-invoices never reach it — `ERechnungProvider` claims those
first, and routing that away from the model is the point (see `classify.py`).

Everything it returns goes through the same validation engine as the XML path.
The model's own confidence score is a hint about legibility, not a verdict on
correctness: self-reported confidence is weakly calibrated, and a model can be
fluent and wrong. The arithmetic checks in `app/validation/rules.py` are what
actually decide whether a document may be booked.
"""

from __future__ import annotations

import base64
import datetime as dt
from decimal import Decimal, InvalidOperation
from typing import Any, Final

import anthropic

from app.domain import (
    DocumentSource,
    DocumentType,
    ExtractedDocument,
    ExtractedLine,
    Party,
    VatRate,
)
from app.extraction.classify import classify
from app.extraction.client import Residency, model_id_for
from app.extraction.provider import (
    ExtractionError,
    ExtractionProvider,
    IntakeFile,
    Syntax,
    UnsupportedInput,
)
from app.extraction.schema import DocumentDraft, ExtractionDraft, LineDraft
from app.money import MoneyError, cents_from_string

MODEL: Final = "claude-opus-5"

#: Room for a long multi-document PDF plus the model's thinking. Anything much
#: tighter truncates a 40-line Metro receipt mid-document, and a truncated
#: response is a silent data-loss bug rather than a visible failure.
MAX_TOKENS: Final = 16_000

_MEDIA_TYPES: Final[dict[bytes, str]] = {
    b"\xff\xd8\xff": "image/jpeg",
    b"\x89PNG\r\n\x1a\n": "image/png",
    b"GIF8": "image/gif",
}

#: Written as instruction, not incantation. Every line here exists because
#: getting it wrong produces a specific, known accounting error — the German
#: rules in CLAUDE.md § 5 restated for the reader who is looking at the paper.
SYSTEM_PROMPT: Final = """\
You read German supplier documents for a restaurant's bookkeeping: invoices
(Rechnung), delivery notes (Lieferschein), credit notes (Gutschrift) and till
receipts (Kassenbeleg). You transcribe. You do not calculate, correct, or tidy.

Transcribe every amount exactly as printed, as text. Keep the document's own
notation — write "1.234,56" if that is what the paper says. Never convert a
number to a different format and never compute a value that is not printed: if
a line shows no unit price, return an empty string for it. A downstream system
checks the arithmetic and needs to see what was actually on the document,
including its mistakes.

Take the VAT rate for each line FROM THE DOCUMENT. Food is usually 7% and
drinks usually 19%, but the exceptions are numerous — milk drinks, take-away
versus in-house, catering — and a rate inferred from the product category is
wrong often enough to corrupt a tax return. If a line's rate is not printed and
cannot be tied to a rate group on the document, return "unknown".

Mark a line as Pfand only when it is a deposit on a container — Pfand, Leergut,
Mehrweg, Einwegpfand, DPG, a returned crate. A deposit is not goods cost and is
booked to its own account. A crate of beer is goods; the deposit on the crate is
not. When you are unsure, set is_pfand false and say so in the notes.

Set a line's confidence below 0.85 whenever the text is smudged, cut off, hand-
written, or ambiguous, and say what is wrong in the document notes. A line
flagged for review costs someone ten seconds. A confidently wrong line becomes
a booking error nobody looks for.

If the file holds several documents, return one entry per document. If a page
is blank, an advertisement, or a duplicate of the previous page, leave it out.
"""


class ClaudeVisionProvider(ExtractionProvider):
    name = "claude-vision"

    def __init__(
        self,
        client: Any,
        *,
        residency: Residency,
        model: str = MODEL,
        source_hint: DocumentSource | None = None,
    ) -> None:
        self._client = client
        self._residency = residency
        self._model = model_id_for(residency, model)
        self._source_hint = source_hint

    def supports(self, file: IntakeFile) -> bool:
        return classify(file) in {Syntax.IMAGE, Syntax.PDF_UNSTRUCTURED}

    def extract(self, file: IntakeFile) -> tuple[ExtractedDocument, ...]:
        syntax = classify(file)
        if syntax not in {Syntax.IMAGE, Syntax.PDF_UNSTRUCTURED}:
            raise UnsupportedInput(
                f"{file.filename}: {syntax} belongs to the deterministic parser, not the model"
            )

        try:
            response = self._call_with_grammar_retry(file, syntax)
        except anthropic.APIStatusError as exc:
            raise ExtractionError(f"{file.filename}: API error {exc.status_code}: {exc}") from exc
        except anthropic.APIConnectionError as exc:
            raise ExtractionError(f"{file.filename}: could not reach the API: {exc}") from exc

        # Checked before touching content: on a refusal `content` is empty or a
        # discarded partial, so indexing into it raises an unrelated IndexError
        # that hides what actually happened.
        if getattr(response, "stop_reason", None) == "refusal":
            raise ExtractionError(f"{file.filename}: the model declined to process this document")
        if getattr(response, "stop_reason", None) == "max_tokens":
            raise ExtractionError(
                f"{file.filename}: response hit the token limit and is truncated — "
                "split the file and retry rather than booking a partial document"
            )

        draft = response.parsed_output
        if draft is None:
            raise ExtractionError(f"{file.filename}: model returned no parsable result")

        source = self._source_hint or file.source
        return tuple(_to_document(d, provider=self.name, source=source) for d in draft.documents)

    def _call_with_grammar_retry(self, file: IntakeFile, syntax: Syntax) -> Any:
        """Retry once when the server times out compiling the output schema.

        Found on the first live call of the spike: a schema the server has not
        seen before is compiled into a grammar on first use, and that
        compilation can exceed its own deadline — returning
        `400 invalid_request_error: Grammar compilation timed out`. The
        identical request succeeded immediately afterwards, because the
        compiled grammar is cached by then.

        It is a 400, so nothing retries it: not the SDK (400s are client
        errors by definition) and not the pipeline's dead-letter logic. Left
        alone it would reject the first upload after every schema change —
        a real document, failed for a reason that has nothing to do with it.

        Deliberately narrow: matched on the message, one retry, and only for
        this text. A genuinely malformed request must still fail fast.
        """
        try:
            return self._call(file, syntax)
        except anthropic.APIStatusError as exc:
            if exc.status_code != 400 or "grammar compilation" not in str(exc).casefold():
                raise
            return self._call(file, syntax)

    def _call(self, file: IntakeFile, syntax: Syntax) -> Any:
        return self._client.messages.parse(
            model=self._model,
            max_tokens=MAX_TOKENS,
            system=[
                {
                    "type": "text",
                    "text": SYSTEM_PROMPT,
                    # The prompt is byte-identical on every document, so it is
                    # the whole cacheable prefix. The document itself comes
                    # after and is never part of the cache key.
                    "cache_control": {"type": "ephemeral"},
                }
            ],
            messages=[{"role": "user", "content": _content_blocks(file, syntax)}],
            output_format=ExtractionDraft,
        )


def _content_blocks(file: IntakeFile, syntax: Syntax) -> list[dict[str, Any]]:
    encoded = base64.standard_b64encode(file.content).decode("ascii")
    if syntax is Syntax.PDF_UNSTRUCTURED:
        block: dict[str, Any] = {
            "type": "document",
            "source": {"type": "base64", "media_type": "application/pdf", "data": encoded},
        }
    else:
        block = {
            "type": "image",
            "source": {"type": "base64", "media_type": _media_type(file.content), "data": encoded},
        }
    # Document first, instruction second: the model reads the page before it
    # reads what to do with it, which is also the order a person would use.
    return [block, {"type": "text", "text": "Transcribe this document."}]


def _media_type(content: bytes) -> str:
    for magic, media_type in _MEDIA_TYPES.items():
        if content.startswith(magic):
            return media_type
    raise UnsupportedInput("unrecognised image format")


def _to_document(
    draft: DocumentDraft, *, provider: str, source: DocumentSource
) -> ExtractedDocument:
    """Translate the wire draft into the strict domain model.

    A `ValidationError` escaping here means the model returned something the
    domain refuses — an unusable date, an amount that is not an amount. That is
    a real failure and is raised as one; coercing it would put a guess into the
    books.
    """
    return ExtractedDocument(
        doc_type=DocumentType(draft.doc_type),
        doc_number=draft.doc_number or None,
        doc_date=_parse_date(draft.doc_date),
        currency=draft.currency or "EUR",
        supplier=Party(
            name=draft.supplier_name or "unbekannt",
            vat_id=draft.supplier_vat_id or None,
            address=draft.supplier_address or None,
            confidence=draft.confidence,
        ),
        buyer=(
            Party(name=draft.buyer_name, confidence=draft.confidence)
            if draft.buyer_name
            else None
        ),
        lines=tuple(_to_line(line) for line in draft.lines),
        total_net_cents=_optional_cents(draft.total_net),
        total_vat_cents=_optional_cents(draft.total_vat),
        total_gross_cents=_optional_cents(draft.total_gross),
        provider=provider,
        source=source,
        confidence=draft.confidence,
    )


def _to_line(draft: LineDraft) -> ExtractedLine:
    line_total_cents = _optional_cents(draft.line_total) or 0
    return ExtractedLine(
        position=draft.position,
        description=draft.description,
        quantity=_parse_decimal(draft.quantity),
        unit=draft.unit or "Stk",
        unit_price=_parse_unit_price(draft, line_total_cents),
        line_total_cents=line_total_cents,
        vat_rate=VatRate(draft.vat_rate),
        is_pfand=draft.is_pfand,
        article_no=draft.article_no or None,
        ean=draft.ean or None,
        confidence=draft.confidence,
    )


def _parse_unit_price(draft: LineDraft, line_total_cents: int) -> Decimal:
    """Derive the unit price when the document does not print one.

    Metro receipts routinely show only quantity and line total. Deriving it here
    is safe in a way that deriving it in the model would not be: this is exact
    division of two transcribed numbers, so the line-math check still compares
    the document's own figures rather than validating a guess against itself.
    """
    if draft.unit_price.strip():
        return _parse_decimal(draft.unit_price)
    quantity = _parse_decimal(draft.quantity)
    if quantity == 0:
        return Decimal(0)
    return (Decimal(line_total_cents) / Decimal(100)) / quantity


def _parse_decimal(raw: str) -> Decimal:
    """Read a quantity the way the document wrote it, at full precision.

    Shares the money parser's separator rule — the last separator is the
    decimal one — because "1.250" is the same ambiguity for a weight as for an
    amount. It does *not* share its rounding: a butcher's line reads
    "1,234 kg", and routing that through cents would silently make it 1,23 kg
    and break the line-math check on a correct document.
    """
    text = raw.strip().replace(" ", "").replace(" ", "")
    if not text:
        return Decimal(0)

    last_dot, last_comma = text.rfind("."), text.rfind(",")
    if last_comma > last_dot:
        text = text.replace(".", "").replace(",", ".")
    else:
        text = text.replace(",", "")

    try:
        return Decimal(text)
    except InvalidOperation as exc:
        raise ExtractionError(f"unreadable quantity {raw!r}") from exc


def _optional_cents(raw: str) -> int | None:
    text = raw.strip()
    if not text:
        return None
    try:
        return cents_from_string(text)
    except MoneyError as exc:
        raise ExtractionError(f"unreadable amount {raw!r}") from exc


def _parse_date(raw: str) -> dt.date | None:
    text = raw.strip()
    if not text:
        return None
    try:
        return dt.date.fromisoformat(text)
    except ValueError:
        # The prompt asks for ISO; a German-format date coming back means the
        # model ignored that, which is worth surfacing rather than smoothing.
        try:
            return dt.datetime.strptime(text, "%d.%m.%Y").date()
        except ValueError as exc:
            raise ExtractionError(f"unreadable date {raw!r}") from exc
