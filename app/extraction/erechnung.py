"""Deterministic reader for XRechnung and ZUGFeRD.

This is a first-class path, not a fallback. Since 2025-01-01 every German
business must be able to receive an E-Rechnung, and the share arriving as XML
only grows. An LLM must never see these bytes: the values are already exact,
and asking a model to restate them can only introduce error.

Two syntaxes carry the same semantics. XRechnung permits both UBL and CII;
ZUGFeRD (>= 2.0) is CII embedded in a PDF/A-3. All three end up in the same
`ExtractedDocument`, so nothing downstream knows which arrived.
"""

from __future__ import annotations

import datetime as dt
import io
from decimal import Decimal, InvalidOperation

import pikepdf
from lxml import etree

from app.domain import (
    CERTAIN,
    DocumentSource,
    DocumentType,
    ExtractedDocument,
    ExtractedLine,
    Party,
    VatRate,
)
from app.extraction.classify import CII_NS, UBL_CREDIT_NOTE_NS, UBL_INVOICE_NS, classify, parse_xml
from app.extraction.pfand import PFAND_MATCH_CONFIDENCE, looks_like_pfand
from app.extraction.provider import (
    ExtractionError,
    ExtractionProvider,
    IntakeFile,
    Syntax,
    UnsupportedInput,
)
from app.money import cents_from_decimal

CBC = "urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
CAC = "urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
RAM = "urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100"
UDT = "urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100"

_NS = {"cbc": CBC, "cac": CAC, "ram": RAM, "udt": UDT, "rsm": CII_NS}

#: UNTDID 1001 document type codes. 381 is a credit note in both syntaxes; the
#: rest of the codes a supplier may legitimately send all mean "invoice" for our
#: purposes (corrected invoice, self-billed invoice, ...).
_CREDIT_NOTE_CODES = frozenset({"381", "396", "532"})

#: Attachment names fixed by the ZUGFeRD and XRechnung specifications.
_EMBEDDED_XML_NAMES = (
    "factur-x.xml",
    "zugferd-invoice.xml",
    "ZUGFeRD-invoice.xml",
    "xrechnung.xml",
)


class ERechnungProvider(ExtractionProvider):
    name = "erechnung-xml"

    def supports(self, file: IntakeFile) -> bool:
        return classify(file) in {
            Syntax.UBL_INVOICE,
            Syntax.UBL_CREDIT_NOTE,
            Syntax.CII,
            Syntax.ZUGFERD_PDF,
        }

    def extract(self, file: IntakeFile) -> tuple[ExtractedDocument, ...]:
        syntax = classify(file)
        match syntax:
            case Syntax.ZUGFERD_PDF:
                xml = _embedded_xml(file.content)
                inner = IntakeFile(filename=file.filename, content=xml, source=file.source)
                return self.extract(inner)
            case Syntax.UBL_INVOICE | Syntax.UBL_CREDIT_NOTE:
                root = parse_xml(file.content)
                return (_read_ubl(root, provider=self.name, source=file.source),)
            case Syntax.CII:
                root = parse_xml(file.content)
                return (_read_cii(root, provider=self.name, source=file.source),)
            case _:
                raise UnsupportedInput(f"{file.filename}: not a structured e-invoice ({syntax})")


def _embedded_xml(pdf_bytes: bytes) -> bytes:
    """Pull the CII XML out of a PDF/A-3.

    The classifier's byte scan can be fooled by a PDF that merely mentions the
    name; this is where that is settled, so a false positive there costs one
    failed lookup and a clear error rather than a wrong routing decision.
    """
    try:
        with pikepdf.open(io.BytesIO(pdf_bytes)) as pdf:
            attachments = pdf.attachments
            for name in _EMBEDDED_XML_NAMES:
                if name in attachments:
                    return bytes(attachments[name].get_file().read_bytes())
            found = ", ".join(attachments.keys()) or "none"
            raise ExtractionError(f"PDF carries no e-invoice attachment (found: {found})")
    except pikepdf.PdfError as exc:
        raise ExtractionError(f"not a readable PDF: {exc}") from exc


def _text(node: etree._Element, path: str) -> str | None:
    found = node.find(path, namespaces=_NS)
    if found is None or found.text is None:
        return None
    text = " ".join(found.text.split())
    return text or None


def _decimal(node: etree._Element, path: str) -> Decimal | None:
    raw = _text(node, path)
    if raw is None:
        return None
    try:
        return Decimal(raw)
    except InvalidOperation as exc:
        raise ExtractionError(f"{path}: not a number: {raw!r}") from exc


def _cents(node: etree._Element, path: str) -> int | None:
    value = _decimal(node, path)
    return None if value is None else cents_from_decimal(value)


def _attr(node: etree._Element, path: str, name: str) -> str | None:
    found = node.find(path, namespaces=_NS)
    if found is None:
        return None
    value = found.get(name)
    return str(value) if value is not None else None


# --------------------------------------------------------------------------- UBL


def _read_ubl(
    root: etree._Element, *, provider: str, source: DocumentSource
) -> ExtractedDocument:
    is_credit_note = etree.QName(root).namespace == UBL_CREDIT_NOTE_NS
    if etree.QName(root).namespace not in (UBL_INVOICE_NS, UBL_CREDIT_NOTE_NS):
        raise UnsupportedInput("not a UBL invoice or credit note")

    type_code = _text(root, "cbc:InvoiceTypeCode") or _text(root, "cbc:CreditNoteTypeCode")
    doc_type = (
        DocumentType.GUTSCHRIFT
        if is_credit_note or (type_code in _CREDIT_NOTE_CODES)
        else DocumentType.RECHNUNG
    )

    line_tag = "cac:CreditNoteLine" if is_credit_note else "cac:InvoiceLine"
    qty_tag = "cbc:CreditedQuantity" if is_credit_note else "cbc:InvoicedQuantity"

    lines = tuple(
        _read_ubl_line(node, fallback_position=index, qty_tag=qty_tag)
        for index, node in enumerate(root.findall(line_tag, namespaces=_NS), start=1)
    )

    return ExtractedDocument(
        doc_type=doc_type,
        doc_number=_text(root, "cbc:ID"),
        doc_date=_read_iso_date(_text(root, "cbc:IssueDate")),
        currency=_text(root, "cbc:DocumentCurrencyCode") or "EUR",
        supplier=_read_ubl_party(root, "cac:AccountingSupplierParty/cac:Party"),
        buyer=_read_ubl_party(root, "cac:AccountingCustomerParty/cac:Party"),
        lines=lines,
        total_net_cents=_cents(root, "cac:LegalMonetaryTotal/cbc:TaxExclusiveAmount"),
        total_vat_cents=_cents(root, "cac:TaxTotal/cbc:TaxAmount"),
        total_gross_cents=_cents(root, "cac:LegalMonetaryTotal/cbc:TaxInclusiveAmount"),
        provider=provider,
        source=source,
        confidence=CERTAIN,
    )


def _read_ubl_party(root: etree._Element, base: str) -> Party:
    node = root.find(base, namespaces=_NS)
    if node is None:
        return Party(name="unbekannt", confidence=0.0)
    name = (
        _text(node, "cac:PartyLegalEntity/cbc:RegistrationName")
        or _text(node, "cac:PartyName/cbc:Name")
        or "unbekannt"
    )
    return Party(
        name=name,
        vat_id=_text(node, "cac:PartyTaxScheme/cbc:CompanyID"),
        tax_number=_text(node, "cac:PartyLegalEntity/cbc:CompanyID"),
        address=_join_address(
            _text(node, "cac:PostalAddress/cbc:StreetName"),
            _text(node, "cac:PostalAddress/cbc:PostalZone"),
            _text(node, "cac:PostalAddress/cbc:CityName"),
        ),
        confidence=CERTAIN if name != "unbekannt" else 0.0,
    )


def _read_ubl_line(node: etree._Element, *, fallback_position: int, qty_tag: str) -> ExtractedLine:
    quantity = _decimal(node, qty_tag) or Decimal(0)
    line_total_cents = _cents(node, "cbc:LineExtensionAmount") or 0
    description = (
        _text(node, "cac:Item/cbc:Name")
        or _text(node, "cac:Item/cbc:Description")
        or "ohne Bezeichnung"
    )

    # BaseQuantity is the trap in UBL: PriceAmount is the price for
    # BaseQuantity units, not for one. A supplier quoting 4,50 € per 100 pieces
    # writes PriceAmount=4.50 BaseQuantity=100. Dividing is not optional.
    price = _decimal(node, "cac:Price/cbc:PriceAmount") or Decimal(0)
    base_quantity = _decimal(node, "cac:Price/cbc:BaseQuantity")
    if base_quantity and base_quantity != 0:
        price = price / base_quantity

    is_pfand = looks_like_pfand(description, line_total_cents=line_total_cents)
    return ExtractedLine(
        position=int(_text(node, "cbc:ID") or fallback_position),
        description=description,
        quantity=quantity,
        unit=_attr(node, qty_tag, "unitCode") or "C62",
        unit_price=price,
        line_total_cents=line_total_cents,
        vat_rate=_vat_rate(_decimal(node, "cac:Item/cac:ClassifiedTaxCategory/cbc:Percent")),
        is_pfand=is_pfand,
        article_no=_text(node, "cac:Item/cac:SellersItemIdentification/cbc:ID"),
        ean=_text(node, "cac:Item/cac:StandardItemIdentification/cbc:ID"),
        confidence=PFAND_MATCH_CONFIDENCE if is_pfand else CERTAIN,
    )


# --------------------------------------------------------------------------- CII


def _read_cii(
    root: etree._Element, *, provider: str, source: DocumentSource
) -> ExtractedDocument:
    header = root.find("rsm:ExchangedDocument", namespaces=_NS)
    transaction = root.find("rsm:SupplyChainTradeTransaction", namespaces=_NS)
    if header is None or transaction is None:
        raise UnsupportedInput("CII document is missing its header or transaction")

    type_code = _text(header, "ram:TypeCode")
    doc_type = (
        DocumentType.GUTSCHRIFT if type_code in _CREDIT_NOTE_CODES else DocumentType.RECHNUNG
    )

    agreement = transaction.find("ram:ApplicableHeaderTradeAgreement", namespaces=_NS)
    settlement = transaction.find("ram:ApplicableHeaderTradeSettlement", namespaces=_NS)
    if agreement is None or settlement is None:
        raise UnsupportedInput("CII document is missing agreement or settlement")

    totals_path = "ram:SpecifiedTradeSettlementHeaderMonetarySummation"
    lines = tuple(
        _read_cii_line(node, fallback_position=index)
        for index, node in enumerate(
            transaction.findall("ram:IncludedSupplyChainTradeLineItem", namespaces=_NS), start=1
        )
    )

    return ExtractedDocument(
        doc_type=doc_type,
        doc_number=_text(header, "ram:ID"),
        doc_date=_read_cii_date(header),
        currency=_text(settlement, "ram:InvoiceCurrencyCode") or "EUR",
        supplier=_read_cii_party(agreement, "ram:SellerTradeParty"),
        buyer=_read_cii_party(agreement, "ram:BuyerTradeParty"),
        lines=lines,
        total_net_cents=_cents(settlement, f"{totals_path}/ram:TaxBasisTotalAmount"),
        total_vat_cents=_cents(settlement, f"{totals_path}/ram:TaxTotalAmount"),
        total_gross_cents=_cents(settlement, f"{totals_path}/ram:GrandTotalAmount"),
        provider=provider,
        source=source,
        confidence=CERTAIN,
    )


def _read_cii_party(node: etree._Element, base: str) -> Party:
    party = node.find(base, namespaces=_NS)
    if party is None:
        return Party(name="unbekannt", confidence=0.0)
    name = _text(party, "ram:Name") or "unbekannt"
    return Party(
        name=name,
        vat_id=_cii_tax_id(party, scheme="VA"),
        tax_number=_cii_tax_id(party, scheme="FC"),
        address=_join_address(
            _text(party, "ram:PostalTradeAddress/ram:LineOne"),
            _text(party, "ram:PostalTradeAddress/ram:PostcodeCode"),
            _text(party, "ram:PostalTradeAddress/ram:CityName"),
        ),
        confidence=CERTAIN if name != "unbekannt" else 0.0,
    )


def _cii_tax_id(party: etree._Element, *, scheme: str) -> str | None:
    """CII distinguishes VAT id (schemeID VA) from tax number (FC) by attribute."""
    for registration in party.findall("ram:SpecifiedTaxRegistration", namespaces=_NS):
        node = registration.find("ram:ID", namespaces=_NS)
        if node is not None and node.get("schemeID") == scheme and node.text:
            return node.text.strip()
    return None


def _read_cii_line(node: etree._Element, *, fallback_position: int) -> ExtractedLine:
    product = "ram:SpecifiedTradeProduct"
    agreement = "ram:SpecifiedLineTradeAgreement"
    delivery = "ram:SpecifiedLineTradeDelivery"
    settlement = "ram:SpecifiedLineTradeSettlement"

    description = _text(node, f"{product}/ram:Name") or "ohne Bezeichnung"
    line_total_cents = (
        _cents(
            node,
            f"{settlement}/ram:SpecifiedTradeSettlementLineMonetarySummation/ram:LineTotalAmount",
        )
        or 0
    )

    price = _decimal(
        node, f"{agreement}/ram:NetPriceProductTradePrice/ram:ChargeAmount"
    ) or Decimal(0)
    basis = _decimal(node, f"{agreement}/ram:NetPriceProductTradePrice/ram:BasisQuantity")
    if basis and basis != 0:
        price = price / basis

    is_pfand = looks_like_pfand(description, line_total_cents=line_total_cents)
    return ExtractedLine(
        position=int(
            _text(node, "ram:AssociatedDocumentLineDocument/ram:LineID") or fallback_position
        ),
        description=description,
        quantity=_decimal(node, f"{delivery}/ram:BilledQuantity") or Decimal(0),
        unit=_attr(node, f"{delivery}/ram:BilledQuantity", "unitCode") or "C62",
        unit_price=price,
        line_total_cents=line_total_cents,
        vat_rate=_vat_rate(
            _decimal(node, f"{settlement}/ram:ApplicableTradeTax/ram:RateApplicablePercent")
        ),
        is_pfand=is_pfand,
        article_no=_text(node, f"{product}/ram:SellerAssignedID"),
        ean=_text(node, f"{product}/ram:GlobalID"),
        confidence=PFAND_MATCH_CONFIDENCE if is_pfand else CERTAIN,
    )


def _read_cii_date(header: etree._Element) -> dt.date | None:
    """CII dates are `<DateTimeString format="102">20260814</DateTimeString>`."""
    node = header.find("ram:IssueDateTime/udt:DateTimeString", namespaces=_NS)
    if node is None or not node.text:
        return None
    raw = node.text.strip()
    fmt = node.get("format", "102")
    if fmt != "102":
        raise ExtractionError(f"unsupported CII date format {fmt!r}")
    try:
        return dt.datetime.strptime(raw, "%Y%m%d").date()
    except ValueError as exc:
        raise ExtractionError(f"unreadable CII date {raw!r}") from exc


# --------------------------------------------------------------------------- shared


def _read_iso_date(raw: str | None) -> dt.date | None:
    if raw is None:
        return None
    try:
        return dt.date.fromisoformat(raw)
    except ValueError as exc:
        raise ExtractionError(f"unreadable date {raw!r}") from exc


def _vat_rate(percent: Decimal | None) -> VatRate:
    """Taken from the document. A missing rate is UNKNOWN, never a default."""
    return VatRate.UNKNOWN if percent is None else VatRate.from_percent(percent)


def _join_address(street: str | None, zip_code: str | None, city: str | None) -> str | None:
    parts = [part for part in (street, " ".join(filter(None, (zip_code, city)))) if part]
    return ", ".join(parts) or None
