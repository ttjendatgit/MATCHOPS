"use client";

import { Building2, Wallet, CreditCard, Banknote } from "lucide-react";
import type { PaymentMethod, PaymentMethodOption } from "@/lib/mock/bookingMockData";
import { cn } from "@/lib/utils";

// ─── Per-method accent config ────────────────────────────────────────────────

const ICON_CONFIG: Record<
  PaymentMethod,
  { icon: React.ElementType; iconColor: string; iconBg: string }
> = {
  BANK_TRANSFER: {
    icon: Building2,
    iconColor: "text-blue-400",
    iconBg: "bg-blue-500/10 border border-blue-800/30",
  },
  MOMO: {
    icon: Wallet,
    iconColor: "text-pink-400",
    iconBg: "bg-pink-500/10 border border-pink-800/30",
  },
  VNPAY: {
    icon: CreditCard,
    iconColor: "text-violet-400",
    iconBg: "bg-violet-500/10 border border-violet-800/30",
  },
  CASH: {
    icon: Banknote,
    iconColor: "text-amber-400",
    iconBg: "bg-amber-500/10 border border-amber-800/30",
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

interface PaymentMethodCardProps {
  method: PaymentMethodOption;
  isSelected: boolean;
  onSelect: () => void;
}

export function PaymentMethodCard({
  method,
  isSelected,
  onSelect,
}: PaymentMethodCardProps) {
  const cfg = ICON_CONFIG[method.id];
  const Icon = cfg.icon;

  return (
    <button
      type="button"
      role="radio"
      aria-checked={isSelected}
      onClick={onSelect}
      className={cn(
        "group w-full rounded-xl border p-4 text-left transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60",
        "focus-visible:ring-offset-1 focus-visible:ring-offset-slate-950",
        isSelected
          ? "border-emerald-500/50 bg-emerald-950/40 shadow-[0_0_18px_rgba(16,185,129,0.14),inset_0_1px_0_rgba(255,255,255,0.04)]"
          : "border-slate-700/50 bg-slate-800/40 hover:border-slate-600/80 hover:bg-slate-800/70",
      )}
    >
      <div className="flex items-center gap-4">
        {/* Payment icon */}
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
            cfg.iconBg,
          )}
        >
          <Icon className={cn("h-5 w-5", cfg.iconColor)} aria-hidden />
        </div>

        {/* Label + description */}
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "text-sm font-semibold leading-tight transition-colors duration-150",
              isSelected ? "text-white" : "text-slate-200 group-hover:text-white",
            )}
          >
            {method.label}
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
            {method.description}
          </p>
        </div>

        {/* Radio dot */}
        <div
          className={cn(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200",
            isSelected
              ? "border-emerald-500 bg-emerald-500"
              : "border-slate-600 group-hover:border-slate-500",
          )}
          aria-hidden
        >
          {isSelected && <div className="h-2 w-2 rounded-full bg-white" />}
        </div>
      </div>
    </button>
  );
}
