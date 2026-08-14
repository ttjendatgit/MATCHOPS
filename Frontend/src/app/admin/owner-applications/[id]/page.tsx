"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  Loader2,
  Mail,
  MapPin,
  Phone,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { BackLink } from "@/components/shared/BackLink";
import { OwnerApplicationStatusBadge } from "@/components/shared/StatusBadge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiFetch, ApiError } from "@/lib/api";
import { getStoredToken } from "@/lib/auth";
import type { ApiResponse } from "@/types/api";
import type { AdminOwnerApplicationDetail } from "@/types/owner-application";

export default function AdminOwnerApplicationDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [application, setApplication] = useState<AdminOwnerApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [approveOpen, setApproveOpen] = useState(false);

  const loadApplication = useCallback(async () => {
    const token = getStoredToken();
    if (!token) return;

    setLoading(true);
    try {
      const res = await apiFetch<ApiResponse<AdminOwnerApplicationDetail>>(
        `/admin/owner-applications/${id}`,
        { token }
      );
      setApplication(res.data ?? null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Không thể tải đơn đăng ký.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadApplication();
  }, [loadApplication]);

  const handleApprove = async () => {
    const token = getStoredToken();
    if (!token) return;

    setSubmitting(true);
    try {
      const res = await apiFetch<ApiResponse<AdminOwnerApplicationDetail>>(
        `/admin/owner-applications/${id}/approve`,
        { method: "PATCH", token }
      );
      setApplication(res.data ?? null);
      setApproveOpen(false);
      toast.success("Đã duyệt đơn và nâng người dùng lên Chủ sân.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Duyệt đơn thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    const token = getStoredToken();
    if (!token || !rejectReason.trim()) return;

    setSubmitting(true);
    try {
      const res = await apiFetch<ApiResponse<AdminOwnerApplicationDetail>>(
        `/admin/owner-applications/${id}/reject`,
        {
          method: "PATCH",
          token,
          body: JSON.stringify({ rejectionReason: rejectReason.trim() }),
        }
      );
      setApplication(res.data ?? null);
      setRejectOpen(false);
      setRejectReason("");
      toast.success("Đã từ chối đơn đăng ký.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Từ chối đơn thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#86D232]" />
      </div>
    );
  }

  if (!application) {
    return (
      <div className="space-y-4">
        <BackLink href="/admin/owner-applications" label="Quay lại danh sách" />
        <p className="text-[#C4C7C9]">Không tìm thấy đơn đăng ký.</p>
      </div>
    );
  }

  const canReview = application.status === "PENDING_APPROVAL";

  return (
    <div className="space-y-6">
      <BackLink href="/admin/owner-applications" label="Quay lại danh sách" />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{application.businessName}</h1>
          <p className="text-sm text-[#C4C7C9]">Đơn đăng ký chủ sân</p>
        </div>
        <OwnerApplicationStatusBadge status={application.status} />
      </div>

      {canReview && (
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => setApproveOpen(true)} className="bg-[#86D232] text-black hover:bg-[#86D232]/90">
            Duyệt & nâng lên Chủ sân
          </Button>
          <Button variant="destructive" onClick={() => setRejectOpen(true)}>
            Từ chối
          </Button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-[rgba(134,210,50,0.2)] bg-[#0A0A0A]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <UserRound className="h-5 w-5 text-[#86D232]" />
              Người đăng ký
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row icon={UserRound} label="Họ tên" value={application.userFullName} />
            <Row icon={Mail} label="Email" value={application.userEmail} />
            {application.userPhone && <Row icon={Phone} label="SĐT tài khoản" value={application.userPhone} />}
            <p className="text-xs text-[#C4C7C9]/60">
              Vai trò hiện tại: <span className="text-white">{application.userRole}</span>
            </p>
            <Button asChild variant="outline" size="sm" className="border-[rgba(134,210,50,0.2)] text-white">
              <Link href="/admin/users">Quản lý người dùng</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-[rgba(255,128,0,0.2)] bg-[#0A0A0A]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Building2 className="h-5 w-5 text-[#FF8000]" />
              Thông tin cơ sở
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row icon={Phone} label="SĐT liên hệ" value={application.contactPhone} />
            <Row icon={MapPin} label="Địa chỉ" value={application.address} />
            <Row icon={MapPin} label="Khu vực" value={`${application.district}, ${application.city}`} />
            {application.businessLicenseNumber && (
              <Row icon={Building2} label="Giấy phép KD" value={application.businessLicenseNumber} />
            )}
            {application.description && (
              <div>
                <p className="text-xs text-[#C4C7C9]/60 mb-1">Mô tả</p>
                <p className="text-white whitespace-pre-wrap">{application.description}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {application.rejectionReason && (
        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-red-400">Lý do từ chối</p>
            <p className="mt-1 text-sm text-[#C4C7C9]">{application.rejectionReason}</p>
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={approveOpen}
        onOpenChange={setApproveOpen}
        title="Duyệt đơn đăng ký chủ sân"
        description={`Xác nhận duyệt đơn của ${application.userFullName}? Tài khoản sẽ được nâng lên vai trò OWNER.`}
        onConfirm={handleApprove}
        confirmLabel="Duyệt"
      />

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="bg-[#0A0A0A] border-[rgba(134,210,50,0.2)] text-white">
          <DialogHeader>
            <DialogTitle>Từ chối đơn đăng ký</DialogTitle>
            <DialogDescription className="text-[#C4C7C9]">
              Nhập lý do từ chối để người dùng biết và có thể cập nhật hồ sơ.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="rejectReason" className="text-[#C4C7C9]">Lý do từ chối *</Label>
            <Textarea
              id="rejectReason"
              rows={4}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="bg-[#141414] border-[rgba(134,210,50,0.2)] text-white resize-none"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)} className="border-[rgba(134,210,50,0.2)]">
              Huỷ
            </Button>
            <Button variant="destructive" disabled={submitting || !rejectReason.trim()} onClick={handleReject}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Từ chối
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#C4C7C9]/50" />
      <div>
        <p className="text-xs text-[#C4C7C9]/60">{label}</p>
        <p className="text-white">{value}</p>
      </div>
    </div>
  );
}
