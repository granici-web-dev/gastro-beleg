# CLAUDE.md — GastroBeleg (working title)

AI-powered invoice & delivery-note ingestion for independent restaurants in Germany.
Photo/PDF/E-Rechnung in → line items extracted → mapped to product catalog → food-cost insights + DATEV export out.

Reference product (inspiration, not target market): restdata.app (Moldova, Syrve/iiko integrations).
We are NOT cloning its integrations — the German market requires a different integration and compliance layer.

---

## 1. Product definition

**Target user:** independent restaurant / café / bar, 1–3 locations, mixed supplier pool
(Metro self-pickup, small butchers, bakeries, vegetable dealers, Getränkehändler).
They usually have a POS but NO Warenwirtschaft. They have a Steuerberater who uses DATEV.

**UVP:** "Lieferschein fotografieren. Fertig. Preiskontrolle für deinen Einkauf + fertige Buchhaltung
für deinen Steuerberater — ohne Systemwechsel, ohne Plattform für 175 €, ab 39 €."

**Explicit NON-goals (do not build):**
- Full Warenwirtschaft / inventory with stock levels and recipes (Apicbase/FoodNotify territory)
- POS functionality of any kind
- Supplier ordering (Choco/Kollex territory — we are complementary to them)
- Outgoing invoice creation (sevdesk territory)

## 2. MVP scope (Phase 1)

### 2.1 Document intake
- Upload: photo (mobile camera), PDF (incl. multi-page), image files
- Email inbox: each tenant gets `docs-{tenant}@<domain>` forwarding address; attachments auto-ingested
- E-Rechnung parser: XRechnung (UBL/CII XML) and ZUGFeRD ≥ 2.0 (PDF/A-3 with embedded XML).
  Structured invoices bypass OCR entirely — parse XML directly. This is a first-class citizen, not a fallback.
- Multi-document detection: one PDF/photo batch may contain several Lieferscheine → auto-split

### 2.2 Extraction (LLM-based, not classical OCR templates)
Extract per document: supplier (name, address, USt-IdNr if present), document type, document number,
date, currency. **The document-type enum is open and must be declared in full from the first migration**
even though only the MVP members are handled: MVP — `Rechnung`, `Lieferschein`, `Gutschrift`, `Kassenbeleg`;
reserved for Phase 2 — `DSFinV-K-Export`, `Speisekarte`, `Plattform-Abrechnung`, `Vertrag`, `Energierechnung`,
`Lohnabrechnung`. Adding them later means rewriting applied migrations, which we forbid.
Extract per line item: description, quantity, unit, unit price, line total, **VAT rate (7% / 19% / 0%)**,
**Pfand lines flagged separately** (deposit for crates/kegs/bottles — never book as goods cost).

Validation rules (hard requirements):
- qty × unit price ≈ line total (tolerance configurable, default 0.02 €)
- sum of lines + VAT ≈ document total
- duplicate detection: same supplier + doc number + total → block with warning
- price-change detection: unit price vs. last known price for same supplier+product → flag if Δ > threshold (default 5%)
- every extracted field carries a confidence score; below threshold → route to human review UI

### 2.3 Product mapping (the learning core — port RestData's pattern)
- First occurrence of a supplier product string → user manually maps to internal catalog item
- Mapping is remembered per (supplier, product string/article number); auto-applied afterwards
- Fuzzy match suggestions by name + EAN/article number
- **Unit conversion:** "1 Kiste = 24 Flaschen à 0,33 l", "5 kg Sack Reis" → base unit configured per catalog item.
  Conversions stored per (supplier, product), reused automatically.

### 2.4 Outputs
1. **Food-cost dashboard (own destination — critical, target users have no WaWi):**
   spend by category/supplier/month, price history per product, top price increases, Pfand balance per supplier.
2. **DATEV export:** EXTF-Format CSV (Buchungsstapel) compatible with DATEV Unternehmen Online.
   Konto mapping per category, SKR03 default (SKR04 selectable). 7/19% split per line, Pfand to its own account.
3. **Universal CSV/Excel export** of line items (for "inventory in Excel" users).
4. **GoBD archive:** original file stored immutably (WORM semantics: versioned, no deletion within retention),
   audit trail of every change (who/when/what), export function (GoBD-Datenzugriff Z3).
   **Retention: 8 years is the legal minimum for Buchungsbelege** (§ 147 (1) no. 4 AO / § 257 HGB as amended
   by Bürokratieentlastungsgesetz IV, in force since 2025-01-01), **10 years is our default** — headroom for
   an unexpired Festsetzungsfrist (§§ 169, 170 AO). Annual accounts, books and inventories stay at 10 years.
   Retention is a per-tenant setting, never a constant in code.

### 2.5 Accounts, billing, compliance
- Multi-location tenants, roles: Owner / Manager / Staff / Steuerberater
  (staff = upload only; Steuerberater = read + export, never edit or book —
  booking stays with the restaurant or the catalog stops learning. See `MVP.md` § 7a)
- **Pricing is credit-based, not per document.** A document is an event; a credit is what the
  processing costs. Tiers **39 / 89 / 149 €/mo = 90 / 220 / 450 credits**. Unused credits roll
  one month forward (capped at one allowance, so they cannot be stockpiled); top-up packs never
  expire, not even across a tier change. 14-day trial, 30 credits, whichever runs out first, no credit card.

  **The rate follows the source, never the line count.** The restaurateur chooses how a document
  reaches us; they do not choose how many lines their supplier prints, so billing them for it would
  make the invoice unpredictable for something they cannot influence.

  | Source | Credits |
  |---|---|
  | **E-Rechnung — XRechnung / ZUGFeRD** | **0** |
  | `Kassenbeleg` ≤ 250 € (Kleinbetragsrechnung) | 0.5 |
  | Photo or PDF | 1 up to 60 lines, +1 per further 60 |
  | Manual entry, and any retry after a failed read | 0 |

  **Structured invoices are free because they cost us nothing** — deterministic XML parsing, no
  model call (§ 4). This is also the wedge: as suppliers move to XRechnung under the 2027/2028
  mandate, the customer's bill falls on its own. It is the same mechanism as the free
  E-Rechnung-Posteingang in Phase 3 (§ 3), applied inside the paid tiers.

  Intake and the GoBD archive never stop when credits run out — only reading pauses. A document
  that arrived is archived and stays retrievable; § 147 AO does not care about our billing.
- Stripe billing (SEPA + card), German invoices with correct USt
- Legal pages: Impressum, AGB, Datenschutzerklärung; AVV (DPA) available as PDF
- **All data and LLM processing in EU.** No US-region inference endpoints.

## 3. Roadmap (post-MVP)

> Full sequenced roadmap with gates, dependencies and rationale: `.research/06-Implement/roadmap.md`
> (revision 2026-08-12, derived from the 41-idea verdict report `.research/03-Ideate/ideenkatalog-verdikte.md`).
> The MVP does not grow — but three things are built into Phase 1 because they cannot be reconstructed
> retroactively: **onboarding questionnaire** (seats, format, cuisine, hours — normalises every later metric),
> **savings-event log** (every alert writes its € effect; feeds the "found money" counter),
> **back-dating on import** (`Document.date` ≠ upload date, or the onboarding backlog collapses into one day).

### Phase 2 — Moat features (months 4–8), in four waves
- **Wave A — reconciliation (months 4–5).** Delivery note ↔ invoice mismatch, Gutschrift tracking,
  **Reklamation flow** (one-click complaint mail → auto-match the incoming credit note), supplier
  reliability score, "found money" counter. *This is the confirmed differentiator: competitors that parse
  line items exist (BilledOK), competitors that reconcile documents against each other do not.*
- **Wave B — the revenue half (months 5–6).** **DSFinV-K import as a first-class document type** — every
  German POS must be able to export it since 2020-01-01 (current version 2.4); the Einzelaufzeichnungsmodul
  carries receipt line items (article, qty, price, VAT rate, product group). Maps onto the same catalog
  mapping engine as supplier lines. Unlocks **Wareneinsatz-Quote** without a single POS integration.
- **Wave C — habit (months 6–7).** **WhatsApp intake** (Business API, photo = document) with multilingual UI
  (DE, EN, TR, VI, AR, RU, PL), weekly digest, due-date calendar, Skonto optimiser.
- **Wave D — document breadth (months 7–8).** Contract/subscription radar, energy monitoring,
  delivery-platform economics (aggregate only), **menu scan** (dish catalog — cold start for recipes),
  Betriebsprüfung export mode, supplier negotiation dossier, price-increase alerts.
- **In parallel:** **Steuerberater portal** (free read-only access, seed of KanzleiBeleg and a distribution
  channel), **Metro Deutschland portal auto-fetch** then Transgourmet, and — at the very end — the
  **ready2order API** (line-item bills, daily reports, webhooks) as a freshness upgrade, not an entry gate.

### Phase 3 — Network effects (months 9–18)
- **Recipes → margin chain:** AI recipe drafts (confirmation required) → dish margin → Menu Engineering →
  menu pricing against inflation. Strictly sequential; the menu scan from Wave D starts it.
- **Live QR menu as a free module, not a product.** The market is a commodity (7+ providers, 0–99 €/mo),
  but none of them is connected to purchase prices. Value is the loop: margin alert → one button → new price
  on the guest's table. AI dish photos are wired in from an existing service and **must carry an automatic,
  non-optional "KI-generierter Inhalt" label plus machine-readable marking** (AI Act Art. 50 (4)(5),
  applicable since 2026-08-02 — the duty falls on the restaurant as deployer); the image must depict the
  dish actually served (Art. 7 LMIV, § 5 UWG). Allergens stay a human-confirmed draft, never an automatic claim.
- **Regional price benchmark:** anonymized cross-tenant price index per product/region
  ("you pay 9% above median in NRW for cream"). Requires critical mass; design data model for this from day 1
  (normalized product taxonomy, region on tenant). THE long-term moat — platforms can't replicate
  (data locked in their silos), Choco won't (monetizes suppliers).
- **Free E-Rechnung-Posteingang** as acquisition funnel: free tier = receive/view/archive XRechnung.
  Consistent with § 2.5, where a structured invoice already costs 0 credits inside the paid tiers —
  the free tier is the same rule with the paid part removed, not a separate promise.
- Depth by demand: prime cost, inventory assistant, bank-grade report, multi-location, ask-your-restaurant chat.
- DESADV/EDI ingestion for chains moving upmarket.

### Explicitly not built
- **Insurance radar** — "no business-interruption cover visible" is advisory judgement plus a broker lead:
  maximum legal exposure for minimal value.
- **Behördenpost** (decoding authority letters) — StBerG/RDG risk, unchanged.

### Regulatory timeline to design around
- Since 2025-01-01: every German business must be able to RECEIVE E-Rechnung (no exceptions).
- From 2027-01-01: sending mandatory for businesses with prior-year turnover > 800k €.
- From 2028-01-01: sending mandatory for all B2B.
- Kleinbetragsrechnungen ≤ 250 € gross stay exempt permanently → paper/PDF receipts (Metro runs!) persist.
  OCR remains relevant; share of structured XML grows — architecture treats both as equal inputs.

## 4. Architecture & stack

- **Backend:** Python 3.12, FastAPI (async), PostgreSQL, SQLAlchemy 2.0 (typed) + Alembic,
  Celery + Redis for the ingestion pipeline. Pydantic v2 as the domain contract (extraction results,
  confidence-scored line items). Rationale: the core is a data/extraction pipeline (vision-LLM + PDF handling
  + deterministic E-Rechnung XML parsing), where the Python ecosystem is more mature and where a Python
  scaffold was already started (Alembic migrations, `app/tasks/etl` stages).
- **Frontend:** Next.js (App Router), TypeScript strict, Tailwind, mobile-first (primary device = phone in a kitchen)
- **Extraction:** Anthropic API (Claude vision model, EU endpoint) for photos/PDFs; deterministic XML parsers
  for XRechnung/ZUGFeRD (`drafthorse` / `factur-x` for CII/UBL + PDF/A-3 embedded XML).
  Never send structured XML through an LLM for parsing; LLM only for unstructured docs.
  LLM structured output via tool-use → validated straight into Pydantic schemas.
  Wrap extraction behind an internal `ExtractionProvider` ABC — providers must be swappable.
- **Storage:** S3-compatible object storage, EU region (originals, immutable); Postgres for structured data
- **Hosting:** EU only — Hetzner (Falkenstein/Nürnberg) or AWS eu-central-1
- **Pipeline shape:** intake → classify (XML vs. image/PDF) → split → extract → validate → map → review-if-needed → post
  Each stage idempotent, resumable, dead-letter queue for failures.

### Data model — core entities
`Tenant, Location, User, Supplier, CatalogItem (base_unit), SupplierProductMapping (supplier_id, raw_string,
article_no, catalog_item_id, conversion_factor), Document (type, status, source, original_file_ref, gobd_lock),
DocumentLine (qty, unit, unit_price, total, vat_rate, is_pfand, confidence, catalog_item_id),
PriceHistory (catalog_item_id, supplier_id, unit_price, date), ExportBatch (datev|csv), AuditLog`

Design constraint: product taxonomy must support future cross-tenant anonymized aggregation (Phase 3 benchmark).

## 5. Domain rules (German specifics — never violate)

1. VAT: food mostly 7%, drinks mostly 19%, exceptions exist — take rate FROM THE DOCUMENT, never guess by category.
2. Pfand is not goods cost: separate flag, separate DATEV account, tracked as per-supplier balance.
3. GoBD: originals immutable, complete audit trail, no hard deletes of booked documents
   (soft-delete + Storno pattern only). Retention: **8 years legal minimum, 10 years default** — see §2.4.
4. DSGVO: EU processing only, AVV for every customer, data export & deletion (of account data, not GoBD-locked docs).
5. DATEV EXTF format is versioned and picky — validate against spec, provide test export before first real one.
6. Dates: DD.MM.YYYY in UI; numbers: comma decimal separator in UI, dot internally.
7. UI language: German first. Code, comments, commits: English.
   **Research and planning docs (`.research/`, mirrored to the Obsidian vault) are Russian** —
   translated 14.08.2026, write new notes there in Russian. Three things stay German inside them:
   domain terms (Lieferschein, Pfand, Wareneinsatz, Steuerberater, GoBD, DSFinV-K, XRechnung,
   Betriebsprüfung, SKR03/04), identifiers (Figma frame/component/token names, route paths), and any
   line spoken or signed verbatim by a respondent — the block-F pitch in `interview-guide.md`, the
   door pitch, the "Wussten Sie das?" question and the consent paragraph in `p1-concierge-protokoll.md`,
   each carrying a Russian gloss underneath. `belegdiagnose-report.html` stays German in full: it is
   handed to a restaurateur, not read by us.

## 6. Conventions for Claude Code

**Read `FLOWS.md` before implementing anything with a screen or a state.** It carries the
document lifecycle, where credits are charged, the eleven end-to-end scenarios, the navigation
contract and the defaults that are wrong in this codebase. `MVP.md` says what ships; `FLOWS.md`
says what happens between screens.

- Backend: Python type hints everywhere, mypy strict; no untyped domain logic. Pydantic v2 models
  for every extracted structure. Frontend: TypeScript strict, no `any` in domain logic.
- Money: integer cents everywhere, never floats. VAT rounded per line, `Decimal` with `ROUND_HALF_UP`
  only at the rounding boundary; store the result as int cents.
- Every ingestion pipeline stage: pytest unit tests + at least one golden-file test
  (sample docs in `/fixtures`: Metro receipt, handwritten butcher Lieferschein, ZUGFeRD PDF, XRechnung XML,
  multi-page multi-doc PDF, doc with Pfand lines, doc with 7%+19% mixed)
- Feature flags for everything post-MVP; MVP ships behind nothing
- Migrations: never edit applied migrations; forward-only
- Secrets via env, never committed; separate staging/prod tenants for Stripe & LLM keys
- Definition of done for extraction changes: golden-file suite passes + confidence distribution not degraded

## 7. Rules

@AI_rules.md