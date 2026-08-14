"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BackLink } from "@/components/shared/BackLink";
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
  MessageSquare,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { apiFetch, ApiError } from "@/lib/api";
import { getStoredToken } from "@/lib/auth";
import type { ApiResponse } from "@/types/api";
import type { CoachSessionRequestResponse, CoachSessionRequestStatus } from "@/types/coach";
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
  CoachSessionRequestStatus,
  { label: string; icon: typeof Clock; badgeVariant: "warning" | "success" | "destructive" | "muted" | "info" }
> = {
  PENDING:   { label: "Đang chờ phản hồi", icon: Clock,        badgeVariant: "warning" },
  ACCEPTED:  { label: "Đã chấp nhận",      icon: CheckCircle2, badgeVariant: "success" },
  DECLINED:  { label: "Đã từ chối",        icon: XCircle,      badgeVariant: "destructive" },
  CANCELLED: { label: "Đã huỷ",            icon: Ban,          badgeVariant: "muted" },
  COMPLETED: { label: "Đã hoàn thành",     icon: CheckCircle2, badgeVariant: "info" },
};

function formatDate(dateStr: string | null): string | null {
  if (!dateStr) return null;
  try {
    // "YYYY-MM-DD" from the backend DateOnly — parse as local, not UTC.
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

function formatDateTime(dateStr: string): string {
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

// ─── Request card ────────────────────────────────────────────────────────────

function SentRequestCard({
  request,
  onRequestCancel,
}: {
  request: CoachSessionRequestResponse;
  onRequestCancel: (request: CoachSessionRequestResponse) => void;
}) {
  const meta = STATUS_META[request.status];
  const StatusIcon = meta.icon;
  const preferredDate = formatDate(request.preferredDate);

  return (
    <Card className="overflow-hidden border-white/10 bg-slate-900/50">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-[#FF8000]/40 to-transparent" aria-hidden />
      <CardContent className="space-y-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white">{request.coachDisplayName}</h3>
            {request.sportName && (
              <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-[#FF8000]">
                <Dumbbell className="h-3 w-3" aria-hidden />
                {request.sportName}
              </span>
            )}
          </div>
          <Badge variant={meta.badgeVariant} className="shrink-0 gap-1.5 px-3 py-1 text-xs">
            <StatusIcon className="h-3.5 w-3.5" aria-hidden />
            {meta.label}
          </Badge>
        </div>

        <div className="grid gap-2 text-sm text-slate-400 sm:grid-cols-2">
          {preferredDate && (
            <span className="flex items-center gap-1.5">
              <CalendarClock className="h-3.5 w-3.5 shrink-0 text-slate-600" aria-hidden />
              {preferredDate}
            </span>
          )}
          {request.preferredTimeSlot && (
            <span className="flex items-center gap-1.5">
              <Clock3 className="h-3.5 w-3.5 shrink-0 text-slate-600" aria-hidden />
              {request.preferredTimeSlot}
              {request.durationMinutes ? ` · ${request.durationMinutes} phút` : ""}
            </span>
          )}
          {!request.preferredTimeSlot && request.durationMinutes && (
            <span className="flex items-center gap-1.5">
              <Clock3 className="h-3.5 w-3.5 shrink-0 text-slate-600" aria-hidden />
              {request.durationMinutes} phút
            </span>
          )}
          {request.locationNote && (
            <span className="flex items-center gap-1.5 sm:col-span-2">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-600" aria-hidden />
              {request.locationNote}
            </span>
          )}
        </div>

        {request.message && (
          <div className="rounded-xl border border-white/[0.06] bg-slate-950/40 p-3 text-sm leading-relaxed text-slate-300">
            <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <MessageSquare className="h-3 w-3" aria-hidden />
              Lời nhắn của bạn
            </p>
            {request.message}
          </div>
        )}

        {request.coachResponseMessage && (
          <div
            className={
              request.status === "DECLINED"
                ? "rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-sm leading-relaxed text-slate-300"
                : "rounded-xl border border-[#86D232]/20 bg-[#86D232]/5 p-3 text-sm leading-relaxed text-slate-300"
            }
          >
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Phản hồi từ huấn luyện viên
            </p>
            {request.coachResponseMessage}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] pt-3">
          <p className="text-xs text-slate-600">Gửi lúc {formatDateTime(request.createdAt)}</p>
          {request.status === "PENDING" && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => onRequestCancel(request)}
            >
              Huỷ yêu cầu
            </Button>
          )}
          {request.status === "ACCEPTED" && (
            <Button asChild size="sm" className="gap-1.5 bg-[#86D232] text-[#0A0A0A] hover:bg-[#86D232]/90">
              <Link href="/coach/sessions">
                <CreditCard className="h-3.5 w-3.5" aria-hidden />
                Xem buổi huấn luyện & thanh toán
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CoachSentRequestsPage() {
  const router = useRouter();

  const [mode, setMode] = useState<"loading" | "ready" | "error">("loading");
  const [pageError, setPageError] = useState<string | null>(null);
  const [requests, setRequests] = useState<CoachSessionRequestResponse[]>([]);
  const [cancelTarget, setCancelTarget] = useState<CoachSessionRequestResponse | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const fetchRequests = useCallback(async () => {
    const token = getStoredToken();
    if (!token) return;
    setPageError(null);
    try {
      const res = await apiFetch<ApiResponse<CoachSessionRequestResponse[]>>(
        "/coaches/session-requests/my-sent",
        { token }
      );
      if (res.success && res.data) {
        setRequests(res.data);
        setMode("ready");
      } else {
        setPageError(res.message || "Không thể tải danh sách yêu cầu.");
        setMode("error");
      }
    } catch (err) {
      const message =
        err instanceof ApiError || err instanceof Error
          ? err.message
          : "Không thể tải danh sách yêu cầu.";
      setPageError(message);
      setMode("error");
    }
  }, []);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      router.push("/login?redirect=/coach/requests");
      return;
    }
    setMode("loading");
    fetchRequests();
  }, [router, fetchRequests]);

  async function handleConfirmCancel() {
    if (!cancelTarget) return;
    const token = getStoredToken();
    setCancelling(true);
    try {
      const res = await apiFetch<ApiResponse<CoachSessionRequestResponse>>(
        `/coaches/session-requests/${cancelTarget.id}/cancel`,
        { method: "PATCH", token }
      );
      if (res.success) {
        toast.success("Đã huỷ yêu cầu buổi huấn luyện.");
        setCancelTarget(null);
        await fetchRequests();
      } else {
        toast.error(res.message || "Không thể huỷ yêu cầu.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Không thể huỷ yêu cầu.";
      toast.error(message);
    } finally {
      setCancelling(false);
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
            fetchRequests();
          }}
          className="mt-6 bg-[#FF8000] text-white hover:bg-[#FF8000]/90"
        >
          Thử lại
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <BackLink href="/coach" label="Quay lại danh sách huấn luyện viên" className="mb-6" />

      <div className="mb-8 max-w-2xl">
        <h1 className="text-2xl font-black text-white sm:text-3xl">Yêu cầu buổi huấn luyện của tôi</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-400 sm:text-base">
          Theo dõi trạng thái các yêu cầu bạn đã gửi tới huấn luyện viên.
        </p>
      </div>

      {requests.length === 0 ? (
        <Card className="border-white/10 bg-slate-900/50">
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-800/60 ring-1 ring-white/[0.06]">
              <Inbox className="h-6 w-6 text-slate-500" aria-hidden />
            </span>
            <p className="max-w-md text-sm text-slate-400">
              Bạn chưa gửi yêu cầu buổi huấn luyện nào. Khám phá danh sách huấn luyện viên để bắt
              đầu.
            </p>
            <Button asChild className="mt-2 bg-[#FF8000] text-white hover:bg-[#FF8000]/90">
              <Link href="/coach">Khám phá huấn luyện viên</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <SentRequestCard key={request.id} request={request} onRequestCancel={setCancelTarget} />
          ))}
        </div>
      )}

      {/* ── Cancel confirmation ── */}
      <Dialog open={cancelTarget !== null} onOpenChange={(open) => !open && setCancelTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Huỷ yêu cầu buổi huấn luyện?</DialogTitle>
            <DialogDescription>
              Bạn có chắc muốn huỷ yêu cầu gửi tới {cancelTarget?.coachDisplayName}? Hành động này
              không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setCancelTarget(null)}
              disabled={cancelling}
            >
              Giữ lại
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmCancel}
              disabled={cancelling}
            >
              {cancelling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                  Đang huỷ...
                </>
              ) : (
                "Huỷ yêu cầu"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
