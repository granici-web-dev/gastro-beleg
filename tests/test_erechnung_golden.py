"""Golden-file tests: every fixture must read exactly, to the cent."""

from __future__ import annotations

import datetime as dt
from decimal import Decimal

import pytest

from app.domain import DocumentSource, DocumentType, VatRate
from app.extraction.classify import classify
from app.extraction.erechnung import ERechnungProvider
from app.extraction.provider import IntakeFile, Syntax, UnsupportedInput
from tests.conftest import load


@pytest.fixture
def provider() -> ERechnungProvider:
    return ERechnungProvider()


def test_classifies_ubl(provider: ERechnungProvider) -> None:
    file = load("xrechnung-ubl-getraenke.xml")
    assert classify(file) is Syntax.UBL_INVOICE
    assert provider.supports(file)


def test_classifies_cii(provider: ERechnungProvider) -> None:
    assert classify(load("xrechnung-cii-gemischt.xml")) is Syntax.CII


def test_unknown_xml_is_not_claimed(provider: ERechnungProvider) -> None:
    """The classifier must not fall through to "first case wins".

    A bare-name pattern in a `match` binds instead of comparing, which made an
    earlier version return UBL_INVOICE for every XML on earth. This is the
    regression guard.
    """
    file = IntakeFile(
        filename="irgendwas.xml",
        content=b'<?xml version="1.0"?><note><to>Marco</to></note>',
        source=DocumentSource.EMAIL,
    )
    assert classify(file) is Syntax.UNKNOWN
    assert not provider.supports(file)
    with pytest.raises(UnsupportedInput):
        provider.extract(file)


def test_ubl_drinks_invoice_reads_exactly(provider: ERechnungProvider) -> None:
    (doc,) = provider.extract(load("xrechnung-ubl-getraenke.xml"))

    assert doc.doc_type is DocumentType.RECHNUNG
    assert doc.doc_number == "GT-2026-04417"
    assert doc.doc_date == dt.date(2026, 8, 4)
    assert doc.currency == "EUR"
    assert doc.supplier.name == "Rheinland Getränkehandel GmbH"
    assert doc.supplier.vat_id == "DE811907980"
    assert doc.supplier.address == "Industriestraße 14, 40699 Erkrath"
    assert doc.total_net_cents == 19400
    assert doc.total_vat_cents == 3686
    assert doc.total_gross_cents == 23086

    water, napkins, deposit = doc.lines

    assert water.description == "Mineralwasser Classic 0,75 l"
    assert water.quantity == Decimal(24)
    assert water.unit_price == Decimal("4.80")
    assert water.line_total_cents == 11520
    assert water.vat_rate is VatRate.STANDARD
    assert water.ean == "4001234567890"
    assert not water.is_pfand

    # BaseQuantity=100 means the quoted 3,80 € buys 100 napkins.
    assert napkins.unit_price == Decimal("0.038")
    assert napkins.line_total_cents == 3800

    assert deposit.is_pfand
    assert deposit.confidence < 1.0, "a word match must not claim certainty"


def test_pfand_is_kept_out_of_goods(provider: ERechnungProvider) -> None:
    (doc,) = provider.extract(load("xrechnung-ubl-getraenke.xml"))
    assert [line.position for line in doc.pfand_lines] == [3]
    assert [line.position for line in doc.goods_lines] == [1, 2]
    assert sum(line.line_total_cents for line in doc.goods_lines) == 15320


def test_cii_mixed_vat_reads_exactly(provider: ERechnungProvider) -> None:
    (doc,) = provider.extract(load("xrechnung-cii-gemischt.xml"))

    assert doc.doc_number == "RE-2026-88231"
    assert doc.doc_date == dt.date(2026, 8, 7)
    assert doc.supplier.name == "Vollsortiment Nord GmbH & Co. KG"
    assert doc.supplier.vat_id == "DE114203301"
    assert doc.supplier.tax_number == "60/123/45678"
    assert doc.total_net_cents == 13252
    assert doc.total_vat_cents == 1516
    assert doc.total_gross_cents == 14768

    flour, cocoa, detergent = doc.lines
    assert flour.vat_rate is VatRate.REDUCED
    assert flour.article_no == "MEHL-405-25"
    assert flour.ean == "4009876543210"
    assert flour.line_total_cents == 5520

    # The trap: a milk drink is 7%, not the 19% "it is a drink" would suggest.
    assert cocoa.vat_rate is VatRate.REDUCED
    assert detergent.vat_rate is VatRate.STANDARD


def test_zugferd_pdf_yields_the_same_document(
    provider: ERechnungProvider, zugferd_pdf: IntakeFile
) -> None:
    """A ZUGFeRD PDF must produce exactly what its embedded XML produces."""
    assert classify(zugferd_pdf) is Syntax.ZUGFERD_PDF

    (from_pdf,) = provider.extract(zugferd_pdf)
    (from_xml,) = provider.extract(load("xrechnung-cii-gemischt.xml"))

    assert from_pdf.model_dump() == from_xml.model_dump()


def test_plain_pdf_is_not_treated_as_structured(provider: ERechnungProvider) -> None:
    file = IntakeFile(
        filename="foto.pdf",
        content=b"%PDF-1.7\n% just a scan, no attachment\n",
        source=DocumentSource.PHOTO,
    )
    assert classify(file) is Syntax.PDF_UNSTRUCTURED
    assert not provider.supports(file)


def test_xxe_is_disarmed() -> None:
    """The mail inbox accepts attachments from anyone who learns the address."""
    hostile = b"""<?xml version="1.0"?>
    <!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>
    <Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2">
      <ID>&xxe;</ID>
    </Invoice>"""
    file = IntakeFile(filename="boese.xml", content=hostile, source=DocumentSource.EMAIL)
    # Either it refuses to parse, or it parses without resolving the entity.
    # What must never happen is /etc/passwd ending up in a field.
    syntax = classify(file)
    if syntax is Syntax.UBL_INVOICE:
        (doc,) = ERechnungProvider().extract(file)
        assert "root:" not in (doc.doc_number or "")
    else:
        assert syntax is Syntax.UNKNOWN
