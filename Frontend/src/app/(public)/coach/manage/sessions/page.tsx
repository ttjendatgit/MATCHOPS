"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  Ban,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Clock3,
  Dumbbell,
  Inbox,
  Loader2,
  Mail,
  MapPin,
  Phone,
  UserPlus,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { apiFetch, ApiError } from "@/lib/api";
import { getStoredToken } from "@/lib/auth";
import type { ApiResponse } from "@/types/api";
import type { CoachSessionResponse, CoachSessionStatus } from "@/types/coach";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

// ─── Status metadata ────────────────────────────────────────────────────────

const STATUS_META: Record<
  CoachSessionStatus,
  { label: string; icon: typeof Clock; badgeVariant: "warning" | "success" | "destructive" | "info" }
> = {
  AWAITING_PAYMENT: { label: "Chờ thanh toán", icon: Clock,        badgeVariant: "warning" },
  PAID:              { label: "Đã thanh toán",  icon: CheckCircle2, badgeVariant: "success" },
  CANCELLED:         { label: "Đã huỷ",         icon: Ban,          badgeVariant: "destructive" },
  COMPLETED:         { label: "Đã hoàn thành",  icon: CheckCircle2, badgeVariant: "info" },
};

function formatDate(dateStr: string | null): string | null {
  if (!dateStr) return null;
  try {
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function formatPrice(amount: number | null, currency: string): string {
  if (amount === null) return "Cần xác nhận giá thủ công";
  return `${amount.toLocaleString("vi-VN")} ${currency}`;
}

// ─── Session card ────────────────────────────────────────────────────────────

function CoachSessionCard({
  session,
  onComplete,
}: {
  session: CoachSessionResponse;
  onComplete: (session: CoachSessionResponse) => void;
}) {
  const meta = STATUS_META[session.status];
  const StatusIcon = meta.icon;
  const scheduledDate = formatDate(session.scheduledDate);

  return (
    <Card className="overflow-hidden border-white/10 bg-slate-900/50">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-[#86D232]/40 to-transparent" aria-hidden />
      <CardContent className="space-y-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-base font-bold text-white">{session.requesterName}</h3>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
              {session.requesterEmail && (
                <span className="flex items-center gap-1">
                  <Mail className="h-3 w-3" aria-hidden />
                  {session.requesterEmail}
                </span>
              )}
              {session.requesterPhoneNumber && (
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" aria-hidden />
                  {session.requesterPhoneNumber}
                </span>
              )}
            </div>
          </div>
          <Badge variant={meta.badgeVariant} className="shrink-0 gap-1.5 px-3 py-1 text-xs">
            <StatusIcon className="h-3.5 w-3.5" aria-hidden />
            {meta.label}
          </Badge>
        </div>

        {session.sportName && (
          <span className="inline-flex items-center gap-1 rounded-full border border-[#FF8000]/30 bg-[rgba(255,128,0,0.12)] px-2.5 py-0.5 text-xs font-medium text-[#FF8000]">
            <Dumbbell className="h-3 w-3" aria-hidden />
            {session.sportName}
          </span>
        )}

        <div className="grid gap-2 text-sm text-slate-400 sm:grid-cols-2">
          {scheduledDate && (
            <span className="flex items-center gap-1.5">
              <CalendarClock className="h-3.5 w-3.5 shrink-0 text-slate-600" aria-hidden />
              {scheduledDate}
            </span>
          )}
          {(session.scheduledTimeSlot || session.durationMinutes) && (
            <span className="flex items-center gap-1.5">
              <Clock3 className="h-3.5 w-3.5 shrink-0 text-slate-600" aria-hidden />
              {[session.scheduledTimeSlot, session.durationMinutes ? `${session.durationMinutes} phút` : null]
                .filter(Boolean)
                .join(" · ")}
            </span>
          )}
          {session.locationNote && (
            <span className="flex items-center gap-1.5 sm:col-span-2">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-600" aria-hidden />
              {session.locationNote}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-slate-950/40 p-3">
          <span className="flex items-center gap-1.5 text-sm font-semibold text-white">
            <Wallet className="h-3.5 w-3.5 shrink-0 text-[#86D232]" aria-hidden />
            {formatPrice(session.priceAmount, session.currency)}
          </span>
          {session.status === "PAID" && (
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

type PageMode = "loading" | "ready" | "no-profile" | "error";

export default function CoachManageSessionsPage() {
  const router = useRouter();

  const [mode, setMode] = useState<PageMode>("loading");
  const [pageError, setPageError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<CoachSessionResponse[]>([]);
  const [completeTarget, setCompleteTarget] = useState<CoachSessionResponse | null>(null);
  const [completing, setCompleting] = useState(false);

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

  if (mode === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF8000]" aria-label="Đang tải" />
      </div>
    );
  }

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

  const upcoming = sessions.filter((s) => s.status === "AWAITING_PAYMENT" || s.status === "PAID");
  const past = sessions.filter((s) => s.status === "CANCELLED" || s.status === "COMPLETED");

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <Link
        href="/coach/manage"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-400 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8000]/50 rounded"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
        Quay lại trang quản lý huấn luyện viên
      </Link>

      <div className="mb-8 max-w-2xl">
        <h1 className="text-2xl font-black text-white sm:text-3xl">Lịch buổi huấn luyện</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-400 sm:text-base">
          Các buổi huấn luyện đã được xác nhận từ yêu cầu, cùng trạng thái thanh toán.
        </p>
      </div>

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
      ) : (
        <div className="space-y-8">
          {upcoming.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Sắp tới</h2>
              {upcoming.map((session) => (
                <CoachSessionCard key={session.id} session={session} onComplete={setCompleteTarget} />
              ))}
            </section>
          )}
          {past.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Đã qua</h2>
              {past.map((session) => (
                <CoachSessionCard key={session.id} session={session} onComplete={setCompleteTarget} />
              ))}
            </section>
          )}
        </div>
      )}

      {/* ── Complete confirmation ── */}
      <Dialog open={completeTarget !== null} onOpenChange={(open) => !open && setCompleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Đánh dấu buổi huấn luyện hoàn thành?</DialogTitle>
            <DialogDescription>
              Xác nhận buổi huấn luyện với {completeTarget?.requesterName} đã diễn ra và hoàn
              thành.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setCompleteTarget(null)} disabled={completing}>
              Đóng
            </Button>
            <Button
              type="button"
              className="bg-[#86D232] text-[#0A0A0A] hover:bg-[#86D232]/90"
              onClick={handleConfirmComplete}
              disabled={completing}
            >
              {completing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                  Đang lưu...
                </>
              ) : (
                "Xác nhận hoàn thành"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
