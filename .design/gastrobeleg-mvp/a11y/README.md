# Accessibility Tests — GastroBeleg

Accessibility is tested in layers. Each layer runs as soon as its subject exists,
so a11y is verified continuously rather than audited once at the end.

## Layer 1 — Design tokens: color contrast ✅ (active now)

`test_contrast.py` reads `../DESIGN_TOKENS.css` (source of truth) and asserts every
meaningful foreground/background pairing meets **WCAG 2.1 AA**:

- Normal text ≥ **4.5:1**
- Large text / non-text UI (icons, borders, focus ring, status dots) ≥ **3.0:1**

Covers both light and dark themes: body/secondary/tertiary text on every surface,
links, primary-button label on accent fill, all four status colors as text and as
pill (colored-text-on-subtle-bg), the low-confidence highlight (the review heart),
and non-text UI contrast (focus ring, accent element).

```bash
python3 test_contrast.py        # standalone, human-readable table, exits 1 on failure
pytest  test_contrast.py -q     # CI-friendly
```

No dependencies. This test already drove real token fixes (missing on-accent label
color; light-mode status pills that failed 4.5:1; dark-mode button that would have
had dark-on-dark text). Re-run after any color-token change — it is the guard.

## Layer 2 — Component & page a11y (planned, needs built UI)

Once the Next.js app is scaffolded (Figma → code phase), add automated checks:

- **`jest-axe` / `vitest-axe`** — axe-core assertions in component unit tests
  (roles, names, ARIA, label associations). One `expect(await axe(container)).toHaveNoViolations()`
  per component.
- **`@axe-core/playwright`** — full-page scans per route in E2E, at the 375 / 768 / 1280
  breakpoints and in both themes.
- **Keyboard-only flow tests** for the two work surfaces (review + DATEV export):
  tab order, visible focus, Enter/Escape, no keyboard traps.

## Layer 3 — Manual checklist (per design review)

Not automatable; verified in `/design-review`:

- Screen-reader pass (VoiceOver) on capture → review → post flow.
- Color is never the only signal — confidence / status / validation each carry an
  icon or text label too (checked visually + by axe rules).
- Tap targets ≥ 44×44px on mobile (kitchen phone, wet fingers).
- `prefers-reduced-motion` respected.
- Money values announce with currency and read in a sensible order.

## Requirements traceability

Derived from `DESIGN_BRIEF.md → Accessibility Requirements` and CLAUDE.md domain
rules. Contrast thresholds and the "color is not the only signal" rule are hard
requirements, not aspirations.
