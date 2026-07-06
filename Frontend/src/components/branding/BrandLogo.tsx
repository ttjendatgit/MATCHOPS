import * as React from "react";
import { cn } from "@/lib/utils";
import { BrandMark, type BrandMarkVariant } from "./BrandMark";

/**
 * BrandLogo — horizontal lockup: approved geometric M mark + MATCHOPS wordmark.
 *
 * Renders the approved brand identity:
 *   - `tone="dark"` (light backgrounds): renders /brand/matchops-logo.svg
 *     — orange M mark + dark charcoal (#1B2030) MATCHOPS wordmark.
 *   - `tone="light"` (dark backgrounds, default): renders the orange BrandMark
 *     next to a white CSS-text MATCHOPS wordmark. This preserves the approved
 *     mark fidelity while adapting the wordmark colour for dark UIs.
 *
 * Presentational only (no <Link>). Wrap in a link/button at the call site so
 * it can be reused in navbars, sidebars, auth screens, footers, and emails.
 */

export type BrandLogoSize = "sm" | "md" | "lg";
/** `light` = for dark UI (white wordmark, default). `dark` = for light UI (black wordmark, SVG file). */
export type BrandLogoTone = "light" | "dark";

interface SizeSpec {
  mark: number;
  text: string;
  gap: string;
  logoH: number;
  logoW: number;
}

const SIZE_MAP: Record<BrandLogoSize, SizeSpec> = {
  sm: { mark: 28, text: "text-base",          gap: "gap-2",   logoH: 28,  logoW: 123 },
  md: { mark: 34, text: "text-lg md:text-xl", gap: "gap-2.5", logoH: 36,  logoW: 158 },
  lg: { mark: 52, text: "text-2xl",           gap: "gap-3",   logoH: 52,  logoW: 229 },
};

export interface BrandLogoProps {
  size?: BrandLogoSize;
  tone?: BrandLogoTone;
  /** Mark colour treatment — retained for API compatibility. */
  variant?: BrandMarkVariant;
  /** Hide the wordmark (mark-only lockup). Use BrandMark directly when possible. */
  showWordmark?: boolean;
  /** Add a soft orange glow (dark backgrounds only). */
  glow?: boolean;
  className?: string;
  /** @deprecated – use className. */
  wordmarkClassName?: string;
  title?: string;
}

export function BrandLogo({
  size = "md",
  tone = "light",
  variant = "gradient",
  showWordmark = true,
  glow = false,
  className,
  wordmarkClassName,
  title = "MatchOps",
}: BrandLogoProps) {
  const spec = SIZE_MAP[size];

  // Mark-only mode — delegate to BrandMark
  if (!showWordmark) {
    return (
      <BrandMark
        size={spec.mark}
        variant={variant}
        title={title}
        className={cn("shrink-0", className)}
      />
    );
  }

  // Dark-background mode (tone="light"): orange mark + white CSS wordmark.
  // This is the primary usage context (navbars, auth screens, splash).
  if (tone === "light") {
    return (
      <span
        className={cn(
          "inline-flex items-center",
          spec.gap,
          glow && "drop-shadow-[0_0_16px_rgba(255,106,0,0.22)]",
          className,
        )}
        role="img"
        aria-label={title}
      >
        <BrandMark
          size={spec.mark}
          variant={variant}
          title=""
          className="shrink-0"
          aria-hidden
        />
        <span
          className={cn(
            "brand-wordmark select-none font-black uppercase leading-none tracking-[0.04em] text-white",
            spec.text,
            wordmarkClassName,
          )}
          aria-hidden
        >
          MATCHOPS
        </span>
      </span>
    );
  }

  // Light-background mode (tone="dark"): render the full approved SVG file
  // which has the dark charcoal (#1B2030) wordmark — exactly matching the
  // approved PNG reference.
  return (
    <img
      src="/brand/matchops-logo.svg"
      alt={title}
      height={spec.logoH}
      width={spec.logoW}
      className={cn(
        "block shrink-0",
        glow && "drop-shadow-[0_0_16px_rgba(255,106,0,0.22)]",
        className,
      )}
      style={{ height: spec.logoH, width: spec.logoW }}
      draggable={false}
    />
  );
}
