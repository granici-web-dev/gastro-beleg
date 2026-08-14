# TESTING.md — GastroBeleg

## What is worth testing

**The money path, and almost nothing else at unit level.**

| Worth testing | Not worth testing |
|---|---|
| Cent arithmetic, VAT split per line, rounding boundary | Formatting wrappers around `Intl` |
| Validation rules: `qty × unit_price ≈ line_total`, `Σ lines + VAT ≈ document total`, duplicate detection, price-jump threshold | React components that only compose shadcn primitives |
| XRechnung/ZUGFeRD parsing against real files | Mock data fixtures |
| Unit conversion (`1 Kiste = 24 × 0,33 l`) and mapping reuse per `(supplier, raw_string)` | Sidebar rendering |
| DATEV EXTF row shape and header versioning | Tailwind class output |
| Pfand never landing in a goods-cost account | |

## Golden files are the backbone

Every ingestion pipeline stage gets pytest unit tests **plus at least one golden-file test**.
Fixtures in `/fixtures`, and the set must always contain: a Metro receipt, a handwritten butcher
Lieferschein, a ZUGFeRD PDF, an XRechnung XML, a multi-page multi-document PDF, a document with
Pfand lines, and a document mixing 7% and 19%.

A golden-file diff is a conversation, not an automatic failure — but it must be *looked at*.
Extraction is done when the suite passes and the confidence distribution has not degraded.

## Mocking policy

Mock exactly two things: the LLM provider and object storage. Everything else runs for real,
against a real Postgres in a container. Mocking the database hides the bugs that actually happen
(constraints, transactions, migration drift).

The frontend prototype talks to `src/lib/mock` — that module *is* the fake, so no further mocking
happens above it.

## Balance

Integration over unit where they compete. One test that puts a real ZUGFeRD PDF through
intake → parse → validate → map is worth ten tests on the individual functions.

Coverage is not a target. An uncovered line in a formatting helper costs nothing; an untested
rounding boundary costs a customer.

## Frontend

No component unit tests in the prototype phase — the screens change too fast for them to pay off.
What replaces them: typecheck + lint on every change, and a manual pass at 375px and 1440px.
When the prototype hardens into the product, add Playwright coverage of the one flow that matters:
upload → review → correct a line → book → export.
