"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BackLink } from "@/components/shared/BackLink";
import {
  AlertTriangle,
  CalendarClock,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Dumbbell,
  Inbox,
  List,
  Loader2,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { apiFetch, ApiError } from "@/lib/api";
import { getStoredToken } from "@/lib/auth";
import type { ApiResponse } from "@/types/api";
import type { CoachSessionResponse } from "@/types/coach";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { CoachSessionCalendar } from "@/components/coach/CoachSessionCalendar";
import { CoachSessionDayDialog } from "@/components/coach/CoachSessionDayDialog";
import { CoachSessionDetailDialog } from "@/components/coach/CoachSessionDetailDialog";
import {
  STATUS_META,
  addDays,
  computeWeekStats,
  formatPrice,
  formatWeekRangeLabel,
  getSessionsForDay,
  getWeekDays,
  getWeekStart,
} from "@/lib/coach-session-calendar";

type PageMode = "loading" | "ready" | "no-profile" | "error";
type ViewMode = "calendar" | "list";

// ─── Week stat tile ─────────────────────────────────────────────────────────

function WeekStatTile({
  icon: Icon,
  label,
  value,
  accentClassName,
}: {
  icon: typeof Clock3;
  label: string;
  value: number;
  accentClassName?: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-slate-900/50 p-4">
      <div className="mb-1 flex items-center gap-1.5 text-xs text-slate-500">
        <Icon className={cn("h-3.5 w-3.5", accentClassName)} aria-hidden />
        {label}
      </div>
      <p className="text-xl font-bold text-white tabular-nums">{value}</p>
    </div>
  );
}

// ─── List-view session card (fallback view) ────────────────────────────────

function SessionListCard({
  session,
  onOpenDetail,
  onComplete,
}: {
  session: CoachSessionResponse;
  onOpenDetail: (session: CoachSessionResponse) => void;
  onComplete: (session: CoachSessionResponse) => void;
}) {
  const meta = STATUS_META[session.status];
  const StatusIcon = meta.icon;
  const canComplete = session.status === "PAID" && session.paymentStatus === "PAID";

  return (
    <Card className="overflow-hidden border-white/10 bg-slate-900/50">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-[#86D232]/40 to-transparent" aria-hidden />
      <CardContent className="space-y-3 p-5 sm:p-6">
        <button
          type="button"
          onClick={() => onOpenDetail(session)}
          className="flex w-full flex-wrap items-start justify-between gap-3 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8000]"
        >
          <div className="min-w-0">
            <h3 className="truncate text-base font-bold text-white">{session.requesterName}</h3>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
              {session.scheduledTimeSlot && (
                <span className="flex items-center gap-1">
                  <Clock3 className="h-3 w-3" aria-hidden />
                  {session.scheduledTimeSlot}
                </span>
              )}
              {session.sportName && (
                <span className="flex items-center gap-1">
                  <Dumbbell className="h-3 w-3" aria-hidden />
                  {session.sportName}
                </span>
              )}
            </div>
          </div>
          <Badge variant={meta.badgeVariant} className="shrink-0 gap-1.5 px-3 py-1 text-xs">
            <StatusIcon className="h-3.5 w-3.5" aria-hidden />
            {meta.label}
          </Badge>
        </button>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-slate-950/40 p-3">
          <span className="text-sm font-semibold text-white">{formatPrice(session.priceAmount, session.currency)}</span>
          {canComplete && (
            <Button
              type="button"
              size="sm"
              className="bg-[#86D232] text-[#0A0A0A] hover:bg-[#86D232]/90"
              onClick={() => onComplete(session)}
            >
              Đánh dấu hoàn thành
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CoachManageSessionsPage() {
  const router = useRouter();

  const [mode, setMode] = useState<PageMode>("loading");
  const [pageError, setPageError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<CoachSessionResponse[]>([]);

  const [viewMode, setViewMode] = useState<ViewMode>("calendar");
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);
  const weekStats = useMemo(() => computeWeekStats(sessions, weekDays), [sessions, weekDays]);

  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedSession, setSelectedSession] = useState<CoachSessionResponse | null>(null);
  const [completeTarget, setCompleteTarget] = useState<CoachSessionResponse | null>(null);
  const [completing, setCompleting] = useState(false);

  const selectedDaySessions = useMemo(
    () => (selectedDay ? getSessionsForDay(sessions, selectedDay) : []),
    [sessions, selectedDay]
  );

  const fetchSessions = useCallback(async () => {
    const token = getStoredToken();
    if (!token) return;
    setPageError(null);
    try {
      const res = await apiFetch<ApiResponse<CoachSessionResponse[]>>("/coaches/me/sessions", { token });
      if (res.success && res.data) {
        setSessions(res.data);
        setMode("ready");
      } else {
        setPageError(res.message || "Không thể tải danh sách buổi huấn luyện.");
        setMode("error");
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setMode("no-profile");
        return;
      }
      const message = err instanceof Error ? err.message : "Không thể tải danh sách buổi huấn luyện.";
      setPageError(message);
      setMode("error");
    }
  }, []);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      router.push("/login?redirect=/coach/manage/sessions");
      return;
    }
    setMode("loading");
    fetchSessions();
  }, [router, fetchSessions]);

  function requestComplete(session: CoachSessionResponse) {
    setSelectedSession(null);
    setCompleteTarget(session);
  }

  async function handleConfirmComplete() {
    if (!completeTarget) return;
    const token = getStoredToken();
    setCompleting(true);
    try {
      const res = await apiFetch<ApiResponse<CoachSessionResponse>>(
        `/coaches/me/sessions/${completeTarget.id}/complete`,
        { method: "PATCH", token }
      );
      if (res.success) {
        toast.success("Đã đánh dấu buổi huấn luyện hoàn thành.");
        setCompleteTarget(null);
        await fetchSessions();
      } else {
        toast.error(res.message || "Không thể cập nhật buổi huấn luyện.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Không thể cập nhật buổi huấn luyện.";
      toast.error(message);
    } finally {
      setCompleting(false);
    }
  }

  // ── Loading ──────────────────────────────────────────────────────────────

  if (mode === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF8000]" aria-label="Đang tải" />
      </div>
    );
  }

  // ── No coach profile ─────────────────────────────────────────────────────

  if (mode === "no-profile") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6 lg:px-8">
        <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-800/60 ring-1 ring-white/[0.06]">
          <UserPlus className="h-6 w-6 text-slate-500" aria-hidden />
        </span>
        <h1 className="text-xl font-bold text-white">Bạn chưa có hồ sơ huấn luyện viên</h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-400">
          Đăng ký làm huấn luyện viên để bắt đầu nhận và quản lý buổi huấn luyện.
        </p>
        <Button asChild className="mt-6 bg-[#FF8000] text-white hover:bg-[#FF8000]/90">
          <Link href="/coach/apply">Đăng ký làm Huấn luyện viên</Link>
        </Button>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────

  if (mode === "error") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6 lg:px-8">
        <AlertTriangle className="mx-auto mb-4 h-10 w-10 text-red-400" aria-hidden />
        <p className="text-sm text-red-400">{pageError}</p>
        <Button
          type="button"
          onClick={() => {
            setMode("loading");
            fetchSessions();
          }}
          className="mt-6 bg-[#FF8000] text-white hover:bg-[#FF8000]/90"
        >
          Thử lại
        </Button>
      </div>
    );
  }

  // ── Ready ────────────────────────────────────────────────────────────────

  const upcoming = sessions.filter((s) => s.status === "AWAITING_PAYMENT" || s.status === "PAID");
  const completed = sessions.filter((s) => s.status === "COMPLETED");
  const cancelled = sessions.filter((s) => s.status === "CANCELLED");

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <BackLink href="/coach/manage" label="Quay lại trang quản lý huấn luyện viên" className="mb-6" />

      <div className="mb-6 max-w-2xl">
        <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
          <CalendarClock className="h-3.5 w-3.5 text-[#FF8000]" aria-hidden />
          Lịch buổi huấn luyện
        </div>
        <h1 className="text-2xl font-black text-white sm:text-3xl">Lịch buổi huấn luyện</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-400 sm:text-base">
          Theo dõi lịch huấn luyện theo tuần, trạng thái thanh toán và tiến độ từng buổi.
        </p>
      </div>

      {/* ── Week controls ── */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Tuần trước"
            onClick={() => setWeekStart((prev) => addDays(prev, -7))}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Tuần sau"
            onClick={() => setWeekStart((prev) => addDays(prev, 7))}
          >
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setWeekStart(getWeekStart(new Date()))}>
            Hôm nay
          </Button>
          <span className="ml-1 text-sm font-semibold tabular-nums text-slate-300">
            {formatWeekRangeLabel(weekStart)}
          </span>
        </div>

        <div role="group" aria-label="Chế độ xem" className="flex items-center gap-1 rounded-lg border border-white/10 bg-slate-900/50 p-1">
          <button
            type="button"
            onClick={() => setViewMode("calendar")}
            aria-pressed={viewMode === "calendar"}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8000]",
              viewMode === "calendar" ? "bg-[#FF8000] text-white" : "text-slate-400 hover:text-white"
            )}
          >
            <CalendarRange className="h-3.5 w-3.5" aria-hidden />
            Lịch
          </button>
          <button
            type="button"
            onClick={() => setViewMode("list")}
            aria-pressed={viewMode === "list"}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8000]",
              viewMode === "list" ? "bg-[#FF8000] text-white" : "text-slate-400 hover:text-white"
            )}
          >
            <List className="h-3.5 w-3.5" aria-hidden />
            Danh sách
          </button>
        </div>
      </div>

      {/* ── Current-week stats ── */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <WeekStatTile icon={CalendarClock} label="Tổng buổi" value={weekStats.total} accentClassName="text-[#FF8000]" />
        <WeekStatTile
          icon={STATUS_META.AWAITING_PAYMENT.icon}
          label="Chờ thanh toán"
          value={weekStats.awaitingPayment}
          accentClassName="text-amber-400"
        />
        <WeekStatTile
          icon={STATUS_META.PAID.icon}
          label="Đã thanh toán"
          value={weekStats.paid}
          accentClassName="text-[#86D232]"
        />
        <WeekStatTile
          icon={STATUS_META.COMPLETED.icon}
          label="Đã hoàn thành"
          value={weekStats.completed}
          accentClassName="text-blue-400"
        />
      </div>

      {/* ── Calendar / list view ── */}
      {sessions.length === 0 ? (
        <Card className="border-white/10 bg-slate-900/50">
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-800/60 ring-1 ring-white/[0.06]">
              <Inbox className="h-6 w-6 text-slate-500" aria-hidden />
            </span>
            <p className="max-w-md text-sm text-slate-400">
              Chưa có buổi huấn luyện nào. Buổi huấn luyện sẽ xuất hiện tại đây sau khi bạn chấp
              nhận một yêu cầu.
            </p>
            <Button asChild className="mt-2 bg-[#FF8000] text-white hover:bg-[#FF8000]/90">
              <Link href="/coach/manage/requests">Xem yêu cầu buổi huấn luyện</Link>
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === "calendar" ? (
        <CoachSessionCalendar
          weekDays={weekDays}
          sessions={sessions}
          onSelectDay={setSelectedDay}
          onSelectSession={setSelectedSession}
        />
      ) : (
        <div className="space-y-8">
          {upcoming.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Sắp tới</h2>
              {upcoming.map((session) => (
                <SessionListCard
                  key={session.id}
                  session={session}
                  onOpenDetail={setSelectedSession}
                  onComplete={requestComplete}
                />
              ))}
            </section>
          )}
          {completed.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Đã qua / hoàn thành</h2>
              {completed.map((session) => (
                <SessionListCard
                  key={session.id}
                  session={session}
                  onOpenDetail={setSelectedSession}
                  onComplete={requestComplete}
                />
              ))}
            </section>
          )}
          {cancelled.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Đã huỷ</h2>
              {cancelled.map((session) => (
                <SessionListCard
                  key={session.id}
                  session={session}
                  onOpenDetail={setSelectedSession}
                  onComplete={requestComplete}
                />
              ))}
            </section>
          )}
        </div>
      )}

      {/* ── Day detail (desktop calendar) ── */}
      <CoachSessionDayDialog
        date={selectedDay}
        sessions={selectedDaySessions}
        onOpenChange={(open) => !open && setSelectedDay(null)}
        onSelectSession={(session) => {
          setSelectedDay(null);
          setSelectedSession(session);
        }}
      />

      {/* ── Session detail ── */}
      <CoachSessionDetailDialog
        session={selectedSession}
        onOpenChange={(open) => !open && setSelectedSession(null)}
        onRequestComplete={requestComplete}
      />

      {/* ── Complete confirmation ── */}
      <ConfirmDialog
        open={completeTarget !== null}
        onOpenChange={(open) => !open && setCompleteTarget(null)}
        title="Đánh dấu buổi huấn luyện hoàn thành?"
        description={
          completeTarget
            ? `Xác nhận buổi huấn luyện với ${completeTarget.requesterName} đã diễn ra và hoàn thành.`
            : undefined
        }
        confirmLabel="Xác nhận hoàn thành"
        onConfirm={handleConfirmComplete}
        loading={completing}
      />
    </div>
  );
}
