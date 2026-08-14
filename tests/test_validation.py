from __future__ import annotations

import datetime as dt
from decimal import Decimal

import pytest

from app.domain import (
    DocumentSource,
    DocumentType,
    ExtractedDocument,
    ExtractedLine,
    Party,
    VatRate,
)
from app.extraction.erechnung import ERechnungProvider
from app.validation.rules import (
    Code,
    PriceHistoryEntry,
    ValidationContext,
    fingerprint,
    may_book,
    validate,
)
from tests.conftest import load

TODAY = dt.date(2026, 8, 14)


def make_line(**overrides: object) -> ExtractedLine:
    base: dict[str, object] = {
        "position": 1,
        "description": "Tomaten gehackt 2,5 kg",
        "quantity": Decimal(6),
        "unit": "H87",
        "unit_price": Decimal("3.20"),
        "line_total_cents": 1920,
        "vat_rate": VatRate.REDUCED,
    }
    return ExtractedLine(**(base | overrides))  # type: ignore[arg-type]


def make_doc(
    lines: tuple[ExtractedLine, ...] | None = None, **overrides: object
) -> ExtractedDocument:
    body = lines or (make_line(),)
    net = sum(line.line_total_cents for line in body)
    base: dict[str, object] = {
        "doc_type": DocumentType.RECHNUNG,
        "doc_number": "RE-1",
        "doc_date": dt.date(2026, 8, 10),
        "currency": "EUR",
        "supplier": Party(name="Gemüse Rhein GmbH", vat_id="DE123456789"),
        "lines": body,
        "total_net_cents": net,
        "total_vat_cents": round(net * 0.07),
        "total_gross_cents": net + round(net * 0.07),
        "provider": "test",
        "source": DocumentSource.UPLOAD,
    }
    return ExtractedDocument(**(base | overrides))  # type: ignore[arg-type]


def codes(document: ExtractedDocument, ctx: ValidationContext | None = None) -> set[Code]:
    return {finding.code for finding in validate(document, ctx or ValidationContext(today=TODAY))}


def test_a_correct_document_is_bookable() -> None:
    findings = validate(make_doc(), ValidationContext(today=TODAY))
    assert findings == []
    assert may_book(findings)


def test_line_math_blocks() -> None:
    doc = make_doc((make_line(line_total_cents=1950),))
    findings = validate(doc, ValidationContext(today=TODAY))
    assert Code.LINE_MATH in {f.code for f in findings}
    assert not may_book(findings)


def test_line_math_tolerates_two_cents() -> None:
    doc = make_doc((make_line(line_total_cents=1922),))
    assert Code.LINE_MATH not in codes(doc)


def test_sub_cent_unit_price_is_not_a_false_alarm() -> None:
    """1 000 napkins at 0,008 € is 8,00 € — and must not report line math.

    Rounding the rate to whole cents first turns this into 10,00 € and the
    check fires on a document that is perfectly correct.
    """
    line = make_line(
        description="Serviette 2-lagig",
        quantity=Decimal(1000),
        unit_price=Decimal("0.008"),
        line_total_cents=800,
    )
    assert Code.LINE_MATH not in codes(make_doc((line,)))


def test_missing_vat_rate_blocks_rather_than_guessing() -> None:
    doc = make_doc((make_line(vat_rate=VatRate.UNKNOWN),))
    assert Code.VAT_RATE_MISSING in codes(doc)


def test_mixed_rates_recompute_correctly() -> None:
    """Real fixture, two rates, VAT rounded per group — must stay silent."""
    (doc,) = ERechnungProvider().extract(load("xrechnung-cii-gemischt.xml"))
    findings = validate(doc, ValidationContext(today=TODAY))
    assert [f.code for f in findings] == []


def test_drinks_invoice_only_warns_about_the_pfand_guess() -> None:
    (doc,) = ERechnungProvider().extract(load("xrechnung-ubl-getraenke.xml"))
    findings = validate(doc, ValidationContext(today=TODAY))
    assert {f.code for f in findings} == {Code.PFAND_UNCONFIRMED}
    assert may_book(findings), "an unconfirmed Pfand line is a warning, not a block"


def test_vat_total_mismatch_blocks() -> None:
    doc = make_doc(total_vat_cents=200)
    assert Code.VAT_MISMATCH in codes(doc)


def test_gross_that_does_not_add_up_blocks() -> None:
    doc = make_doc(total_gross_cents=99999)
    assert Code.DOCUMENT_TOTAL in codes(doc)


def test_duplicate_blocks() -> None:
    doc = make_doc()
    ctx = ValidationContext(today=TODAY, seen_fingerprints=frozenset({fingerprint(doc)}))
    findings = validate(doc, ctx)
    assert Code.DUPLICATE in {f.code for f in findings}
    assert not may_book(findings)


def test_duplicate_ignores_the_file_it_arrived_as() -> None:
    """Same invoice as photo and as XML must collide on meaning, not bytes."""
    as_xml = make_doc(source=DocumentSource.EMAIL, provider="erechnung-xml")
    as_photo = make_doc(source=DocumentSource.PHOTO, provider="vision")
    assert fingerprint(as_xml) == fingerprint(as_photo)


@pytest.mark.parametrize(
    ("previous", "current", "expect_flag"),
    [
        (Decimal("3.20"), Decimal("3.20"), False),
        (Decimal("3.20"), Decimal("3.30"), False),  # +3.1%, under the 5% threshold
        (Decimal("3.20"), Decimal("3.60"), True),  # +12.5%
        (Decimal("3.20"), Decimal("2.80"), True),  # a drop is worth knowing too
    ],
)
def test_price_change_threshold(previous: Decimal, current: Decimal, expect_flag: bool) -> None:
    doc = make_doc((make_line(unit_price=current, line_total_cents=int(current * 600)),))
    ctx = ValidationContext(
        today=TODAY,
        known_prices={
            ("DE123456789", "tomaten gehackt 2,5 kg"): PriceHistoryEntry(
                unit_price=previous, observed_on=dt.date(2026, 6, 2)
            )
        },
    )
    assert (Code.PRICE_JUMP in codes(doc, ctx)) is expect_flag


def test_price_change_is_a_warning_not_a_block() -> None:
    doc = make_doc((make_line(unit_price=Decimal("9.99"), line_total_cents=5994),))
    ctx = ValidationContext(
        today=TODAY,
        known_prices={
            ("DE123456789", "tomaten gehackt 2,5 kg"): PriceHistoryEntry(
                unit_price=Decimal("3.20"), observed_on=dt.date(2026, 6, 2)
            )
        },
    )
    findings = validate(doc, ctx)
    assert Code.PRICE_JUMP in {f.code for f in findings}
    assert may_book(findings), "a price rise is news, not an error in the document"


def test_unknown_product_is_not_compared() -> None:
    """No history means no alert — never a comparison against a guess.

    This is the +424% bug from the prototype: a pack price measured against a
    per-kilo history. Silence is the correct output until the catalog mapping
    supplies a conversion factor.
    """
    doc = make_doc((make_line(unit_price=Decimal("42.90"), line_total_cents=25740),))
    assert Code.PRICE_JUMP not in codes(doc)


def test_missing_number_and_date_block() -> None:
    doc = make_doc(doc_number=None, doc_date=None)
    found = codes(doc)
    assert {Code.MISSING_NUMBER, Code.MISSING_DATE} <= found


def test_future_date_warns_only() -> None:
    doc = make_doc(doc_date=dt.date(2026, 12, 24))
    findings = validate(doc, ValidationContext(today=TODAY))
    assert Code.FUTURE_DATE in {f.code for f in findings}
    assert may_book(findings)
