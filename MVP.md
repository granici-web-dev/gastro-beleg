# GastroBeleg MVP — engineering scope

Audience: the CTO and whoever builds Phase 1. This is the scope contract: what
ships, what deliberately does not, and which decisions are already closed so
nobody reopens them mid-build.

Companion documents:

| Document | What it is for |
|---|---|
| `CLAUDE.md` | Product definition, German domain rules, conventions. **Authoritative** — this file never contradicts it, it only sequences it. |
| `README.md` | Honest state of the repository, including what is unproven. |
| `.research/06-Implement/roadmap.md` | Phase 2 and 3, with the reasoning behind the order. Russian. |
| `web/` | The clickable prototype. Correct **behaviour and data shapes**, superseded styling — see below. |
| Figma page `MVP · Ready for Dev` | The 44 screens. **The visual reference.** |

### The two design surfaces, and which wins

**Figma is the visual reference. The prototype is the behavioural one.** The
founder reviewed both and chose the Figma design; that decision is what this
document is written against.

- **`MVP · Ready for Dev`** — the 44 MVP screens in the approved *Forest &
  Lime* design, in German, at MVP scope. It is the page `Screens V2.0` with two
  deliberate narrowings: the Phase 2 tab rows are removed, and the copy comes
  from `Screens V3.0` rather than V2's half-translated Russian. Dev Mode
  annotations on ten screens and the sidebar carry the build rules.
- **`Screens V2.0`** — the approved design in its original form. Reference.
- **`Screens V3.0`** — the same design componentised, plus 38 Phase 2 and 3
  screens. Reference for Phase 2 only. Untouched.
- **`MVP · shadcn-Variante (abgelegt)`** — an earlier draft of the MVP page in
  the prototype's shadcn styling. Superseded; safe to delete.

**Consequence for the frontend, and it is not small.** `web/` is currently
styled in shadcn defaults with the brand colours applied. Its routing, state
handling, mock data shapes, responsive behaviour and the review screen's
interaction model are all worth keeping — but its *appearance* has to be
brought to the Figma design. Budget that as real work in M4–M5 rather than
discovering it late. What carries over unchanged: the token names, the four
brand colours, and every behavioural decision recorded in the prototype.

---

## 0. One-paragraph summary

A restaurant photographs a delivery note or forwards a supplier invoice by
email. The system reads it into line items, checks the arithmetic, remembers
how this supplier writes each product, and produces two outputs: a food-cost
view for the owner and a DATEV Buchungsstapel for the tax advisor. Everything
runs in the EU. Originals are archived immutably for the retention period.

Phase 1 ends when a real restaurant can run a month of purchasing through it
and hand the export to a real Steuerberater without a manual correction pass.

---

## 1. What already exists

The repository is not empty, but almost none of it is production code.

| Component | State | Where |
|---|---|---|
| E-Rechnung parsing (XRechnung UBL Invoice + CreditNote, CII, ZUGFeRD ≥ 2.0) | **Working, 70 tests, `mypy --strict` clean.** Deterministic, no model involved. | `app/extraction/erechnung.py` |
| File classification (which syntax a byte string is) | Working | `app/extraction/classify.py` |
| Vision extraction via Claude | Wired, ran against the live API once. **Accuracy unmeasured** — see §11. | `app/extraction/vision.py` |
| Validation rules (line math, totals, VAT per rate group, duplicates, price jumps, confidence) | Working, pure functions, no persistence | `app/validation/rules.py` |
| Money handling (integer cents, German notation) | Working | `app/money.py` |
| Domain contract (Pydantic v2) | Working | `app/domain.py` |
| Clickable prototype, 35 routes | Mock data in `localStorage`. No backend, no auth, no tests. | `web/` |
| Everything else | **Not started.** Persistence, queue, storage, auth, billing, DATEV export, GoBD archive, email intake. | — |

Treat `app/` as a validated spike, not as a foundation to preserve at all
costs. Its contracts (`ExtractedDocument`, `Finding`, `Thresholds`) are worth
keeping; its lack of a database is the point where real work starts.

---

## 2. Scope

### 2.1 In

1. **Intake** — photo, image file, PDF (including multi-page), XRechnung XML,
   ZUGFeRD PDF/A-3, plus a per-tenant email address `docs-{tenant}@<domain>`
   whose attachments are ingested automatically.
2. **Multi-document splitting** — one photo batch or one PDF may carry several
   delivery notes and must become several documents.
3. **Extraction** — structured XML parsed deterministically; everything else
   read by a vision model. Both produce the same `ExtractedDocument`.
4. **Validation** — the rules in §6, every finding either blocking or a warning.
5. **Human review** — the screen where a person fixes what the machine got
   wrong. This is the most important screen in the product; see §7.
6. **Product mapping** — first time a supplier string is seen, a human maps it
   to a catalog item; every time after, it maps itself. Includes unit
   conversion (`1 Kiste = 24 × 0,33 l`).
7. **Food-cost dashboard** — spend by category / supplier / month, price
   history per product, largest price increases, Pfand balance per supplier.
8. **DATEV export** — EXTF Buchungsstapel CSV, SKR03 default, SKR04
   selectable, 7/19 % split per line, Pfand to its own account.
9. **Universal CSV/Excel export** of line items.
10. **GoBD archive** — original stored immutably, full audit trail, Z3 export.
11. **Accounts and billing** — tenants, locations, three roles, Stripe, trial.

### 2.2 Built in Phase 1 although the UI is Phase 2

Three things cannot be reconstructed retroactively, so the *data* ships now
even though the *screens* do not:

| Thing | Why it cannot wait |
|---|---|
| **Onboarding questionnaire** — seats, service format, cuisine, opening hours | Every later metric is normalised by these (€ per seat, expected Wareneinsatz ratio by format). Five fields, one screen. Cannot be collected retroactively with any accuracy. |
| **Savings-event log** — every alert writes a row with its € effect | The "we found you 1 840 € and the subscription cost 1 068 €" counter is the anti-churn mechanic. Start writing events on day one or the counter reads zero for a customer who has paid for six months. |
| **Back-dating on import** — `Document.date` is the document's date, never the upload date | Onboarding digitises three to six months of backlog. If those collapse onto one upload date, price history is meaningless and no alert ever fires. |

### 2.3 Out — do not build, do not "just add quickly"

- Full Warenwirtschaft: stock levels, recipes, inventory counts.
- Any POS functionality.
- Supplier ordering.
- Outgoing invoice creation.
- Everything in Phase 2 and 3: reconciliation of delivery note against invoice,
  Gutschrift tracking, DSFinV-K import, WhatsApp intake, contract radar, menu
  scanning, margin per dish, QR menu, Steuerberater portal, regional price
  benchmark. The prototype shows screens for these on purpose — they are the
  demo story, not the build order. Every one of them is behind a feature flag.

---

## 3. Screen inventory

44 screens: 20 desktop, 24 mobile. Mobile is the primary device — the phone in
a kitchen is the one that photographs the delivery note.

The Figma page `MVP · Ready for Dev` holds them, and it is the visual
reference. The prototype route beside each screen in the table below is where
the behaviour already lives — routing, state, editing model — even though its
styling is superseded.

**The sidebar has seven entries, and that is the MVP.** Übersicht, Belege,
Analyse, Katalog, Lieferanten, DATEV-Export, Einstellungen. The prototype shows
eleven because it also demonstrates Phase 2 — Abgleich, Kassendaten, Kosten and
Speisekarte appear only when their feature flag is on. A build that ships eleven
entries has shipped four dead ends.

### Desktop (20)

| # | Screen | Route | Notes |
|---|---|---|---|
| 1 | Übersicht | `/uebersicht` | Food-cost dashboard. Landing screen after login. |
| 2 | Belege | `/belege` | List, filter by status, source, supplier, period. |
| 3 | Beleg prüfen | `/belege/[id]` | **The core screen.** See §7. |
| 4 | Analyse | `/analyse` | Purchase analysis, price history. |
| 5 | Katalog | `/katalog` | Catalog items, supplier mappings, unit conversions. |
| 6 | Lieferanten | `/lieferanten` | Suppliers, per-supplier Pfand balance. |
| 7 | DATEV-Export | `/export` | Produces the Buchungsstapel. |
| 8 | Einstellungen · Betrieb | `/einstellungen/betrieb` | Tenant, locations. |
| 9 | Einstellungen · Nutzer | `/einstellungen/nutzer` | Roles, invitations. |
| 10 | Einstellungen · Buchhaltung | `/einstellungen/buchhaltung` | SKR03/04, account mapping, tolerances, thresholds, retention. |
| 11 | Einstellungen · Rechtliches | `/einstellungen/rechtliches` | AVV, Impressum, data export and deletion. |
| 12 | Einstellungen · Tarif | `/einstellungen/tarif` | Plan, document quota, top-up packs. |
| 13 | Modal · Artikel zuordnen | over `/katalog` | Map a supplier string to a catalog item. |
| 14 | Modal · Neuer Artikel | over `/katalog` | Create catalog item with base unit. |
| 15 | Modal · Neuer Lieferant | over `/lieferanten` | |
| 16 | Modal · Nutzer einladen | over `/einstellungen/nutzer` | |
| 17 | Modal · Tarif wechseln | over `/einstellungen/tarif` | |
| 18 | Registrierung | `/registrieren` | |
| 19 | Anmelden | `/login` | |
| 20 | Passwort zurücksetzen | `/passwort` | |

### Mobile (24)

Tab bar: Übersicht · Belege · **[Scan]** · Analyse · Mehr. Scan is a raised
centre action, not a tab — it is the primary job.

| # | Screen | Route |
|---|---|---|
| 1 | Übersicht | `/uebersicht` |
| 2 | Belege | `/belege` |
| 3 | Beleg erfassen (camera) | `/scan` |
| 4 | Analyse | `/analyse` |
| 5 | Mehr | menu sheet |
| 6 | Beleg prüfen | `/belege/[id]` |
| 7 | Katalog | `/katalog` |
| 8 | Lieferanten | `/lieferanten` |
| 9 | DATEV-Export | `/export` |
| 10 | Hochladen | upload sheet |
| 11 | Einstellungen | `/einstellungen` |
| 12–15 | Betrieb · Nutzer · Buchhaltung · Rechtliches | `/einstellungen/*` |
| 16 | Onboarding | `/onboarding` |
| 17–21 | Sheets: Artikel zuordnen · Neuer Artikel · Neuer Lieferant · Nutzer einladen · Tarif wechseln | bottom sheets |
| 22 | Registrierung | `/registrieren` |
| 23 | Anmelden | `/login` |
| 24 | Passwort zurücksetzen | `/passwort` |

### States every screen owes

Not optional, and not a polish pass at the end. A list screen that has only
its full state is half a screen:

- **empty** — first login, no documents at all, and the different empty of
  "no results for this filter"
- **loading** — skeletons, not spinners, for anything that has a known shape
- **error** — what failed and what the person can do about it
- **partial** — extraction succeeded but confidence is low, or the document is
  blocked from booking

---

## 4. Architecture

Fixed by `CLAUDE.md` §4. Restated here so it is in one place.

- **Backend** — Python 3.12, FastAPI (async), PostgreSQL, SQLAlchemy 2.0 typed
  + Alembic, Celery + Redis for the pipeline. Pydantic v2 is the domain
  contract. `mypy --strict`, no untyped domain logic.
- **Frontend** — Next.js App Router, TypeScript strict, Tailwind, shadcn/ui,
  mobile-first. `web/` is the starting point, not a throwaway — but its
  styling is restyled to the Figma design, not kept. shadcn stays as the
  component substrate; what changes is the theme layer on top of it.
- **Extraction** — Anthropic Claude vision for unstructured documents;
  `drafthorse` / `factur-x` style deterministic parsers for CII/UBL and
  PDF/A-3 embedded XML. Behind the `ExtractionProvider` ABC — providers must
  stay swappable.
- **Storage** — S3-compatible object storage, EU region, originals immutable.
  Postgres for structured data.
- **Hosting** — EU only. Hetzner (Falkenstein/Nürnberg) or AWS eu-central-1.

### Pipeline

```
intake → classify → split → extract → validate → map → review-if-needed → post
```

Every stage idempotent and resumable. Dead-letter queue for failures. A stage
that cannot complete must leave the document in a state a human can act on —
never a silent drop.

`classify` decides the route and it is a **security boundary as much as a cost
one**: structured XML must never reach a model. The values in an XRechnung are
already exact; restating them through a language model can only introduce
error.

---

## 5. Data model

Core entities, from `CLAUDE.md` §4:

```
Tenant, Location, User
Supplier
CatalogItem (base_unit)
SupplierProductMapping (supplier_id, raw_string, article_no, catalog_item_id, conversion_factor)
Document (type, status, source, original_file_ref, gobd_lock, date)
DocumentLine (qty, unit, unit_price, total, vat_rate, is_pfand, confidence, catalog_item_id)
PriceHistory (catalog_item_id, supplier_id, unit_price, date)
ExportBatch (datev | csv)
AuditLog
SavingsEvent (§2.2)
OnboardingProfile (§2.2)
```

### Constraints that are not negotiable

1. **`DocumentType` is declared in full in the first migration**, including the
   Phase 2 members nothing parses yet (`DSFinV-K-Export`, `Speisekarte`,
   `Plattform-Abrechnung`, `Vertrag`, `Energierechnung`, `Lohnabrechnung`).
   The enum becomes a Postgres type; migrations are forward-only; adding a
   member later means editing an applied migration, which this project forbids.
   See `app/domain.py`.
2. **Money is integer cents.** Never floats. `unit_price` is the one exception
   and stays `Decimal`: a unit price is a *rate*, not an amount. EN 16931
   allows four decimals and real documents use them — 1 000 napkins at 0,008 €
   is a line total of 8,00 €, and rounding the rate to a cent first makes it
   10,00 € and starts failing the line-math check on correct documents.
3. **Product taxonomy must support cross-tenant anonymised aggregation.**
   Phase 3's regional price benchmark is the long-term moat and it cannot be
   retrofitted onto a per-tenant free-text catalog. Normalised taxonomy;
   region on the tenant.
4. **No hard deletes of booked documents.** Soft-delete plus Storno only.
5. **Retention is a per-tenant setting**, defaulting to 10 years. 8 years is
   the legal minimum for Buchungsbelege (§ 147 (1) no. 4 AO / § 257 HGB as
   amended by BEG IV, in force since 2025-01-01); 10 is our default because an
   unexpired Festsetzungsfrist (§§ 169, 170 AO) can outlive 8. Never a constant
   in code.

---

## 6. Validation rules

Already implemented in `app/validation/rules.py`. The severity split is the
contract: **blocking** means the document cannot be booked; **warning** means a
human should look but may proceed.

| Code | Severity | Rule |
|---|---|---|
| `line_math` | blocking | `quantity × unit_price ≈ line_total`, tolerance default 2 cents |
| `document_total` | blocking | sum of lines + VAT ≈ document total |
| `vat_mismatch` | blocking | VAT recomputed per rate group must match |
| `vat_rate_missing` | blocking | a line whose rate could not be read from the document |
| `duplicate` | blocking | same supplier + document number + gross already booked |
| `no_lines` | blocking | nothing extracted |
| `price_jump` | warning | unit price against last known price for the same (supplier, product), default threshold 5 % |
| `low_confidence` | warning | below 0.85, routes to review |
| `pfand_unconfirmed` | warning | a line that looks like a deposit but the model was unsure |
| `missing_number` / `missing_date` / `future_date` | warning | header fields |

Two details worth defending in review:

- **Duplicate detection fingerprints supplier + number + gross, not the file.**
  The duplicate that actually happens is the same invoice arriving twice as an
  XRechnung and as a forwarded PDF — different bytes, same meaning.
- **Price-change detection skips when there is no history.** The prototype had
  a bug here that reported "+424 %" because it compared a pack price
  (42,90 € per 5 kg) against a per-base-unit history (8,18 €/kg). Always
  resolve the mapping's `conversion_factor` before comparing. Type checks and
  lint were both green; this was only found by looking at the screen.

Every threshold in `Thresholds` is per-tenant in production. None of them may
become a literal inside a rule.

---

## 7. The review screen

`/belege/[id]`. If this screen is good the product works; if it is mediocre
the product is a slower version of typing invoices by hand.

What it must do:

- Show the original next to the extraction, always. The person is comparing.
- Every field editable in place, with the document's own notation
  (`1.234,56`), never a reformatted value.
- Findings at the top, blocking ones visually distinct from warnings, each
  saying what it means and what to do — not a rule code.
- Low-confidence lines marked on the line, not only in a summary.
- The Pfand toggle per line, because a deposit booked as goods cost corrupts
  both the food-cost number and the tax return.
- VAT rate per line as a select, defaulting to what the document said and
  never to a category guess.
- "Beleg buchen" disabled while a blocking finding stands, with the reason
  visible next to the button.
- **Every correction teaches the mapping.** That is the learning core: the
  second invoice from the same supplier should need no corrections at all.

---

## 8. German domain rules — never violate

These are from `CLAUDE.md` §5 and they are the difference between a working
product and a liability.

1. **Take the VAT rate from the document.** Food is usually 7 %, drinks usually
   19 %, and the exceptions are numerous enough (milk drinks, take-away versus
   in-house, catering) that a category guess corrupts a tax return. Unknown is
   a valid, blocking value.
2. **Pfand is not goods cost.** Separate flag, separate DATEV account, tracked
   as a per-supplier balance.
3. **GoBD** — originals immutable, complete audit trail, no hard deletes.
4. **DSGVO** — EU processing only, AVV for every customer, account data export
   and deletion (but not of GoBD-locked documents).
5. **DATEV EXTF is versioned and picky.** Validate against the spec and produce
   a test export before the first real one.
6. **UI:** dates `DD.MM.YYYY`, comma decimal separator. Internally: ISO dates,
   dot separator.
7. **UI language German. Code, comments, commits English.** Research notes in
   `.research/` are Russian.

---

## 9. Build order

Each milestone ends with something demonstrable. Nothing here is parallel busy
work — the order is the dependency order.

**M1 — Skeleton that stores a document (weeks 1–2)**
FastAPI service, Postgres, Alembic with the full `DocumentType` enum, S3
storage, Celery + Redis. Upload a file, store the original immutably, see it in
a list. No extraction yet.
*Done when:* a file uploaded through the API is retrievable, its audit row
exists, and the original cannot be modified.

**M2 — The deterministic half (weeks 2–3)**
Port `app/extraction/` and `app/validation/` behind the pipeline. XRechnung and
ZUGFeRD end to end, no model call. Golden-file suite in CI.
*Done when:* a real supplier XRechnung becomes a document with correct lines,
VAT split and totals, and the golden suite runs on every push.

**M3 — The vision half (weeks 3–5)**
Photo and scanned-PDF route, multi-document splitting, confidence routing.
**Prerequisite: the fixture set in `fixtures/README.md` exists.** This
milestone cannot start honestly without real documents.
*Done when:* accuracy is measured on the fixture set and the number is written
down — see §11.

**M4 — Review and mapping (weeks 5–7)**
`/belege/[id]` against the real API. Supplier product mapping, unit conversion,
price history written on booking.
*Done when:* the second document from a supplier needs no manual mapping.

**M5 — Outputs (weeks 7–9)**
Food-cost dashboard on real data. DATEV EXTF export validated against the
spec. CSV export. GoBD Z3 export.
*Done when:* a Steuerberater imports a generated Buchungsstapel into DATEV
Unternehmen Online without a correction.

**M6 — Accounts, billing, compliance (weeks 9–11)**
Auth, roles, multi-location, Stripe with SEPA and card, German invoices,
onboarding questionnaire, legal pages, AVV.
*Done when:* a stranger can sign up, run the trial, and be charged.

**M7 — Email intake and hardening (weeks 11–12)**
`docs-{tenant}@` addresses, attachment ingestion, dead-letter handling,
observability, load behaviour on a month of backlog uploaded at once.

The estimate assumes the fixture problem in §11 is solved during M1–M2. It is
the single dependency most likely to move these dates.

---

## 10. Definition of done

Per `CLAUDE.md` §6, plus what this document adds:

- Python type hints everywhere, `mypy --strict` clean. No untyped domain logic.
- TypeScript strict, no `any` in domain logic.
- Every pipeline stage: pytest unit tests **and** at least one golden-file test.
- **Extraction changes specifically:** golden-file suite passes *and* the
  confidence distribution has not degraded. A change that raises average
  confidence while getting more documents wrong is a regression.
- Feature flags on everything post-MVP. The MVP ships behind nothing.
- Migrations forward-only. Never edit an applied migration.
- Secrets via environment, never committed. Separate staging and production
  tenants for Stripe and the LLM key.
- Every screen looked at once, on a real device, at 390 px. The prototype's
  most expensive bugs were all visible and none were caught by the type checker.

---

## 11. Risks

**R1 — Vision accuracy is unmeasured. This is the one that can kill the
product.** The whole proposition rests on a model reading a crumpled Metro
receipt on thermal paper well enough to separate Pfand and take VAT from the
document. It has never been tested on a real one. `fixtures/README.md` lists
what is missing: a Metro receipt photo, a handwritten butcher's Lieferschein, a
real supplier ZUGFeRD, a multi-page multi-document PDF, a Pfand credit note, a
Kleinbetragsrechnung ≤ 250 €. Getting these is a **business** blocker on M3,
not an engineering task to schedule later.

**R2 — Willingness to pay is unvalidated.** One of twenty-one planned
interviews has been conducted. DATEV Belege online costs 3,75 €/month for
digitising; we ask 39 € for reading the line items back. The assumption is
recorded as A2 in `.research/01-Empathize/insights-utp.md`. Engineering cannot
resolve it, but it should be resolved before M6.

**R3 — DATEV EXTF rejection.** The format is versioned and unforgiving, and a
rejected Buchungsstapel lands on the Steuerberater's desk, which is exactly the
relationship the product is trying to earn. Build a validator against the spec
in M5, not a hand-rolled CSV writer.

**R4 — EU residency for inference.** `app/extraction/client.py` has no default
route and refuses a non-EU region; the development route needs a second
explicit flag. Production must run through a route with a verifiable region
argument (Vertex or Bedrock, EU). Two independent mistakes are required to send
a real document outside the EU, and that property must survive refactoring.

**R5 — Scope creep from the prototype.** `web/` contains 18 routes that are
Phase 2 and 3. They exist to demonstrate where the product goes. Anyone reading
the prototype as a backlog will build the wrong twelve weeks.

**R6 — The restyle is underestimated.** The prototype and the approved design
are the same information architecture in two different visual systems. Bringing
`web/` to the Figma design is a theme-layer job, not a rewrite — but it touches
every screen, and a half-done restyle looks worse than either version. Do it as
one deliberate pass in M4, before the screens multiply, rather than screen by
screen as they are built.

---

## 12. Open decisions for the CTO

These are genuinely open. Each has a default that is defensible if nobody
decides otherwise.

| Decision | Default if unresolved |
|---|---|
| Hosting: Hetzner versus AWS eu-central-1 | Hetzner for cost, AWS if Bedrock is the inference route — in which case one provider for both is simpler |
| Inference route: Vertex EU versus Bedrock EU | Bedrock, if hosting is AWS. Both take a verifiable region argument; the first-party API does not. |
| Auth: build versus a provider | A provider. Auth is not where this product earns anything, and a German B2B tenant model with roles is well-trodden. |
| Email intake: own MX versus an inbound service | An inbound service. Running mail for attachment ingestion is a distraction with a long tail of deliverability work. |
| Queue: Celery versus something newer | Celery, as specified. It is boring and the pipeline is not exotic. |
| Monorepo versus split repositories | Monorepo. Two people, one product, shared contracts. |
