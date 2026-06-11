"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Lock, Eye, EyeOff, Save, Loader2, ChevronLeft } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { getStoredToken } from "@/lib/auth";
import type { ApiResponse } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import Link from "next/link";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error("Mật khẩu mới không khớp");
      return;
    }

    if (formData.newPassword.length < 6) {
      toast.error("Mật khẩu mới phải có ít nhất 6 ký tự");
      return;
    }

    setSaving(true);
    const token = getStoredToken();
    try {
      const res = await apiFetch<ApiResponse<any>>("/profile/change-password", {
        method: "PUT",
        token,
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        }),
      });

      if (res.success) {
        toast.success("Đổi mật khẩu thành công");
        router.push("/profile");
      } else {
        toast.error(res.message || "Đổi mật khẩu thất bại");
      }
    } catch (err) {
      console.error(err);
      toast.error("Đã xảy ra lỗi. Vui lòng kiểm tra lại mật khẩu hiện tại.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <Link href="/profile" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-8 transition-colors">
        <ChevronLeft className="h-4 w-4" />
        Quay lại trang cá nhân
      </Link>

      <Card className="border-white/10 bg-slate-900/50 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#FF8000]/10 border border-[#FF8000]/20">
            <KeyRound className="h-6 w-6 text-[#FF8000]" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">Đổi mật khẩu</CardTitle>
          <p className="text-sm text-slate-400 mt-1">Vui lòng nhập mật khẩu hiện tại và mật khẩu mới của bạn</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="old" className="text-slate-300">Mật khẩu hiện tại</Label>
              <div className="relative">
                <Input
                  id="old"
                  type={showOld ? "text" : "password"}
                  value={formData.currentPassword}
                  onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                  className="bg-slate-950/50 border-white/10 text-white focus:border-[#FF8000] pr-10"
                  required
                />
                <button 
                  type="button" 
                  onClick={() => setShowOld(!showOld)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showOld ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new" className="text-slate-300">Mật khẩu mới</Label>
              <div className="relative">
                <Input
                  id="new"
                  type={showNew ? "text" : "password"}
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  className="bg-slate-950/50 border-white/10 text-white focus:border-[#FF8000] pr-10"
                  required
                />
                <button 
                  type="button" 
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-[10px] text-slate-500">Mật khẩu phải chứa ít nhất 6 ký tự</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm" className="text-slate-300">Xác nhận mật khẩu mới</Label>
              <div className="relative">
                <Input
                  id="confirm"
                  type={showConfirm ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="bg-slate-950/50 border-white/10 text-white focus:border-[#FF8000] pr-10"
                  required
                />
                <button 
                  type="button" 
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" disabled={saving} className="w-full bg-[#FF8000] hover:bg-[#FF8000]/90 text-white gap-2 font-bold py-6">
              {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
              Cập nhật mật khẩu
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
