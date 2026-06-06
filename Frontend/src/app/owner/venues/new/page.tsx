import { Metadata } from "next";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export const metadata: Metadata = { title: "Tạo cơ sở mới – Owner" };

export default function NewVenuePage() {
  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-1 text-sm text-slate-500">
        <Link href="/owner/venues" className="hover:text-primary">Cơ sở của tôi</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-slate-900 font-medium">Tạo mới</span>
      </nav>

      <PageHeader title="Tạo cơ sở mới" description="Điền thông tin cơ sở để gửi yêu cầu duyệt" />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Thông tin cơ bản</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Tên cơ sở <span className="text-destructive">*</span></Label>
                <Input placeholder="VD: Sân cầu lông Phú Mỹ Hưng" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Tỉnh / Thành phố <span className="text-destructive">*</span></Label>
                  <Input placeholder="TP.HCM" />
                </div>
                <div className="space-y-1.5">
                  <Label>Quận / Huyện <span className="text-destructive">*</span></Label>
                  <Input placeholder="Quận 7" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Địa chỉ <span className="text-destructive">*</span></Label>
                <Input placeholder="Số nhà, tên đường, phường/xã" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Giờ mở cửa <span className="text-destructive">*</span></Label>
                  <input type="time" className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" defaultValue="06:00" />
                </div>
                <div className="space-y-1.5">
                  <Label>Giờ đóng cửa <span className="text-destructive">*</span></Label>
                  <input type="time" className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" defaultValue="22:00" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Mô tả</Label>
                <textarea className="flex min-h-[100px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" placeholder="Mô tả cơ sở, tiện ích, lưu ý..." />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Ảnh bìa</CardTitle></CardHeader>
            <CardContent>
              <div className="flex h-40 flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-200 text-center text-sm text-slate-400 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors">
                <p className="font-medium">Tải ảnh lên</p>
                <p className="text-xs mt-1">PNG, JPG tối đa 5MB</p>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" asChild>
              <Link href="/owner/venues">Huỷ</Link>
            </Button>
            <Button className="flex-1">Gửi duyệt</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
