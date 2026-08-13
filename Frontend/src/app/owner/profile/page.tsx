"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import {
  UserCircle,
  Mail,
  Phone,
  Shield,
  CreditCard,
  Camera,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Save,
  X,
  Key,
  Building2,
  TrendingUp,
  Star,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";
import { apiFetch, apiUpload } from "@/lib/api";
import { getStoredToken, getStoredUser, setAuthData } from "@/lib/auth";
import type { ApiResponse } from "@/types/api";
import type { User } from "@/types/auth";
import type { DashboardOwnerStatistics } from "@/types/dashboard";
import { formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ProfileData {
  id: string;
  avatarUrl: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  skillLevel: string;
  preferredPlayingArea: string;
}

interface UpdateProfilePayload {
  fullName: string;
  phoneNumber: string;
  email: string;
  preferredPlayingArea: string;
  skillLevel: number;
}

interface MembershipPlanSummary {
  name: string;
  tier: string;
  pricePerMonth: number;
}

interface MySubscription {
  status?: string | null;
  plan: MembershipPlanSummary;
  usage?: {
    usedVenues: number;
    maxVenues: number;
    usedCourts: number;
    maxCourts: number;
  } | null;
}

const SKILL_LEVEL_VALUE: Record<string, number> = {
  Beginner: 1,
  Intermediate: 2,
  Advanced: 3,
  Professional: 4,
};

const PASSWORD_HINT =
  "Ít nhất 8 ký tự, gồm chữ hoa, chữ thường và số.";

function validatePassword(password: string): string | null {
  if (password.length < 8) return "Mật khẩu mới phải có ít nhất 8 ký tự";
  if (!/[A-Z]/.test(password)) return "Mật khẩu mới phải có ít nhất 1 chữ hoa";
  if (!/[a-z]/.test(password)) return "Mật khẩu mới phải có ít nhất 1 chữ thường";
  if (!/[0-9]/.test(password)) return "Mật khẩu mới phải có ít nhất 1 chữ số";
  return null;
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default function OwnerProfilePage() {
  const [account, setAccount] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [stats, setStats] = useState<DashboardOwnerStatistics | null>(null);
  const [subscription, setSubscription] = useState<MySubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<UpdateProfilePayload | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSaving, setPasswordSaving] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);

  const loadProfile = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      toast.error("Vui lòng đăng nhập");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const stored = getStoredUser();
      setAccount(stored);

      const [profileRes, statsRes, subRes] = await Promise.all([
        apiFetch<ApiResponse<ProfileData>>("/profile", { token }),
        apiFetch<ApiResponse<DashboardOwnerStatistics>>("/dashboard/owner/statistics", { token }).catch(() => null),
        apiFetch<ApiResponse<MySubscription>>("/membership/my-subscription", { token }).catch(() => null),
      ]);

      if (profileRes.data) {
        setProfile(profileRes.data);
        setEditForm({
          fullName: profileRes.data.fullName,
          phoneNumber: profileRes.data.phoneNumber,
          email: profileRes.data.email,
          preferredPlayingArea: profileRes.data.preferredPlayingArea,
          skillLevel: SKILL_LEVEL_VALUE[profileRes.data.skillLevel] ?? 1,
        });
      }

      if (statsRes?.data) setStats(statsRes.data);
      if (subRes?.data) setSubscription(subRes.data);
    } catch (err) {
      console.error(err);
      toast.error("Không thể tải hồ sơ");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError(null);
    if (!editForm?.fullName.trim()) {
      setEditError("Vui lòng nhập họ tên");
      return;
    }

    const token = getStoredToken();
    if (!token) return;

    setSaving(true);
    try {
      const res = await apiFetch<ApiResponse<ProfileData>>("/profile", {
        method: "PUT",
        token,
        body: JSON.stringify(editForm),
      });

      if (res.data) {
        setProfile(res.data);
        const user = getStoredUser();
        if (user) {
          setAuthData(token, { ...user, fullName: res.data.fullName, phone: res.data.phoneNumber });
          setAccount({ ...user, fullName: res.data.fullName, phone: res.data.phoneNumber });
        }
        toast.success("Cập nhật hồ sơ thành công!");
        setIsEditing(false);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Đã xảy ra lỗi";
      setEditError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const token = getStoredToken();
    if (!token) return;

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("Avatar", file);

      const res = await apiUpload<ApiResponse<{ avatarUrl: string }>>("/profile/avatar", formData, { token });
      const avatarUrl = res.data?.avatarUrl;
      if (avatarUrl && profile) {
        setProfile({ ...profile, avatarUrl });
        const user = getStoredUser();
        if (user) {
          setAuthData(token, { ...user, avatar: avatarUrl });
          setAccount({ ...user, avatar: avatarUrl });
        }
        toast.success("Cập nhật ảnh đại diện thành công!");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể tải ảnh lên");
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (!passwordForm.currentPassword) {
      setPasswordError("Vui lòng nhập mật khẩu hiện tại");
      return;
    }

    const pwdErr = validatePassword(passwordForm.newPassword);
    if (pwdErr) {
      setPasswordError(pwdErr);
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("Mật khẩu mới không khớp");
      return;
    }

    const token = getStoredToken();
    if (!token) return;

    setPasswordSaving(true);
    try {
      await apiFetch("/profile/change-password", {
        method: "PUT",
        token,
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      toast.success("Đổi mật khẩu thành công!");
      setShowPasswordDialog(false);
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Đã xảy ra lỗi");
    } finally {
      setPasswordSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-[#FF8000]" />
        <p className="text-sm text-[#C4C7C9]/60">Đang tải hồ sơ...</p>
      </div>
    );
  }

  if (!profile || !editForm) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <AlertCircle className="h-12 w-12 text-red-400" />
        <p className="text-red-400">Không thể tải hồ sơ</p>
        <Button onClick={loadProfile} variant="outline" className="border-[rgba(134,210,50,0.2)] text-white">
          Thử lại
        </Button>
      </div>
    );
  }

  const venueCount = stats?.venuePerformance?.length ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hồ sơ chủ sân"
        description="Quản lý thông tin cá nhân, gói membership và tài khoản kinh doanh"
      />

      {/* Business snapshot */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-[#0A0A0A] border-[rgba(134,210,50,0.2)]">
            <CardContent className="p-4">
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-[#FF8000]/10">
                <TrendingUp className="h-4 w-4 text-[#FF8000]" />
              </div>
              <p className="text-xs uppercase tracking-wide text-[#C4C7C9]/60">Doanh thu tháng này</p>
              <p className="mt-1 text-xl font-bold text-white">{formatCurrency(stats.revenueThisMonth)}</p>
            </CardContent>
          </Card>
          <Card className="bg-[#0A0A0A] border-[rgba(134,210,50,0.2)]">
            <CardContent className="p-4">
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-[#86D232]/10">
                <Building2 className="h-4 w-4 text-[#86D232]" />
              </div>
              <p className="text-xs uppercase tracking-wide text-[#C4C7C9]/60">Cơ sở hoạt động</p>
              <p className="mt-1 text-xl font-bold text-white">{venueCount}</p>
            </CardContent>
          </Card>
          <Card className="bg-[#0A0A0A] border-[rgba(134,210,50,0.2)]">
            <CardContent className="p-4">
              <p className="text-xs uppercase tracking-wide text-[#C4C7C9]/60">Tổng đơn đặt</p>
              <p className="mt-1 text-xl font-bold text-white">{stats.totalBookings}</p>
            </CardContent>
          </Card>
          <Card className="bg-[#0A0A0A] border-[rgba(134,210,50,0.2)]">
            <CardContent className="p-4">
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10">
                <Star className="h-4 w-4 text-amber-400" />
              </div>
              <p className="text-xs uppercase tracking-wide text-[#C4C7C9]/60">Đánh giá TB</p>
              <p className="mt-1 text-xl font-bold text-white">
                {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : "—"}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-[#0A0A0A] border-[rgba(134,210,50,0.2)]">
            <CardHeader className="border-b border-[rgba(134,210,50,0.15)]">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-white">
                  <UserCircle className="h-5 w-5 text-[#FF8000]" />
                  Thông tin cá nhân
                </CardTitle>
                {!isEditing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="text-[#FF8000] hover:text-[#FF8000]/80 hover:bg-[#FF8000]/10"
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    Chỉnh sửa
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {isEditing ? (
                <form onSubmit={handleEditSubmit} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#C4C7C9]">
                        Họ tên <span className="text-red-400">*</span>
                      </label>
                      <Input
                        value={editForm.fullName}
                        onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                        className="bg-[#141414] border-[rgba(134,210,50,0.2)] text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#C4C7C9]">Số điện thoại</label>
                      <Input
                        value={editForm.phoneNumber}
                        onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                        placeholder="0912345678"
                        className="bg-[#141414] border-[rgba(134,210,50,0.2)] text-white"
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <label className="text-sm font-medium text-[#C4C7C9]">Email</label>
                      <Input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        className="bg-[#141414] border-[rgba(134,210,50,0.2)] text-white"
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <label className="text-sm font-medium text-[#C4C7C9]">Khu vực kinh doanh</label>
                      <Input
                        value={editForm.preferredPlayingArea}
                        onChange={(e) => setEditForm({ ...editForm, preferredPlayingArea: e.target.value })}
                        placeholder="VD: Quận 7, TP.HCM"
                        className="bg-[#141414] border-[rgba(134,210,50,0.2)] text-white"
                      />
                    </div>
                  </div>

                  {editError && (
                    <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-950/30 px-4 py-3 text-sm text-red-400">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      {editError}
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <Button type="submit" disabled={saving} className="bg-[#FF8000] hover:bg-[#FF8000]/90">
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Đang lưu...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Lưu
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        setEditError(null);
                        setEditForm({
                          fullName: profile.fullName,
                          phoneNumber: profile.phoneNumber,
                          email: profile.email,
                          preferredPlayingArea: profile.preferredPlayingArea,
                          skillLevel: SKILL_LEVEL_VALUE[profile.skillLevel] ?? 1,
                        });
                      }}
                      className="border-[rgba(134,210,50,0.2)] text-white"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Hủy
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-wider text-[#C4C7C9]/60">Họ tên</p>
                    <p className="font-medium text-white">{profile.fullName}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-wider text-[#C4C7C9]/60">Số điện thoại</p>
                    <p className="text-white">
                      {profile.phoneNumber || <span className="text-[#C4C7C9]/40">Chưa cập nhật</span>}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-wider text-[#C4C7C9]/60">Email</p>
                    <div className="flex items-center gap-2">
                      <p className="text-white">{profile.email}</p>
                      {account?.emailConfirmed && (
                        <CheckCircle2 className="h-4 w-4 text-green-400" title="Đã xác minh" />
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-wider text-[#C4C7C9]/60">Ngày tham gia</p>
                    <p className="text-white">{formatDate(account?.createdAt)}</p>
                  </div>
                  {profile.preferredPlayingArea && (
                    <div className="space-y-1 sm:col-span-2">
                      <p className="text-xs font-medium uppercase tracking-wider text-[#C4C7C9]/60">Khu vực kinh doanh</p>
                      <p className="flex items-center gap-1.5 text-white">
                        <MapPin className="h-3.5 w-3.5 text-[#FF8000]" />
                        {profile.preferredPlayingArea}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-[#0A0A0A] border-[rgba(134,210,50,0.2)]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-white">Liên kết nhanh</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm" className="border-[rgba(134,210,50,0.2)] text-white">
                <Link href="/owner/venues">Quản lý cụm sân</Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="border-[rgba(134,210,50,0.2)] text-white">
                <Link href="/owner/revenue">Doanh thu</Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="border-[rgba(134,210,50,0.2)] text-white">
                <Link href="/owner/pricing">Bảng giá</Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="border-[rgba(134,210,50,0.2)] text-white">
                <Link href="/owner/bookings">Lịch đặt</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-[#0A0A0A] border-[rgba(134,210,50,0.2)]">
            <CardContent className="p-6">
              <div className="flex flex-col items-center">
                <div className="relative mb-4">
                  <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-[#FF8000]/30 bg-[#FF8000]/10">
                    {profile.avatarUrl ? (
                      <img src={profile.avatarUrl} alt={profile.fullName} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-3xl font-bold text-[#FF8000]">
                        {profile.fullName.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    disabled={uploadingAvatar}
                    onClick={() => avatarInputRef.current?.click()}
                    className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#0A0A0A] bg-[#FF8000] hover:bg-[#FF8000]/90 transition-colors disabled:opacity-60"
                  >
                    {uploadingAvatar ? (
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                    ) : (
                      <Camera className="h-4 w-4 text-white" />
                    )}
                  </button>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </div>
                <h3 className="text-lg font-bold text-white">{profile.fullName}</h3>
                <p className="text-sm text-[#C4C7C9]/60">{profile.email}</p>
                <Badge variant="secondary" className="mt-2">
                  {account?.role ?? "OWNER"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {subscription && (
            <Card className="bg-[#0A0A0A] border-[rgba(134,210,50,0.2)]">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm text-white">
                  <CreditCard className="h-4 w-4 text-[#FF8000]" />
                  Gói Membership
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-semibold text-white">{subscription.plan.name}</p>
                  <p className="text-xs text-[#C4C7C9]/60">
                    {subscription.plan.tier} · {formatCurrency(subscription.plan.pricePerMonth)}/tháng
                  </p>
                </div>
                {subscription.usage && (
                  <div className="space-y-2 text-xs text-[#C4C7C9]">
                    <p>Cơ sở: {subscription.usage.usedVenues}/{subscription.usage.maxVenues || "∞"}</p>
                    <p>Sân: {subscription.usage.usedCourts}/{subscription.usage.maxCourts || "∞"}</p>
                  </div>
                )}
                <Button asChild variant="outline" size="sm" className="w-full border-[rgba(134,210,50,0.2)] text-white">
                  <Link href="/account/subscription">Quản lý gói</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          <Card className="bg-[#0A0A0A] border-[rgba(134,210,50,0.2)]">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm text-white">
                <Shield className="h-4 w-4 text-[#FF8000]" />
                Bảo mật
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start border-[rgba(134,210,50,0.2)] text-white hover:bg-[#141414]"
                onClick={() => setShowPasswordDialog(true)}
              >
                <Key className="h-4 w-4 mr-3 text-[#FF8000]" />
                Đổi mật khẩu
              </Button>
              <div className="space-y-2 border-t border-[rgba(134,210,50,0.1)] pt-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-[#C4C7C9]/60" />
                    <span className="text-sm text-[#C4C7C9]">Email</span>
                  </div>
                  {account?.emailConfirmed ? (
                    <CheckCircle2 className="h-4 w-4 text-green-400" />
                  ) : (
                    <Badge variant="warning" className="text-xs">Chưa xác minh</Badge>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-[#C4C7C9]/60" />
                    <span className="text-sm text-[#C4C7C9]">Số điện thoại</span>
                  </div>
                  {profile.phoneNumber ? (
                    <CheckCircle2 className="h-4 w-4 text-green-400" />
                  ) : (
                    <Badge variant="secondary" className="text-xs">Chưa</Badge>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#C4C7C9]">Trạng thái</span>
                  <Badge variant={account?.status === "ACTIVE" ? "success" : "warning"}>
                    {account?.status ?? "ACTIVE"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="bg-[#141414] border-[rgba(134,210,50,0.2)] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Đổi mật khẩu</DialogTitle>
            <DialogDescription className="text-[#C4C7C9]/60">
              {PASSWORD_HINT}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#C4C7C9]">Mật khẩu hiện tại</label>
              <Input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                className="bg-[#0A0A0A] border-[rgba(134,210,50,0.2)] text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#C4C7C9]">Mật khẩu mới</label>
              <Input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                className="bg-[#0A0A0A] border-[rgba(134,210,50,0.2)] text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#C4C7C9]">Xác nhận mật khẩu mới</label>
              <Input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                className="bg-[#0A0A0A] border-[rgba(134,210,50,0.2)] text-white"
              />
            </div>

            {passwordError && (
              <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-950/30 px-4 py-3 text-sm text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {passwordError}
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowPasswordDialog(false);
                  setPasswordError(null);
                  setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
                }}
                className="border-[rgba(134,210,50,0.2)] text-white"
              >
                Hủy
              </Button>
              <Button type="submit" disabled={passwordSaving} className="bg-[#FF8000] hover:bg-[#FF8000]/90">
                {passwordSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  "Đổi mật khẩu"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
