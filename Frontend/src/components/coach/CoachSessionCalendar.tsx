"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Clock3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { CoachSessionResponse } from "@/types/coach";
import {
  STATUS_ACCENT,
  STATUS_META,
  STATUS_PRICE_CLASS,
  TIMELINE_HOURS,
  buildWeekCalendar,
  formatMinutesLabel,
  formatPrice,
  formatViDate,
  getOverflowLabel,
  getSessionsForDay,
  isEveningHour,
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
      <div
        className={cn(
          "hidden overflow-x-auto rounded-2xl border border-white/[0.12] shadow-[0_10px_44px_-16px_rgba(0,0,0,0.65)] md:block",
          "[background-image:radial-gradient(ellipse_70%_55%_at_12%_-15%,rgba(255,128,0,0.09),transparent_60%),linear-gradient(180deg,rgba(30,41,59,0.55),rgba(2,6,23,0.7))]"
        )}
      >
        <div className="min-w-[880px]">
          {/* Day header row */}
          <div className="relative flex border-b border-white/[0.14] bg-gradient-to-b from-slate-950/95 to-slate-900/75 shadow-[0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-md">
            <div className="w-14 shrink-0 border-r border-white/[0.08]" aria-hidden />
            <div className="grid flex-1 grid-cols-7 gap-px bg-white/[0.08]">
              {weekDays.map((day, i) => {
                const bucket = dayBuckets[i];
                const totalCount = bucket.timed.length + bucket.outOfRange.length + bucket.unclear.length;
                const overflowLabel = getOverflowLabel(bucket.outOfRange.length, bucket.unclear.length);
                const isToday = isSameDay(day, today);
                return (
                  <button
                    key={bucket.dayKey}
                    type="button"
                    onClick={() => onSelectDay(day)}
                    className={cn(
                      "flex flex-col items-center gap-1 bg-slate-950/80 py-2.5 text-xs transition-colors duration-150",
                      isToday && "bg-gradient-to-b from-[#FF8000]/[0.14] to-slate-950/80",
                      "hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#FF8000]"
                    )}
                    aria-label={`Xem lịch ngày ${formatViDate(day)}${totalCount > 0 ? `, ${totalCount} buổi` : ""}`}
                  >
                    <span className={cn("font-semibold uppercase tracking-wide", isToday ? "text-[#FF8000]" : "text-slate-500")}>
                      {WEEKDAY_SHORT_LABELS[i]}
                    </span>
                    <span
                      className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold transition-all",
                        isToday
                          ? "bg-[#FF8000] text-white shadow-[0_0_0_3px_rgba(255,128,0,0.18),0_0_16px_rgba(255,128,0,0.5)]"
                          : "text-slate-200"
                      )}
                    >
                      {day.getDate()}
                    </span>
                    <div className="flex min-h-[16px] items-center gap-1">
                      {totalCount > 0 && (
                        <span className="rounded-full bg-white/[0.09] px-1.5 py-0.5 text-[10px] font-semibold leading-none text-slate-300">
                          {totalCount} buổi
                        </span>
                      )}
                      {overflowLabel && (
                        <span
                          className="flex items-center gap-0.5 rounded-full bg-amber-400/15 px-1.5 py-0.5 text-[9.5px] font-medium leading-none text-amber-300"
                          title={overflowLabel}
                        >
                          <AlertTriangle className="h-2.5 w-2.5 shrink-0" aria-hidden />
                          {overflowLabel}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scrollable time body */}
          <div className="flex max-h-[640px] overflow-y-auto">
            {/* Hour labels */}
            <div className="w-14 shrink-0 border-r border-white/[0.08] bg-slate-950/30">
              {TIMELINE_HOURS.map((hour) => (
                <div
                  key={hour}
                  style={{ height: ROW_HEIGHT }}
                  className={cn(
                    "pr-2 pt-0.5 text-right text-[11px] font-medium tabular-nums text-slate-400",
                    hour % 2 === 0 ? "border-t border-white/[0.09]" : "border-t border-white/[0.03]",
                    isEveningHour(hour) && "bg-indigo-950/[0.18] text-slate-500"
                  )}
                >
                  {hour}:00
                </div>
              ))}
            </div>

            {/* Day columns */}
            <div className="grid flex-1 grid-cols-7 gap-px bg-white/[0.08]">
              {weekDays.map((day, i) => {
                const bucket = dayBuckets[i];
                const laidOut = layoutDayColumn(bucket.timed);
                const isToday = isSameDay(day, today);
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
                    className={cn(
                      "relative cursor-pointer bg-slate-950/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#FF8000]",
                      isToday && "bg-[#FF8000]/[0.045]"
                    )}
                    style={{ height: TIMELINE_HOURS.length * ROW_HEIGHT }}
                  >
                    {TIMELINE_HOURS.map((hour) => (
                      <div
                        key={hour}
                        style={{ height: ROW_HEIGHT }}
                        className={cn(
                          hour % 2 === 0 ? "border-t border-white/[0.07]" : "border-t border-white/[0.025]",
                          isEveningHour(hour) && "bg-indigo-950/[0.12]"
                        )}
                      />
                    ))}

                    {laidOut.map((item) => {
                      const meta = STATUS_META[item.session.status];
                      const StatusIcon = meta.icon;
                      const top = ((item.startMinutes - TIMELINE_HOURS[0] * 60) / 60) * ROW_HEIGHT;
                      const height = ((item.endMinutes - item.startMinutes) / 60) * ROW_HEIGHT;
                      const blockHeight = Math.max(height, 22);
                      const widthPct = 100 / item.laneCount;
                      const leftPct = item.lane * widthPct;
                      const timeLabel = `${formatMinutesLabel(item.startMinutes)}–${formatMinutesLabel(item.endMinutes)}`;
                      // Below ~56px there's only room for name + time — price/status pill would clutter a short block.
                      const isExpanded = blockHeight >= 56;

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
                            height: blockHeight,
                            left: `calc(${leftPct}% + 2px)`,
                            width: `calc(${widthPct}% - 4px)`,
                          }}
                          className={cn(
                            "absolute flex flex-col overflow-hidden rounded-lg px-2 py-1.5 text-left leading-tight",
                            "transition-all duration-150 hover:-translate-y-0.5 hover:z-10",
                            "focus-visible:outline-none focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-[#FF8000] focus-visible:ring-offset-1 focus-visible:ring-offset-[#030303]",
                            isExpanded ? "justify-between gap-0.5" : "justify-center gap-0.5",
                            STATUS_ACCENT[item.session.status]
                          )}
                          title={`${item.session.requesterName} · ${timeLabel} · ${meta.label}`}
                          aria-label={`${item.session.requesterName}, ${timeLabel}, ${meta.label}${item.session.priceAmount !== null
                              ? `, ${formatPrice(item.session.priceAmount, item.session.currency)}`
                              : ""
                            }`}
                        >
                          <span className="flex items-center gap-1 text-[11px] font-bold text-white drop-shadow-sm">
                            <StatusIcon className="h-2.5 w-2.5 shrink-0" aria-hidden />
                            <span className="truncate">{item.session.requesterName}</span>
                          </span>
                          <span className="block truncate text-[10px] font-medium tabular-nums text-sky-200/80">
                            {timeLabel}
                          </span>
                          {isExpanded && (
                            <>
                              <span
                                className={cn(
                                  "mt-0.5 block truncate text-[10.5px] font-extrabold tabular-nums",
                                  STATUS_PRICE_CLASS[item.session.status]
                                )}
                              >
                                {formatPrice(item.session.priceAmount, item.session.currency)}
                              </span>
                              {blockHeight >= 72 && (
                                <span className="inline-flex w-fit max-w-full items-center rounded-full bg-black/25 px-1.5 py-[1px] text-[8.5px] font-semibold leading-[1.4] text-white/75">
                                  {meta.label}
                                </span>
                              )}
                            </>
                          )}
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
          const dayCount = getSessionsForDay(sessions, day).length;
          const isToday = isSameDay(day, today);
          return (
            <button
              key={dayKey}
              type="button"
              onClick={() => setSelectedKey(dayKey)}
              aria-pressed={active}
              aria-label={`${WEEKDAY_FULL_LABELS[i]}, ${formatViDate(day)}${dayCount > 0 ? `, ${dayCount} buổi` : ""}`}
              className={cn(
                "flex min-w-[3.5rem] shrink-0 flex-col items-center gap-1 rounded-xl border px-2.5 py-2 transition-all duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8000]",
                active
                  ? "border-[#FF8000]/60 bg-gradient-to-b from-[#FF8000]/[0.22] to-[#FF8000]/[0.06] text-white shadow-[0_0_0_1px_rgba(255,128,0,0.15),0_4px_16px_-4px_rgba(255,128,0,0.5)]"
                  : cn(
                    "border-white/10 bg-slate-900/40 text-slate-400 hover:bg-white/[0.06]",
                    isToday && "border-[#FF8000]/30"
                  )
              )}
            >
              <span className="text-[10px] font-semibold uppercase tracking-wide">{WEEKDAY_SHORT_LABELS[i]}</span>
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-sm font-bold",
                  isToday && !active && "text-[#FF8000]"
                )}
              >
                {day.getDate()}
              </span>
              {dayCount > 0 && (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[9.5px] font-bold leading-none",
                    active ? "bg-white/20 text-white" : "bg-white/10 text-slate-300"
                  )}
                >
                  {dayCount}
                </span>
              )}
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
      className={cn(
        "flex w-full flex-col gap-2 rounded-xl p-4 text-left shadow-[0_4px_16px_-8px_rgba(0,0,0,0.5)] transition-all duration-150",
        "hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8000]",
        STATUS_ACCENT[session.status]
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="font-semibold text-white">{session.requesterName}</span>
        <Badge variant={meta.badgeVariant} className="shrink-0 gap-1 px-2 py-0.5 text-[11px]">
          <StatusIcon className="h-3 w-3" aria-hidden />
          {meta.label}
        </Badge>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-300/80">
        {session.scheduledTimeSlot && (
          <span className="flex items-center gap-1">
            <Clock3 className="h-3 w-3 text-slate-400" aria-hidden />
            {session.scheduledTimeSlot}
          </span>
        )}
        {session.sportName && <span>{session.sportName}</span>}
      </div>
      <span className={cn("text-xs font-bold tabular-nums", STATUS_PRICE_CLASS[session.status])}>
        {formatPrice(session.priceAmount, session.currency)}
      </span>
    </button>
  );
}
