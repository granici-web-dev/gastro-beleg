#!/usr/bin/env python3
"""
Accessibility test: WCAG 2.1 contrast validation for GastroBeleg design tokens.

Reads DESIGN_TOKENS.css (source of truth), extracts the hex color variables for
light (:root) and dark ([data-theme="dark"]) themes, and asserts that every
meaningful foreground/background pairing meets its WCAG AA threshold:

  - Normal text      : >= 4.5:1
  - Large text / UI  : >= 3.0:1  (icons, borders, non-text UI, >=24px or >=19px bold)

Run standalone:   python3 test_contrast.py
Run with pytest:  pytest test_contrast.py -q

No third-party dependencies.
"""
from __future__ import annotations
import re
import sys
from pathlib import Path

TOKENS_CSS = Path(__file__).resolve().parent.parent / "DESIGN_TOKENS.css"

AA_NORMAL = 4.5
AA_LARGE = 3.0  # large text AND non-text UI components (WCAG 1.4.11)


# ---------- WCAG math ---------------------------------------------------------
def _hex_to_rgb(h: str) -> tuple[int, int, int]:
    h = h.strip().lstrip("#")
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    return int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)


def _linearize(c: int) -> float:
    s = c / 255.0
    return s / 12.92 if s <= 0.03928 else ((s + 0.055) / 1.055) ** 2.4


def relative_luminance(hex_color: str) -> float:
    r, g, b = _hex_to_rgb(hex_color)
    return 0.2126 * _linearize(r) + 0.7152 * _linearize(g) + 0.0722 * _linearize(b)


def contrast_ratio(fg: str, bg: str) -> float:
    l1, l2 = relative_luminance(fg), relative_luminance(bg)
    hi, lo = max(l1, l2), min(l1, l2)
    return (hi + 0.05) / (lo + 0.05)


# ---------- token extraction --------------------------------------------------
# Captures both direct hex values and single-level var() aliases
_ANY_VAR = re.compile(r"(--[a-z0-9-]+)\s*:\s*(#[0-9A-Fa-f]{3,6}|var\(--[a-z0-9-]+\))\s*;")
_VAR_REF = re.compile(r"var\((--[a-z0-9-]+)\)")


def _extract_block(css: str, selector: str) -> dict[str, str]:
    """Return {var: value} for the first `selector { ... }` block (hex or var() alias)."""
    start = css.find(selector)
    if start == -1:
        return {}
    brace = css.find("{", start)
    depth, i = 0, brace
    while i < len(css):
        if css[i] == "{":
            depth += 1
        elif css[i] == "}":
            depth -= 1
            if depth == 0:
                break
        i += 1
    body = css[brace + 1 : i]
    return {m.group(1): m.group(2) for m in _ANY_VAR.finditer(body)}


def _resolve_aliases(tok: dict[str, str]) -> dict[str, str]:
    """Resolve var(--x) references to concrete hex values within the same theme."""
    resolved: dict[str, str] = {}
    for name, value in tok.items():
        seen = set()
        while value.startswith("var(") and value not in seen:
            seen.add(value)
            ref = _VAR_REF.match(value)
            if not ref:
                break
            value = tok.get(ref.group(1), value)
        if value.startswith("#"):
            resolved[name] = value
    return resolved


def load_themes() -> dict[str, dict[str, str]]:
    css = TOKENS_CSS.read_text(encoding="utf-8")
    light = _extract_block(css, ":root")
    dark_overrides = _extract_block(css, '[data-theme="dark"]')
    # dark inherits light, then overrides — mirrors CSS cascade
    dark = {**light, **dark_overrides}
    return {"light": _resolve_aliases(light), "dark": _resolve_aliases(dark)}


# ---------- pairings under test ----------------------------------------------
# (foreground_var, background_var, threshold, description)
PAIRINGS = [
    # Body text on surfaces
    ("--color-text-primary",   "--color-bg-primary",   AA_NORMAL, "primary text on page"),
    ("--color-text-primary",   "--color-bg-secondary", AA_NORMAL, "primary text on card"),
    ("--color-text-primary",   "--color-bg-tertiary",  AA_NORMAL, "primary text on input"),
    ("--color-text-secondary", "--color-bg-primary",   AA_NORMAL, "secondary text on page"),
    ("--color-text-secondary", "--color-bg-secondary", AA_NORMAL, "secondary text on card"),
    # Tertiary = placeholder/meta -> treated as large/non-essential (>=3.0)
    ("--color-text-tertiary",  "--color-bg-primary",   AA_LARGE,  "tertiary/meta on page"),
    ("--color-text-tertiary",  "--color-bg-secondary", AA_LARGE,  "tertiary/meta on card"),
    # Links
    ("--color-text-link",      "--color-bg-primary",   AA_NORMAL, "link on page"),
    ("--color-text-link",      "--color-bg-secondary", AA_NORMAL, "link on card"),
    # Primary button: label sits on the accent fill
    ("--color-text-on-accent", "--color-accent-primary", AA_NORMAL, "button label on accent fill"),
    # Accent used as on-surface text/icon
    ("--color-accent-primary-text", "--color-bg-primary",   AA_NORMAL, "accent text on page"),
    ("--color-accent-primary-text", "--color-bg-secondary", AA_NORMAL, "accent text on card"),
    # Status text on card (icons+text; used at body size)
    ("--color-status-success", "--color-bg-secondary", AA_NORMAL, "success text on card"),
    ("--color-status-warning", "--color-bg-secondary", AA_NORMAL, "warning text on card"),
    ("--color-status-error",   "--color-bg-secondary", AA_NORMAL, "error text on card"),
    ("--color-status-info",    "--color-bg-secondary", AA_NORMAL, "info text on card"),
    # Status pills: colored text on its own subtle background
    ("--color-status-success", "--color-status-success-subtle", AA_NORMAL, "success pill text/bg"),
    ("--color-status-warning", "--color-status-warning-subtle", AA_NORMAL, "warning pill text/bg"),
    ("--color-status-error",   "--color-status-error-subtle",   AA_NORMAL, "error pill text/bg"),
    ("--color-status-info",    "--color-status-info-subtle",    AA_NORMAL, "info pill text/bg"),
    # Low-confidence highlight (the review heart) — colored outline/text on tint
    ("--color-confidence-low", "--color-confidence-low-bg",     AA_NORMAL, "low-confidence text on tint"),
    # Lime signature — dark label on lime fill (active nav, chips) + lime as accent on forest
    ("--color-text-on-lime",   "--color-accent-lime",   AA_NORMAL, "dark text on lime fill"),
    # bg-inverse == forest only in LIGHT theme (it flips to light in dark); scope accordingly
    ("--color-accent-lime",    "--color-bg-inverse",    AA_LARGE,  "lime accent on forest surface", ("light",)),
    ("--color-text-inverse",   "--color-bg-inverse",    AA_NORMAL, "text on inverse surface"),
    # Non-text UI contrast (WCAG 1.4.11): focus ring + accent element vs page
    ("--color-border-focus",   "--color-bg-primary",   AA_LARGE, "focus ring vs page"),
    ("--color-accent-primary", "--color-bg-primary",   AA_LARGE, "accent UI element vs page"),
]


def evaluate() -> list[dict]:
    themes = load_themes()
    results = []
    for theme_name, tok in themes.items():
        for pairing in PAIRINGS:
            fg_var, bg_var, threshold, desc = pairing[:4]
            only_themes = pairing[4] if len(pairing) > 4 else ("light", "dark")
            if theme_name not in only_themes:
                continue
            fg, bg = tok.get(fg_var), tok.get(bg_var)
            if fg is None or bg is None:
                results.append({"theme": theme_name, "desc": desc, "fg": fg_var, "bg": bg_var,
                                "ratio": None, "threshold": threshold, "passed": False,
                                "missing": True})
                continue
            ratio = contrast_ratio(fg, bg)
            results.append({"theme": theme_name, "desc": desc, "fg": fg, "bg": bg,
                            "ratio": ratio, "threshold": threshold,
                            "passed": ratio >= threshold, "missing": False})
    return results


# ---------- pytest entrypoints ------------------------------------------------
def test_no_missing_tokens():
    missing = [r for r in evaluate() if r.get("missing")]
    assert not missing, "Tokens referenced by tests but absent in CSS: " + ", ".join(
        f'{r["fg"]} / {r["bg"]} ({r["theme"]})' for r in missing)


def test_all_pairings_meet_wcag_aa():
    failures = [r for r in evaluate() if not r["passed"] and not r.get("missing")]
    msg = "\n".join(
        f'  [{r["theme"]:>5}] {r["desc"]:<32} {r["ratio"]:.2f}:1  (need {r["threshold"]}:1)'
        for r in failures)
    assert not failures, f"\nWCAG AA contrast failures:\n{msg}"


# ---------- standalone runner -------------------------------------------------
def _main() -> int:
    results = evaluate()
    fails = 0
    print(f"\nWCAG AA contrast — {TOKENS_CSS.name}\n" + "=" * 66)
    for theme in ("light", "dark"):
        print(f"\n  {theme.upper()}")
        for r in [x for x in results if x["theme"] == theme]:
            if r.get("missing"):
                print(f"    ✗  {r['desc']:<34} MISSING TOKEN")
                fails += 1
                continue
            mark = "✓" if r["passed"] else "✗"
            if not r["passed"]:
                fails += 1
            print(f"    {mark}  {r['desc']:<34} {r['ratio']:5.2f}:1  (>= {r['threshold']})")
    print("\n" + "=" * 66)
    total = len([r for r in results])
    print(f"  {total - fails}/{total} passed, {fails} failed\n")
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(_main())
