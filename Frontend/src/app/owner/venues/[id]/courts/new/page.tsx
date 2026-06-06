import { Metadata } from "next";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import Link from "next/link";

export const metadata: Metadata = { title: "Thêm sân mới – Owner" };

export default async function NewCourtPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-1 text-sm text-slate-500">
        <Link href={`/owner/venues/${id}/courts`} className="hover:text-primary">Danh sách sân</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-slate-900">Thêm mới</span>
      </nav>

      <PageHeader title="Thêm sân mới" />

      <div className="max-w-2xl space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Thông tin sân</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Tên sân <span className="text-destructive">*</span></Label>
              <Input placeholder="VD: Sân A1" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Loại sân <span className="text-destructive">*</span></Label>
                <Input placeholder="Cầu lông, Tennis, Bóng đá..." />
              </div>
              <div className="space-y-1.5">
                <Label>Sức chứa</Label>
                <Input type="number" placeholder="4" min={1} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Vị trí / Ghi chú</Label>
              <Input placeholder="VD: Tầng 2, khu A" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Quy tắc giá</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-4 items-end">
              <div className="space-y-1.5">
                <Label className="text-xs">Loại ngày</Label>
                <select className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                  <option value="ALL">Tất cả</option>
                  <option value="WEEKDAY">Ngày thường</option>
                  <option value="WEEKEND">Cuối tuần</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Từ giờ</Label>
                <input type="time" className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" defaultValue="06:00" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Đến giờ</Label>
                <input type="time" className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" defaultValue="22:00" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Giá/giờ (đ)</Label>
                <Input type="number" placeholder="80000" />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button variant="outline" asChild><Link href={`/owner/venues/${id}/courts`}>Huỷ</Link></Button>
          <Button>Tạo sân</Button>
        </div>
      </div>
    </div>
  );
}
