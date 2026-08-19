"""The contract every extraction provider must produce.

These models are the boundary between "something read a document" and "the rest
of the system trusts it". Providers differ wildly in how they arrive at values
— an XML parser knows them exactly, a vision model guesses — so every field a
provider fills carries a confidence, and the validation stage decides what that
means. Nothing downstream is allowed to look at the provider that produced a
document.
"""

from __future__ import annotations

import datetime as dt
from decimal import Decimal
from enum import StrEnum
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.money import cents_from_decimal


class DocumentType(StrEnum):
    """Declared in full from the start, including what Phase 2 will add.

    Only the first four are handled today. The rest are listed because this
    enum becomes a Postgres type in the first migration, and migrations are
    forward-only here — adding a member later means editing an applied
    migration, which the project forbids. Declaring them costs nothing;
    discovering the constraint after the first production deploy costs a
    migration we are not allowed to write.
    """

    # MVP
    RECHNUNG = "Rechnung"
    LIEFERSCHEIN = "Lieferschein"
    GUTSCHRIFT = "Gutschrift"
    KASSENBELEG = "Kassenbeleg"
    # Reserved for Phase 2 — parsed by nothing yet.
    DSFINVK_EXPORT = "DSFinV-K-Export"
    SPEISEKARTE = "Speisekarte"
    PLATTFORM_ABRECHNUNG = "Plattform-Abrechnung"
    VERTRAG = "Vertrag"
    ENERGIERECHNUNG = "Energierechnung"
    LOHNABRECHNUNG = "Lohnabrechnung"


HANDLED_DOCUMENT_TYPES: frozenset[DocumentType] = frozenset(
    {
        DocumentType.RECHNUNG,
        DocumentType.LIEFERSCHEIN,
        DocumentType.GUTSCHRIFT,
        DocumentType.KASSENBELEG,
    }
)


class DocumentSource(StrEnum):
    UPLOAD = "upload"
    EMAIL = "email"
    PHOTO = "photo"
    PORTAL = "portal"


Confidence = Annotated[float, Field(ge=0.0, le=1.0)]

#: A deterministic parser read the value out of a structured field. This is not
#: optimism: if the XML says the line total is 12.34, there is no reading of the
#: document under which it is 12.35. Anything less than certain here would make
#: the review queue meaningless, because every XRechnung would enter it.
CERTAIN: Confidence = 1.0


class VatRate(StrEnum):
    """The rate is taken FROM THE DOCUMENT — never inferred from the product.

    Food is usually 7% and drinks usually 19%, but the exceptions are numerous
    enough (milk drinks over 75% milk, take-away versus in-house, catering) that
    a category-based guess would be wrong on real documents regularly and
    silently. `UNKNOWN` exists so a provider can say "I could not read it"
    instead of picking one.
    """

    REDUCED = "7"
    STANDARD = "19"
    ZERO = "0"
    UNKNOWN = "unknown"

    @property
    def percent(self) -> Decimal:
        if self is VatRate.UNKNOWN:
            raise ValueError("VAT rate was not read from the document")
        return Decimal(self.value)

    @classmethod
    def from_percent(cls, value: Decimal) -> VatRate:
        for rate in (cls.ZERO, cls.REDUCED, cls.STANDARD):
            if Decimal(rate.value) == value:
                return rate
        return cls.UNKNOWN


class Party(BaseModel):
    """Supplier or buyer as the document states them."""

    model_config = ConfigDict(frozen=True)

    name: str
    vat_id: str | None = None
    tax_number: str | None = None
    address: str | None = None
    confidence: Confidence = CERTAIN


class ExtractedLine(BaseModel):
    """One line as read. Not yet mapped to a catalog item, not yet validated.

    `unit_price` is a Decimal while every total is integer cents, and that is
    not an inconsistency: a unit price is a *rate* (euro per kg, per piece),
    not an amount of money. Rates carry more precision than the currency does —
    EN 16931 allows four decimals, and real documents use them: 1 000 napkins
    at 0,008 € is a line total of 8,00 €. Rounding that rate to one cent first
    turns the line into 10,00 € and the line-math check starts reporting
    documents that are perfectly correct. Money that is *stored* stays in
    integer cents; money that is *quoted per unit* stays exact.
    """

    model_config = ConfigDict(frozen=True)

    position: int
    description: str
    quantity: Decimal
    unit: str
    unit_price: Decimal
    line_total_cents: int
    vat_rate: VatRate
    is_pfand: bool = False
    article_no: str | None = None
    ean: str | None = None
    confidence: Confidence = CERTAIN

    @field_validator("description")
    @classmethod
    def _description_not_blank(cls, value: str) -> str:
        text = " ".join(value.split())
        if not text:
            raise ValueError("line description is empty")
        return text

    @property
    def unit_price_cents(self) -> int:
        """The rate rounded to currency precision — for display only.

        Never validate against this; use `unit_price`. See the class docstring.
        """
        return cents_from_decimal(self.unit_price)


class ExtractedDocument(BaseModel):
    """A single document. Multi-document files are split before this exists."""

    model_config = ConfigDict(frozen=True)

    doc_type: DocumentType
    doc_number: str | None
    doc_date: dt.date | None
    #: Time of issue, when the document prints one. Almost every German till
    #: receipt does, and it is the only thing that separates two purchases made
    #: at the same shop on the same day for the same amount. A Kassenbeleg
    #: without a number is identified by supplier, day, time and total, so this
    #: field is what keeps that identity from collapsing. Invoices rarely carry
    #: it and do not need it — they have a number.
    doc_time: dt.time | None = None
    currency: str
    supplier: Party
    buyer: Party | None = None
    lines: tuple[ExtractedLine, ...]
    total_net_cents: int | None = None
    total_vat_cents: int | None = None
    total_gross_cents: int | None = None
    provider: str
    source: DocumentSource
    confidence: Confidence = CERTAIN

    @field_validator("currency")
    @classmethod
    def _currency_shape(cls, value: str) -> str:
        code = value.strip().upper()
        if len(code) != 3 or not code.isalpha():
            raise ValueError(f"currency must be an ISO 4217 code, got {value!r}")
        return code

    @model_validator(mode="after")
    def _positions_are_unique(self) -> ExtractedDocument:
        positions = [line.position for line in self.lines]
        if len(set(positions)) != len(positions):
            raise ValueError("line positions must be unique within a document")
        return self

    @property
    def pfand_lines(self) -> tuple[ExtractedLine, ...]:
        return tuple(line for line in self.lines if line.is_pfand)

    @property
    def goods_lines(self) -> tuple[ExtractedLine, ...]:
        """Pfand is a deposit, not goods cost — it never enters Wareneinsatz."""
        return tuple(line for line in self.lines if not line.is_pfand)
