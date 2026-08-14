"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User, Mail, Phone, Calendar, Shield, Camera, Save, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { getStoredToken } from "@/lib/auth";
import type { ApiResponse } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface ProfileData {
  id: string;
  avatarUrl: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  skillLevel: string;
  preferredPlayingArea: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      router.push("/login?redirect=/profile");
      return;
    }

    apiFetch<ApiResponse<ProfileData>>("/profile", { token })
      .then((profileRes) => {
        if (profileRes.success && profileRes.data) {
          setProfile(profileRes.data);
        }
      })
      .catch((err) => {
        console.error(err);
        toast.error("Không thể tải thông tin cá nhân");
      })
      .finally(() => setLoading(false));
  }, [router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setSaving(true);
    const token = getStoredToken();
    try {
      const res = await apiFetch<ApiResponse<ProfileData>>("/profile", {
        method: "PUT",
        token,
        body: JSON.stringify({
          fullName: profile.fullName,
          phoneNumber: profile.phoneNumber,
          email: profile.email,
          preferredPlayingArea: profile.preferredPlayingArea,
          skillLevel: 0,
        }),
      });

      if (res.success) {
        toast.success("Cập nhật hồ sơ thành công");
      } else {
        toast.error(res.message || "Cập nhật thất bại");
      }
    } catch (err) {
      console.error(err);
      toast.error("Đã xảy ra lỗi khi cập nhật");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF8000]" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Trang cá nhân</h1>
          <p className="mt-2 text-slate-400">Quản lý thông tin tài khoản và sở thích của bạn</p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-6">
          <Card className="border-white/10 bg-slate-900/50 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-4">
                  <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-[#FF8000]/30 bg-[#FF8000]/10">
                    {profile.avatarUrl ? (
                      <img src={profile.avatarUrl} alt={profile.fullName} className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-12 w-12 text-[#FF8000]" />
                    )}
                  </div>
                  <button className="absolute bottom-0 right-0 rounded-full border border-white/10 bg-slate-800 p-1.5 text-white transition-colors hover:bg-slate-700">
                    <Camera className="h-4 w-4" />
                  </button>
                </div>
                <h2 className="text-xl font-bold text-white">{profile.fullName}</h2>
                <p className="text-sm text-slate-400">{profile.email}</p>
                <div className="mt-4 inline-flex items-center rounded-full bg-[#FF8000]/10 px-3 py-1 text-xs font-medium text-[#FF8000]">
                  {profile.skillLevel || "Người mới chơi"}
                </div>
              </div>

              <div className="mt-8 space-y-4">
                <div className="flex items-center gap-3 text-sm text-slate-300">
                  <Mail className="h-4 w-4 text-slate-500" />
                  <span className="truncate">{profile.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-300">
                  <Phone className="h-4 w-4 text-slate-500" />
                  <span>{profile.phoneNumber || "Chưa cập nhật"}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-300">
                  <Calendar className="h-4 w-4 text-slate-500" />
                  <span>Tham gia từ 2026</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-slate-900/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-white">
                <Shield className="h-4 w-4 text-[#86D232]" />
                Bảo mật &amp; tài khoản
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start border-white/5 text-xs hover:bg-white/5" asChild>
                <a href="/account/transactions">Lịch sử giao dịch</a>
              </Button>
              <Button variant="outline" className="w-full justify-start border-white/5 text-xs hover:bg-white/5" asChild>
                <a href="/account/subscription">Gói thành viên</a>
              </Button>
              <Button variant="outline" className="w-full justify-start border-white/5 text-xs hover:bg-white/5" asChild>
                <a href="/change-password">Đổi mật khẩu</a>
              </Button>
              <Button variant="outline" className="w-full justify-start border-white/5 text-xs hover:bg-white/5" asChild>
                <a href="/account/settings">Cài đặt quyền riêng tư</a>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="border-white/10 bg-slate-900/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-white">Thông tin cơ bản</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-slate-300">Họ và tên</Label>
                    <Input
                      id="fullName"
                      value={profile.fullName}
                      onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                      className="border-white/10 bg-slate-950/50 text-white focus:border-[#FF8000]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-300">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      disabled
                      className="cursor-not-allowed border-white/10 bg-slate-950/50 text-slate-500"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-slate-300">Số điện thoại</Label>
                    <Input
                      id="phone"
                      value={profile.phoneNumber}
                      onChange={(e) => setProfile({ ...profile, phoneNumber: e.target.value })}
                      className="border-white/10 bg-slate-950/50 text-white focus:border-[#FF8000]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="area" className="text-slate-300">Khu vực ưu tiên</Label>
                    <Input
                      id="area"
                      value={profile.preferredPlayingArea}
                      onChange={(e) => setProfile({ ...profile, preferredPlayingArea: e.target.value })}
                      placeholder="VD: Quận 7, TP.HCM"
                      className="border-white/10 bg-slate-950/50 text-white focus:border-[#FF8000]"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={saving} className="gap-2 bg-[#FF8000] text-white hover:bg-[#FF8000]/90">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Lưu thay đổi
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
