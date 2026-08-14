from __future__ import annotations

from decimal import Decimal

import pytest

from app.money import (
    MoneyError,
    apply_vat,
    cents_from_decimal,
    cents_from_string,
    format_cents,
)


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        ("1234.56", 123456),
        ("1.234,56", 123456),  # German thousands + decimal comma
        ("1,234.56", 123456),  # English thousands + decimal point
        ("0,07", 7),
        ("-12,50", -1250),
        ("42", 4200),
        ("1.234.567,89", 123456789),
    ],
)
def test_reads_both_notations(raw: str, expected: int) -> None:
    assert cents_from_string(raw) == expected


def test_rejects_nonsense() -> None:
    with pytest.raises(MoneyError):
        cents_from_string("acht Euro")


@pytest.mark.parametrize(
    ("amount", "expected"),
    [
        (Decimal("0.005"), 1),  # half away from zero, not to even
        (Decimal("-0.005"), -1),  # and symmetrically on the negative side
        (Decimal("0.004"), 0),
        (Decimal("2.675"), 268),
    ],
)
def test_rounds_half_away_from_zero(amount: Decimal, expected: int) -> None:
    """Banker's rounding would give 0 for 0.005 and 2.68 -> 267 for 2.675.

    German commercial rounding does not do that, and a cent lost per line
    against a supplier total is a blocking finding on a correct document.
    """
    assert cents_from_decimal(amount) == expected


def test_vat_rounds_once_per_line() -> None:
    assert apply_vat(8352, Decimal(7)) == 585
    assert apply_vat(4900, Decimal(19)) == 931


def test_german_presentation() -> None:
    assert format_cents(123456789) == "1.234.567,89"
    assert format_cents(-1250) == "-12,50"
    assert format_cents(7) == "0,07"
