import * as React from "react";

/**
 * BrandMark — the MatchOps geometric "M" symbol.
 *
 * Renders the approved orange angular M mark from /brand/matchops-mark.svg.
 * The SVG uses fill-rule="evenodd" for transparent cutouts, so it renders
 * correctly on any background colour (white, dark, coloured).
 *
 * The `variant` prop is preserved for API compatibility but the SVG file
 * itself encodes the approved orange. Pass `variant="white"` to apply a
 * CSS brightness filter that forces the mark to appear white (useful on
 * orange/coloured backgrounds). Pass `variant="mono"` to inherit currentColor
 * via a grayscale filter (advanced use only).
 */

export type BrandMarkVariant = "gradient" | "solid" | "white" | "mono";

export interface BrandMarkProps
  extends React.ImgHTMLAttributes<HTMLImageElement> {
  /** Pixel (or CSS) size for both width and height. Default 32. */
  size?: number | string;
  /**
   * Colour treatment.
   * - `gradient` / `solid` — renders the approved orange mark (default).
   * - `white` — applies a CSS filter to make the mark white.
   * - `mono` — greyscale filter.
   */
  variant?: BrandMarkVariant;
  /** Render the mark inside a rounded charcoal tile (app-icon lockup). */
  withBackground?: boolean;
  /** Accessible label. Pass empty string to mark as decorative (aria-hidden). */
  title?: string;
}

const VARIANT_FILTER: Record<BrandMarkVariant, string | undefined> = {
  gradient: undefined,
  solid: undefined,
  white:
    "brightness(0) saturate(100%) invert(1)",
  mono:
    "brightness(0) saturate(0%) invert(0.5)",
};

export function BrandMark({
  size = 32,
  variant = "gradient",
  withBackground = false,
  title = "MatchOps",
  className,
  style,
  ...props
}: BrandMarkProps) {
  const decorative = title === "";
  const filter = VARIANT_FILTER[variant];

  const imgSize = typeof size === "number" ? size : undefined;
  const imgStyle: React.CSSProperties = {
    width: size,
    height: size,
    display: "block",
    flexShrink: 0,
    filter,
    ...style,
  };

  if (withBackground) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: imgSize ? imgSize + 16 : undefined,
          height: imgSize ? imgSize + 16 : undefined,
          borderRadius: "12px",
          backgroundColor: "#0A0D12",
          flexShrink: 0,
        }}
        className={className}
      >
        <img
          src="/brand/matchops-mark.svg"
          alt={decorative ? "" : title}
          aria-hidden={decorative || undefined}
          role={decorative ? "presentation" : undefined}
          width={imgSize}
          height={imgSize}
          style={{
            width: imgSize ? imgSize * 0.72 : "72%",
            height: imgSize ? imgSize * 0.72 : "72%",
            display: "block",
            filter,
          }}
          draggable={false}
          {...props}
        />
      </span>
    );
  }

  return (
    <img
      src="/brand/matchops-mark.svg"
      alt={decorative ? "" : title}
      aria-hidden={decorative || undefined}
      role={decorative ? "presentation" : undefined}
      width={imgSize}
      height={imgSize}
      className={className}
      style={imgStyle}
      draggable={false}
      {...props}
    />
  );
}
