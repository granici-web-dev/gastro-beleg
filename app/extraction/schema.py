"""What the model is asked to return.

Deliberately not `ExtractedDocument`. Two reasons, and both are load-bearing:

1. **Amounts are strings here, not numbers.** JSON has one numeric type and it
   is a float. Letting the model emit `4.80` as a JSON number means a float
   round-trip on money before we ever see it — the one thing the project's
   money rule forbids. As text, "4,80" and "4.80" both survive intact and are
   parsed with `Decimal` on our side.
2. **Structured outputs do not support every JSON Schema keyword.** Recursive
   schemas, numeric bounds and string-length bounds are unsupported. Keeping
   the wire schema flat and permissive, then validating into the strict domain
   model afterwards, means a model that returns something odd produces a
   validation error we can see rather than a silently coerced value.

The translation into `ExtractedDocument` lives in `vision.py`, so this file
stays a description of the wire format and nothing else.
"""

from __future__ import annotations

from typing import Annotated, Literal

from pydantic import BaseModel, Field

#: Mirrors `VatRate`, as literals because the wire format cannot carry an enum
#: class. "unknown" is a required member: a model that cannot read the rate must
#: be able to say so instead of picking one. See the prompt in `vision.py`.
VatRateLiteral = Literal["7", "19", "0", "unknown"]

DocTypeLiteral = Literal["Rechnung", "Lieferschein", "Gutschrift", "Kassenbeleg"]


class LineDraft(BaseModel):
    """One line as the model read it."""

    position: int = Field(description="Line number as printed, or 1-based order if unnumbered.")
    description: str = Field(
        description="Article text exactly as printed. Do not translate or tidy."
    )
    quantity: str = Field(description="Quantity as printed, e.g. '6' or '2,5'.")
    unit: str = Field(description="Unit as printed, e.g. 'kg', 'Stk', 'Kiste'. Empty if absent.")
    unit_price: str = Field(description="Price for ONE unit as printed. Empty string if not shown.")
    line_total: str = Field(description="Line total as printed.")
    vat_rate: VatRateLiteral = Field(
        description="VAT percent for this line, read from the document. 'unknown' if not printed."
    )
    is_pfand: bool = Field(
        description="True only if this line is a deposit (Pfand/Leergut), not goods."
    )
    article_no: str = Field(default="", description="Supplier article number if printed.")
    ean: str = Field(default="", description="EAN/GTIN if printed.")
    confidence: Annotated[float, Field(ge=0.0, le=1.0)] = Field(
        description="How legible this line was. Below 0.85 sends it to human review."
    )


class DocumentDraft(BaseModel):
    """One document as the model read it."""

    doc_type: DocTypeLiteral
    doc_number: str = Field(default="", description="Document number. Empty if not printed.")
    doc_date: str = Field(
        default="", description="Document date as ISO 8601 (YYYY-MM-DD). Empty if unreadable."
    )
    currency: str = Field(default="EUR", description="ISO 4217 code.")
    supplier_name: str
    supplier_vat_id: str = Field(default="", description="USt-IdNr, e.g. DE123456789.")
    supplier_address: str = Field(default="")
    buyer_name: str = Field(default="")
    lines: list[LineDraft]
    total_net: str = Field(default="", description="Net total as printed. Empty if not shown.")
    total_vat: str = Field(default="", description="VAT total as printed. Empty if not shown.")
    total_gross: str = Field(default="", description="Gross total as printed. Empty if not shown.")
    confidence: Annotated[float, Field(ge=0.0, le=1.0)] = Field(
        description="Overall legibility of this document."
    )
    notes: str = Field(
        default="",
        description="Anything a human reviewer should know: damage, cut-off edges, ambiguity.",
    )


class ExtractionDraft(BaseModel):
    """The top-level response.

    A list because one file can hold several documents — a photographed stack
    of delivery notes, a supplier who bundles a month into one PDF. A file with
    exactly one document returns a one-element list, so no caller special-cases
    the count.
    """

    documents: list[DocumentDraft]
