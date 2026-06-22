import * as React from "react";
import { cn } from "@/lib/utils";
import { BrandMark, type BrandMarkVariant } from "./BrandMark";

/**
 * BrandLogo — horizontal lockup: the "M" mark + MATCHOPS wordmark.
 *
 * Presentational only (no <Link>). Wrap it in a link/button at the call site so
 * it can be reused in navbars, sidebars, auth screens, footers and emails.
 */

export type BrandLogoSize = "sm" | "md" | "lg";
/** `light` = white wordmark (dark UI). `dark` = charcoal wordmark (light UI). */
export type BrandLogoTone = "light" | "dark";

interface SizeSpec {
  mark: number;
  text: string;
  gap: string;
}

const SIZE_MAP: Record<BrandLogoSize, SizeSpec> = {
  sm: { mark: 28, text: "text-base", gap: "gap-2" },
  md: { mark: 34, text: "text-lg md:text-xl", gap: "gap-2.5" },
  lg: { mark: 46, text: "text-2xl", gap: "gap-3" },
};

export interface BrandLogoProps {
  size?: BrandLogoSize;
  tone?: BrandLogoTone;
  /** Mark colour treatment. Default `gradient`. */
  variant?: BrandMarkVariant;
  /** Hide the wordmark (mark-only lockup). */
  showWordmark?: boolean;
  /** Add a soft orange glow behind the wordmark (dark backgrounds only). */
  glow?: boolean;
  className?: string;
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

  return (
    <span className={cn("inline-flex items-center", spec.gap, className)}>
      <BrandMark
        size={spec.mark}
        variant={variant}
        title={showWordmark ? "" : title}
        className="shrink-0"
      />
      {showWordmark && (
        <span
          className={cn(
            "brand-wordmark select-none uppercase leading-none tracking-[0.04em]",
            spec.text,
            tone === "light" ? "text-[#F5F6F7]" : "text-[#0A0D12]",
            glow && "drop-shadow-[0_0_16px_rgba(255,106,0,0.22)]",
            wordmarkClassName,
          )}
        >
          Match<span className="text-[#FF6A00]">Ops</span>
        </span>
      )}
    </span>
  );
}
