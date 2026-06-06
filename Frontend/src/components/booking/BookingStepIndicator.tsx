"use client";

import { usePathname } from "next/navigation";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { key: "summary", label: "Xem lại" },
  { key: "payment", label: "Thanh toán" },
  { key: "success", label: "Xác nhận" },
] as const;

export function BookingStepIndicator() {
  const pathname = usePathname();

  const activeIndex = STEPS.findIndex((s) => pathname.includes(`/booking/${s.key}`));
  const current = activeIndex === -1 ? 0 : activeIndex;

  return (
    <nav aria-label="Tiến trình đặt sân" className="flex items-start justify-center">
      {STEPS.map((step, i) => {
        const isCompleted = i < current;
        const isActive = i === current;

        return (
          <div key={step.key} className="flex items-start">
            {/* Node + label */}
            <div className="flex flex-col items-center gap-2">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-all duration-300",
                  isCompleted
                    ? "bg-emerald-500 text-white"
                    : isActive
                      ? "bg-emerald-500 text-white shadow-[0_0_18px_rgba(16,185,129,0.55)]"
                      : "bg-slate-800 text-slate-500 ring-1 ring-slate-700",
                )}
                aria-current={isActive ? "step" : undefined}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" aria-hidden />
                ) : (
                  <span>{i + 1}</span>
                )}
              </div>
              <span
                className={cn(
                  "whitespace-nowrap text-xs font-medium transition-colors duration-200",
                  isActive
                    ? "text-emerald-400"
                    : isCompleted
                      ? "text-emerald-600"
                      : "text-slate-600",
                )}
              >
                {step.label}
              </span>
            </div>

            {/* Connector — not after last step */}
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "mx-3 mt-4 h-px w-16 shrink-0 transition-colors duration-300 sm:w-24",
                  i < current ? "bg-emerald-500" : "bg-slate-700",
                )}
                aria-hidden
              />
            )}
          </div>
        );
      })}
    </nav>
  );
}
