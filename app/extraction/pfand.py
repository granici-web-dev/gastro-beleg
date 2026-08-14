"""Deciding whether a line is a deposit rather than goods.

This is the one guess the deterministic path makes, and it is unavoidable:
neither EN 16931 nor XRechnung has a field for Pfand. Suppliers express it as an
ordinary line whose description happens to say so. Booking it as Wareneinsatz
would overstate food cost and put a deposit on a P&L account, so the guess has
to be made — but it is marked as a guess, and a matched line is never silently
trusted at full confidence.
"""

from __future__ import annotations

import re
from decimal import Decimal
from typing import Final

#: Word stems seen on German supplier documents. Matched as whole words so that
#: "Pfandbrief" or a supplier called "Pfandl" cannot trigger it, and case-folded
#: because documents are inconsistent about capitalisation.
_PFAND_TERMS: Final[tuple[str, ...]] = (
    "pfand",
    "leergut",
    "leihgebinde",
    "mehrweg",
    "einwegpfand",
    "dpg",  # Deutsche Pfandsystem GmbH, printed on single-use deposit lines
)

#: Containers that carry a deposit. On their own these are not enough — a
#: "Kasten Bier" is goods — so they only count together with a deposit term or
#: a negative amount.
_CONTAINER_TERMS: Final[tuple[str, ...]] = ("kasten", "kiste", "fass", "keg", "gebinde")

_WORD_RE: Final = re.compile(r"[a-zäöüß]+")


def looks_like_pfand(description: str, *, line_total_cents: int | None = None) -> bool:
    """True if this line is a deposit rather than goods.

    A negative total alone does not qualify: credit lines, discounts and
    returned goods are all negative too. It only strengthens a container word,
    because a returned crate is the common shape of a Pfand credit.
    """
    words = set(_WORD_RE.findall(description.casefold()))
    if any(any(term in word for word in words) for term in _PFAND_TERMS):
        return True

    has_container = any(term in words for term in _CONTAINER_TERMS)
    return has_container and line_total_cents is not None and line_total_cents < 0


#: Confidence for a line that matched. Not 1.0: the deterministic parser is
#: certain about the numbers it read, but this classification is a word match,
#: and word matches are wrong sometimes. Below the review threshold on purpose
#: for the ambiguous case, so a human sees it before it books.
PFAND_MATCH_CONFIDENCE: Final[float] = 0.80

#: Once a supplier's article number has been confirmed as Pfand by a human, the
#: mapping is remembered and the guess is no longer needed. Phase 2 wires this
#: to SupplierProductMapping; the constant marks where it plugs in.
PFAND_CONFIRMED_CONFIDENCE: Final[float] = 1.0


def pfand_deposit_total(lines_totals: list[int]) -> Decimal:
    """Sum deposits in euro. Kept here so the sign convention lives in one file.

    Positive means the restaurant is owed nothing and has paid a deposit out;
    negative means crates went back and a credit came in. The per-supplier
    balance in the dashboard is the running sum of exactly this.
    """
    return sum((Decimal(total) for total in lines_totals), start=Decimal(0)) / Decimal(100)
