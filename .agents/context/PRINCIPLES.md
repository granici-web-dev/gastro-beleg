# PRINCIPLES.md — GastroBeleg engineering posture

Derived from `CLAUDE.md` (the product contract) and how this project actually gets built.

## What we optimise for

**Trust in numbers, then speed of capture.** A restaurateur photographs a delivery note in a loud
kitchen. If the extracted total is wrong once, the product is dead — no amount of polish repairs it.
So: correctness of money and tax first, latency second, elegance third.

## Abstraction policy

- Three similar lines beat a premature abstraction. Wait for the fourth.
- No layer exists "for later". The one exception is documented and deliberate: the extraction
  provider sits behind an ABC because providers must be swappable, and the mock data layer sits
  behind one module because it will be replaced by the API.
- No config option without a caller. No feature flag for MVP code — MVP ships behind nothing.

## Error handling

- Validate at boundaries: HTTP bodies, env vars, uploaded files, LLM output, third-party responses.
  LLM output is a boundary even though it comes from us — it is validated into Pydantic/TypeScript
  types and rejected if it does not fit.
- Do not defend inside the domain. Internal callers obey the type system.
- Never swallow an extraction failure. A document that cannot be read goes to the review queue
  with a reason, it does not get silently dropped or guessed at.

## Money and tax — hard rules, they override taste

1. **Integer cents everywhere.** Floats are a defect, not a style choice.
2. **Take the VAT rate from the document.** Never infer 7% or 19% from a product category.
3. **Pfand is not goods cost.** Own flag, own account, own per-supplier balance.
4. Rounding: `Decimal` with `ROUND_HALF_UP` at the rounding boundary only, stored as int cents.
5. GoBD: originals immutable, complete audit trail, no hard deletes of booked documents —
   soft-delete plus Storno only. Retention is a per-tenant setting, never a constant in code.

## Comments

Default to none. The code is the documentation. Write a comment only when the *why* is
non-obvious — a legal constraint (`§ 147 AO`), a workaround for a specific bug, an invariant that
would surprise a reader. Never a *what*-comment. Never a reference to the task or the PR.

## Naming

Long and obvious beats short and clever. German domain nouns stay German in user-facing strings
(`Lieferschein`, `Pfand`, `Gutschrift`) and become English identifiers in code
(`deliveryNote`, `deposit`, `creditNote`) — with one exception: where the German word *is* the
domain term with no honest English equivalent (`pfand`, `datev`, `skonto`), keep it.

## Migrations

Forward-only. Never edit an applied migration. Enums that will grow (document type) are declared in
full from the first migration.

## What we refuse

- Building any part of a Warenwirtschaft, POS, ordering flow, or outgoing-invoice product.
- Sending structured XRechnung/ZUGFeRD XML through an LLM. It is deterministic data; parse it.
- Any data or inference leaving the EU.
- Advisory judgement that is regulated activity: no insurance recommendations, no decoding of
  authority letters (StBerG/RDG).
- Shipping half-finished work behind a flag and calling it done.

## Definition of done

- Extraction changes: golden-file suite passes **and** the confidence distribution has not degraded.
- Frontend changes: typecheck clean, lint clean, every new list has empty and loading states, and
  the screen was actually opened in a browser at 375px and 1440px.
- Nothing is "done" while a test is failing or a step was skipped. Say so instead.
