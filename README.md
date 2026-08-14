# GastroBeleg

Invoice and delivery-note ingestion for independent restaurants in Germany.
Photo, PDF or E-Rechnung in → line items out → food-cost insight for the owner
and a clean Buchungsstapel for the Steuerberater.

The gap it aims at: digitising a document already costs almost nothing (DATEV
Belege online is 3,75 €/month), and reading the *line items* back to the
restaurateur — price changes per supplier and article, short deliveries, Pfand
— currently starts at ~175 €/month with a full Warenwirtschaft. Between those
two numbers there is nothing.

> **Language.** Code, comments and commits are English. The product UI is
> German. The research corpus under `.research/` is Russian, with German domain
> terms left intact — see `CLAUDE.md` § 5.7 for the exact rule.

## State of the project — read this first

Nothing here is in production, and the central question is still open.

| Area | State |
|---|---|
| Research & design | Desk research, personas, POV, 41-idea verdict, roadmap. **1 real interview out of 21 planned.** |
| Prototype (`web/`) | 35 routes, Next.js, **mock data only** — no backend, no login, no tests |
| E-Rechnung parsing | Working: XRechnung (UBL + CII), ZUGFeRD. 70 tests, `mypy --strict` clean |
| Validation | Working: line math, totals, VAT per rate group, duplicates, price jumps |
| Vision extraction | Wired and smoke-tested against the live API — **accuracy unmeasured** |
| Everything else | Not started: persistence, DATEV export, auth, billing, GoBD archive |

**The unvalidated assumption the whole product rests on** is that a vision model
can read a crumpled Metro receipt reliably enough — separating Pfand, taking the
VAT rate from the document rather than guessing it by category. That cannot be
answered without real documents; `fixtures/README.md` lists exactly which ones
are missing and what each one blocks.

The second open question is commercial, not technical: whether a restaurateur
who finds 3,75 €/month too expensive will pay 39 €. See
`.research/01-Empathize/insights-utp.md`, assumption A2.

## Quickstart

```bash
uv sync --extra dev          # Python 3.12
uv run pytest                # 70 tests, no network
uv run mypy && uv run ruff check .

cp .env.example .env         # then fill in credentials
uv run python scripts/extract.py fixtures/xrechnung-cii-gemischt.xml
```

`scripts/extract.py` runs one document through the real pipeline and prints the
extraction *and* the validation findings together — the question being measured
is not "did it read something" but "did the checks catch what it got wrong".

Structured e-invoices take the deterministic path and make no model call. Only
photos and scanned PDFs reach the vision provider.

## Layout

```
app/extraction/    classify → deterministic XML parser | vision provider
app/validation/    the rules that decide whether a document may be booked
app/money.py       integer cents, German notation
fixtures/          golden files + what is still missing (read its README)
web/               Next.js prototype on mock data
.research/         design-thinking corpus, Empathize → Implement
.design/           Figma-derived design records and decks
```

## Conventions that will bite you

- **Money is integer cents.** Never floats. A *unit price* is the exception and
  stays `Decimal`: it is a rate, not an amount, and "1 000 napkins at 0,008 €"
  is a real line that rounding to cents turns into a false validation failure.
- **The VAT rate comes from the document.** Never inferred from the product
  category — food is usually 7% and drinks usually 19%, but the exceptions are
  numerous enough that guessing corrupts a tax return. A missing rate is a
  blocking finding, not a default.
- **Pfand is not goods cost.** Separate flag, separate account, tracked as a
  per-supplier balance.
- **Inference runs in the EU.** `app/extraction/client.py` has no default route
  and refuses a non-EU region; the development route needs a second explicit
  flag. Two independent mistakes are required to send a real document outside
  the EU.
- **Never send structured XML through a model.** The values are already exact;
  restating them can only introduce error.
- **Migrations are forward-only.** This is why `DocumentType` already declares
  the Phase 2 members it does not yet handle.

Full domain rules and non-goals: `CLAUDE.md`.

## Licence

None yet — all rights reserved.
