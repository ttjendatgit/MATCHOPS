"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  Ban,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Clock3,
  Dumbbell,
  Inbox,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  UserPlus,
  X,
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

// ─── Status metadata (shared shape with the requester page) ────────────────

const STATUS_META: Record<
  CoachSessionRequestStatus,
  { label: string; icon: typeof Clock; badgeVariant: "warning" | "success" | "destructive" | "muted" | "info" }
> = {
  PENDING:   { label: "Đang chờ xử lý",  icon: Clock,        badgeVariant: "warning" },
  ACCEPTED:  { label: "Đã chấp nhận",    icon: CheckCircle2, badgeVariant: "success" },
  DECLINED:  { label: "Đã từ chối",      icon: XCircle,      badgeVariant: "destructive" },
  CANCELLED: { label: "Đã bị huỷ",       icon: Ban,          badgeVariant: "muted" },
  COMPLETED: { label: "Đã hoàn thành",   icon: CheckCircle2, badgeVariant: "info" },
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

type RespondAction = "accept" | "decline";

// ─── Request card ────────────────────────────────────────────────────────────

function IncomingRequestCard({
  request,
  onRespond,
}: {
  request: CoachSessionRequestResponse;
  onRespond: (request: CoachSessionRequestResponse, action: RespondAction) => void;
}) {
  const meta = STATUS_META[request.status];
  const StatusIcon = meta.icon;
  const preferredDate = formatDate(request.preferredDate);

  return (
    <Card className="overflow-hidden border-white/10 bg-slate-900/50">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-[#FF8000]/40 to-transparent" aria-hidden />
      <CardContent className="space-y-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-base font-bold text-white">{request.requesterName}</h3>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
              {request.requesterEmail && (
                <span className="flex items-center gap-1">
                  <Mail className="h-3 w-3" aria-hidden />
                  {request.requesterEmail}
                </span>
              )}
              {request.requesterPhoneNumber && (
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" aria-hidden />
                  {request.requesterPhoneNumber}
                </span>
              )}
            </div>
          </div>
          <Badge variant={meta.badgeVariant} className="shrink-0 gap-1.5 px-3 py-1 text-xs">
            <StatusIcon className="h-3.5 w-3.5" aria-hidden />
            {meta.label}
          </Badge>
        </div>

        {request.sportName && (
          <span className="inline-flex items-center gap-1 rounded-full border border-[#FF8000]/30 bg-[rgba(255,128,0,0.12)] px-2.5 py-0.5 text-xs font-medium text-[#FF8000]">
            <Dumbbell className="h-3 w-3" aria-hidden />
            {request.sportName}
          </span>
        )}

        <div className="grid gap-2 text-sm text-slate-400 sm:grid-cols-2">
          {preferredDate && (
            <span className="flex items-center gap-1.5">
              <CalendarClock className="h-3.5 w-3.5 shrink-0 text-slate-600" aria-hidden />
              {preferredDate}
            </span>
          )}
          {(request.preferredTimeSlot || request.durationMinutes) && (
            <span className="flex items-center gap-1.5">
              <Clock3 className="h-3.5 w-3.5 shrink-0 text-slate-600" aria-hidden />
              {[request.preferredTimeSlot, request.durationMinutes ? `${request.durationMinutes} phút` : null]
                .filter(Boolean)
                .join(" · ")}
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
              Lời nhắn từ người yêu cầu
            </p>
            {request.message}
          </div>
        )}

        {request.coachResponseMessage && (
          <div className="rounded-xl border border-white/[0.06] bg-slate-950/40 p-3 text-sm leading-relaxed text-slate-300">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Phản hồi của bạn
            </p>
            {request.coachResponseMessage}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] pt-3">
          <p className="text-xs text-slate-600">Gửi lúc {formatDateTime(request.createdAt)}</p>
          {request.status === "PENDING" && (
            <div className="flex gap-2">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => onRespond(request, "decline")}
              >
                <X className="h-3.5 w-3.5" aria-hidden />
                Từ chối
              </Button>
              <Button
                type="button"
                size="sm"
                className="bg-[#86D232] text-[#0A0A0A] hover:bg-[#86D232]/90"
                onClick={() => onRespond(request, "accept")}
              >
                <Check className="h-3.5 w-3.5" aria-hidden />
                Chấp nhận
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type PageMode = "loading" | "ready" | "no-profile" | "error";

export default function CoachIncomingRequestsPage() {
  const router = useRouter();

  const [mode, setMode] = useState<PageMode>("loading");
  const [pageError, setPageError] = useState<string | null>(null);
  const [requests, setRequests] = useState<CoachSessionRequestResponse[]>([]);

  const [respondTarget, setRespondTarget] = useState<{
    request: CoachSessionRequestResponse;
    action: RespondAction;
  } | null>(null);
  const [responseMessage, setResponseMessage] = useState("");
  const [responding, setResponding] = useState(false);

  const fetchRequests = useCallback(async () => {
    const token = getStoredToken();
    if (!token) return;
    setPageError(null);
    try {
      const res = await apiFetch<ApiResponse<CoachSessionRequestResponse[]>>(
        "/coaches/me/session-requests",
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
      if (err instanceof ApiError && err.status === 404) {
        setMode("no-profile");
        return;
      }
      const message = err instanceof Error ? err.message : "Không thể tải danh sách yêu cầu.";
      setPageError(message);
      setMode("error");
    }
  }, []);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      router.push("/login?redirect=/coach/manage/requests");
      return;
    }
    setMode("loading");
    fetchRequests();
  }, [router, fetchRequests]);

  async function handleConfirmRespond() {
    if (!respondTarget) return;
    const token = getStoredToken();
    setResponding(true);
    try {
      const res = await apiFetch<ApiResponse<CoachSessionRequestResponse>>(
        `/coaches/me/session-requests/${respondTarget.request.id}/${respondTarget.action}`,
        {
          method: "PATCH",
          token,
          body: JSON.stringify({ responseMessage: responseMessage.trim() || undefined }),
        }
      );
      if (res.success) {
        toast.success(
          respondTarget.action === "accept"
            ? "Đã chấp nhận yêu cầu buổi huấn luyện."
            : "Đã từ chối yêu cầu buổi huấn luyện."
        );
        setRespondTarget(null);
        setResponseMessage("");
        await fetchRequests();
      } else {
        toast.error(res.message || "Không thể xử lý yêu cầu.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Không thể xử lý yêu cầu.";
      toast.error(message);
    } finally {
      setResponding(false);
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
          Đăng ký làm huấn luyện viên để bắt đầu nhận yêu cầu buổi huấn luyện từ người chơi.
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
            fetchRequests();
          }}
          className="mt-6 bg-[#FF8000] text-white hover:bg-[#FF8000]/90"
        >
          Thử lại
        </Button>
      </div>
    );
  }

  const pendingCount = requests.filter((r) => r.status === "PENDING").length;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <Link
        href="/coach/apply"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-400 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8000]/50 rounded"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
        Quay lại hồ sơ huấn luyện viên
      </Link>

      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-black text-white sm:text-3xl">Yêu cầu buổi huấn luyện</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-400 sm:text-base">
            Xem và phản hồi các yêu cầu buổi huấn luyện gửi tới hồ sơ của bạn.
          </p>
        </div>
        {pendingCount > 0 && (
          <Badge variant="warning" className="gap-1.5 px-3 py-1 text-sm">
            <Clock className="h-3.5 w-3.5" aria-hidden />
            {pendingCount} đang chờ xử lý
          </Badge>
        )}
      </div>

      {requests.length === 0 ? (
        <Card className="border-white/10 bg-slate-900/50">
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-800/60 ring-1 ring-white/[0.06]">
              <Inbox className="h-6 w-6 text-slate-500" aria-hidden />
            </span>
            <p className="max-w-md text-sm text-slate-400">
              Chưa có yêu cầu buổi huấn luyện nào. Yêu cầu mới từ người chơi sẽ xuất hiện tại đây.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <IncomingRequestCard key={request.id} request={request} onRespond={(r, a) => { setRespondTarget({ request: r, action: a }); setResponseMessage(""); }} />
          ))}
        </div>
      )}

      {/* ── Accept/decline response dialog ── */}
      <Dialog
        open={respondTarget !== null}
        onOpenChange={(open) => { if (!open) { setRespondTarget(null); setResponseMessage(""); } }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {respondTarget?.action === "accept" ? "Chấp nhận yêu cầu?" : "Từ chối yêu cầu?"}
            </DialogTitle>
            <DialogDescription>
              {respondTarget?.action === "accept"
                ? `Xác nhận chấp nhận yêu cầu buổi huấn luyện từ ${respondTarget?.request.requesterName}.`
                : `Xác nhận từ chối yêu cầu buổi huấn luyện từ ${respondTarget?.request.requesterName}.`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label htmlFor="coach-response-message" className="text-sm font-medium text-white">
              {respondTarget?.action === "accept"
                ? "Nhắn gì đó cho người yêu cầu (không bắt buộc)"
                : "Lý do từ chối (không bắt buộc)"}
            </label>
            <textarea
              id="coach-response-message"
              value={responseMessage}
              onChange={(e) => setResponseMessage(e.target.value)}
              placeholder={
                respondTarget?.action === "accept"
                  ? "VD: Hẹn gặp bạn tại sân lúc 19h thứ Bảy."
                  : "VD: Lịch của tôi đã kín trong khoảng thời gian này."
              }
              maxLength={1000}
              rows={3}
              className="flex w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white ring-offset-[#030303] placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8000] focus-visible:border-[rgba(255,128,0,0.5)] transition-colors resize-y"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setRespondTarget(null)} disabled={responding}>
              Đóng
            </Button>
            <Button
              type="button"
              variant={respondTarget?.action === "decline" ? "destructive" : "default"}
              className={respondTarget?.action === "accept" ? "bg-[#86D232] text-[#0A0A0A] hover:bg-[#86D232]/90" : undefined}
              onClick={handleConfirmRespond}
              disabled={responding}
            >
              {responding ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                  Đang xử lý...
                </>
              ) : respondTarget?.action === "accept" ? (
                "Chấp nhận"
              ) : (
                "Từ chối"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
