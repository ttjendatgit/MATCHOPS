"use client";

import { useEffect, useState, useCallback } from "react";
import {
  UserCircle, Mail, Phone, Shield, CreditCard, Camera,
  Loader2, CheckCircle2, AlertCircle, Edit2, Save, X, Key
} from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { getStoredToken, getStoredUser, setAuthData } from "@/lib/auth";
import type { ApiResponse } from "@/types/api";
import { formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

// ── Types ──────────────────────────────────────────────────────────────────────

interface OwnerProfileDto {
  id: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  avatarUrl?: string;
  role: string;
  status: string;
  emailConfirmed: boolean;
  createdAt: string;
  sanHandle?: string;
  bio?: string;
}

interface UpdateProfileDto {
  fullName?: string;
  phoneNumber?: string;
  bio?: string;
}

interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function OwnerProfilePage() {
  const [profile, setProfile] = useState<OwnerProfileDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<UpdateProfileDto>({});
  const [editError, setEditError] = useState<string | null>(null);

  // Password change
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordForm, setPasswordForm] = useState<ChangePasswordDto>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSaving, setPasswordSaving] = useState(false);

  // Load profile
  const loadProfile = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      toast.error("Vui lòng đăng nhập");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch<ApiResponse<OwnerProfileDto>>("/profile", { token });
      if (res.data?.data) {
        setProfile(res.data.data);
        setEditForm({
          fullName: res.data.data.fullName,
          phoneNumber: res.data.data.phoneNumber,
          bio: res.data.data.bio,
        });
      }
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

  // Handle edit submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError(null);

    if (!editForm.fullName?.trim()) {
      setEditError("Vui lòng nhập họ tên");
      return;
    }

    const token = getStoredToken();
    if (!token) return;

    setSaving(true);
    try {
      const res = await apiFetch<ApiResponse<OwnerProfileDto>>("/profile", {
        method: "PUT",
        token,
        body: JSON.stringify(editForm),
      });

      if (res.data?.data) {
        setProfile(res.data.data);

        // Update local storage
        const user = getStoredUser();
        if (user) {
          setAuthData(token, {
            ...user,
            fullName: res.data.data.fullName,
          });
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

  // Handle password change
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (!passwordForm.currentPassword) {
      setPasswordError("Vui lòng nhập mật khẩu hiện tại");
      return;
    }
    if (!passwordForm.newPassword) {
      setPasswordError("Vui lòng nhập mật khẩu mới");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordError("Mật khẩu mới phải có ít nhất 6 ký tự");
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
      const message = err instanceof Error ? err.message : "Đã xảy ra lỗi";
      setPasswordError(message);
    } finally {
      setPasswordSaving(false);
    }
  };

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-[#FF8000]" />
        <p className="text-sm text-[#C4C7C9]/60">Đang tải hồ sơ...</p>
      </div>
    );
  }

  if (!profile) {
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hồ sơ chủ sân"
        description="Quản lý thông tin cá nhân và bảo mật tài khoản"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Card */}
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
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#C4C7C9]">
                      Họ tên <span className="text-red-400">*</span>
                    </label>
                    <Input
                      value={editForm.fullName || ""}
                      onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                      className="bg-[#141414] border-[rgba(134,210,50,0.2)] text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#C4C7C9]">Số điện thoại</label>
                    <Input
                      value={editForm.phoneNumber || ""}
                      onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                      placeholder="Nhập số điện thoại"
                      className="bg-[#141414] border-[rgba(134,210,50,0.2)] text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#C4C7C9]">Bio</label>
                    <textarea
                      value={editForm.bio || ""}
                      onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                      placeholder="Giới thiệu bản thân (tùy chọn)"
                      rows={3}
                      className="w-full rounded-lg border border-[rgba(134,210,50,0.2)] bg-[#141414] px-3 py-2 text-sm text-white placeholder:text-[#C4C7C9]/20 focus:border-[#FF8000] focus:outline-none resize-none"
                    />
                  </div>

                  {editError && (
                    <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-950/30 px-4 py-3 text-sm text-red-400">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      {editError}
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <Button
                      type="submit"
                      disabled={saving}
                      className="bg-[#FF8000] hover:bg-[#FF8000]/90"
                    >
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
                          bio: profile.bio,
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
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                      <p className="text-xs font-medium uppercase tracking-wider text-[#C4C7C9]/60">
                        Họ tên
                      </p>
                      <p className="text-white font-medium">{profile.fullName}</p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-medium uppercase tracking-wider text-[#C4C7C9]/60">
                        Số điện thoại
                      </p>
                      <p className="text-white">
                        {profile.phoneNumber || <span className="text-[#C4C7C9]/40">Chưa cập nhật</span>}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-medium uppercase tracking-wider text-[#C4C7C9]/60">
                        Email
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-white">{profile.email}</p>
                        {profile.emailConfirmed ? (
                          <CheckCircle2 className="h-4 w-4 text-green-400" title="Đã xác minh" />
                        ) : (
                          <Badge variant="secondary" className="text-xs">Chưa xác minh</Badge>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-medium uppercase tracking-wider text-[#C4C7C9]/60">
                        Ngày tham gia
                      </p>
                      <p className="text-white">{formatDate(profile.createdAt)}</p>
                    </div>
                  </div>

                  {profile.bio && (
                    <div className="space-y-1 pt-2">
                      <p className="text-xs font-medium uppercase tracking-wider text-[#C4C7C9]/60">
                        Giới thiệu
                      </p>
                      <p className="text-white">{profile.bio}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Avatar Card */}
          <Card className="bg-[#0A0A0A] border-[rgba(134,210,50,0.2)]">
            <CardContent className="p-6">
              <div className="flex flex-col items-center">
                <div className="relative mb-4">
                  <div className="h-24 w-24 rounded-full bg-[#FF8000]/10 flex items-center justify-center border-2 border-[#FF8000]/30">
                    {profile.avatarUrl ? (
                      <img
                        src={profile.avatarUrl}
                        alt={profile.fullName}
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-3xl font-bold text-[#FF8000]">
                        {profile.fullName.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <button className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-[#FF8000] flex items-center justify-center border-2 border-[#0A0A0A] hover:bg-[#FF8000]/90 transition-colors">
                    <Camera className="h-4 w-4 text-white" />
                  </button>
                </div>
                <h3 className="text-lg font-bold text-white">{profile.fullName}</h3>
                <p className="text-sm text-[#C4C7C9]/60">@{profile.sanHandle || profile.id.slice(0, 8)}</p>
                <Badge
                  variant={profile.status === "ACTIVE" ? "success" : "secondary"}
                  className="mt-2"
                >
                  {profile.role}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Account Actions */}
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

              <div className="pt-2 border-t border-[rgba(134,210,50,0.1)]">
                <p className="text-xs text-[#C4C7C9]/60 mb-2">Trạng thái tài khoản</p>
                <div className="flex items-center gap-2">
                  {profile.status === "ACTIVE" ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-400" />
                      <span className="text-sm text-green-400">Hoạt động</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 text-red-400" />
                      <span className="text-sm text-red-400">{profile.status}</span>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Verification Status */}
          <Card className="bg-[#0A0A0A] border-[rgba(134,210,50,0.2)]">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm text-white">
                <CreditCard className="h-4 w-4 text-[#FF8000]" />
                Xác minh
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-[#C4C7C9]/60" />
                    <span className="text-sm text-[#C4C7C9]">Xác minh email</span>
                  </div>
                  {profile.emailConfirmed ? (
                    <CheckCircle2 className="h-4 w-4 text-green-400" />
                  ) : (
                    <Badge variant="secondary" className="text-xs">Chưa</Badge>
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
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Password Change Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="bg-[#141414] border-[rgba(134,210,50,0.2)] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Đổi mật khẩu</DialogTitle>
            <DialogDescription className="text-[#C4C7C9]/60">
              Cập nhật mật khẩu để bảo vệ tài khoản của bạn
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#C4C7C9]">
                Mật khẩu hiện tại
              </label>
              <Input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                className="bg-[#0A0A0A] border-[rgba(134,210,50,0.2)] text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#C4C7C9]">
                Mật khẩu mới
              </label>
              <Input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                placeholder="Ít nhất 6 ký tự"
                className="bg-[#0A0A0A] border-[rgba(134,210,50,0.2)] text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#C4C7C9]">
                Xác nhận mật khẩu mới
              </label>
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
              <Button
                type="submit"
                disabled={passwordSaving}
                className="bg-[#FF8000] hover:bg-[#FF8000]/90"
              >
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
