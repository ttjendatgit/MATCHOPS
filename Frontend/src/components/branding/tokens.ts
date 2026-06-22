/**
 * MatchOps — brand tokens (single source of truth)
 *
 * Premium dark-UI palette built around an energy-orange focal accent.
 * Use these constants for SVG fills, inline styles, charts, canvas, emails —
 * anywhere Tailwind utility classes are not available. For Tailwind, the same
 * values are exposed as CSS variables in globals.css (see `--brand-*`).
 */

/** Raw brand colours. */
export const brand = {
  /** Primary accent — Energy Orange */
  orange: "#FF6A00",
  /** Lighter orange used for the top of the mark gradient / hover states */
  orangeBright: "#FF8A2A",
  /** Darker orange used for active / pressed states */
  orangeDeep: "#E55F00",
  /** App background — Deep Charcoal */
  charcoal: "#0A0D12",
  /** Elevated surface — Slate */
  slate: "#1A1F26",
  /** Higher surface (cards, popovers) */
  slateElevated: "#222A33",
  /** Primary text — Off White */
  offWhite: "#F5F6F7",
  /** Optional support accent — Performance Green */
  green: "#7BC043",
} as const;

/** Semantic, role-based tokens for the dark product UI. */
export const brandTokens = {
  primary: brand.orange,
  primaryHover: brand.orangeBright,
  primaryActive: brand.orangeDeep,

  bg: brand.charcoal,
  surface: brand.slate,
  surfaceElevated: brand.slateElevated,

  textPrimary: brand.offWhite,
  textMuted: "#9AA3AD",
  textFaint: "rgba(245,246,247,0.45)",

  border: "rgba(245,246,247,0.08)",
  borderHover: "rgba(245,246,247,0.16)",
  borderAccent: "rgba(255,106,0,0.35)",

  accent: brand.green,
} as const;

export type BrandTokens = typeof brandTokens;
