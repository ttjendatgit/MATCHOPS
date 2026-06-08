"use client";

import type { Court, Sport } from "@/types/court";
import { Users, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CourtPickerCardProps {
  court: Court;
  sport?: Sport;
  isSelected: boolean;
  onSelect: () => void;
  minPrice: number | null;
}

export function CourtPickerCard({
  court,
  sport,
  isSelected,
  onSelect,
  minPrice,
}: CourtPickerCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={isSelected}
      aria-label={`Chọn ${court.name}`}
      className={cn(
        "group w-full rounded-xl border px-3.5 py-3 text-left transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8000]/60",
        "focus-visible:ring-offset-1 focus-visible:ring-offset-slate-950",
        "active:scale-[0.99]",
        isSelected
          ? "border-[#FF8000]/50 bg-[rgba(255,128,0,0.08)] shadow-[0_0_18px_rgba(255,128,0,0.14),inset_0_1px_0_rgba(255,255,255,0.05)]"
          : "border-slate-700/50 bg-slate-800/40 hover:border-slate-600/80 hover:bg-slate-800/70",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        {/* Left: name + meta */}
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex items-center gap-1.5">
            {/* Fixed-width slot so name doesn't jump when check appears */}
            <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center">
              {isSelected && (
                <CheckCircle2 className="h-3.5 w-3.5 text-[#FF8000]" aria-hidden />
              )}
            </span>
            <p
              className={cn(
                "truncate text-sm font-semibold tracking-tight",
                isSelected ? "text-white" : "text-slate-200 group-hover:text-white",
              )}
            >
              {court.name}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 pl-5">
            {sport && (
              <span className="rounded-full border border-[#FF8000]/30 bg-[rgba(255,128,0,0.10)] px-2 py-0.5 text-[10px] font-medium text-[#FF8000]">
                {sport.name}
              </span>
            )}
            {court.type && (
              <span className="text-[10px] text-slate-500">{court.type}</span>
            )}
            {court.capacity && (
              <span className="flex items-center gap-0.5 text-[10px] text-slate-500">
                <Users className="h-2.5 w-2.5" aria-hidden />
                {court.capacity}
              </span>
            )}
          </div>
        </div>

        {/* Right: price */}
        <div className="shrink-0 text-right">
          {minPrice !== null ? (
            <>
              <p className="text-[10px] text-slate-600">từ</p>
              <p
                className={cn(
                  "text-sm font-bold tabular-nums transition-all duration-200",
                  isSelected
                    ? "bg-gradient-to-r from-[#FF8000] to-[#86D232] bg-clip-text text-transparent"
                    : "text-[#FF8000]",
                )}
              >
                {(minPrice / 1000).toFixed(0)}k
                <span className="text-[10px] font-normal text-slate-600">/h</span>
              </p>
            </>
          ) : (
            <p className="text-xs text-slate-500">Liên hệ</p>
          )}
        </div>
      </div>
    </button>
  );
}
