"""What has to be true before a document may be booked.

Two severities, and the difference is the whole point. A *blocking* finding
means the document would put a wrong number into the books — booking is
refused. A *warning* means something is worth a human's attention but the
arithmetic holds. Mixing the two produces the failure mode the review screen
already showed us: three identical-looking bands where the reader cannot tell
which one actually stops them.
"""

from __future__ import annotations

import datetime as dt
from collections.abc import Iterable, Mapping
from dataclasses import dataclass, field
from decimal import Decimal
from enum import StrEnum

from app.domain import ExtractedDocument, ExtractedLine, VatRate
from app.money import apply_vat, cents_from_decimal, format_cents


class Severity(StrEnum):
    BLOCKING = "blocking"
    WARNING = "warning"


class Code(StrEnum):
    LINE_MATH = "line_math"
    DOCUMENT_TOTAL = "document_total"
    VAT_MISMATCH = "vat_mismatch"
    VAT_RATE_MISSING = "vat_rate_missing"
    DUPLICATE = "duplicate"
    PRICE_JUMP = "price_jump"
    LOW_CONFIDENCE = "low_confidence"
    PFAND_UNCONFIRMED = "pfand_unconfirmed"
    NO_LINES = "no_lines"
    MISSING_NUMBER = "missing_number"
    MISSING_DATE = "missing_date"
    FUTURE_DATE = "future_date"


@dataclass(frozen=True, slots=True)
class Finding:
    code: Code
    severity: Severity
    message: str
    line_position: int | None = None

    @property
    def blocks_booking(self) -> bool:
        return self.severity is Severity.BLOCKING


@dataclass(frozen=True, slots=True)
class Thresholds:
    """Every limit is a setting, never a literal in a rule.

    Tolerances are per-tenant in production: a supplier who rounds differently
    is a tenant-level fact, not a global truth.
    """

    #: Line math and totals may differ by this much before it counts.
    #: 2 cents covers the usual per-line rounding drift; wider and real
    #: transposition errors slip through.
    amount_tolerance_cents: int = 2
    #: Unit price change against the last known price for the same
    #: (supplier, product) before the line is flagged.
    price_change_ratio: Decimal = Decimal("0.05")
    #: Below this, a field goes to human review instead of straight through.
    review_confidence: float = 0.85


@dataclass(frozen=True, slots=True)
class PriceHistoryEntry:
    unit_price: Decimal
    observed_on: dt.date


@dataclass(frozen=True, slots=True)
class ValidationContext:
    """What the rules need to know that the document itself cannot say."""

    thresholds: Thresholds = field(default_factory=Thresholds)
    #: (supplier vat id or name, article no or description) -> last known price.
    known_prices: Mapping[tuple[str, str], PriceHistoryEntry] = field(default_factory=dict)
    #: Fingerprints of documents already booked for this tenant.
    seen_fingerprints: frozenset[str] = frozenset()
    today: dt.date | None = None


def fingerprint(document: ExtractedDocument) -> str:
    """Supplier + document number + gross total, per the duplicate rule.

    Deliberately not a hash of the file: the same invoice arrives twice as a
    photo and as an XML, with different bytes and the same meaning. That is the
    duplicate we actually need to catch — the restaurant forwarding the PDF
    after the supplier already sent the XRechnung.
    """
    supplier = document.supplier.vat_id or document.supplier.name.casefold()
    total = document.total_gross_cents
    return f"{supplier}|{document.doc_number or ''}|{total if total is not None else ''}"


def validate(
    document: ExtractedDocument, context: ValidationContext | None = None
) -> list[Finding]:
    ctx = context or ValidationContext()
    findings: list[Finding] = []

    findings.extend(_check_header(document, ctx))
    for line in document.lines:
        findings.extend(_check_line(line, document, ctx))
    findings.extend(_check_totals(document, ctx))
    findings.extend(_check_duplicate(document, ctx))

    return findings


def _check_header(document: ExtractedDocument, ctx: ValidationContext) -> Iterable[Finding]:
    if not document.lines:
        yield Finding(
            Code.NO_LINES,
            Severity.BLOCKING,
            "Das Dokument enthält keine Positionen.",
        )
    if not document.doc_number:
        yield Finding(
            Code.MISSING_NUMBER,
            Severity.BLOCKING,
            "Belegnummer fehlt — ohne sie ist keine Dublettenprüfung möglich.",
        )
    if document.doc_date is None:
        yield Finding(
            Code.MISSING_DATE,
            Severity.BLOCKING,
            "Belegdatum fehlt.",
        )
    else:
        today = ctx.today or dt.date.today()
        if document.doc_date > today:
            yield Finding(
                Code.FUTURE_DATE,
                Severity.WARNING,
                f"Belegdatum {document.doc_date:%d.%m.%Y} liegt in der Zukunft.",
            )
    if document.confidence < ctx.thresholds.review_confidence:
        yield Finding(
            Code.LOW_CONFIDENCE,
            Severity.WARNING,
            "Das Dokument wurde unsicher erkannt und sollte geprüft werden.",
        )


def _check_line(
    line: ExtractedLine, document: ExtractedDocument, ctx: ValidationContext
) -> Iterable[Finding]:
    tolerance = ctx.thresholds.amount_tolerance_cents

    expected = cents_from_decimal(line.quantity * line.unit_price)
    delta = abs(expected - line.line_total_cents)
    if delta > tolerance:
        yield Finding(
            Code.LINE_MATH,
            Severity.BLOCKING,
            (
                f"Position {line.position}: {line.quantity} × {line.unit_price} "
                f"ergibt {format_cents(expected)} €, "
                f"der Beleg nennt {format_cents(line.line_total_cents)} €."
            ),
            line_position=line.position,
        )

    if line.vat_rate is VatRate.UNKNOWN:
        yield Finding(
            Code.VAT_RATE_MISSING,
            Severity.BLOCKING,
            (
                f"Position {line.position}: kein Steuersatz auf dem Beleg. "
                "Der Satz wird nie aus der Warengruppe geraten."
            ),
            line_position=line.position,
        )

    if line.confidence < ctx.thresholds.review_confidence:
        code = Code.PFAND_UNCONFIRMED if line.is_pfand else Code.LOW_CONFIDENCE
        message = (
            f"Position {line.position}: als Pfand erkannt — bitte bestätigen."
            if line.is_pfand
            else f"Position {line.position} wurde unsicher gelesen."
        )
        yield Finding(code, Severity.WARNING, message, line_position=line.position)

    yield from _check_price_change(line, document, ctx)


def _check_price_change(
    line: ExtractedLine, document: ExtractedDocument, ctx: ValidationContext
) -> Iterable[Finding]:
    """Compare against the last known price for the same supplier and product.

    Only meaningful once the unit is comparable. A pack price of 42,90 € for a
    5 kg sack against a history kept in euro per kg produces "+424 %", which is
    the exact false alarm the prototype shipped with. Until the catalog mapping
    supplies the conversion factor, comparison is skipped rather than guessed —
    a missing alert is recoverable, a wrong one destroys trust in every alert.
    """
    supplier_key = document.supplier.vat_id or document.supplier.name.casefold()
    product_key = line.article_no or line.description.casefold()
    previous = ctx.known_prices.get((supplier_key, product_key))
    if previous is None or previous.unit_price == 0:
        return

    change = (line.unit_price - previous.unit_price) / previous.unit_price
    if abs(change) <= ctx.thresholds.price_change_ratio:
        return

    direction = "teurer" if change > 0 else "günstiger"
    yield Finding(
        Code.PRICE_JUMP,
        Severity.WARNING,
        (
            f"Position {line.position} „{line.description}“: "
            f"{abs(change) * 100:.1f} % {direction} "
            f"als am {previous.observed_on:%d.%m.%Y} ({previous.unit_price} → {line.unit_price})."
        ),
        line_position=line.position,
    )


def _check_totals(document: ExtractedDocument, ctx: ValidationContext) -> Iterable[Finding]:
    tolerance = ctx.thresholds.amount_tolerance_cents
    if not document.lines:
        return

    line_sum = sum(line.line_total_cents for line in document.lines)
    if document.total_net_cents is not None:
        delta = abs(line_sum - document.total_net_cents)
        if delta > tolerance:
            yield Finding(
                Code.DOCUMENT_TOTAL,
                Severity.BLOCKING,
                (
                    f"Summe der Positionen {format_cents(line_sum)} € weicht vom "
                    f"Nettobetrag {format_cents(document.total_net_cents)} € ab."
                ),
            )

    expected_vat = _expected_vat_cents(document)
    if expected_vat is not None and document.total_vat_cents is not None:
        # The tolerance widens with the number of distinct rates: VAT is
        # rounded once per rate group, so a document with 7% and 19% can
        # legitimately sit two roundings away from our recomputation.
        rate_groups = len(
            {line.vat_rate for line in document.lines if line.vat_rate is not VatRate.UNKNOWN}
        )
        vat_tolerance = tolerance + max(0, rate_groups - 1)
        if abs(expected_vat - document.total_vat_cents) > vat_tolerance:
            yield Finding(
                Code.VAT_MISMATCH,
                Severity.BLOCKING,
                (
                    f"Errechnete Umsatzsteuer {format_cents(expected_vat)} € weicht vom "
                    f"ausgewiesenen Betrag {format_cents(document.total_vat_cents)} € ab."
                ),
            )

    if (
        document.total_net_cents is not None
        and document.total_vat_cents is not None
        and document.total_gross_cents is not None
    ):
        expected_gross = document.total_net_cents + document.total_vat_cents
        if abs(expected_gross - document.total_gross_cents) > tolerance:
            yield Finding(
                Code.DOCUMENT_TOTAL,
                Severity.BLOCKING,
                (
                    f"Netto plus Steuer ergibt {format_cents(expected_gross)} €, "
                    f"der Beleg nennt {format_cents(document.total_gross_cents)} € brutto."
                ),
            )


def _expected_vat_cents(document: ExtractedDocument) -> int | None:
    """VAT recomputed per rate group, the way a German invoice states it."""
    by_rate: dict[VatRate, int] = {}
    for line in document.lines:
        if line.vat_rate is VatRate.UNKNOWN:
            return None
        by_rate[line.vat_rate] = by_rate.get(line.vat_rate, 0) + line.line_total_cents
    if not by_rate:
        return None
    return sum(apply_vat(net, rate.percent) for rate, net in by_rate.items())


def _check_duplicate(document: ExtractedDocument, ctx: ValidationContext) -> Iterable[Finding]:
    if not document.doc_number:
        return
    if fingerprint(document) in ctx.seen_fingerprints:
        yield Finding(
            Code.DUPLICATE,
            Severity.BLOCKING,
            (
                f"Beleg {document.doc_number} von {document.supplier.name} "
                "wurde bereits erfasst."
            ),
        )


def blocking(findings: Iterable[Finding]) -> list[Finding]:
    return [finding for finding in findings if finding.blocks_booking]


def may_book(findings: Iterable[Finding]) -> bool:
    return not blocking(findings)
