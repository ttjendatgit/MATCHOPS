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
  CreditCard,
  Dumbbell,
  Inbox,
  Loader2,
  MapPin,
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
  if (amount === null) return "Cần huấn luyện viên xác nhận giá";
  return `${amount.toLocaleString("vi-VN")} ${currency}`;
}

// ─── Session card ────────────────────────────────────────────────────────────

function SessionCard({
  session,
  onPay,
}: {
  session: CoachSessionResponse;
  onPay: (session: CoachSessionResponse) => void;
}) {
  const meta = STATUS_META[session.status];
  const StatusIcon = meta.icon;
  const scheduledDate = formatDate(session.scheduledDate);
  const canPay =
    session.status === "AWAITING_PAYMENT" &&
    (session.paymentStatus === "UNPAID" || session.paymentStatus === "FAILED");

  return (
    <Card className="overflow-hidden border-white/10 bg-slate-900/50">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-[#FF8000]/40 to-transparent" aria-hidden />
      <CardContent className="space-y-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white">{session.coachDisplayName}</h3>
            {session.sportName && (
              <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-[#FF8000]">
                <Dumbbell className="h-3 w-3" aria-hidden />
                {session.sportName}
              </span>
            )}
          </div>
          <Badge variant={meta.badgeVariant} className="shrink-0 gap-1.5 px-3 py-1 text-xs">
            <StatusIcon className="h-3.5 w-3.5" aria-hidden />
            {meta.label}
          </Badge>
        </div>

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
          {canPay && (
            <Button
              type="button"
              size="sm"
              className="gap-1.5 bg-[#FF8000] text-white hover:bg-[#FF8000]/90"
              onClick={() => onPay(session)}
              disabled={session.requiresManualPricing}
            >
              <CreditCard className="h-3.5 w-3.5" aria-hidden />
              Thanh toán demo buổi huấn luyện
            </Button>
          )}
        </div>
        {canPay && session.requiresManualPricing && (
          <p className="text-xs text-slate-500">
            Huấn luyện viên cần xác nhận giá trước khi bạn có thể thanh toán.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CoachSessionsPage() {
  const router = useRouter();

  const [mode, setMode] = useState<"loading" | "ready" | "error">("loading");
  const [pageError, setPageError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<CoachSessionResponse[]>([]);
  const [payTarget, setPayTarget] = useState<CoachSessionResponse | null>(null);
  const [paying, setPaying] = useState(false);
  const [successSession, setSuccessSession] = useState<CoachSessionResponse | null>(null);

  const fetchSessions = useCallback(async () => {
    const token = getStoredToken();
    if (!token) return;
    setPageError(null);
    try {
      const res = await apiFetch<ApiResponse<CoachSessionResponse[]>>("/coaches/sessions/my", { token });
      if (res.success && res.data) {
        setSessions(res.data);
        setMode("ready");
      } else {
        setPageError(res.message || "Không thể tải danh sách buổi huấn luyện.");
        setMode("error");
      }
    } catch (err) {
      const message =
        err instanceof ApiError || err instanceof Error
          ? err.message
          : "Không thể tải danh sách buổi huấn luyện.";
      setPageError(message);
      setMode("error");
    }
  }, []);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      router.push("/login?redirect=/coach/sessions");
      return;
    }
    setMode("loading");
    fetchSessions();
  }, [router, fetchSessions]);

  async function handleConfirmPay() {
    if (!payTarget) return;
    const token = getStoredToken();
    setPaying(true);
    try {
      const res = await apiFetch<ApiResponse<CoachSessionResponse>>(
        `/coaches/sessions/${payTarget.id}/payment`,
        { method: "POST", token, body: JSON.stringify({}) }
      );
      if (res.success && res.data) {
        setPayTarget(null);
        setSuccessSession(res.data);
        await fetchSessions();
      } else {
        toast.error(res.message || "Thanh toán thất bại.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Thanh toán thất bại.";
      toast.error(message);
    } finally {
      setPaying(false);
    }
  }

  if (mode === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF8000]" aria-label="Đang tải" />
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
        href="/coach/requests"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-400 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8000]/50 rounded"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
        Quay lại yêu cầu của tôi
      </Link>

      <div className="mb-8 max-w-2xl">
        <h1 className="text-2xl font-black text-white sm:text-3xl">Buổi huấn luyện của tôi</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-400 sm:text-base">
          Theo dõi các buổi huấn luyện đã được huấn luyện viên chấp nhận, thanh toán và trạng
          thái.
        </p>
      </div>

      {sessions.length === 0 ? (
        <Card className="border-white/10 bg-slate-900/50">
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-800/60 ring-1 ring-white/[0.06]">
              <Inbox className="h-6 w-6 text-slate-500" aria-hidden />
            </span>
            <p className="max-w-md text-sm text-slate-400">
              Bạn chưa có buổi huấn luyện nào. Buổi huấn luyện sẽ xuất hiện tại đây sau khi huấn
              luyện viên chấp nhận yêu cầu của bạn.
            </p>
            <Button asChild className="mt-2 bg-[#FF8000] text-white hover:bg-[#FF8000]/90">
              <Link href="/coach/requests">Xem yêu cầu của tôi</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {upcoming.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Sắp tới</h2>
              {upcoming.map((session) => (
                <SessionCard key={session.id} session={session} onPay={setPayTarget} />
              ))}
            </section>
          )}
          {past.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Đã qua</h2>
              {past.map((session) => (
                <SessionCard key={session.id} session={session} onPay={setPayTarget} />
              ))}
            </section>
          )}
        </div>
      )}

      {/* ── Payment confirmation ── */}
      <Dialog open={payTarget !== null} onOpenChange={(open) => !open && setPayTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Thanh toán demo buổi huấn luyện</DialogTitle>
            <DialogDescription>
              Đây là thanh toán demo, chưa qua cổng thanh toán thật. Xác nhận thanh toán demo
              buổi huấn luyện với {payTarget?.coachDisplayName}.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-xl border border-white/[0.06] bg-slate-950/40 p-4 text-center">
            <p className="text-xs text-slate-500">Số tiền</p>
            <p className="mt-1 text-2xl font-black text-white">
              {payTarget ? formatPrice(payTarget.priceAmount, payTarget.currency) : ""}
            </p>
          </div>

          <div className="flex flex-col gap-2 pt-1">
            <Button
              type="button"
              onClick={handleConfirmPay}
              disabled={paying}
              className="w-full gap-2 bg-[#FF8000] text-white hover:bg-[#FF8000]/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {paying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Đang xử lý...
                </>
              ) : (
                "Xác nhận thanh toán demo"
              )}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setPayTarget(null)} disabled={paying}>
              Huỷ
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Payment success ── */}
      <Dialog open={successSession !== null} onOpenChange={(open) => !open && setSuccessSession(null)}>
        <DialogContent className="max-w-md text-center sm:text-center">
          <DialogHeader className="items-center text-center sm:text-center">
            <div className="mx-auto mb-1 flex h-14 w-14 items-center justify-center rounded-full border border-[#86D232]/30 bg-[#86D232]/10 shadow-[0_0_24px_rgba(134,210,50,0.25)]">
              <CheckCircle2 className="h-7 w-7 text-[#86D232]" aria-hidden />
            </div>
            <DialogTitle className="text-center text-xl">Thanh toán demo thành công</DialogTitle>
            <DialogDescription className="text-center">
              Đây là xác nhận thanh toán demo, chưa qua cổng thanh toán thật. Buổi huấn luyện với
              {" "}
              {successSession?.coachDisplayName} đã được đánh dấu đã thanh toán. Hẹn gặp bạn tại
              buổi tập!
            </DialogDescription>
          </DialogHeader>
          <Button type="button" className="w-full" onClick={() => setSuccessSession(null)}>
            Đóng
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
