import * as React from "react";
import { brand } from "./tokens";

/**
 * BrandMark — the MatchOps "M" symbol.
 *
 * Concept: two upward angular strokes that meet at a centre vertex. It reads as
 * an "M", as two ascending arrows (momentum / performance), and as two players
 * converging on a single point (the "match"). Pure geometry, single accent
 * colour — scales crisply from a 16px favicon to a splash screen.
 *
 * The glyph is a single stroked polyline (miter joins) so it stays razor-sharp
 * at any size and exports cleanly as SVG.
 */

export type BrandMarkVariant = "gradient" | "solid" | "white" | "mono";

export interface BrandMarkProps extends Omit<React.SVGProps<SVGSVGElement>, "fill"> {
  /** Pixel (or CSS) size for both width and height. Default 32. */
  size?: number | string;
  /** Colour treatment. `mono` inherits `currentColor`. Default `gradient`. */
  variant?: BrandMarkVariant;
  /** Render the mark inside a rounded charcoal tile (app-icon lockup). */
  withBackground?: boolean;
  /** Accessible label. Pass empty string to mark as decorative. */
  title?: string;
}

// Centre-line of the "M": bottom-left → peak → centre valley → peak → bottom-right.
const M_PATH = "M5 41 L17 9 L24 25 L31 9 L43 41";
const STROKE_WIDTH = 7.5;

// Static gradient id. Safe to repeat across instances: every definition is
// identical, so url(#id) always resolves to the same gradient. Keeping it
// constant (instead of useId) lets BrandMark render in Server Components too.
const GRAD_ID = "mo-mark-gradient";

export function BrandMark({
  size = 32,
  variant = "gradient",
  withBackground = false,
  title = "MatchOps",
  className,
  ...props
}: BrandMarkProps) {
  const stroke =
    variant === "gradient"
      ? `url(#${GRAD_ID})`
      : variant === "solid"
        ? brand.orange
        : variant === "white"
          ? brand.offWhite
          : "currentColor";

  const decorative = title === "";

  const glyph = (
    <path
      d={M_PATH}
      fill="none"
      stroke={stroke}
      strokeWidth={STROKE_WIDTH}
      strokeLinejoin="miter"
      strokeLinecap="butt"
      strokeMiterlimit={10}
    />
  );

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role={decorative ? "presentation" : "img"}
      aria-label={decorative ? undefined : title}
      aria-hidden={decorative || undefined}
      className={className}
      {...props}
    >
      {!decorative && <title>{title}</title>}

      {variant === "gradient" && (
        <defs>
          <linearGradient
            id={GRAD_ID}
            x1="6"
            y1="9"
            x2="42"
            y2="41"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor={brand.orangeBright} />
            <stop offset="1" stopColor={brand.orange} />
          </linearGradient>
        </defs>
      )}

      {withBackground && <rect width="48" height="48" rx="12" fill={brand.charcoal} />}

      {withBackground ? (
        // Inset the glyph ~26% so it breathes inside the tile.
        <g transform="translate(24 24) scale(0.72) translate(-24 -24)">{glyph}</g>
      ) : (
        glyph
      )}
    </svg>
  );
}
