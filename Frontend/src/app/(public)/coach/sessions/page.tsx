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
  isPaying,
  onPay,
}: {
  session: CoachSessionResponse;
  isPaying: boolean;
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
              disabled={session.requiresManualPricing || isPaying}
            >
              {isPaying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CreditCard className="h-3.5 w-3.5" />}
              {isPaying ? "Đang tải..." : "Thanh toán"}
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
  
  // State QR
  const [sepayData, setSepayData] = useState<any>(null);
  const [pollingSessionId, setPollingSessionId] = useState<string | null>(null);
  const [payingSessionId, setPayingSessionId] = useState<string | null>(null); // Để xoay loading đúng session
  
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

  useEffect(() => {
    if (!pollingSessionId || !sepayData) return;

    let intervalId: NodeJS.Timeout;
    let isCancelled = false;

    const checkStatus = async () => {
      try {
        const token = getStoredToken();
        if (!token) return;

        // Gọi API check trạng thái từng session cụ thể theo BE hướng dẫn
        const res = await apiFetch<ApiResponse<CoachSessionResponse>>(`/coaches/sessions/${pollingSessionId}`, { token });
        
        console.log("Polling coach session status:", res);

        if (res.success && res.data) {
          // Phòng trường hợp backend bọc thêm 1 lớp data bên trong
          const currentSession = (res.data as any).data || res.data;
          
          if (currentSession) {
            const pStatus = String(currentSession.paymentStatus).toUpperCase().trim();
            const sStatus = String(currentSession.status).toUpperCase().trim();

            const isPaid = pStatus === "PAID" || pStatus === "2";
            const isConfirmed = sStatus === "CONFIRMED" || sStatus === "2" || sStatus === "COMPLETED" || sStatus === "PAID";

            if (isPaid || isConfirmed) {
              if (isCancelled) return;
              clearInterval(intervalId);
              
              // Cập nhật lại UI:
              setSepayData(null);
              setPollingSessionId(null);
              setSuccessSession(currentSession);
              // Lấy lại toàn bộ danh sách để reload trang
              await fetchSessions();
            }
          }
        }
      } catch (err) {
        // ignore polling errors
      }
    };

    intervalId = setInterval(checkStatus, 3000);

    return () => {
      isCancelled = true;
      clearInterval(intervalId);
    };
  }, [pollingSessionId, sepayData]);

  async function handlePaySession(session: CoachSessionResponse) {
    const token = getStoredToken();
    if (!token) return;

    setPayingSessionId(session.id);
    try {
      const res = await apiFetch<ApiResponse<any>>(
        `/my/coach-sessions/${session.id}/pay/sepay`,
        { method: "POST", token }
      );

      let qrUrl = null;
      if (typeof res.data === "string") {
        qrUrl = res.data;
      } else if (res.data?.qrImageUrl) {
        qrUrl = res.data.qrImageUrl;
      } else if (res.data?.data?.qrImageUrl) {
        qrUrl = res.data.data.qrImageUrl;
      } else if (res.data?.paymentUrl) {
        qrUrl = res.data.paymentUrl;
      } else if (res.data?.qrCodeUrl) {
        qrUrl = res.data.qrCodeUrl;
      } else if (res.data?.url) {
        qrUrl = res.data.url;
      } else if (res.data?.data?.url) {
        qrUrl = res.data.data.url;
      }

      if (res.success && qrUrl) {
        setSepayData(res.data?.data || res.data);
        setPollingSessionId(session.id);
      } else {
        const debugData = JSON.stringify(res.data);
        throw new Error(res.message || `Lỗi: Không tìm thấy link ảnh QR. Data BE: ${debugData}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Thanh toán thất bại.";
      toast.error(message);
    } finally {
      setPayingSessionId(null);
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
                <SessionCard key={session.id} session={session} isPaying={payingSessionId === session.id} onPay={handlePaySession} />
              ))}
            </section>
          )}
          {past.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Đã qua</h2>
              {past.map((session) => (
                <SessionCard key={session.id} session={session} isPaying={payingSessionId === session.id} onPay={handlePaySession} />
              ))}
            </section>
          )}
        </div>
      )}

      {/* ── Payment confirmation (QR) ── */}
      <Dialog open={!!sepayData} onOpenChange={(open) => {
        if (!open) {
           setSepayData(null);
           setPollingSessionId(null);
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Thanh toán qua SePay</DialogTitle>
            <DialogDescription>
              Vui lòng sử dụng ứng dụng ngân hàng để quét mã QR bên dưới.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center space-y-4 py-4">
            {sepayData?.qrImageUrl && (
              <div className="rounded-xl overflow-hidden border border-white/10 bg-white p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={sepayData.qrImageUrl} alt="Mã QR thanh toán" className="w-64 h-64 object-contain" />
              </div>
            )}
            
            {/* Hiển thị thông tin chuyển khoản dạng text dự phòng */}
            {sepayData && (
              <div className="w-full bg-slate-900 rounded-lg p-3 text-sm space-y-1">
                <div className="flex justify-between"><span className="text-slate-400">Ngân hàng:</span> <span className="font-medium text-white">{sepayData.bankName || "Đang tải"}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Chủ TK:</span> <span className="font-medium text-white">{sepayData.accountName || "Đang tải"}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Số TK:</span> <span className="font-bold text-[#86D232]">{sepayData.accountNumber || "Đang tải"}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Số tiền:</span> <span className="font-bold text-[#FF8000]">{sepayData.amount ? sepayData.amount.toLocaleString("vi-VN") + " ₫" : "Đang tải"}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Nội dung:</span> <span className="font-mono text-white">{sepayData.paymentContent || "Đang tải"}</span></div>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm text-[#FF8000]">
              <Loader2 className="h-4 w-4 animate-spin" />
              Đang chờ xác nhận thanh toán...
            </div>
            <p className="text-center text-xs text-slate-500 mt-2">
              Popup sẽ tự động chuyển sang trang thành công khi giao dịch hoàn tất.
            </p>
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
            <DialogTitle className="text-center text-xl">Thanh toán thành công</DialogTitle>
            <DialogDescription className="text-center">
              Buổi huấn luyện với {successSession?.coachDisplayName} đã được thanh toán thành công!
              Hẹn gặp bạn tại buổi tập.
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
