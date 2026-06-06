import type { ReactNode } from "react";
import { BookingStepIndicator } from "@/components/booking/BookingStepIndicator";

export default function BookingLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      {/* Step indicator strip */}
      <div className="border-b border-white/5 bg-slate-950/80 py-6 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <BookingStepIndicator />
        </div>
      </div>

      {children}
    </div>
  );
}
