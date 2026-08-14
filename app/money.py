"""Money is integer cents. Decimal appears only where rounding is decided."""

from __future__ import annotations

from decimal import ROUND_HALF_UP, Decimal, InvalidOperation
from typing import Final

CENTS_PER_EURO: Final = Decimal(100)

_CENT = Decimal("0.01")


class MoneyError(ValueError):
    """A monetary string could not be read as an amount."""


def cents_from_decimal(amount: Decimal) -> int:
    """Round a euro amount to whole cents, half away from zero.

    ROUND_HALF_UP in Python's decimal means half away from zero, which is what
    German commercial rounding (kaufmännisches Runden) asks for on both signs:
    -0.005 must go to -0.01, not to 0.
    """
    return int((amount * CENTS_PER_EURO).quantize(Decimal(1), rounding=ROUND_HALF_UP))


def cents_from_string(raw: str) -> int:
    """Read an amount as it appears in a document into cents.

    Accepts both notations, because both turn up: XML carries `1234.56` while a
    photographed German document carries `1.234,56`. The separators are told
    apart by position, never by locale guessing — the last separator in the
    string is the decimal one.
    """
    text = raw.strip().replace(" ", "").replace(" ", "")
    if not text:
        raise MoneyError("empty amount")

    last_dot = text.rfind(".")
    last_comma = text.rfind(",")
    if last_comma > last_dot:
        text = text.replace(".", "").replace(",", ".")
    else:
        text = text.replace(",", "")

    try:
        return cents_from_decimal(Decimal(text))
    except InvalidOperation as exc:
        raise MoneyError(f"not an amount: {raw!r}") from exc


def format_cents(value: int) -> str:
    """German presentation: comma decimal separator, dot for thousands.

    Swapped through a placeholder rather than a translation table, because a
    two-way swap done in one pass would turn every separator into the same
    character.
    """
    euros = Decimal(value) / CENTS_PER_EURO
    return f"{euros:,.2f}".replace(",", "\x00").replace(".", ",").replace("\x00", ".")


def apply_vat(net_cents: int, rate_percent: Decimal) -> int:
    """VAT on a net amount, rounded to cents once, at this boundary.

    Rounding per line is deliberate: § 14 UStG lets an invoice state VAT per
    line, and the German tax authorities accept a document whose total is the
    sum of line-level VAT. Rounding the sum instead would put us one cent away
    from a supplier's own total often enough to trip the totals check.
    """
    vat = Decimal(net_cents) * rate_percent / Decimal(100)
    return int(vat.quantize(Decimal(1), rounding=ROUND_HALF_UP))


def to_decimal_euro(cents: int) -> Decimal:
    """For arithmetic that must not lose precision before it is rounded back."""
    return (Decimal(cents) / CENTS_PER_EURO).quantize(_CENT)
