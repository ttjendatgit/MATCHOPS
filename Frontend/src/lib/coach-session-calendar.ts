import {
  Ban,
  CheckCircle2,
  Clock,
  RotateCcw,
  Wallet,
  XCircle,
} from "lucide-react";
import type {
  CoachSessionPaymentStatus,
  CoachSessionResponse,
  CoachSessionStatus,
} from "@/types/coach";

// ─── Status / payment metadata ─────────────────────────────────────────────

export const STATUS_META: Record<
  CoachSessionStatus,
  { label: string; icon: typeof Clock; badgeVariant: "warning" | "success" | "destructive" | "info" }
> = {
  AWAITING_PAYMENT: { label: "Chờ thanh toán", icon: Clock, badgeVariant: "warning" },
  PAID: { label: "Đã thanh toán", icon: CheckCircle2, badgeVariant: "success" },
  CANCELLED: { label: "Đã huỷ", icon: Ban, badgeVariant: "destructive" },
  COMPLETED: { label: "Đã hoàn thành", icon: CheckCircle2, badgeVariant: "info" },
};

export const PAYMENT_STATUS_META: Record<
  CoachSessionPaymentStatus,
  { label: string; icon: typeof Clock; badgeVariant: "muted" | "warning" | "success" | "destructive" | "info" }
> = {
  UNPAID: { label: "Chưa thanh toán", icon: Wallet, badgeVariant: "muted" },
  PENDING: { label: "Đang xử lý thanh toán", icon: Clock, badgeVariant: "warning" },
  PAID: { label: "Đã thanh toán", icon: CheckCircle2, badgeVariant: "success" },
  FAILED: { label: "Thanh toán thất bại", icon: XCircle, badgeVariant: "destructive" },
  REFUNDED: { label: "Đã hoàn tiền", icon: RotateCcw, badgeVariant: "info" },
};

/** Accent classes for calendar blocks — icon+text still carries the meaning, this is a secondary visual cue. */
export const STATUS_ACCENT: Record<CoachSessionStatus, string> = {
  AWAITING_PAYMENT: "border-amber-400/40 bg-amber-400/[0.12] text-amber-200 hover:bg-amber-400/[0.18]",
  PAID: "border-[#86D232]/45 bg-[#86D232]/[0.12] text-[#d7f5b0] hover:bg-[#86D232]/[0.18]",
  CANCELLED: "border-red-400/30 bg-red-400/[0.06] text-red-200/70 opacity-70 hover:opacity-90",
  COMPLETED: "border-blue-400/40 bg-blue-400/[0.12] text-blue-100 hover:bg-blue-400/[0.18]",
};

// ─── Date helpers (manual parsing — avoids UTC/timezone drift) ────────────

/** Parses a "YYYY-MM-DD" DateOnly string as a local date (no UTC shift). */
export function parseDateOnly(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

/** Local YYYY-MM-DD key — do not use toISOString(), it shifts by timezone. */
export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function isSameDay(a: Date, b: Date): boolean {
  return toDateKey(a) === toDateKey(b);
}

/** Monday 00:00 of the week containing `date`. */
export function getWeekStart(date: Date): Date {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dow = start.getDay(); // 0 = Sunday ... 6 = Saturday
  const diff = dow === 0 ? -6 : 1 - dow;
  return addDays(start, diff);
}

export function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

export function formatViDate(date: Date): string {
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function formatWeekRangeLabel(weekStart: Date): string {
  const weekEnd = addDays(weekStart, 6);
  return `${formatViDate(weekStart)} – ${formatViDate(weekEnd)}`;
}

export function formatDateTimeVi(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

export const WEEKDAY_SHORT_LABELS = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"];
export const WEEKDAY_FULL_LABELS = [
  "Thứ hai",
  "Thứ ba",
  "Thứ tư",
  "Thứ năm",
  "Thứ sáu",
  "Thứ bảy",
  "Chủ nhật",
];

// ─── Timeline geometry ──────────────────────────────────────────────────────

export const TIMELINE_START_HOUR = 6;
export const TIMELINE_END_HOUR = 22;
export const TIMELINE_HOURS = Array.from(
  { length: TIMELINE_END_HOUR - TIMELINE_START_HOUR },
  (_, i) => TIMELINE_START_HOUR + i
);

const TIMELINE_START_MIN = TIMELINE_START_HOUR * 60;
const TIMELINE_END_MIN = TIMELINE_END_HOUR * 60;

export function formatMinutesLabel(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${pad2(h)}:${pad2(m)}`;
}

// ─── Robust time-string parsing ────────────────────────────────────────────
//
// Coaches/requesters type free-ish strings like "18:00", "18h", "18h30",
// "18h-19h30", "18:00-19:30", "18h-19h30 · 90 phút". We only need the start
// time (and optionally an end/duration hint) to place a block on the grid.

function parseTimeToken(token: string): number | null {
  const match = /^(\d{1,2})(?:[:h](\d{2}))?h?$/i.exec(token.trim());
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = match[2] ? Number(match[2]) : 0;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return hour * 60 + minute;
}

export interface ParsedSessionTime {
  /** Minutes from midnight, or null if the time string couldn't be parsed at all. */
  startMinutes: number | null;
  /** Effective duration in minutes — falls back to 60 when nothing else is known. */
  durationMinutes: number;
}

export function parseSessionTime(
  scheduledTimeSlot: string | null,
  durationMinutes: number | null
): ParsedSessionTime {
  const explicitDuration = durationMinutes && durationMinutes > 0 ? durationMinutes : null;

  if (!scheduledTimeSlot) {
    return { startMinutes: null, durationMinutes: explicitDuration ?? 60 };
  }

  // Strip a trailing "· 90 phút" annotation and keep it as a duration fallback.
  const [timePartRaw, ...restParts] = scheduledTimeSlot.split("·");
  const timePart = timePartRaw.trim();
  const durationHintMatch = /(\d+)\s*phút/i.exec(restParts.join("·"));
  const durationHint = durationHintMatch ? Number(durationHintMatch[1]) : null;

  const segments = timePart
    .split(/[-–]/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (segments.length === 0) {
    return { startMinutes: null, durationMinutes: explicitDuration ?? durationHint ?? 60 };
  }

  const startMinutes = parseTimeToken(segments[0]);
  if (startMinutes === null) {
    return { startMinutes: null, durationMinutes: explicitDuration ?? durationHint ?? 60 };
  }

  const endMinutes = segments.length > 1 ? parseTimeToken(segments[1]) : null;

  let resolvedDuration = 60;
  if (explicitDuration) {
    resolvedDuration = explicitDuration;
  } else if (endMinutes !== null && endMinutes > startMinutes) {
    resolvedDuration = endMinutes - startMinutes;
  } else if (durationHint && durationHint > 0) {
    resolvedDuration = durationHint;
  }

  return { startMinutes, durationMinutes: resolvedDuration };
}

// ─── Placing sessions on the weekly grid ───────────────────────────────────

export interface PlacedSession {
  session: CoachSessionResponse;
  /** Clamped into [06:00, 22:00] for rendering. */
  startMinutes: number;
  endMinutes: number;
}

export interface DayBucket {
  date: Date;
  dayKey: string;
  /** Falls (fully or partially) inside the visible 06:00–22:00 range. */
  timed: PlacedSession[];
  /** Parsed fine, but entirely outside the visible range. */
  outOfRange: PlacedSession[];
  /** Start time could not be parsed at all. */
  unclear: CoachSessionResponse[];
}

type Classified =
  | { kind: "unclear" }
  | { kind: "out-of-range"; startMinutes: number; endMinutes: number }
  | { kind: "timed"; startMinutes: number; endMinutes: number };

function classifySessionTime(session: CoachSessionResponse): Classified {
  const parsed = parseSessionTime(session.scheduledTimeSlot, session.durationMinutes);
  if (parsed.startMinutes === null) return { kind: "unclear" };

  const rawEnd = parsed.startMinutes + parsed.durationMinutes;

  if (rawEnd <= TIMELINE_START_MIN || parsed.startMinutes >= TIMELINE_END_MIN) {
    return { kind: "out-of-range", startMinutes: parsed.startMinutes, endMinutes: rawEnd };
  }

  const clampedStart = Math.max(parsed.startMinutes, TIMELINE_START_MIN);
  const clampedEnd = Math.max(Math.min(rawEnd, TIMELINE_END_MIN), clampedStart + 20);
  return { kind: "timed", startMinutes: clampedStart, endMinutes: clampedEnd };
}

/** Buckets every session that falls within `weekDays` into its day, by placement kind. */
export function buildWeekCalendar(
  sessions: CoachSessionResponse[],
  weekDays: Date[]
): DayBucket[] {
  const buckets = new Map<string, DayBucket>(
    weekDays.map((date) => {
      const dayKey = toDateKey(date);
      return [dayKey, { date, dayKey, timed: [], outOfRange: [], unclear: [] }];
    })
  );

  for (const session of sessions) {
    if (!session.scheduledDate) continue;
    const dayKey = toDateKey(parseDateOnly(session.scheduledDate));
    const bucket = buckets.get(dayKey);
    if (!bucket) continue;

    const classified = classifySessionTime(session);
    if (classified.kind === "unclear") {
      bucket.unclear.push(session);
    } else if (classified.kind === "out-of-range") {
      bucket.outOfRange.push({ session, startMinutes: classified.startMinutes, endMinutes: classified.endMinutes });
    } else {
      bucket.timed.push({ session, startMinutes: classified.startMinutes, endMinutes: classified.endMinutes });
    }
  }

  return weekDays.map((date) => buckets.get(toDateKey(date))!);
}

/** All sessions scheduled on `date`, sorted by parsed start time (unclear-time ones last). */
export function getSessionsForDay(sessions: CoachSessionResponse[], date: Date): CoachSessionResponse[] {
  const dayKey = toDateKey(date);
  return sessions
    .filter((s) => s.scheduledDate && toDateKey(parseDateOnly(s.scheduledDate)) === dayKey)
    .sort((a, b) => {
      const aStart = parseSessionTime(a.scheduledTimeSlot, a.durationMinutes).startMinutes;
      const bStart = parseSessionTime(b.scheduledTimeSlot, b.durationMinutes).startMinutes;
      if (aStart === null && bStart === null) return 0;
      if (aStart === null) return 1;
      if (bStart === null) return -1;
      return aStart - bStart;
    });
}

// ─── Overlap layout — simple lane assignment per overlapping cluster ──────

export interface LaidOutSession extends PlacedSession {
  lane: number;
  laneCount: number;
}

export function layoutDayColumn(items: PlacedSession[]): LaidOutSession[] {
  const sorted = [...items].sort((a, b) => a.startMinutes - b.startMinutes);
  const result: LaidOutSession[] = [];

  let cluster: PlacedSession[] = [];
  let clusterEnd = -Infinity;

  const flush = () => {
    if (cluster.length === 0) return;
    const laneEnds: number[] = [];
    const withLane = cluster.map((item) => {
      let lane = laneEnds.findIndex((end) => end <= item.startMinutes);
      if (lane === -1) {
        lane = laneEnds.length;
        laneEnds.push(item.endMinutes);
      } else {
        laneEnds[lane] = item.endMinutes;
      }
      return { item, lane };
    });
    const laneCount = laneEnds.length;
    for (const { item, lane } of withLane) {
      result.push({ ...item, lane, laneCount });
    }
    cluster = [];
    clusterEnd = -Infinity;
  };

  for (const item of sorted) {
    if (cluster.length === 0 || item.startMinutes < clusterEnd) {
      cluster.push(item);
      clusterEnd = Math.max(clusterEnd, item.endMinutes);
    } else {
      flush();
      cluster.push(item);
      clusterEnd = item.endMinutes;
    }
  }
  flush();

  return result;
}

// ─── Week stats ─────────────────────────────────────────────────────────────

export interface WeekStats {
  total: number;
  awaitingPayment: number;
  paid: number;
  completed: number;
}

export function computeWeekStats(sessions: CoachSessionResponse[], weekDays: Date[]): WeekStats {
  const keys = new Set(weekDays.map(toDateKey));
  const inWeek = sessions.filter((s) => s.scheduledDate && keys.has(toDateKey(parseDateOnly(s.scheduledDate))));
  return {
    total: inWeek.length,
    awaitingPayment: inWeek.filter((s) => s.status === "AWAITING_PAYMENT").length,
    paid: inWeek.filter((s) => s.status === "PAID").length,
    completed: inWeek.filter((s) => s.status === "COMPLETED").length,
  };
}

// ─── Formatting shared by cards/dialogs ────────────────────────────────────

export function formatPrice(amount: number | null, currency: string): string {
  if (amount === null) return "Cần xác nhận giá thủ công";
  return `${amount.toLocaleString("vi-VN")} ${currency}`;
}
