"""Decide what a file is before anything tries to read it.

This is the fork that keeps structured XML away from the LLM. It is deliberately
dumb — root element names and magic bytes, no heuristics that could drift — so
that the answer is auditable when a Betriebsprüfung asks how a given document
was processed.
"""

from __future__ import annotations

from lxml import etree

from app.extraction.provider import IntakeFile, Syntax

UBL_INVOICE_NS = "urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
UBL_CREDIT_NOTE_NS = "urn:oasis:names:specification:ubl:schema:xsd:CreditNote-2"
CII_NS = "urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"

_PDF_MAGIC = b"%PDF-"
_IMAGE_MAGIC: tuple[tuple[bytes, str], ...] = (
    (b"\xff\xd8\xff", "jpeg"),
    (b"\x89PNG\r\n\x1a\n", "png"),
    (b"GIF8", "gif"),
    (b"II*\x00", "tiff"),
    (b"MM\x00*", "tiff"),
)

#: XML bombs are a real intake risk: the mail inbox accepts attachments from
#: anyone who learns a tenant address. resolve_entities=False disarms XXE and
#: billion-laughs; huge_tree stays off so a crafted file cannot exhaust memory.
_PARSER = etree.XMLParser(
    resolve_entities=False,
    no_network=True,
    huge_tree=False,
    recover=False,
)


def parse_xml(content: bytes) -> etree._Element:
    """Parse defensively. Raises etree.XMLSyntaxError on anything malformed."""
    return etree.fromstring(content, parser=_PARSER)


def classify(file: IntakeFile) -> Syntax:
    head = file.content[:1024].lstrip()

    if head.startswith(_PDF_MAGIC):
        if _pdf_has_embedded_xml(file.content):
            return Syntax.ZUGFERD_PDF
        return Syntax.PDF_UNSTRUCTURED

    for magic, _ in _IMAGE_MAGIC:
        if file.content.startswith(magic):
            return Syntax.IMAGE

    if head.startswith(b"<?xml") or head.startswith(b"<"):
        try:
            root = parse_xml(file.content)
        except etree.XMLSyntaxError:
            return Syntax.UNKNOWN
        return _syntax_of_root(root)

    return Syntax.UNKNOWN


#: Root (namespace, local name) -> syntax. A plain lookup rather than a `match`
#: on purpose: in structural pattern matching a bare name is a *capture*, not a
#: comparison, so `case (UBL_INVOICE_NS, "Invoice")` would bind the namespace
#: and match every document. The bug is invisible on reading and total in
#: effect — every XML would classify as a UBL invoice.
_ROOTS: dict[tuple[str, str], Syntax] = {
    (UBL_INVOICE_NS, "Invoice"): Syntax.UBL_INVOICE,
    (UBL_CREDIT_NOTE_NS, "CreditNote"): Syntax.UBL_CREDIT_NOTE,
    (CII_NS, "CrossIndustryInvoice"): Syntax.CII,
}


def _syntax_of_root(root: etree._Element) -> Syntax:
    qname = etree.QName(root)
    return _ROOTS.get((qname.namespace or "", qname.localname), Syntax.UNKNOWN)


def _pdf_has_embedded_xml(content: bytes) -> bool:
    """A ZUGFeRD PDF is a PDF/A-3 with the CII XML attached.

    Checked by name rather than by opening the file: the attachment names are
    fixed by the specs (factur-x.xml since ZUGFeRD 2.1, zugferd-invoice.xml
    before it, xrechnung.xml for the XRechnung profile), and a byte scan is
    orders of magnitude cheaper than a full PDF parse on the intake path.
    A false positive here costs one failed open in the parser, not a wrong
    routing decision — the parser re-checks.
    """
    markers = (
        b"factur-x.xml",
        b"zugferd-invoice.xml",
        b"ZUGFeRD-invoice.xml",
        b"xrechnung.xml",
    )
    return any(marker in content for marker in markers)
