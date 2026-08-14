"use client";

import { useState } from "react";
import { Settings, Bell, Shield, Eye, Trash2 } from "lucide-react";
import { BackLink } from "@/components/shared/BackLink";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export default function AccountSettingsPage() {
  const [notifications, setNotifications] = useState(true);
  const [marketing, setNotificationsMarketing] = useState(false);
  const [profilePublic, setProfilePublic] = useState(true);

  const handleSave = () => {
    toast.success("Đã lưu cài đặt tài khoản");
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <BackLink href="/profile" label="Quay lại trang cá nhân" className="mb-8" />

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Cài đặt tài khoản</h1>
        <p className="mt-2 text-slate-400">Quản lý quyền riêng tư và thông báo của bạn</p>
      </div>

      <div className="space-y-6">
        {/* Notifications */}
        <Card className="border-white/10 bg-slate-900/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Bell className="h-5 w-5 text-[#FF8000]" />
              Thông báo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-white">Thông báo đặt sân</Label>
                <p className="text-xs text-slate-500">Nhận thông báo khi có thay đổi về lịch đặt sân của bạn</p>
              </div>
              <Switch checked={notifications} onCheckedChange={setNotifications} />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-white">Tin nhắn mới</Label>
                <p className="text-xs text-slate-500">Thông báo khi có người nhắn tin cho bạn</p>
              </div>
              <Switch checked={true} />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-white">Email marketing</Label>
                <p className="text-xs text-slate-500">Nhận thông tin về các ưu đãi và sự kiện mới</p>
              </div>
              <Switch checked={marketing} onCheckedChange={setNotificationsMarketing} />
            </div>
          </CardContent>
        </Card>

        {/* Privacy */}
        <Card className="border-white/10 bg-slate-900/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Eye className="h-5 w-5 text-[#86D232]" />
              Quyền riêng tư
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-white">Hồ sơ công khai</Label>
                <p className="text-xs text-slate-500">Cho phép người khác xem hồ sơ và trình độ của bạn khi tìm trận</p>
              </div>
              <Switch checked={profilePublic} onCheckedChange={setProfilePublic} />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-white">Hiển thị số điện thoại</Label>
                <p className="text-xs text-slate-500">Chỉ hiển thị cho người chơi cùng trận đấu</p>
              </div>
              <Switch checked={false} />
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card className="border-red-500/20 bg-red-950/5">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-red-400 flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Vùng nguy hiểm
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-white">Xóa tài khoản</Label>
                <p className="text-xs text-slate-500">Tất cả dữ liệu của bạn sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn tác.</p>
              </div>
              <Button variant="destructive" size="sm" className="bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all">
                <Trash2 className="h-4 w-4 mr-2" />
                Xóa tài khoản
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} className="bg-[#FF8000] hover:bg-[#FF8000]/90 text-white px-8">
            Lưu tất cả cài đặt
          </Button>
        </div>
      </div>
    </div>
  );
}
