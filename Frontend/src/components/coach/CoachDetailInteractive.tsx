"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { BackLink } from "@/components/shared/BackLink";
import type { CoachAvailabilitySlot, CoachSport } from "@/types/coach";
import {
  CoachAvailabilityPreview,
  type SelectedAvailabilitySlot,
} from "@/components/coach/CoachAvailabilityPreview";
import { CoachSessionRequestCTA } from "@/components/coach/CoachSessionRequestCTA";

interface CoachDetailInteractiveProps {
  /** Server-rendered header/stats/bio/gallery block — composed as children, not fetched here. */
  mainContent: ReactNode;
  coachId: string;
  coachDisplayName: string;
  sports: CoachSport[];
  hourlyRateLabel: string;
  availabilitySlots: CoachAvailabilitySlot[];
  availabilityError: string | null;
}

export function CoachDetailInteractive({
  mainContent,
  coachId,
  coachDisplayName,
  sports,
  hourlyRateLabel,
  availabilitySlots,
  availabilityError,
}: CoachDetailInteractiveProps) {
  const [selectedSlot, setSelectedSlot] = useState<SelectedAvailabilitySlot | null>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  const handleSelectSlot = useCallback((slot: SelectedAvailabilitySlot) => {
    setSelectedSlot(slot);
    ctaRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        {mainContent}

        <CoachAvailabilityPreview
          slots={availabilitySlots}
          error={availabilityError}
          selectedSlotId={selectedSlot?.id ?? null}
          onSelectSlot={handleSelectSlot}
        />

        <BackLink href="/coach" label="Quay lại danh sách huấn luyện viên" className="mt-4 lg:hidden" />
      </div>

      <div className="lg:col-span-1">
        <div
          ref={ctaRef}
          className="sticky top-24 rounded-2xl border border-white/[0.08] bg-slate-900/50 p-6"
        >
          <h2 className="mb-1 text-base font-semibold text-white">Liên hệ huấn luyện viên</h2>
          <p className="mb-5 text-sm text-slate-500">{hourlyRateLabel}</p>

          <CoachSessionRequestCTA
            coachId={coachId}
            coachDisplayName={coachDisplayName}
            sports={sports}
            prefillDate={selectedSlot?.date ?? null}
            prefillTimeSlot={selectedSlot?.timeSlot ?? null}
            prefillLabel={selectedSlot?.label ?? null}
          />
        </div>
      </div>
    </div>
  );
}
