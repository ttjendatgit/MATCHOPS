"use client";

import { useMemo } from "react";
import { AlertTriangle, CalendarClock, Check, Clock3 } from "lucide-react";
import type { CoachAvailabilitySlot, CoachDayOfWeek } from "@/types/coach";
import { cn } from "@/lib/utils";

export interface SelectedAvailabilitySlot {
  id: string;
  /** "YYYY-MM-DD" — next upcoming date matching the slot's day of week. */
  date: string;
  /** "HH:mm-HH:mm" */
  timeSlot: string;
  /** Human-readable summary, e.g. "Thứ Hai, 12/08 · 18:00-19:00" */
  label: string;
}

interface CoachAvailabilityPreviewProps {
  slots: CoachAvailabilitySlot[];
  error: string | null;
  selectedSlotId: string | null;
  onSelectSlot: (slot: SelectedAvailabilitySlot) => void;
}

// Display Monday→Sunday; values match System.DayOfWeek (0 = Sunday).
const DAYS: { value: CoachDayOfWeek; label: string }[] = [
  { value: 1, label: "Thứ Hai" },
  { value: 2, label: "Thứ Ba" },
  { value: 3, label: "Thứ Tư" },
  { value: 4, label: "Thứ Năm" },
  { value: 5, label: "Thứ Sáu" },
  { value: 6, label: "Thứ Bảy" },
  { value: 0, label: "Chủ Nhật" },
];

function parseTimeToMinutes(time: string): number | null {
  const [hourRaw, minuteRaw = "0"] = time.split(":");
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  return hour * 60 + minute;
}

function nextDateForDayOfWeek(targetDow: number, startTime: string): Date {
  const now = new Date();
  let diff = (targetDow - now.getDay() + 7) % 7;

  if (diff === 0) {
    const startMinutes = parseTimeToMinutes(startTime);
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    if (startMinutes !== null && startMinutes <= nowMinutes) {
      diff = 7;
    }
  }

  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + diff);
}

function toIsoDate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function toShortDateLabel(d: Date): string {
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

export function CoachAvailabilityPreview({
  slots,
  error,
  selectedSlotId,
  onSelectSlot,
}: CoachAvailabilityPreviewProps) {
  const byDay = useMemo(() => {
    const map = new Map<number, CoachAvailabilitySlot[]>();
    for (const day of DAYS) map.set(day.value, []);
    for (const slot of slots) {
      if (!slot.isEnabled) continue;
      map.get(slot.dayOfWeek)?.push(slot);
    }
    for (const list of map.values()) list.sort((a, b) => a.startTime.localeCompare(b.startTime));
    return map;
  }, [slots]);

  const hasAnySlot = slots.some((s) => s.isEnabled);

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-slate-900/50 p-6">
      <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold text-white">
        <CalendarClock className="h-4 w-4 text-[#FF8000]" aria-hidden />
        Lịch rảnh của huấn luyện viên
      </h2>
      <p className="mb-4 text-xs leading-relaxed text-slate-500">
        Khung giờ thường nhận lịch. Huấn luyện viên sẽ xác nhận lại thời gian cụ thể sau khi bạn
        gửi yêu cầu.
      </p>

      {error && (
        <div
          role="alert"
          className="mb-4 flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-xs text-red-400"
        >
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          {error}
        </div>
      )}

      {!hasAnySlot ? (
        <p className="text-sm text-slate-500">
          Huấn luyện viên chưa thiết lập lịch rảnh công khai. Bạn vẫn có thể gửi yêu cầu thời gian
          mong muốn.
        </p>
      ) : (
        <div className="space-y-3">
          {DAYS.map((day) => {
            const daySlots = byDay.get(day.value) ?? [];
            if (daySlots.length === 0) return null;
            return (
              <div key={day.value} className="flex flex-col gap-2 sm:flex-row sm:items-start">
                <div className="shrink-0 text-xs font-bold uppercase tracking-wide text-slate-400 sm:w-24 sm:pt-2">
                  {day.label}
                </div>
                <div className="flex flex-wrap gap-2">
                  {daySlots.map((slot) => {
                    const selected = slot.id === selectedSlotId;
                    const dateObj = nextDateForDayOfWeek(day.value, slot.startTime);
                    const timeSlot = `${slot.startTime}-${slot.endTime}`;
                    const label = `${day.label}, ${toShortDateLabel(dateObj)} · ${timeSlot}`;
                    return (
                      <button
                        key={slot.id}
                        type="button"
                        aria-pressed={selected}
                        aria-label={`Chọn khung giờ ${label}${selected ? " (đã chọn)" : ""}`}
                        onClick={() =>
                          onSelectSlot({ id: slot.id, date: toIsoDate(dateObj), timeSlot, label })
                        }
                        className={cn(
                          "flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold",
                          "transition-all duration-200",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8000]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
                          selected
                            ? "border-transparent bg-[#FF8000] text-white shadow-[0_0_16px_rgba(255,128,0,0.4)]"
                            : "border-white/10 bg-slate-800/60 text-slate-300 hover:border-[#FF8000]/40 hover:bg-slate-800 hover:text-white"
                        )}
                      >
                        {selected ? (
                          <Check className="h-3.5 w-3.5" aria-hidden />
                        ) : (
                          <Clock3 className="h-3.5 w-3.5" aria-hidden />
                        )}
                        {slot.startTime}–{slot.endTime}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
