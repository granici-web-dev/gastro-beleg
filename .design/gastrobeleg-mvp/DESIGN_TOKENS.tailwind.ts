/**
 * GastroBeleg — Tailwind mapping for the design tokens.
 * Paste `theme.extend` into tailwind.config.ts once the Next.js app is scaffolded.
 * Colors reference the CSS variables in DESIGN_TOKENS.css → app/globals.css,
 * so light/dark switching stays in CSS (data-theme) and Tailwind classes stay stable.
 *
 * Usage: bg-bg-primary, text-text-secondary, bg-accent, text-accent,
 *        border-border, ring-focus, bg-warning-subtle, text-warning, etc.
 */
export const themeExtend = {
  colors: {
    bg: {
      DEFAULT: "var(--color-bg-primary)",
      primary: "var(--color-bg-primary)",
      secondary: "var(--color-bg-secondary)",
      tertiary: "var(--color-bg-tertiary)",
      inverse: "var(--color-bg-inverse)",
    },
    text: {
      DEFAULT: "var(--color-text-primary)",
      primary: "var(--color-text-primary)",
      secondary: "var(--color-text-secondary)",
      tertiary: "var(--color-text-tertiary)",
      inverse: "var(--color-text-inverse)",
      link: "var(--color-text-link)",
    },
    border: {
      DEFAULT: "var(--color-border-primary)",
      primary: "var(--color-border-primary)",
      secondary: "var(--color-border-secondary)",
      focus: "var(--color-border-focus)",
    },
    accent: {
      DEFAULT: "var(--color-accent-primary)",
      hover: "var(--color-accent-primary-hover)",
      active: "var(--color-accent-primary-active)",
      subtle: "var(--color-accent-primary-subtle)",
      text: "var(--color-accent-primary-text)",
      on: "var(--color-text-on-accent)",
      secondary: "var(--color-accent-secondary)",
      "secondary-subtle": "var(--color-accent-secondary-subtle)",
    },
    lime: {
      DEFAULT: "var(--color-accent-lime)",
      subtle: "var(--color-accent-lime-subtle)",
      on: "var(--color-text-on-lime)",
    },
    success: { DEFAULT: "var(--color-status-success)", subtle: "var(--color-status-success-subtle)" },
    warning: { DEFAULT: "var(--color-status-warning)", subtle: "var(--color-status-warning-subtle)" },
    error:   { DEFAULT: "var(--color-status-error)",   subtle: "var(--color-status-error-subtle)" },
    info:    { DEFAULT: "var(--color-status-info)",    subtle: "var(--color-status-info-subtle)" },
    confidence: { low: "var(--color-confidence-low)", "low-bg": "var(--color-confidence-low-bg)" },
  },
  fontFamily: {
    display: "var(--font-family-display)",
    body: "var(--font-family-body)",
    mono: "var(--font-family-mono)",
  },
  fontSize: {
    xs: "var(--font-size-xs)", sm: "var(--font-size-sm)", base: "var(--font-size-base)",
    md: "var(--font-size-md)", lg: "var(--font-size-lg)", xl: "var(--font-size-xl)",
    "2xl": "var(--font-size-2xl)", "3xl": "var(--font-size-3xl)", "4xl": "var(--font-size-4xl)",
  },
  borderRadius: {
    sm: "var(--border-radius-sm)", md: "var(--border-radius-md)",
    lg: "var(--border-radius-lg)", full: "var(--border-radius-full)",
  },
  boxShadow: {
    sm: "var(--shadow-sm)", md: "var(--shadow-md)", lg: "var(--shadow-lg)", focus: "var(--shadow-focus)",
  },
  maxWidth: {
    content: "var(--max-width-content)", wide: "var(--max-width-wide)", page: "var(--max-width-page)",
  },
  height: {
    "control-sm": "var(--control-height-sm)", "control-md": "var(--control-height-md)",
    "control-lg": "var(--control-height-lg)", "tab-bar": "var(--tab-bar-height)",
  },
  transitionTimingFunction: {
    DEFAULT: "var(--easing-default)", in: "var(--easing-in)",
    out: "var(--easing-out)", bounce: "var(--easing-bounce)",
  },
  transitionDuration: {
    instant: "50ms", fast: "150ms", normal: "250ms", slow: "400ms", slower: "600ms",
  },
} as const;

// Tailwind screens (match --breakpoint-* in DESIGN_TOKENS.css)
export const screens = {
  sm: "375px", md: "768px", lg: "1024px", xl: "1280px", "2xl": "1536px",
};
