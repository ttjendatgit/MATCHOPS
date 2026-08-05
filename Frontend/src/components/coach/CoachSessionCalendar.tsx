"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Clock3 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CoachSessionResponse } from "@/types/coach";
import {
  STATUS_ACCENT,
  STATUS_META,
  TIMELINE_HOURS,
  buildWeekCalendar,
  formatMinutesLabel,
  formatPrice,
  formatViDate,
  getSessionsForDay,
  isSameDay,
  layoutDayColumn,
  toDateKey,
  WEEKDAY_FULL_LABELS,
  WEEKDAY_SHORT_LABELS,
} from "@/lib/coach-session-calendar";

const ROW_HEIGHT = 48; // px per hour row

interface CoachSessionCalendarProps {
  weekDays: Date[];
  sessions: CoachSessionResponse[];
  onSelectDay: (date: Date) => void;
  onSelectSession: (session: CoachSessionResponse) => void;
}

export function CoachSessionCalendar({
  weekDays,
  sessions,
  onSelectDay,
  onSelectSession,
}: CoachSessionCalendarProps) {
  const today = useMemo(() => new Date(), []);
  const dayBuckets = useMemo(() => buildWeekCalendar(sessions, weekDays), [sessions, weekDays]);

  return (
    <div>
      {/* ── Desktop weekly grid ── */}
      <div className="hidden overflow-x-auto rounded-2xl border border-white/10 bg-slate-900/40 md:block">
        <div className="min-w-[880px]">
          {/* Day header row */}
          <div className="flex border-b border-white/10 bg-slate-950/70 backdrop-blur">
            <div className="w-14 shrink-0" aria-hidden />
            <div className="grid flex-1 grid-cols-7 gap-px bg-white/5">
              {weekDays.map((day, i) => {
                const bucket = dayBuckets[i];
                const overflowCount = bucket.outOfRange.length + bucket.unclear.length;
                const isToday = isSameDay(day, today);
                return (
                  <button
                    key={bucket.dayKey}
                    type="button"
                    onClick={() => onSelectDay(day)}
                    className={cn(
                      "flex flex-col items-center gap-0.5 bg-slate-950/70 py-2.5 text-xs transition-colors duration-150",
                      "hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#FF8000]"
                    )}
                    aria-label={`Xem lịch ngày ${formatViDate(day)}`}
                  >
                    <span className="font-medium text-slate-500">{WEEKDAY_SHORT_LABELS[i]}</span>
                    <span
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full text-sm font-bold",
                        isToday ? "bg-[#FF8000] text-white" : "text-slate-200"
                      )}
                    >
                      {day.getDate()}
                    </span>
                    {overflowCount > 0 && (
                      <span className="flex items-center gap-0.5 text-[10px] font-medium text-amber-400">
                        <AlertTriangle className="h-2.5 w-2.5" aria-hidden />+{overflowCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scrollable time body */}
          <div className="flex max-h-[640px] overflow-y-auto">
            {/* Hour labels */}
            <div className="w-14 shrink-0">
              {TIMELINE_HOURS.map((hour) => (
                <div
                  key={hour}
                  style={{ height: ROW_HEIGHT }}
                  className="border-t border-white/[0.06] pr-2 pt-0.5 text-right text-[11px] tabular-nums text-slate-500"
                >
                  {hour}:00
                </div>
              ))}
            </div>

            {/* Day columns */}
            <div className="grid flex-1 grid-cols-7 gap-px bg-white/5">
              {weekDays.map((day, i) => {
                const bucket = dayBuckets[i];
                const laidOut = layoutDayColumn(bucket.timed);
                return (
                  // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
                  <div
                    key={bucket.dayKey}
                    role="button"
                    tabIndex={0}
                    onClick={() => onSelectDay(day)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onSelectDay(day);
                      }
                    }}
                    aria-label={`Lịch ngày ${formatViDate(day)}`}
                    className="relative cursor-pointer bg-slate-950/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#FF8000]"
                    style={{ height: TIMELINE_HOURS.length * ROW_HEIGHT }}
                  >
                    {TIMELINE_HOURS.map((hour) => (
                      <div key={hour} style={{ height: ROW_HEIGHT }} className="border-t border-white/[0.06]" />
                    ))}

                    {laidOut.map((item) => {
                      const meta = STATUS_META[item.session.status];
                      const StatusIcon = meta.icon;
                      const top = ((item.startMinutes - TIMELINE_HOURS[0] * 60) / 60) * ROW_HEIGHT;
                      const height = ((item.endMinutes - item.startMinutes) / 60) * ROW_HEIGHT;
                      const widthPct = 100 / item.laneCount;
                      const leftPct = item.lane * widthPct;
                      const timeLabel = `${formatMinutesLabel(item.startMinutes)}–${formatMinutesLabel(item.endMinutes)}`;

                      return (
                        <button
                          key={item.session.id}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectSession(item.session);
                          }}
                          style={{
                            top,
                            height: Math.max(height, 22),
                            left: `calc(${leftPct}% + 2px)`,
                            width: `calc(${widthPct}% - 4px)`,
                          }}
                          className={cn(
                            "absolute overflow-hidden rounded-md border px-1.5 py-1 text-left text-[10.5px] leading-tight",
                            "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8000] focus-visible:ring-offset-1 focus-visible:ring-offset-[#030303]",
                            STATUS_ACCENT[item.session.status]
                          )}
                          title={`${item.session.requesterName} · ${timeLabel} · ${meta.label}`}
                          aria-label={`${item.session.requesterName}, ${timeLabel}, ${meta.label}`}
                        >
                          <span className="flex items-center gap-1 font-semibold text-white">
                            <StatusIcon className="h-2.5 w-2.5 shrink-0" aria-hidden />
                            <span className="truncate">{item.session.requesterName}</span>
                          </span>
                          <span className="block truncate tabular-nums opacity-90">{timeLabel}</span>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile: day chips + card list ── */}
      <MobileDayView weekDays={weekDays} sessions={sessions} onSelectSession={onSelectSession} />
    </div>
  );
}

// ─── Mobile day selector ────────────────────────────────────────────────────

function MobileDayView({
  weekDays,
  sessions,
  onSelectSession,
}: {
  weekDays: Date[];
  sessions: CoachSessionResponse[];
  onSelectSession: (session: CoachSessionResponse) => void;
}) {
  const today = useMemo(() => new Date(), []);
  const [selectedKey, setSelectedKey] = useState(() => {
    const todayInWeek = weekDays.find((d) => isSameDay(d, today));
    return toDateKey(todayInWeek ?? weekDays[0]);
  });

  useEffect(() => {
    const todayInWeek = weekDays.find((d) => isSameDay(d, today));
    setSelectedKey(toDateKey(todayInWeek ?? weekDays[0]));
    // Week changed — reset selection. `today` is stable for the component's lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekDays]);

  const selectedDate = weekDays.find((d) => toDateKey(d) === selectedKey) ?? weekDays[0];
  const daySessions = useMemo(() => getSessionsForDay(sessions, selectedDate), [sessions, selectedDate]);

  return (
    <div className="md:hidden">
      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {weekDays.map((day, i) => {
          const dayKey = toDateKey(day);
          const active = dayKey === selectedKey;
          const hasSessions = getSessionsForDay(sessions, day).length > 0;
          const isToday = isSameDay(day, today);
          return (
            <button
              key={dayKey}
              type="button"
              onClick={() => setSelectedKey(dayKey)}
              aria-pressed={active}
              aria-label={`${WEEKDAY_FULL_LABELS[i]}, ${formatViDate(day)}`}
              className={cn(
                "flex min-w-[3.25rem] shrink-0 flex-col items-center gap-1 rounded-xl border px-2.5 py-2 transition-colors duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8000]",
                active
                  ? "border-[#FF8000]/40 bg-[#FF8000]/[0.12] text-white"
                  : "border-white/10 bg-slate-900/40 text-slate-400 hover:bg-white/[0.05]"
              )}
            >
              <span className="text-[10px] font-medium uppercase tracking-wide">{WEEKDAY_SHORT_LABELS[i]}</span>
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-sm font-bold",
                  isToday && !active && "text-[#FF8000]"
                )}
              >
                {day.getDate()}
              </span>
              {hasSessions && <span className={cn("h-1 w-1 rounded-full", active ? "bg-[#FF8000]" : "bg-slate-600")} aria-hidden />}
            </button>
          );
        })}
      </div>

      <div className="mt-4 space-y-3">
        {daySessions.length === 0 ? (
          <div className="rounded-xl border border-white/[0.08] bg-slate-900/40 p-6 text-center text-sm text-slate-500">
            Không có buổi huấn luyện nào trong ngày này.
          </div>
        ) : (
          daySessions.map((session) => <MobileSessionCard key={session.id} session={session} onClick={() => onSelectSession(session)} />)
        )}
      </div>
    </div>
  );
}

function MobileSessionCard({ session, onClick }: { session: CoachSessionResponse; onClick: () => void }) {
  const meta = STATUS_META[session.status];
  const StatusIcon = meta.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full flex-col gap-2 rounded-xl border border-white/10 bg-slate-900/50 p-4 text-left transition-colors duration-150 hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8000]"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="font-semibold text-white">{session.requesterName}</span>
        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
            STATUS_ACCENT[session.status]
          )}
        >
          <StatusIcon className="h-3 w-3" aria-hidden />
          {meta.label}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
        {session.scheduledTimeSlot && (
          <span className="flex items-center gap-1">
            <Clock3 className="h-3 w-3 text-slate-600" aria-hidden />
            {session.scheduledTimeSlot}
          </span>
        )}
        {session.sportName && <span>{session.sportName}</span>}
      </div>
      <span className="text-xs font-medium text-slate-300">{formatPrice(session.priceAmount, session.currency)}</span>
    </button>
  );
}
