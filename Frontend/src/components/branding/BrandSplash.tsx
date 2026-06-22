import { BrandLogo } from "./BrandLogo";

/**
 * BrandSplash — full-screen branded loading / splash state.
 *
 * Drop into an App Router `loading.tsx`, a route transition, or an auth gate.
 */
export function BrandSplash({ label = "Đang tải..." }: { label?: string }) {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-7 bg-[#0A0D12]">
      <div className="relative">
        {/* Soft pulsing aura behind the mark */}
        <span
          aria-hidden
          className="absolute inset-0 -z-10 animate-ping rounded-full bg-[#FF6A00]/15 blur-2xl"
        />
        <BrandLogo size="lg" glow />
      </div>

      {/* Indeterminate progress bar */}
      <div className="h-1 w-44 overflow-hidden rounded-full bg-white/10">
        <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-[#FF6A00] to-[#FF8A2A] animate-[brand-loadbar_1.1s_ease-in-out_infinite]" />
      </div>

      <span className="text-[11px] font-medium uppercase tracking-[0.25em] text-white/40">
        {label}
      </span>
    </div>
  );
}
