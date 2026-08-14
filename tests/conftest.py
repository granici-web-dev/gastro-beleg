from __future__ import annotations

import io
from pathlib import Path

import pikepdf
import pytest

from app.domain import DocumentSource
from app.extraction.provider import IntakeFile

FIXTURES = Path(__file__).resolve().parent.parent / "fixtures"


def load(name: str, *, source: DocumentSource = DocumentSource.EMAIL) -> IntakeFile:
    return IntakeFile(filename=name, content=(FIXTURES / name).read_bytes(), source=source)


@pytest.fixture(scope="session")
def zugferd_pdf() -> IntakeFile:
    """A ZUGFeRD PDF built at test time from the CII fixture.

    Built rather than committed as a binary: a checked-in PDF is opaque in
    review and drifts silently from the XML it is supposed to carry. Building
    it here keeps one source of truth and still exercises the real code path —
    pikepdf writes a genuine embedded-file tree, which is what the parser reads.
    """
    xml = (FIXTURES / "xrechnung-cii-gemischt.xml").read_bytes()
    pdf = pikepdf.new()
    pdf.add_blank_page(page_size=(595, 842))
    pdf.attachments["factur-x.xml"] = pikepdf.AttachedFileSpec(
        pdf,
        xml,
        mime_type="text/xml",
        description="Factur-X/ZUGFeRD invoice",
        filename="factur-x.xml",
        creation_date="D:20260814120000+02'00'",
        mod_date="D:20260814120000+02'00'",
    )
    buffer = io.BytesIO()
    pdf.save(buffer)
    return IntakeFile(
        filename="rechnung-zugferd.pdf",
        content=buffer.getvalue(),
        source=DocumentSource.EMAIL,
    )
