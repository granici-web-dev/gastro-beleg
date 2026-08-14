# Fixtures

Golden files for the extraction suite. A fixture is only useful if it is either
a real document or an exact synthetic one — a fixture whose arithmetic does not
close teaches the validator to accept documents that are wrong.

## Present

| File | What it exercises | Origin |
|---|---|---|
| `xrechnung-ubl-getraenke.xml` | UBL syntax, 19% throughout, a Pfand line, a `BaseQuantity` price (3,80 € per 100 pieces) | synthetic, arithmetic verified to the cent |
| `xrechnung-cii-gemischt.xml` | CII syntax, mixed 7% / 19% on one document, VAT rounded per rate group, seller VAT id and tax number | synthetic, arithmetic verified to the cent |
| ZUGFeRD PDF | PDF/A-3 with the CII XML attached | built at test time from the CII fixture — see `tests/conftest.py` |

The ZUGFeRD PDF is built rather than committed on purpose. A binary in the
repository is opaque in review and drifts from the XML it is meant to carry;
building it keeps one source of truth and still exercises the real embedded-file
path.

## Missing — and what each one blocks

These cannot be invented. A synthetic photo teaches the vision provider only
what we already believed, which is the one thing a spike must not do. They come
from the P1 concierge test (`.research/04-Prototype/p1-test-plan.md`, step 4:
"Sammlung von 20–30 realen Belegen je Betriebstyp").

| Fixture | Blocks | Why it cannot be synthesised |
|---|---|---|
| METRO Kassenbeleg (photo) | the whole vision path | thermal paper, self-pickup layout, gross prices, article shorthand. The core question of the spike — can a crumpled receipt be read at all — is only answerable on a real one |
| Handwritten butcher Lieferschein | vision path, worst case | handwriting, no article numbers, quantities in kg written by hand. If this fails, the delivery-note half of the product changes shape |
| Real ZUGFeRD PDF from a supplier | parser robustness | ours is spec-perfect. Real ones carry profile quirks (MINIMUM/BASIC-WL without line items, non-standard attachment names) |
| Multi-page PDF with several delivery notes | the split stage | the splitter has no input at all today |
| Document with a Pfand credit (crates returned) | Pfand balance | the sign convention is only asserted against an invented case so far |
| Kleinbetragsrechnung ≤ 250 € | permanently exempt case | § 33 UStDV lets these omit the buyer and the net/VAT split. Our totals check assumes both exist |

Until these arrive the deterministic path is testable and the vision path is
not. That is the honest state of the spike.

The vision provider itself is built and unit-tested (`tests/test_vision.py`),
but every one of those tests fakes the API call. They cover routing, the
translation into the domain model, and the failure paths — never whether the
model reads a real receipt correctly. **No accuracy claim can be made until the
documents above exist**, and the first thing to measure on them is not an
overall score but three specific rates: how often the VAT rate is taken from
the document rather than guessed, how often a Pfand line is classified
correctly, and how often a low-confidence flag actually corresponds to a wrong
value. A model that is 95% accurate overall and miscalibrated on that third
number is worse than useless, because the review queue stops being trustworthy.

## Rules for adding one

1. Pseudonymise before committing: business name, address, customer number.
   Amounts and article names stay — they are the point.
2. Assert against it in a golden test. A fixture nothing reads is decoration.
3. If it is synthetic, verify the arithmetic closes before committing, and say
   so in a comment at the top of the file.
