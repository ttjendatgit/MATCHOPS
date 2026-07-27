"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft, Mail, Phone, CalendarClock, MapPin, Wallet, Dumbbell,
  Award, Image as ImageIcon, ShieldCheck, AlertTriangle, Loader2,
  ChevronRight as ChevronRightIcon, ExternalLink, UserRound, RefreshCcw,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CoachStatusBadge } from "@/components/shared/StatusBadge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { apiFetch, ApiError } from "@/lib/api";
import { getStoredToken } from "@/lib/auth";
import type { ApiResponse } from "@/types/api";
import type {
  AdminCoachDetail, CoachProofType, RejectCoachProfileRequest, SuspendCoachProfileRequest,
} from "@/types/coach";

const PROOF_TYPE_LABELS: Record<CoachProofType, string> = {
  CERTIFICATION: "Chứng chỉ",
  ACHIEVEMENT: "Thành tích",
  TRAINING_CREDENTIAL: "Kinh nghiệm huấn luyện",
  OTHER: "Khác",
};

function proofTypeLabel(proofType: string): string {
  return PROOF_TYPE_LABELS[proofType as CoachProofType] ?? proofType;
}

function formatCurrency(value: number | null): string {
  if (value === null) return "Chưa cập nhật";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value);
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("vi-VN", { dateStyle: "medium", timeStyle: "short" });
}

function initials(name: string): string {
  return name.trim().slice(0, 2).toUpperCase() || "HL";
}

type ActionKind = "approve" | "reject" | "suspend" | "reactivate" | null;

export default function AdminCoachDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [profile, setProfile] = useState<AdminCoachDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeAction, setActiveAction] = useState<ActionKind>(null);
  const [submitting, setSubmitting] = useState(false);
  const [reasonText, setReasonText] = useState("");

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const fetchDetail = useCallback(async () => {
    const token = getStoredToken();
    if (!token || !id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<ApiResponse<AdminCoachDetail>>(`/admin/coaches/${id}`, { token });
      if (res.success && res.data) {
        setProfile(res.data);
      } else {
        setError(res.message || "Không thể tải hồ sơ huấn luyện viên.");
      }
    } catch (err) {
      const message =
        err instanceof ApiError && err.status === 404
          ? "Không tìm thấy hồ sơ huấn luyện viên này."
          : "Không thể tải hồ sơ huấn luyện viên. Vui lòng thử lại.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const closeActionDialog = () => {
    if (submitting) return;
    setActiveAction(null);
    setReasonText("");
  };

  const runAction = async (kind: Exclude<ActionKind, null>) => {
    if (!id) return;
    const token = getStoredToken();
    setSubmitting(true);
    try {
      let res: ApiResponse<AdminCoachDetail>;
      if (kind === "approve") {
        res = await apiFetch<ApiResponse<AdminCoachDetail>>(`/admin/coaches/${id}/approve`, { method: "PATCH", token });
      } else if (kind === "reactivate") {
        res = await apiFetch<ApiResponse<AdminCoachDetail>>(`/admin/coaches/${id}/reactivate`, { method: "PATCH", token });
      } else if (kind === "reject") {
        const body: RejectCoachProfileRequest = { rejectionReason: reasonText.trim() };
        res = await apiFetch<ApiResponse<AdminCoachDetail>>(`/admin/coaches/${id}/reject`, {
          method: "PATCH", token, body: JSON.stringify(body),
        });
      } else {
        const body: SuspendCoachProfileRequest = { reason: reasonText.trim() };
        res = await apiFetch<ApiResponse<AdminCoachDetail>>(`/admin/coaches/${id}/suspend`, {
          method: "PATCH", token, body: JSON.stringify(body),
        });
      }

      if (res.success && res.data) {
        setProfile(res.data);
        toast.success(res.message || "Cập nhật trạng thái thành công.");
        setActiveAction(null);
        setReasonText("");
      } else {
        toast.error(res.message || "Thao tác thất bại.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Đã xảy ra lỗi. Vui lòng thử lại.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF8000]" aria-label="Đang tải hồ sơ" />
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (error || !profile) {
    return (
      <div className="space-y-4">
        <Link href="/admin/coaches" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900">
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Quay lại danh sách
        </Link>
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <AlertTriangle className="h-8 w-8 text-[#FF4B4B]" aria-hidden />
            <p className="text-sm text-[#C4C7C9]">{error || "Không tìm thấy hồ sơ huấn luyện viên."}</p>
            <Button type="button" onClick={fetchDetail} className="mt-1">Thử lại</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const name = profile.displayName || profile.userFullName;
  const proofs = profile.proofs ?? [];
  const activeProof = lightboxIndex !== null ? proofs[lightboxIndex] : null;

  return (
    <div className="space-y-6">
      <Link href="/admin/coaches" className="inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-900">
        <ChevronLeft className="h-4 w-4" aria-hidden />
        Quay lại danh sách huấn luyện viên
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold text-slate-900 font-heading">{name}</h1>
        <CoachStatusBadge status={profile.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* ── Main review content (reviewed top-to-bottom before deciding) ── */}
        <div className="min-w-0 space-y-6">
          {/* Applicant identity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <UserRound className="h-4 w-4 text-[#FF8000]" aria-hidden />
                Thông tin người ứng tuyển
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <InfoField label="Họ và tên tài khoản" value={profile.userFullName} />
              <InfoField label="Tên hiển thị" value={profile.displayName || "Chưa đặt tên hiển thị"} />
              <InfoField label="Email" value={profile.userEmail} icon={Mail} />
              <InfoField label="Số điện thoại" value={profile.userPhoneNumber || "Chưa cập nhật"} icon={Phone} />
              <InfoField label="Ngày gửi hồ sơ" value={formatDateTime(profile.createdAt)} icon={CalendarClock} />
              <InfoField label="Cập nhật gần nhất" value={formatDateTime(profile.updatedAt)} icon={CalendarClock} />
            </CardContent>
          </Card>

          {/* Coach profile */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Dumbbell className="h-4 w-4 text-[#FF8000]" aria-hidden />
                Hồ sơ huấn luyện viên
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <InfoField label="Khu vực hoạt động" value={`${profile.district}, ${profile.city}`} icon={MapPin} />
                <InfoField label="Số năm kinh nghiệm" value={profile.experienceYears !== null ? `${profile.experienceYears} năm` : "Chưa cập nhật"} />
                <InfoField label="Giá theo giờ" value={formatCurrency(profile.hourlyRate)} icon={Wallet} />
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#C4C7C9]/70">Giới thiệu</p>
                <p className="whitespace-pre-line text-sm leading-relaxed text-[#C4C7C9]">
                  {profile.bio?.trim() || "Chưa có giới thiệu."}
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#C4C7C9]/70">Môn thể thao giảng dạy</p>
                {profile.sports.length === 0 ? (
                  <p className="text-sm text-[#C4C7C9]/60">Chưa chọn môn thể thao.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {profile.sports.map((s) => (
                      <span key={s.sportId} className="flex items-center gap-1.5 rounded-full border border-white/[0.1] bg-white/5 px-3 py-1 text-xs text-[#C4C7C9]">
                        <Dumbbell className="h-3 w-3 text-[#86D232]" aria-hidden />
                        {s.sportName}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Achievements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Award className="h-4 w-4 text-[#FF8000]" aria-hidden />
                Thành tích & chứng chỉ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-line text-sm leading-relaxed text-[#C4C7C9]">
                {profile.achievements?.trim() || "Chưa có thông tin thành tích/chứng chỉ."}
              </p>
            </CardContent>
          </Card>

          {/* Proof gallery */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ImageIcon className="h-4 w-4 text-[#FF8000]" aria-hidden />
                Ảnh minh chứng
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="flex items-start gap-1.5 rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 text-xs leading-relaxed text-[#C4C7C9]/80">
                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#86D232]" aria-hidden />
                Ảnh minh chứng chỉ dùng cho quá trình xét duyệt hồ sơ huấn luyện viên.
              </p>

              {proofs.length === 0 ? (
                <p className="text-sm text-[#C4C7C9]/60">Chưa có ảnh minh chứng nào được tải lên.</p>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {proofs.map((proof, index) => {
                    const label = proofTypeLabel(proof.proofType);
                    return (
                      <button
                        key={proof.id}
                        type="button"
                        onClick={() => setLightboxIndex(index)}
                        aria-label={`Xem ảnh minh chứng loại ${label}, tải lên ngày ${new Date(proof.createdAt).toLocaleDateString("vi-VN")}`}
                        className="group relative overflow-hidden rounded-xl border border-white/10 bg-slate-950 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8000]"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={proof.imageUrl}
                          alt={`Ảnh minh chứng loại ${label}`}
                          className="h-28 w-full object-cover transition-transform duration-200 group-hover:scale-105"
                        />
                        <span className="absolute bottom-1.5 left-1.5 rounded-full bg-slate-950/85 px-2 py-0.5 text-[10px] font-medium text-slate-300 backdrop-blur-sm">
                          {label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Decision panel (sticky on desktop; follows the reviewed content on mobile) ── */}
        <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <Card>
            <div className="h-px w-full bg-gradient-to-r from-transparent via-[#FF8000]/40 to-transparent" aria-hidden />
            <CardContent className="space-y-4 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-base font-bold text-white">{name}</p>
                  <p className="truncate text-xs text-[#C4C7C9]/70">{profile.userEmail}</p>
                </div>
                <CoachStatusBadge status={profile.status} />
              </div>

              {profile.status === "REJECTED" && profile.rejectionReason && (
                <ReasonBox title="Lý do từ chối" text={profile.rejectionReason} />
              )}
              {profile.status === "SUSPENDED" && profile.rejectionReason && (
                <ReasonBox title="Lý do tạm khóa" text={profile.rejectionReason} />
              )}

              {profile.status === "ACTIVE" && (
                <Link
                  href={`/coach/${profile.id}`}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 rounded text-xs font-medium text-[#86D232] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#86D232]/50"
                >
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                  Xem trang công khai
                </Link>
              )}

              <div className="space-y-2 border-t border-white/[0.06] pt-4">
                {profile.status === "PENDING_APPROVAL" && (
                  <>
                    <Button type="button" className="w-full" onClick={() => setActiveAction("approve")}>
                      Duyệt hồ sơ
                    </Button>
                    <Button type="button" variant="destructive" className="w-full" onClick={() => setActiveAction("reject")}>
                      Từ chối
                    </Button>
                  </>
                )}

                {profile.status === "REJECTED" && (
                  <>
                    <Button type="button" className="w-full" onClick={() => setActiveAction("approve")}>
                      Duyệt hồ sơ
                    </Button>
                    <Button type="button" variant="outline" className="w-full" onClick={() => setActiveAction("reject")}>
                      Từ chối lại với lý do khác
                    </Button>
                  </>
                )}

                {profile.status === "ACTIVE" && (
                  <Button type="button" variant="destructive" className="w-full" onClick={() => setActiveAction("suspend")}>
                    Tạm khóa hồ sơ
                  </Button>
                )}

                {profile.status === "SUSPENDED" && (
                  <Button type="button" className="w-full gap-1.5" onClick={() => setActiveAction("reactivate")}>
                    <RefreshCcw className="h-3.5 w-3.5" aria-hidden />
                    Kích hoạt lại
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Approve confirm */}
      <ConfirmDialog
        open={activeAction === "approve"}
        onOpenChange={(open) => !open && closeActionDialog()}
        title="Duyệt hồ sơ huấn luyện viên?"
        description={`Hồ sơ của "${name}" sẽ hiển thị công khai trên trang Huấn luyện viên.`}
        confirmLabel="Duyệt hồ sơ"
        onConfirm={() => runAction("approve")}
        loading={submitting}
      />

      {/* Reactivate confirm */}
      <ConfirmDialog
        open={activeAction === "reactivate"}
        onOpenChange={(open) => !open && closeActionDialog()}
        title="Kích hoạt lại hồ sơ?"
        description={`Hồ sơ của "${name}" sẽ hoạt động trở lại và hiển thị công khai.`}
        confirmLabel="Kích hoạt lại"
        onConfirm={() => runAction("reactivate")}
        loading={submitting}
      />

      {/* Reject / Suspend — require reason */}
      <Dialog open={activeAction === "reject" || activeAction === "suspend"} onOpenChange={(open) => !open && closeActionDialog()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{activeAction === "reject" ? "Từ chối hồ sơ" : "Tạm khóa hồ sơ"}</DialogTitle>
            <DialogDescription>
              {activeAction === "reject"
                ? `Cho "${name}" biết lý do hồ sơ bị từ chối. Nội dung này sẽ hiển thị trong hồ sơ của họ.`
                : `Cho "${name}" biết lý do hồ sơ bị tạm khóa. Nội dung này sẽ hiển thị trong hồ sơ của họ.`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="action-reason" className="text-white">
              Lý do <span className="text-red-400">*</span>
            </Label>
            <textarea
              id="action-reason"
              value={reasonText}
              onChange={(e) => setReasonText(e.target.value)}
              rows={4}
              maxLength={1000}
              placeholder={activeAction === "reject" ? "VD: Thông tin kinh nghiệm chưa rõ ràng, cần bổ sung minh chứng..." : "VD: Vi phạm quy định cộng đồng MatchOps..."}
              className="flex w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8000] transition-colors resize-y"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeActionDialog} disabled={submitting}>
              Huỷ
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={submitting || reasonText.trim().length === 0}
              onClick={() => activeAction && runAction(activeAction)}
            >
              {submitting ? "Đang xử lý..." : activeAction === "reject" ? "Xác nhận từ chối" : "Xác nhận tạm khóa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Proof lightbox */}
      <Dialog open={lightboxIndex !== null} onOpenChange={(open) => !open && setLightboxIndex(null)}>
        <DialogContent className="max-w-2xl">
          {activeProof && (
            <>
              <DialogHeader>
                <DialogTitle>{proofTypeLabel(activeProof.proofType)}</DialogTitle>
                <DialogDescription>
                  Tải lên ngày {new Date(activeProof.createdAt).toLocaleDateString("vi-VN")}
                </DialogDescription>
              </DialogHeader>
              <div className="relative overflow-hidden rounded-xl border border-white/10 bg-slate-950">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activeProof.imageUrl}
                  alt={`Ảnh minh chứng loại ${proofTypeLabel(activeProof.proofType)}, phóng to`}
                  className="max-h-[70vh] w-full object-contain"
                />
              </div>
              {proofs.length > 1 && (
                <div className="flex items-center justify-between">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={lightboxIndex === 0}
                    onClick={() => setLightboxIndex((i) => (i !== null ? Math.max(0, i - 1) : i))}
                    className="gap-1"
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden />
                    Trước
                  </Button>
                  <span className="text-xs text-[#C4C7C9]/60">
                    {(lightboxIndex ?? 0) + 1}/{proofs.length}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={lightboxIndex === proofs.length - 1}
                    onClick={() => setLightboxIndex((i) => (i !== null ? Math.min(proofs.length - 1, i + 1) : i))}
                    className="gap-1"
                  >
                    Sau
                    <ChevronRightIcon className="h-4 w-4" aria-hidden />
                  </Button>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InfoField({
  label, value, icon: Icon,
}: {
  label: string;
  value: string;
  icon?: typeof Mail;
}) {
  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#C4C7C9]/70">{label}</p>
      <p className="flex items-center gap-1.5 text-sm text-white">
        {Icon && <Icon className="h-3.5 w-3.5 shrink-0 text-[#C4C7C9]/50" aria-hidden />}
        <span className="truncate">{value}</span>
      </p>
    </div>
  );
}

function ReasonBox({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3">
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-red-400">
        <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
        {title}
      </p>
      <p className="mt-1 text-sm text-slate-300">{text}</p>
    </div>
  );
}
