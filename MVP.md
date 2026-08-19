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
| Figma page `V4 · Accent Lime` | The 105 screens and the weekly-report e-mail. **The visual reference.** |

### The two design surfaces, and which wins

**Figma is the visual reference. The prototype is the behavioural one.** The
founder reviewed both and chose the Figma design; that decision is what this
document is written against.

- **`V4 · Accent Lime`** — the current reference: 119 screens (61 desktop, 58
  mobile) plus the weekly-report e-mail, in German, at MVP scope. The page
  carries its own notes block: what the seven sidebar entries are, why a
  Lieferschein is not a Buchungsbeleg, and why the whole app is scoped to one
  location. Colour comes from a variable mode, so the page can be restyled
  without touching any earlier one.
- **`MVP · Ready for Dev`** — the previous handoff page, 73 screens in the
  *Forest & Lime* design. Superseded by `V4 · Accent Lime`, which contains
  everything it had plus the 46 screens added since. Keep until the frontend
  has taken the new page over, then archive.
- **`Screens V2.0`** — the original approved design. Reference.
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
   selectable, 7/19 % split per line, Pfand to its own account. **Lieferscheine
   are excluded unless the supplier is flagged as billing by delivery note**
   (§3a) — the invoice is the Buchungsbeleg. Delivered as a ZIP: the CSV plus
   the original documents, so the Kanzlei gets the Buchungsstapel and the
   Belege in one download. See §8a.
9. **Universal CSV/Excel export** of line items.
10. **GoBD archive** — original stored immutably, full audit trail, Z3 export.
11. **Accounts and billing** — tenants, locations, four roles, Stripe, trial.
12. **Payment terms and Skonto** — due date and discount terms read from the
    invoice, a week-ahead payment list, and a warning before a discount
    expires. Pure arithmetic on fields the same parser already sees.
13. **Duplicate-payment protection, stated as money** — the duplicate rule
    already exists; what ships with it is the sentence a person understands
    ("this invoice is already paid") and a savings-event row.
14. **Supplier price comparison per catalog item** — the mapping already
    normalises every supplier's wording to one item and one base unit, so
    "who is cheaper per kg" is a query over data the MVP has anyway.
15. **Weekly summary by email** — what was processed, which prices moved, what
    is due, where a discount is about to expire, what was not lost.

### 2.1a Why these five, and why now

Added on 17 August 2026, deliberately breaking the "the MVP does not grow"
rule. The justification is one property they share: **none of them depends on
the vision model being good.** They run on structured e-invoices and on
arithmetic. If R1 turns out badly — if a crumpled Metro receipt cannot be read
reliably — the product still does something a restaurant will pay for. That is
worth roughly two and a half weeks.

Each also passes three tests that keep the MVP from bloating further:

1. **It works on document number one.** Nothing here needs three months of
   history, so nothing here is an empty screen during a demo.
2. **It is deterministic.** No new model behaviour, no new failure mode.
3. **It adds no new document type.** This is the test that keeps contract
   radar, subscription tracking and energy monitoring out — each is cheap on
   its own, and each needs months of history plus a new parsing path. They
   stay in Phase 2, Wave D.

**One honest limit on the Skonto number.** A discount is only realised if the
restaurant actually pays early, which depends on cash they may not have. The
product may show "47 € expire in three days". It may not claim to have saved
them.

This has two consequences that are easy to get wrong:

- **Wording, everywhere.** The column is `Skonto-Betrag`, never `Ersparnis`;
  the tile says "noch erreichbar"; the day card says "Skonto möglich". Nothing
  says *gespart* until a payment is confirmed. This is not tone — `Ersparnis`
  states a saving as fact, and the fact is not in evidence.
- **The savings-event log writes on payment, not on display.** A discount that
  was merely shown is not found money. If the counter starts booking discounts
  nobody took, the first reconciliation against a bank statement destroys the
  one number the subscription is defended with.

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
  Gutschrift tracking, DSFinV-K import, WhatsApp intake, contract radar, energy
  monitoring, menu scanning, margin per dish, QR menu, regional price
  benchmark. The prototype shows screens for these on purpose — they are the
  demo story, not the build order. Every one of them is behind a feature flag.
- **The Steuerberater *portal* stays out; the Steuerberater *role* is in.** The
  role is a login with a permission set on the tenant's own data (§7a). The
  portal — a Kanzlei working across many restaurants, its own dashboard, its own
  billing — is a second product and belongs to Phase 2 at the earliest.

---

## 3. Screen inventory

**119 screens: 61 desktop, 58 mobile, plus one e-mail template.** Mobile is the
primary device — the phone in a kitchen is the one that photographs the
delivery note, and it is also where a wrong line gets corrected.

How the count grew, and why each step was not padding: 47 screens were the
original inventory; walking the seven user journeys end to end found **seven
steps with no screen** (54); three audits of states and document types found
**nineteen missing states** (73); building the mobile halves of desktop-only
screens closed the platform gap (90); and the flow audit of **19 August 2026**
found five dead ends, three scenario holes and four missing mobile states
(105); and the role variants for Staff and Manager, the last item that was
open by decision rather than by oversight, took it to 111; the loading
skeletons took it to 115 and the split editor to 117. Each round found
less than the one before, which is the only evidence that the list is
converging.

**The sidebar has seven entries, and that is the MVP.** Übersicht, Belege,
Analyse, Katalog, Lieferanten, DATEV-Export, Einstellungen. `Fälligkeiten` is a
tab under Belege, not an eighth entry. Above the menu sits the **location
switcher** — see §3a. The prototype shows eleven entries because it also
demonstrates Phase 2; a build that ships eleven has shipped four dead ends.

### Desktop — the primary screens

| # | Screen | Route | Notes |
|---|---|---|---|
| 1 | Übersicht | `/uebersicht` | Food-cost dashboard. Landing screen after login. |
| 2 | Belege | `/belege` | List, filter by status, source, supplier, period. |
| 3 | Beleg prüfen | `/belege/[id]` | **The core screen.** See §7. |
| 4 | Fälligkeiten | `/faelligkeiten` | Tab under Belege. Payment week ahead, Skonto about to expire. |
| 5 | Kanzlei-Ansicht | `/kanzlei` | What the Steuerberater role sees. Read + export only; see §7a. |
| 6 | Analyse | `/analyse` | Purchase analysis, price history. |
| 7 | Katalog | `/katalog` | Catalog items, supplier mappings, unit conversions, supplier price comparison per item. |
| 8 | Lieferanten | `/lieferanten` | Suppliers, per-supplier Pfand balance, **billing mode** (§3a). |
| 9 | DATEV-Export | `/export` | Buchungsstapel ZIP and the CSV line-item export; see §8a. |
| 10–13 | Einstellungen · Betrieb / Nutzer / Buchhaltung / Rechtliches | `/einstellungen/*` | |
| 14 | Einstellungen · Tarif | `/einstellungen/tarif` | Plan, credit balance, top-up packs. |
| 15–19 | Modals: Artikel zuordnen · Neuer Artikel · Neuer Lieferant · Nutzer einladen · Tarif wechseln | over their pages | |
| 20–22 | Registrierung · Anmelden · Passwort zurücksetzen | `/registrieren` `/login` `/passwort` | |

### Mobile — the primary screens

Tab bar: Übersicht · Belege · **[Scan]** · Analyse · Mehr. Scan is a raised
centre action, not a tab — it is the primary job.

| # | Screen | Route |
|---|---|---|
| 1–5 | Übersicht · Belege · Beleg erfassen · Analyse · Mehr | `/uebersicht` `/belege` `/scan` `/analyse`, menu sheet |
| 6–10 | Beleg prüfen · Fälligkeiten · Katalog · Lieferanten · DATEV-Export | as desktop |
| 11–12 | Hochladen · Einstellungen | upload sheet, `/einstellungen` |
| 13–17 | Betrieb · Nutzer · Buchhaltung · Rechtliches · Tarif | `/einstellungen/*` |
| 18 | Onboarding | `/onboarding` |
| 19–23 | Sheets: Artikel zuordnen · Neuer Artikel · Neuer Lieferant · Nutzer einladen · Tarif wechseln | bottom sheets |
| 24–26 | Registrierung · Anmelden · Passwort zurücksetzen | as desktop |

> The rows above are the primary screens. Everything else in the count is a
> state, a document type or a dialog. The Figma section name is the authority
> on the total.

### 3a. What the flow audit of 19.08.2026 changed

Fifteen screens, one e-mail template and two product rules. The rules first,
because they change what the screens say.

**A Lieferschein is not a Buchungsbeleg.** The DATEV preview was posting
delivery notes to 3300. A supplier who delivers eight times and invoices once
would then be booked nine times, and the duplicate rule cannot catch it —
different number, different total. Reconciliation of delivery note against
invoice is Phase 2, so the MVP settles it with a default and an exception:
**Lieferscheine stay out of the Buchungsstapel** and feed price history and
delivery control instead; a supplier whose delivery note *is* the invoice —
the butcher who prints "Lieferschein/Rechnung" — carries the flag
`bills_by_delivery_note` and gets posted. The flag is set on the supplier, not
on the document, because it is a property of how that supplier trades.

**The app is scoped to one location at a time.** The tariff sells up to three
Standorte and the data model has always had them, but nothing in the interface
knew about them: a two-location owner could not tell whose delivery a document
was. The switcher sits in the sidebar on desktop and in `Mehr` on the phone,
and **every list, dashboard and export follows it**. A document gets its
location on the review screen, defaulting to the location of whoever uploaded
it. There is deliberately no per-list location filter — one global scope, or
two screens start showing different totals for the same month.

| Screen | What it settles |
|---|---|
| `Sheet · Position bearbeiten — Mobile` | The `Bearbeiten` button on the phone led nowhere. §7 requires quantity, price, VAT rate and the Pfand flag to be correctable per line; on a 375px table that needs a sheet. Mobile is the primary device, so this was the most expensive hole in the set |
| `Neues Passwort setzen` — D + M | `Passwort zurücksetzen` was only the request form. The screen behind the e-mailed link did not exist |
| `Einladung annehmen` — D + M | `Einstellungen · Nutzer` already shows "wartet auf Bestätigung", so invitations existed in the model with no screen to accept them. This blocked all four roles, and with them the Steuerberater — the cheapest distribution channel the product has (§7a) |
| `Registrierung · E-Mail bestätigen` — D + M | Nothing was drawn between "Kostenlos testen" and the first login. It also carries the honest promise that documents may already be mailed in and will be archived |
| `Belege · Noch keine Belege` — D + M | `Übersicht · Erster Tag` covered the dashboard and `Belege · Kein Treffer` the empty filter. The list with no data at all — the second screen every trial user opens — was not drawn |
| `Beleg prüfen · Mögliche Dublette` — D + M | `possible_duplicate` is a warning, not a block: a Kassenbeleg under 250 € carries no number (§ 33 UStDV) and is recognised by supplier, day, time and total. That is grounds for suspicion, not for a lock, so the screen is amber and booking stays possible |
| `Katalog · Noch keine Artikel — Mobile`, `Lieferanten · Noch keine Lieferanten — Mobile` | Both empty states existed on desktop only, and the first day happens on the phone |
| `Belege · Storniert — Mobile` | A reversed document never leaves the list, so the phone meets it too |
| `Sheet · Testphase abgelaufen — Mobile` | The trial ends wherever the owner opens the app first. `Kontingent erschöpft` already had both platforms; this one did not |
| `E-Mail · Wochenbericht` | Scope item 15 had no design at all. One column, 600px: what was read, which prices moved, what is due with the Skonto still reachable, what is waiting. Wording follows §2.1a — `noch erreichbar`, never `gespart` |

One tile on `Analyse` was replaced rather than restyled. It read **ZEIT
GESPART · 6 Std. · beim Steuerberater** — hours saved at the tax advisor, which
nothing in the system can evidence and which §2.1a forbids stating as fact. It
now reads **AUTOMATISCH GEBUCHT · 92 % · 136 von 148 · ohne Korrektur**, and
that number has an exact definition the build must not soften: documents booked
in the period with **zero field edits**, divided by documents booked. The audit
log already records every edit, so it is derivable and auditable — it measures
what the extraction got right instead of guessing what that was worth to
somebody.

The same screen lost the word *Ersparnis* twice more: the quarter tile is now
**PREISINDEX IM QUARTAL** and the panel beside `Größte Anstiege` is now
**Größte Rückgänge**. Both figures were already real — they come from price
history, not from a promise — but naming them after the movement instead of
after its supposed benefit keeps one vocabulary on the screen and removes the
question of whose saving it was.

**Decided, so nobody reopens it:** the auth screens (`Registrierung`,
`Anmelden`, `Passwort zurücksetzen`, `Onboarding`, and the three added on
19.08.) carry the marketing proof point *„−9 % durchschnittliche Ersparnis im
Einkauf in 3 Monaten“*. It **stays** — it rests on pilot data, not on the
product's own arithmetic, which is why it lives on the marketing panel and
never inside the app. Two consequences follow. The number is a quantified
advertising claim, so whoever owns marketing keeps the pilot figures that
support it and refreshes the claim when they move. And it must not migrate
inside the product: everything past the login states only what this tenant's
own documents show.

Two permissions also got the control they were missing: the Kanzlei view now
offers the **CSV line-item export and the GoBD-Z3 archive** next to the EXTF
batch, which §7a grants but no screen had, and the desktop export screen offers
the CSV as well.

### 3b. Desktop only, on purpose

Not a gap — a decision, written down so nobody "fixes" it later. The
Kanzlei-Ansicht and its Rückfrage form, the Storno dialog, and the two DATEV
batch states (`Stapel veraltet`, `Stapel bereitgestellt`) exist on desktop
only. All four are desk work: an accountant, a booking correction and a
month-end handover are not done standing in a walk-in fridge.

### 3c. Still open, and deliberately not invented in Figma

- **`Analyse` with too little history** — a price trend needs two observations.
  Judged a variant of the existing empty states rather than a screen

### 3d. The four state families

Not optional, and not a polish pass at the end. A list screen that has only its
full state is half a screen.

- **empty** — first login with no data at all, and the *different* empty of
  "no results for this filter"
- **loading** — skeletons, not spinners, for anything with a known shape;
  the four shapes and the rules are in §3g
- **error** — what failed and what the person can do about it
- **partial** — extraction succeeded but confidence is low, or the document is
  blocked from booking

Every list, every MVP document type and every dead end now has one, on both
platforms, with the exceptions listed in §3b and §3c.

### 3e. Copy conventions the frontend must not undo

A pass on 19.08.2026 rewrote roughly 400 strings to remove two habits that make
an interface look machine-assembled, and both are easy to reintroduce in code.

- **No middle dot as a separator.** Two facts on one line are joined by a
  comma, a preposition or an em dash; a path uses a slash. `24 Belege im Juni`,
  not `24 Belege · Juni`. The only surviving `•` is the password mask, which is
  a mask and not a separator.
- **No glyph arrows, checks or maths signs in text runs.** Direction is carried
  by the sign and the colour, so a trend reads `+12 %` / `−6 %` with no arrow,
  and a link says where it goes instead of pointing at it. The validation panel
  says `Summe der Zeilen`, not a sigma. Where an icon is genuinely needed it is
  a drawn vector from the kit — a character in a text run inherits the text
  colour and weight and stops being an icon at the first restyle.

Both rules come from `AI_rules.md` §8; the file now complies, and the page
notes carry them so they survive the handoff.

### 3f. The permission model, and how it is shown

Four roles, one tenant. `Rollen · Rechte-Matrix — Desktop` carries the full
table and is the source of truth: **if code and that table disagree, the table
is right, or it gets changed there first.** The short version:

| | Owner | Manager | Staff | Steuerberater |
|---|---|---|---|---|
| Erfassen | ja | ja | ja | — |
| Prüfen, buchen, stornieren | ja | ja | — | — |
| Zahlen, Analyse, Katalog, Lieferanten | ja | ja | — | lesen |
| DATEV, CSV, GoBD-Z3 | ja | ja | — | ja |
| Nutzer einladen | ja | nur Staff | — | — |
| Tarif, Abrechnung, Löschen | ja | — | — | — |

Three mechanisms, and the difference between them is the part that is easy to
get wrong:

1. **Navigation hides.** A menu entry a role may never use is not rendered.
   Six of seven sidebar items reading „kein Zugriff“ is a wall of refusals
   shown to the person who does the most repetitive work in the building.
2. **Routes deny.** A deep link to a hidden page lands on
   `Staff · Kein Zugriff` — never a 404, never a blank screen. It names the
   role, what the role is for, and who can change it. One screen serves every
   denied route; the title carries the attempted route's own name.
3. **Actions inside a permitted page stay visible and disabled**, with who may
   perform them — see the two owner-only actions on
   `Manager · Einstellungen`. Hiding a button on a page the role may
   legitimately open makes the page look broken, and the person still needs to
   know the function exists and whom to ask.

**None of this is security.** The hidden entry is comfort; every route and
every mutation re-checks the role on the server.

Two consequences worth stating because they shaped the screens:

- **Staff sees only what they uploaded, and no amounts at all.** The list is
  scoped to that person so they can tell whether their photo went through, and
  the money column is absent everywhere. The total is on the paper in their
  hand; what the business spends is not their business, and hiding it costs
  them nothing. Their statuses are upload-centric — *wird gelesen, wird
  geprüft, erfasst, nicht gelesen* — never booking states, because Staff never
  books.
- **The Staff tab bar is a variant, not a second component.** Uploads, the
  raised Scan action, Mehr. In Figma it is detached to make the variant
  visible; in code it stays one component driven by the role. Staff's Standort
  is assigned rather than switchable — the global location scope of §3a is
  fixed for them.


### 3g. Loading, and why it is four screens rather than one component

Four shapes cover the product: **list** (`Belege · Laden — Desktop`, stands for
Katalog and Lieferanten too), **dashboard** (`Übersicht · Laden — Desktop`,
stands for Analyse), **detail** (`Beleg prüfen · Laden — Desktop`) and **mobile
list** (`Belege · Laden — Mobile`). Each is a clone of its live screen with the
data taken out, which is the point: same row height, same column widths, same
padding, so **nothing shifts when the data lands.**

What stays real and what becomes a block is the part that is easy to get wrong:

- **Real:** sidebar, tab bar, topbar, page title, column headers, filter chips,
  the search placeholder. Anything the client already knows before the request
  returns — putting a skeleton over a control the person could already use is a
  lie about what is loading.
- **A block:** everything the server still owes. **Anything carrying a figure
  counts as owed**, including a count in a header (`24 Belege im Juni`) and the
  subtitle of a detail screen, because the document is not identified yet.
- **Colour is data too.** Chart marks, the donut, status tints and confidence
  badges go flat grey. A lime chip inside a skeleton claims a result that has
  not arrived.
- **No result glyph.** No ticks in the validation panel, no checked Pfand box.
- **Actions that need the data are disabled** — `Beleg buchen` is disabled while
  the document is still loading.

Mechanics:

| | |
|---|---|
| Block height | ≈ 0.72 × font size, radius 4 |
| Block fill | one step below its ground — `#ebebeb` on a white card |
| Block width | varies per column, so the result does not read as a grid; badges keep the pill radius |
| Row count | whatever fills the viewport — the real count is one of the unknowns |
| Below ~300 ms | show nothing; a skeleton that flashes is worse than a still screen |
| Above ~10 s | switch to the failure state; a skeleton that shimmers forever is a spinner with extra steps |
| Motion | one shimmer, off under `prefers-reduced-motion`, never a spinner on top |

**A skeleton needs a known shape.** An action with an unknown duration — an
export being generated, a batch being built — gets a progress bar or its own
state screen instead. `Belege · Verarbeitung und Fehler` is that case and is
deliberately not a skeleton.


### 3h. `Trennung ändern`, and why the model is cuts rather than drag-and-drop

`Modal · Trennung ändern — Desktop` and `Sheet · Trennung ändern — Mobile` are
the editor the split-confirmation screens promise. **The model is a strip of
captures with cuts between them**, which is also exactly what the backend
needs: an ordered list of page indices plus the positions of the cuts.

That choice does the work:

- **Pages keep their order.** Nothing is dragged and nothing is reordered, so
  the only two operations are *set a cut* and *remove a cut* — and every state
  the person can reach is valid by construction. There is no way to build a
  document out of pages 1 and 4.
- **A document always keeps at least one capture**, which falls out of the same
  model rather than needing a validation rule.
- **The credit consequence is live and honest**: one cut more is one credit
  more, one merge is one credit less, because a photo or PDF is charged per
  document. A wrong split costs money *and* corrupts price history, which is
  why this screen exists at all.

**Out of scope, deliberately:** region cropping inside a single photo — two
delivery notes lying side by side on one sheet. The split works per capture,
because a photo batch is several captures. Cropping regions is a different
interaction with a different model and belongs to Phase 2 if it ever earns its
place.


### 3i. The Belege tab row

`Fälligkeiten` presented itself as a tab of `Belege` while `Belege` had no such
row — the two screens disagreed about the navigation above the list. The row is
now on all ten desktop screens that present themselves as Belege, including the
four that are only a backdrop behind a modal:

**Alle Belege / In Arbeit / Fälligkeiten.**

Three decisions came with it:

- **The middle tab was `Erfassen`, a verb between two nouns.** It is now
  **In Arbeit**, and it is the door to `Belege · Verarbeitung und Fehler` —
  the pipeline states were reachable only right after an upload and had no
  navigation of their own.
- **The active underline is ink, not lime.** The `Tab` component's Active
  variant defaults to lime; a `#dcff90` hairline on white measures 1.12:1 and
  is simply not there. The instances override it. **Fix the variant in the kit
  before building** rather than repeating the override.
- **The phone deliberately has no tab row.** `Fälligkeiten — Mobile` is a
  pushed screen with a back header, and a second chip row above the existing
  filters would fight them. Its door is an entry card at the top of
  `Belege — Mobile` that carries the week's figure and the Skonto still
  reachable. The pipeline states need no door there: on the phone those
  documents sit in the list with their status on the row.


### 3j. The unit conversion editor

`Modal · Umrechnung ändern — Desktop` and `Sheet · Umrechnung ändern — Mobile`
sit behind the `Ändern` link next to a conversion in `Artikel zuordnen`.

**This is where the most expensive bug in the prototype lived** — a pack price
compared against a per-base-unit history, reported as `+424 %`, green on every
type check. So the screen is built around the **result**, not around the
factor: *„8,40 € je Karton sind 1,68 € je Liter“* recomputes as the person
types, and it is the line that lets them tell a right conversion from a wrong
one. A factor alone tells nobody anything.

- **The base unit is fixed** and comes from the catalog item; only the quantity
  inside the delivery unit is editable here.
- **Two shapes, switched by chips.** *Feste Menge* (`1 Karton = 5 l`) and
  *Einzelne Gebinde* (`1 Kiste = 24 Flaschen à 0,33 l`, the case `CLAUDE.md`
  §2.3 names) — the second takes count, size and unit and multiplies them.
- **Stored per (supplier, raw string or article number)** — the same key as the
  mapping itself, because the conversion is a property of how that supplier
  packs that product.
- **It applies from the next document on.** Already booked lines keep the value
  they were booked with: silently rewriting price history is worse than a wrong
  factor going forward, and the person can see which entries were affected.


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
Tenant, Location, User (home_location_id)
Supplier (bills_by_delivery_note)
CatalogItem (base_unit)
SupplierProductMapping (supplier_id, raw_string, article_no, catalog_item_id, conversion_factor)
Document (type, status, source, original_file_ref, gobd_lock, date, time, location_id)
DocumentLine (qty, unit, unit_price, total, vat_rate, is_pfand, confidence, catalog_item_id)
PriceHistory (catalog_item_id, supplier_id, unit_price, date)
ExportBatch (datev | csv)
AuditLog
SavingsEvent (§2.2)
OnboardingProfile (§2.2)
CreditAllowance (tenant_id, period, granted, used, rolled_in)
CreditTopUp (tenant_id, purchased_at, credits, remaining)
CreditCharge (document_id, source, line_count, credits, charged_at, note)
```

**Two credit balances, not one.** The monthly allowance rolls one period
forward and is capped at a single allowance, so it cannot be stockpiled;
purchased top-ups never expire, not even across a tier change (§2.5). They are
consumed allowance-first, and mixing them into one number makes the cap
unenforceable and the top-up promise unkeepable.

**Every charge is a row, and the rows are append-only.** `CreditCharge` records
what was billed and why — the source it arrived by and the line count that
decided the multiplier — because „warum drei Credits?“ is a question the
product has to be able to answer. A correction is a compensating row, never an
edit, the same discipline the archive uses. A retry after a failed read and a
manual entry are charges of zero rather than absent rows: absence cannot be
told apart from a bug.

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
| `possible_duplicate` | warning | a document with **no** number matching an existing one by supplier + day + time + gross. See below |
| `no_lines` | blocking | nothing extracted |
| `price_jump` | warning | unit price against last known price for the same (supplier, product), default threshold 5 % |
| `low_confidence` | warning | below 0.85, routes to review |
| `pfand_unconfirmed` | warning | a line that looks like a deposit but the model was unsure |
| `missing_number` / `missing_date` / `future_date` | warning | header fields. `missing_number` is **suppressed** for a `Kassenbeleg` at or under `kleinbetrag_limit_cents` (default 250 €) |

Two details worth defending in review:

- **Duplicate detection fingerprints supplier + number + gross, not the file.**
  The duplicate that actually happens is the same invoice arriving twice as an
  XRechnung and as a forwarded PDF — different bytes, same meaning.
- **A Kleinbetragsrechnung has no number, so it gets the other fingerprint.**
  § 33 UStDV lets a receipt at or under 250 € omit the number, the recipient
  and the separately stated tax — and every Metro run produces one. Demanding a
  number there would block a legally complete document, so the rule is
  suppressed below the limit and identity falls back to supplier + day + time +
  gross. That combination is strong enough to warn and too weak to block: two
  purchases in the same minute for the same amount are unlikely, not
  impossible. Hence `possible_duplicate` is a warning with its own screen,
  where booking stays available — see §3a. The document's time of issue is
  carried for this rule and for nothing else.
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
  visible next to the button. A *warning* never disables it.
- **On the phone, correcting a line is a sheet, not an inline table.** 375px
  cannot hold quantity, unit, price, VAT select and the Pfand toggle in a row.
  `Sheet · Position bearbeiten — Mobile` is that surface, and it shows the
  recomputed line total before it is accepted.
- **The document's location is set here**, defaulting to the uploader's home
  location (§3a). It is the only screen that assigns one.
- **Every correction teaches the mapping.** That is the learning core: the
  second invoice from the same supplier should need no corrections at all.

---

## 7a. The Steuerberater role

The MVP has **four** roles, not three: Owner, Manager, Staff, Steuerberater.
The fourth one is the cheapest distribution channel this product has — the
Kanzlei sits between us and every restaurant it serves — and it costs a role
plus a permission set.

**A read-only accountant is useless.** Their work starts exactly where ours
stops: they need the Buchungsstapel out, not the dashboard in. So the role is
**read + export**, not read-only:

| May | May not |
|---|---|
| See documents, line items and findings | Edit any field |
| Download the original of any document | Book a document |
| Generate and download a DATEV export batch | Change catalog items or mappings |
| Download the CSV/Excel line-item export | See or change plan, billing, users |
| Run the GoBD Z3 export | Delete anything |

**Every row on the left needs a control, and two of them were missing.** The
Kanzlei-Ansicht offered the EXTF batch and nothing else, so the CSV line-item
export and the GoBD-Z3 archive were rights on paper. Both now sit on that
screen. A permission with no button is not a permission.

**Why booking stays with the restaurant.** It is tempting to let the Kanzlei
fix a wrong VAT rate and book — that is how the paper process works today. But
the review screen is where the mapping learns, and the person who knows that
"RIND HACK 5KG FRISCH" is Rinderhackfleisch works in the kitchen, not in the
Kanzlei. Move booking to the accountant and the catalog stops learning, price
history stops filling, and every alert the product sells goes quiet. The audit
trail is also cleaner when booking has exactly one owner.

**The role needs a way in.** An invitation is sent from
`Einstellungen · Nutzer`; the recipient lands on `Einladung annehmen`, which
states who invited them, to which business, in which role, and what that role
may and may not do — before they choose a password. For the Steuerberater this
screen *is* the product's first impression on the distribution channel, so it
says the "may not" half out loud rather than hiding it.

What the accountant needs instead of edit rights is a way to send a question
back — the classic Rückfrage. In the MVP that is one field: a note on a
document that flips it to "Rückfrage offen" and shows up in the owner's review
queue. If that turns out to cost more than a day, ship the role without it and
let them phone; do not ship edit rights as a substitute.

### 8a. What the export has to contain to be usable

A CSV of numbers alone makes the Kanzlei re-attach every Beleg by hand, which
is the work we claim to remove. The MVP export is therefore a **ZIP**:

- `EXTF_Buchungsstapel.csv` — header version 700, per DATEV document 1034038
- the original files, named by document number
- a manifest mapping each booking row to its original file

**To verify against the spec before building:** whether the EXTF record can
carry a document link (`Beleglink` / BEDI) that DATEV resolves to the image, and
under what conditions. If it can, populate it — that is the difference between
an import that lands with its Belege attached and a pile of numbers. The
sandbox and the DATEV Prüftool (Hilfe-Center 1070393) are open without a
partnership, so this is answerable in an afternoon and belongs in M5, not in a
meeting.

Stage 2 — pushing images and structured positions into DATEV Unternehmen
online through the `accounting:dxso-jobs` API — is Phase 2, and it only helps
the subset of clients who actually have Unternehmen online. Stage 1 works for
everyone and never stops being the fallback.

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

**M2 — The deterministic half (weeks 2–4)**
Port `app/extraction/` and `app/validation/` behind the pipeline. XRechnung and
ZUGFeRD end to end, no model call. Golden-file suite in CI. **Payment terms and
due date** join the extraction contract here, while the schema is being
settled — retrofitting fields after the review UI exists costs more.
*Done when:* a real supplier XRechnung becomes a document with correct lines,
VAT split, totals and due date, and the golden suite runs on every push.

**M3 — The vision half (weeks 3–5)**
Photo and scanned-PDF route, multi-document splitting, confidence routing.
**Prerequisite: the fixture set in `fixtures/README.md` exists.** This
milestone cannot start honestly without real documents.
*Done when:* accuracy is measured on the fixture set and the number is written
down — see §11.

**M4 — Review and mapping (weeks 5–8)**
`/belege/[id]` against the real API. Supplier product mapping, unit conversion,
price history written on booking. **Supplier price comparison per catalog
item** — it is a query over the mapping built in this milestone, so it costs
days here and would cost a rebuild later. **Duplicate-payment protection
restated as money**, writing its savings event. **The prototype restyle to the
Figma design**, as one pass — see risk R6.
*Done when:* the second document from a supplier needs no manual mapping, and
the catalog can answer "who is cheaper per kg".

**M5 — Outputs (weeks 8–10)**
Food-cost dashboard on real data. DATEV EXTF export validated against the spec
and delivered as the ZIP described in §8a. CSV export. GoBD Z3 export.
**Fälligkeiten and Skonto** — the arithmetic and the two screens, on the fields
M2 already extracts.
*Done when:* a Steuerberater imports a generated Buchungsstapel into DATEV
Unternehmen Online without a correction, **and without re-attaching a single
Beleg by hand**.

**M6 — Accounts, billing, compliance (weeks 10–12)**
Auth, four roles including Steuerberater with its permission set, multi-location,
Stripe with SEPA and card, German invoices, onboarding questionnaire, legal
pages, AVV.
*Done when:* a stranger can sign up, run the trial, and be charged — and an
invited Kanzlei can log in, download the Buchungsstapel and change nothing.

**M7 — Email intake and hardening (weeks 12–14)**
`docs-{tenant}@` addresses, attachment ingestion, dead-letter handling,
**the weekly summary email**, observability, load behaviour on a month of
backlog uploaded at once.

Two things about these dates. The estimate assumes the fixture problem in §11
is solved during M1–M2 — that is the single dependency most likely to move
them. And the plan grew from twelve weeks to fourteen when the features in
§2.1a were added: about two and a half weeks of work, placed where each piece
is cheapest rather than bolted on at the end.

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
