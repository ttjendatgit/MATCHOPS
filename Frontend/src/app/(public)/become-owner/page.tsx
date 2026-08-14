"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  Phone,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { BackLink } from "@/components/shared/BackLink";
import { OwnerApplicationStatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch, ApiError } from "@/lib/api";
import { getStoredToken, getStoredUser } from "@/lib/auth";
import type { ApiResponse } from "@/types/api";
import type { OwnerApplicationMe, OwnerApplyRequest } from "@/types/owner-application";

const EMPTY_FORM: OwnerApplyRequest = {
  businessName: "",
  contactPhone: "",
  address: "",
  city: "",
  district: "",
  description: "",
  businessLicenseNumber: "",
};

export default function BecomeOwnerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [application, setApplication] = useState<OwnerApplicationMe | null>(null);
  const [form, setForm] = useState<OwnerApplyRequest>(EMPTY_FORM);
  const [isEditing, setIsEditing] = useState(false);

  const loadApplication = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      router.replace("/login?redirect=/become-owner");
      return;
    }

    const user = getStoredUser();
    if (user?.role === "OWNER") {
      router.replace("/owner");
      return;
    }

    try {
      const res = await apiFetch<ApiResponse<OwnerApplicationMe>>("/owner-applications/me", { token });
      setApplication(res.data ?? null);
      if (res.data) {
        setForm({
          businessName: res.data.businessName,
          contactPhone: res.data.contactPhone,
          address: res.data.address,
          city: res.data.city,
          district: res.data.district,
          description: res.data.description ?? "",
          businessLicenseNumber: res.data.businessLicenseNumber ?? "",
        });
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setApplication(null);
      } else {
        toast.error(err instanceof ApiError ? err.message : "Không thể tải đơn đăng ký.");
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadApplication();
  }, [loadApplication]);

  const handleChange = (field: keyof OwnerApplyRequest, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getStoredToken();
    if (!token) return;

    setSubmitting(true);
    try {
      const payload: OwnerApplyRequest = {
        businessName: form.businessName.trim(),
        contactPhone: form.contactPhone.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        district: form.district.trim(),
        description: form.description?.trim() || undefined,
        businessLicenseNumber: form.businessLicenseNumber?.trim() || undefined,
      };

      if (application && (application.status === "REJECTED" || isEditing)) {
        const res = await apiFetch<ApiResponse<OwnerApplicationMe>>("/owner-applications/me", {
          method: "PUT",
          token,
          body: JSON.stringify(payload),
        });
        setApplication(res.data ?? null);
        setIsEditing(false);
        toast.success("Đơn đăng ký đã được cập nhật và gửi lại để duyệt.");
      } else {
        const res = await apiFetch<ApiResponse<OwnerApplicationMe>>("/owner-applications/apply", {
          method: "POST",
          token,
          body: JSON.stringify(payload),
        });
        setApplication(res.data ?? null);
        toast.success("Đơn đăng ký chủ sân đã được gửi thành công!");
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Gửi đơn thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF8000]" />
      </div>
    );
  }

  const showForm =
    !application ||
    application.status === "REJECTED" ||
    isEditing;

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 pb-24">
      <BackLink href="/" label="Về trang chủ" />

      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[rgba(255,128,0,0.12)]">
            <Building2 className="h-6 w-6 text-[#FF8000]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Đăng ký làm chủ sân</h1>
            <p className="text-sm text-[#C4C7C9]">
              Nộp hồ sơ để trở thành đối tác MATCHOP và quản lý cơ sở thể thao của bạn
            </p>
          </div>
        </div>
      </div>

      {application && !showForm && (
        <Card className="border-[rgba(255,128,0,0.2)] bg-[#0A0A0A]">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-lg text-white">Trạng thái đơn đăng ký</CardTitle>
              <OwnerApplicationStatusBadge status={application.status} />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {application.status === "PENDING_APPROVAL" && (
              <div className="flex items-start gap-3 rounded-lg border border-[rgba(255,128,0,0.2)] bg-[rgba(255,128,0,0.06)] p-4">
                <Clock className="mt-0.5 h-5 w-5 shrink-0 text-[#FF8000]" />
                <div>
                  <p className="font-medium text-white">Đơn đang chờ admin duyệt</p>
                  <p className="mt-1 text-sm text-[#C4C7C9]">
                    Chúng tôi sẽ xem xét hồ sơ trong vòng 1–3 ngày làm việc. Bạn sẽ nhận thông báo khi có kết quả.
                  </p>
                </div>
              </div>
            )}

            {application.status === "APPROVED" && (
              <div className="flex items-start gap-3 rounded-lg border border-[rgba(134,210,50,0.2)] bg-[rgba(134,210,50,0.06)] p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#86D232]" />
                <div>
                  <p className="font-medium text-white">Đơn đã được duyệt!</p>
                  <p className="mt-1 text-sm text-[#C4C7C9]">
                    Tài khoản của bạn đã được nâng lên Chủ sân. Vui lòng đăng xuất và đăng nhập lại để truy cập dashboard.
                  </p>
                  <Button asChild className="mt-3 bg-[#FF8000] hover:bg-[#FF8000]/90">
                    <Link href="/owner">Vào Dashboard Chủ sân</Link>
                  </Button>
                </div>
              </div>
            )}

            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <InfoRow icon={Building2} label="Tên cơ sở" value={application.businessName} />
              <InfoRow icon={Phone} label="SĐT liên hệ" value={application.contactPhone} />
              <InfoRow icon={MapPin} label="Địa chỉ" value={application.address} className="sm:col-span-2" />
              <InfoRow icon={MapPin} label="Khu vực" value={`${application.district}, ${application.city}`} />
            </div>

            {application.status === "PENDING_APPROVAL" && (
              <Button variant="outline" onClick={() => setIsEditing(true)} className="border-[rgba(255,128,0,0.3)] text-white">
                Chỉnh sửa hồ sơ
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {application?.status === "REJECTED" && !isEditing && (
        <div className="flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4">
          <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
          <div>
            <p className="font-medium text-white">Đơn bị từ chối</p>
            {application.rejectionReason && (
              <p className="mt-1 text-sm text-[#C4C7C9]">Lý do: {application.rejectionReason}</p>
            )}
            <Button onClick={() => setIsEditing(true)} className="mt-3 bg-[#FF8000] hover:bg-[#FF8000]/90">
              Cập nhật và gửi lại
            </Button>
          </div>
        </div>
      )}

      {showForm && (
        <Card className="border-[rgba(255,128,0,0.2)] bg-[#0A0A0A]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-white">
              <ShieldCheck className="h-5 w-5 text-[#86D232]" />
              {application ? "Cập nhật hồ sơ đăng ký" : "Thông tin hồ sơ"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <Field label="Tên cơ sở / doanh nghiệp *" id="businessName">
                <Input
                  id="businessName"
                  required
                  value={form.businessName}
                  onChange={(e) => handleChange("businessName", e.target.value)}
                  placeholder="VD: Sân Pickleball ABC"
                  className="bg-[#141414] border-[rgba(255,128,0,0.2)] text-white"
                />
              </Field>

              <Field label="Số điện thoại liên hệ *" id="contactPhone">
                <Input
                  id="contactPhone"
                  required
                  value={form.contactPhone}
                  onChange={(e) => handleChange("contactPhone", e.target.value)}
                  placeholder="VD: 0901234567"
                  className="bg-[#141414] border-[rgba(255,128,0,0.2)] text-white"
                />
              </Field>

              <Field label="Địa chỉ cơ sở *" id="address">
                <Input
                  id="address"
                  required
                  value={form.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  placeholder="Số nhà, đường..."
                  className="bg-[#141414] border-[rgba(255,128,0,0.2)] text-white"
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Tỉnh/Thành phố *" id="city">
                  <Input
                    id="city"
                    required
                    value={form.city}
                    onChange={(e) => handleChange("city", e.target.value)}
                    placeholder="VD: Hà Nội"
                    className="bg-[#141414] border-[rgba(255,128,0,0.2)] text-white"
                  />
                </Field>
                <Field label="Quận/Huyện *" id="district">
                  <Input
                    id="district"
                    required
                    value={form.district}
                    onChange={(e) => handleChange("district", e.target.value)}
                    placeholder="VD: Cầu Giấy"
                    className="bg-[#141414] border-[rgba(255,128,0,0.2)] text-white"
                  />
                </Field>
              </div>

              <Field label="Mã giấy phép kinh doanh (tuỳ chọn)" id="businessLicenseNumber">
                <Input
                  id="businessLicenseNumber"
                  value={form.businessLicenseNumber ?? ""}
                  onChange={(e) => handleChange("businessLicenseNumber", e.target.value)}
                  placeholder="Mã số ĐKKD hoặc giấy phép hoạt động"
                  className="bg-[#141414] border-[rgba(255,128,0,0.2)] text-white"
                />
              </Field>

              <Field label="Mô tả cơ sở (tuỳ chọn)" id="description">
                <Textarea
                  id="description"
                  rows={4}
                  value={form.description ?? ""}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Số sân, loại hình thể thao, quy mô..."
                  className="bg-[#141414] border-[rgba(255,128,0,0.2)] text-white resize-none"
                />
              </Field>

              <div className="flex gap-3 pt-2">
                {isEditing && application?.status === "PENDING_APPROVAL" && (
                  <Button type="button" variant="outline" onClick={() => setIsEditing(false)} className="border-[rgba(255,128,0,0.3)] text-white">
                    Huỷ
                  </Button>
                )}
                <Button type="submit" disabled={submitting} className="bg-[#FF8000] hover:bg-[#FF8000]/90">
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {application ? "Cập nhật và gửi lại" : "Gửi đơn đăng ký"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-[#C4C7C9]">{label}</Label>
      {children}
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  className = "",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={`flex items-start gap-2 ${className}`}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#FF8000]" />
      <div>
        <p className="text-xs text-[#C4C7C9]/60">{label}</p>
        <p className="text-white">{value}</p>
      </div>
    </div>
  );
}
