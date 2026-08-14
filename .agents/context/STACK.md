# STACK.md — GastroBeleg

## Frontend (this is what the prototype is)

| Layer | Choice | Version | Why |
|---|---|---|---|
| Framework | Next.js App Router | 16.3 | Server Components by default; the prototype becomes the product, not a throwaway |
| Language | TypeScript, `strict` | 5.9 | No `any` in domain logic — the domain is money and tax rates |
| Styling | Tailwind CSS | 4.3 | CSS-first config, tokens live in `globals.css` |
| Components | shadcn/ui on Radix, preset `nova` | CLI 4.17 | Owned source in `src/components/ui`, not a black-box dependency. Chosen deliberately over the hand-built Figma system — see DECISION below |
| Icons | lucide-react | 1.31 | Real vector icons. Never keyboard glyphs or emoji in the UI |
| Charts | recharts via `components/ui/chart` | 3.8 | Themed through the same CSS variables as everything else |
| Notifications | sonner | 2.0 | |
| Feedback loop | agentation (dev only) | 3.0 | Click an element in the running app, annotate, hand the selector to the agent |

Package manager: **pnpm**. Node 26.

### DECISION: shadcn/ui replaces the hand-built Figma component system

The Figma file (`X5cmjr1EwurV8FrkN6BYxc`) holds 46 screens and a 42-component kit. It stays as the
**source of product intent** — what is on each screen, in what order, with what German copy. It is
**not** the source of visual truth any more. Visual truth is shadcn/ui + the tokens below.

Brand survives as tokens only: primary Forest `#26703F`, signature Lime `#B7D967`, attention burnt
orange `#A04E00`, error `#B01818`. Everything else is shadcn default.

### Non-negotiable frontend rules

- **Money is integer cents.** Never a float, never a number parsed out of a formatted string.
  Format at the edge with `Intl.NumberFormat("de-DE")`. Helpers live in `src/lib/money.ts`.
- **Dates**: `DD.MM.YYYY` in UI, ISO internally.
- **UI language German.** Code, comments, commits, file names English.
- **Numeric columns** get `font-variant-numeric: tabular-nums` (class `tabular`) — money that shimmies
  between rows is unreadable.
- No `style=` attributes for anything a token can carry.
- Every list has an empty state and a loading state. A screen without them is unfinished.

## Backend (not in this prototype yet)

Python 3.12, FastAPI async, PostgreSQL, SQLAlchemy 2.0 typed + Alembic, Celery + Redis, Pydantic v2
as the domain contract. Extraction via Anthropic vision (EU endpoint) behind an `ExtractionProvider`
ABC; XRechnung/ZUGFeRD parsed deterministically with `drafthorse` / `factur-x` and **never** sent
through an LLM. S3-compatible EU storage for immutable originals.

The prototype talks to **mock data in `src/lib/mock`**, shaped exactly like the future API responses,
so the swap is one module deep.

## Hosting

EU only — Hetzner (Falkenstein/Nürnberg) or AWS eu-central-1. No US-region inference endpoints, ever.
