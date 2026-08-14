"""The seam between the pipeline and whatever reads a document.

Providers must be swappable: today the vision path is Anthropic's, tomorrow it
may not be, and the deterministic path must never be reachable from an LLM at
all. Both live behind this one interface so the pipeline never branches on
which is in use.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from enum import StrEnum

from app.domain import DocumentSource, ExtractedDocument


class Syntax(StrEnum):
    """What a byte string turned out to be, decided before any parsing."""

    UBL_INVOICE = "ubl-invoice"
    UBL_CREDIT_NOTE = "ubl-credit-note"
    CII = "cii"
    ZUGFERD_PDF = "zugferd-pdf"
    PDF_UNSTRUCTURED = "pdf-unstructured"
    IMAGE = "image"
    UNKNOWN = "unknown"


STRUCTURED_SYNTAXES: frozenset[Syntax] = frozenset(
    {Syntax.UBL_INVOICE, Syntax.UBL_CREDIT_NOTE, Syntax.CII, Syntax.ZUGFERD_PDF}
)


@dataclass(frozen=True, slots=True)
class IntakeFile:
    """A file as it arrived, before anyone knows what it is."""

    filename: str
    content: bytes
    source: DocumentSource


class ExtractionError(Exception):
    """The provider could not produce a document from this input."""


class UnsupportedInput(ExtractionError):
    """This provider does not handle this kind of file. Try another."""


class ExtractionProvider(ABC):
    """One way of turning a file into documents.

    `extract` returns a tuple because one file can carry several documents: a
    photographed batch of delivery notes, a multi-page PDF from a supplier who
    bundles a month. Providers that cannot split still return a 1-tuple, so no
    caller has to special-case it.
    """

    name: str

    @abstractmethod
    def supports(self, file: IntakeFile) -> bool:
        """Cheap check. Must not parse the whole file to answer."""

    @abstractmethod
    def extract(self, file: IntakeFile) -> tuple[ExtractedDocument, ...]:
        """Read the file. Raises ExtractionError if it cannot."""
