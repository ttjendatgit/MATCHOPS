"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, CalendarDays, Clock } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn, formatCurrency } from "@/lib/utils";
import type { Venue } from "@/types/venue";
import type { Court, Sport } from "@/types/court";
import type { ApiResponse } from "@/types/api";
import { apiFetch } from "@/lib/api";
import { generateTimeOptions, getDurationHours } from "@/lib/mock/bookingMockData";
import { CourtPickerCard } from "./CourtPickerCard";

// ─── Constants ────────────────────────────────────────────────────────────────

const TODAY = new Date().toISOString().split("T")[0];
const MIN_DURATION_H = 0.5;
const MAX_DURATION_H = 4;

// ─── Types ────────────────────────────────────────────────────────────────────

interface AvailabilitySlot {
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  status: string;    // AVAILABLE | BOOKED | BLOCKED | HOLDING | …
}

interface AvailabilityData {
  slots: Array<{ startTime: string; endTime: string; status: string; price?: number | null }>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toMins(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function toHHMM(t: string): string {
  return t.length >= 5 ? t.slice(0, 5) : t;
}

/** Returns true if the 30-min slot starting at startHHMM is not available. */
function isSlotUnavailable(avSlots: AvailabilitySlot[], startHHMM: string): boolean {
  const slot = avSlots.find((s) => s.startTime === startHHMM);
  return !!slot && slot.status !== "AVAILABLE";
}

/** Returns true if [start, end) overlaps any non-available slot. */
function isRangeUnavailable(avSlots: AvailabilitySlot[], start: string, end: string): boolean {
  const reqStart = toMins(start);
  const reqEnd = toMins(end);
  return avSlots.some((s) => {
    const sStart = toMins(s.startTime);
    const sEnd = toMins(s.endTime);
    return s.status !== "AVAILABLE" && sStart < reqEnd && sEnd > reqStart;
  });
}

function calculatePriceFromRules(
  rules: Court["priceRules"],
  date: string,
  start: string,
  end: string,
): number | null {
  if (!rules?.length) return null;
  const day = new Date(`${date}T12:00:00`).getDay();
  const isWeekend = day === 0 || day === 6;
  const applicable = rules.filter((r) => {
    const dt = r.dayType.toUpperCase();
    return (
      r.status === "ACTIVE" &&
      (dt === "ALL" ||
        (isWeekend && dt === "WEEKEND") ||
        (!isWeekend && dt === "WEEKDAY"))
    );
  });
  if (!applicable.length) return null;
  const reqStart = toMins(toHHMM(start));
  const reqEnd = toMins(toHHMM(end));
  let total = 0;
  for (const rule of applicable) {
    const rStart = toMins(toHHMM(rule.startTime));
    const rEnd = toMins(toHHMM(rule.endTime));
    const oStart = Math.max(reqStart, rStart);
    const oEnd = Math.min(reqEnd, rEnd);
    if (oEnd > oStart) {
      total += ((oEnd - oStart) / 60) * rule.pricePerHour;
    }
  }
  return total > 0 ? Math.round(total) : null;
}

function getMinPrice(court: Court): number | null {
  if (!court.priceRules?.length) return null;
  return Math.min(...court.priceRules.map((r) => r.pricePerHour));
}

function formatDuration(hours: number): string {
  const total = Math.round(hours * 60);
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m} phút`;
  if (m === 0) return `${h} giờ`;
  return `${h} giờ ${m} phút`;
}

function formatDateVN(dateStr: string): string {
  const labels = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  const d = new Date(`${dateStr}T12:00:00`);
  const [, m, day] = dateStr.split("-");
  return `${labels[d.getDay()]}, ${day}/${m}`;
}

// ─── Step label ───────────────────────────────────────────────────────────────

function StepLabel({
  step,
  children,
}: {
  step: number;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#FF8000]/15 text-[10px] font-bold text-[#FF8000]">
        {step}
      </span>
      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
        {children}
      </span>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface TimeSlotPickerProps {
  venue: Venue;
  courts: Court[];
  sports: Sport[];
}

export function TimeSlotPicker({ venue, courts, sports }: TimeSlotPickerProps) {
  const router = useRouter();

  const [courtId, setCourtId] = useState<string | null>(null);
  const [date, setDate] = useState(TODAY);
  const [startTime, setStartTime] = useState<string | null>(null);
  const [endTime, setEndTime] = useState<string | null>(null);

  // ── Real availability from backend ────────────────────────────────────────

  const [avSlots, setAvSlots] = useState<AvailabilitySlot[]>([]);
  const [avLoading, setAvLoading] = useState(false);
  const [avError, setAvError] = useState(false);

  useEffect(() => {
    if (!courtId || !date) {
      setAvSlots([]);
      setAvError(false);
      return;
    }

    let cancelled = false;
    setAvLoading(true);
    setAvError(false);

    apiFetch<ApiResponse<AvailabilityData>>(
      `/courts/${courtId}/availability?date=${date}`,
    )
      .then((res) => {
        if (cancelled) return;
        const slots: AvailabilitySlot[] = (res.data?.slots ?? []).map((s) => ({
          startTime: toHHMM(s.startTime),
          endTime: toHHMM(s.endTime),
          status: s.status.toUpperCase(),
        }));
        setAvSlots(slots);
        setAvError(false);
      })
      .catch(() => {
        if (cancelled) return;
        setAvSlots([]);
        setAvError(true);
      })
      .finally(() => {
        if (!cancelled) setAvLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [courtId, date]);

  // ── Derived time options ──────────────────────────────────────────────────

  const allSlots = useMemo(
    () => generateTimeOptions(venue.openingTime, venue.closingTime),
    [venue.openingTime, venue.closingTime],
  );

  // Filter start options: hide slots the backend says are not available.
  const startOptions = useMemo(() => {
    const base = allSlots.slice(0, -1);
    if (!avSlots.length) return base;
    return base.filter((t) => !isSlotUnavailable(avSlots, t));
  }, [allSlots, avSlots]);

  // Filter end options: hide ends that would span an unavailable slot.
  const endOptions = useMemo(() => {
    if (!startTime) return [];
    const startM = toMins(startTime);
    return allSlots.filter((t) => {
      const diff = toMins(t) - startM;
      if (diff < 30 || diff > MAX_DURATION_H * 60) return false;
      if (avSlots.length && isRangeUnavailable(avSlots, startTime, t)) return false;
      return true;
    });
  }, [startTime, allSlots, avSlots]);

  const gridSlots = allSlots.slice(0, -1);

  // ── Pricing & duration ───────────────────────────────────────────────────

  const duration = startTime && endTime ? getDurationHours(startTime, endTime) : null;

  const price = useMemo(() => {
    if (!courtId || !date || !startTime || !endTime) return null;
    const court = courts.find((c) => c.id === courtId);
    if (!court) return null;
    return calculatePriceFromRules(court.priceRules, date, startTime, endTime);
  }, [courts, courtId, date, startTime, endTime]);

  // ── Validation ───────────────────────────────────────────────────────────

  const validationError = useMemo<string | null>(() => {
    if (!startTime || !endTime) return null;
    const dur = getDurationHours(startTime, endTime);
    if (dur < MIN_DURATION_H) return "Tối thiểu 30 phút mỗi lượt đặt.";
    if (dur > MAX_DURATION_H) return "Tối đa 4 giờ mỗi lượt đặt.";
    if (avSlots.length && isRangeUnavailable(avSlots, startTime, endTime))
      return "Khung giờ này đã được đặt. Vui lòng chọn giờ khác.";
    return null;
  }, [startTime, endTime, avSlots]);

  const canSubmit = !!(courtId && date && startTime && endTime && !validationError && !avError);

  // ── Handlers ─────────────────────────────────────────────────────────────

  function handleCourtSelect(id: string) {
    setCourtId(id);
    setStartTime(null);
    setEndTime(null);
  }

  function handleDateChange(d: string) {
    setDate(d);
    setStartTime(null);
    setEndTime(null);
  }

  function handleStartChange(t: string) {
    setStartTime(t);
    if (endTime) {
      const diff = toMins(endTime) - toMins(t);
      if (diff < 30 || diff > MAX_DURATION_H * 60) setEndTime(null);
    }
  }

  function handleSubmit() {
    if (!canSubmit || !courtId || !startTime || !endTime) return;
    const params = new URLSearchParams({
      courtId,
      venueId: venue.id,
      date,
      start: startTime,
      end: endTime,
    });
    router.push(`/booking/summary?${params.toString()}`);
  }

  // ── Slot state (for visual grid) ─────────────────────────────────────────

  function getSlotState(slot: string) {
    const avSlot = avSlots.find((s) => s.startTime === slot);
    const booked = avSlot ? avSlot.status !== "AVAILABLE" : false;
    const slotStart = toMins(slot);
    const inRange = !!(
      startTime &&
      endTime &&
      slotStart >= toMins(startTime) &&
      slotStart < toMins(endTime)
    );
    return { booked, inRange };
  }

  const hasCourtAndDate = !!(courtId && date);

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div
      id="booking-panel"
      className={cn(
        "sticky top-24 overflow-hidden rounded-2xl border border-white/8",
        "bg-gradient-to-b from-slate-900 to-slate-950 shadow-2xl",
      )}
    >
      {/* Ambient emerald glow — top */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-[#FF8000]/10 to-transparent"
        aria-hidden
      />

      <div className="relative p-5">
        {/* ── Header ── */}
        <div className="mb-5 flex items-start justify-between gap-2">
          <div>
            <h3 className="text-base font-bold tracking-tight text-white">
              Đặt lịch sân
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Chọn sân, ngày và khung giờ phù hợp
            </p>
          </div>
          {/* Live badge */}
          <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-[#86D232]/20 bg-[#86D232]/8 px-2.5 py-1">
            <span
              className="h-1.5 w-1.5 rounded-full bg-[#86D232] animate-pulse"
              aria-hidden
            />
            <span className="text-[10px] font-medium text-[#86D232]">
              Lịch trống thực
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="mb-5 border-t border-white/5" />

        {/* ── 1. Court selection ── */}
        <section className="mb-5">
          <StepLabel step={1}>Chọn sân</StepLabel>
          <div className="space-y-2">
            {courts.map((court) => (
              <CourtPickerCard
                key={court.id}
                court={court}
                sport={sports.find((s) => s.id === court.sportId)}
                isSelected={courtId === court.id}
                onSelect={() => handleCourtSelect(court.id)}
                minPrice={getMinPrice(court)}
              />
            ))}
          </div>
        </section>

        {/* Divider */}
        <div className="mb-5 border-t border-white/5" />

        {/* ── 2. Date ── */}
        <section className="mb-5">
          <StepLabel step={2}>Ngày chơi</StepLabel>
          <div className="relative">
            <CalendarDays
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
              aria-hidden
            />
            <input
              id="booking-date"
              type="date"
              value={date}
              min={TODAY}
              onChange={(e) => handleDateChange(e.target.value)}
              disabled={!courtId}
              className={cn(
                "h-11 w-full rounded-xl border border-slate-700/60 bg-slate-800/50 py-2 pl-9 pr-3 text-sm text-white",
                "[color-scheme:dark]",
                "focus:outline-none focus:ring-2 focus:ring-[#FF8000]/40 focus:border-[#FF8000]/40",
                "disabled:cursor-not-allowed disabled:opacity-40",
                "transition-colors duration-150",
              )}
            />
          </div>
          <p className="mt-1.5 text-[10px] text-slate-600">
            Chỉ hiển thị khung giờ trong ngày đã chọn
          </p>
        </section>

        {/* ── 3. Time selection ── */}
        {hasCourtAndDate && (
          <>
            <div className="mb-5 border-t border-white/5" />
            <section className="mb-5">
              <StepLabel step={3}>Chọn giờ</StepLabel>

              {/* Start → End with arrow */}
              <div className="flex items-end gap-2">
                {/* Start time */}
                <div className="flex-1">
                  <label
                    htmlFor="start-time-trigger"
                    className="mb-1.5 flex items-center gap-1 text-xs text-slate-500"
                  >
                    <Clock className="h-3 w-3" aria-hidden />
                    Bắt đầu
                  </label>
                  <Select value={startTime ?? ""} onValueChange={handleStartChange} disabled={avError}>
                    <SelectTrigger
                      id="start-time-trigger"
                      className={cn(
                        "h-11 rounded-xl border-slate-700/60 bg-slate-800/50 text-white",
                        "focus:ring-[#FF8000]/40 focus:border-[#FF8000]/40",
                        "data-[placeholder]:text-slate-500",
                        "disabled:opacity-40",
                        !startTime && "text-slate-500",
                      )}
                    >
                      <SelectValue placeholder="--:--" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 border-slate-700 bg-slate-900 text-white">
                      {startOptions.map((t) => (
                        <SelectItem
                          key={t}
                          value={t}
                          className="cursor-pointer text-slate-300 focus:bg-[#FF8000]/15 focus:text-white"
                        >
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Arrow connector */}
                <div className="mb-3 flex h-11 shrink-0 items-center">
                  <ArrowRight className="h-4 w-4 text-slate-600" aria-hidden />
                </div>

                {/* End time */}
                <div className="flex-1">
                  <label
                    htmlFor="end-time-trigger"
                    className="mb-1.5 flex items-center gap-1 text-xs text-slate-500"
                  >
                    <Clock className="h-3 w-3" aria-hidden />
                    Kết thúc
                  </label>
                  <Select
                    value={endTime ?? ""}
                    onValueChange={setEndTime}
                    disabled={!startTime || avError}
                  >
                    <SelectTrigger
                      id="end-time-trigger"
                      className={cn(
                        "h-11 rounded-xl border-slate-700/60 bg-slate-800/50 text-white",
                        "focus:ring-[#FF8000]/40 focus:border-[#FF8000]/40",
                        "disabled:opacity-40",
                        !endTime && "text-slate-500",
                      )}
                    >
                      <SelectValue placeholder="--:--" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 border-slate-700 bg-slate-900 text-white">
                      {endOptions.map((t) => (
                        <SelectItem
                          key={t}
                          value={t}
                          className="cursor-pointer text-slate-300 focus:bg-[#FF8000]/15 focus:text-white"
                        >
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Helper text when nothing selected */}
              {!startTime && (
                <p className="mt-2 text-[10px] text-slate-600">
                  Bước 30 phút · tối đa 4 giờ / lượt đặt
                </p>
              )}

              {/* Validation error */}
              {validationError && (
                <div
                  className="mt-3 flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-950/30 px-3 py-2.5"
                  role="alert"
                  aria-live="polite"
                >
                  <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0 text-red-400" aria-hidden />
                  <p className="text-xs text-red-400">{validationError}</p>
                </div>
              )}
            </section>
          </>
        )}

        {/* ── 4. Availability grid ── */}
        {hasCourtAndDate && (
          <>
            <div className="mb-5 border-t border-white/5" />
            <section className="mb-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Lịch trống
                </p>
                {/* Legend */}
                <div className="flex items-center gap-3">
                  {[
                    { dot: "bg-slate-700 border border-slate-600", label: "Trống" },
                    { dot: "bg-red-900/50 border border-red-800/40", label: "Đã đặt" },
                    { dot: "bg-[#FF8000]/30 ring-1 ring-[#FF8000]/40", label: "Chọn" },
                  ].map(({ dot, label }) => (
                    <span key={label} className="flex items-center gap-1">
                      <span
                        className={cn("inline-block h-2 w-2 rounded-sm", dot)}
                        aria-hidden
                      />
                      <span className="text-[10px] text-slate-600">{label}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Grid — spinner while loading, error banner on failure, grid on success */}
              {avLoading ? (
                <div className="flex h-20 items-center justify-center">
                  <div
                    className="h-4 w-4 animate-spin rounded-full border-2 border-slate-700 border-t-[#FF8000]"
                    aria-label="Đang tải lịch trống..."
                  />
                </div>
              ) : avError ? (
                <div
                  className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-950/30 px-3 py-2.5"
                  role="alert"
                >
                  <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0 text-red-400" aria-hidden />
                  <p className="text-xs text-red-400">
                    Không thể tải lịch trống. Vui lòng thử lại sau.
                  </p>
                </div>
              ) : (
                <div
                  className="grid max-h-44 grid-cols-4 gap-1 overflow-y-auto"
                  role="img"
                  aria-label="Lịch trống theo khung 30 phút"
                >
                  {gridSlots.map((slot) => {
                    const { booked, inRange } = getSlotState(slot);
                    const isConflict = booked && inRange;
                    return (
                      <div
                        key={slot}
                        title={`${slot}${booked ? " – đã đặt" : inRange ? " – đang chọn" : ""}`}
                        className={cn(
                          "select-none rounded-md py-1.5 text-center text-[10px] leading-tight transition-colors duration-100",
                          isConflict
                            ? "bg-orange-900/30 text-orange-400"
                            : booked
                              ? "bg-red-900/25 text-red-500/60 line-through"
                              : inRange
                                ? "bg-[#FF8000]/20 font-semibold text-white ring-1 ring-[#FF8000]/30"
                                : "bg-slate-800/60 text-slate-500",
                        )}
                      >
                        {slot}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}

        {/* ── 5. Price summary ── */}
        {duration !== null && !validationError && (
          <>
            <div className="mb-5 border-t border-white/5" />
            <div className="mb-5 rounded-xl border border-[#FF8000]/20 bg-gradient-to-br from-[rgba(255,128,0,0.06)] to-slate-900/60 p-4">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-xs tabular-nums text-slate-500">
                    {startTime} → {endTime}
                  </p>
                  <p className="mt-0.5 text-sm font-medium text-slate-300">
                    {formatDuration(duration)}
                  </p>
                  <p className="text-[10px] text-slate-600">{formatDateVN(date)}</p>
                </div>
                <div className="text-right">
                  <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    Tổng cộng
                  </p>
                  {price !== null ? (
                    <p className="bg-gradient-to-r from-[#FF8000] to-[#86D232] bg-clip-text text-2xl font-bold text-transparent tabular-nums">
                      {formatCurrency(price)}
                    </p>
                  ) : (
                    <p className="text-xl font-bold text-slate-300">Liên hệ</p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── 6. CTA ── */}
        <button
          type="button"
          disabled={!canSubmit}
          onClick={handleSubmit}
          aria-label={
            canSubmit
              ? "Tiếp tục đặt sân"
              : "Vui lòng chọn sân, ngày và giờ để tiếp tục"
          }
          className={cn(
            "flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all duration-200",
            canSubmit
              ? [
                  "bg-[#FF8000] text-white",
                  "hover:bg-[#FF8000]/85",
                  "hover:shadow-[0_0_28px_rgba(255,128,0,0.5)]",
                  "active:scale-[0.98] cursor-pointer",
                ]
              : "cursor-not-allowed bg-slate-800 text-slate-500 border border-slate-700/50",
          )}
        >
          Tiếp tục đặt sân
          <ArrowRight className="h-4 w-4" aria-hidden />
        </button>

        <p className="mt-3 text-center text-[10px] text-slate-600">
          Miễn phí đặt lịch · Huỷ trước 2 giờ
        </p>
      </div>
    </div>
  );
}
