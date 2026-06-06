import { Metadata } from "next";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { VenueStatusBadge } from "@/components/shared/StatusBadge";
import Link from "next/link";

export const metadata: Metadata = { title: "Quản lý cơ sở – Owner" };

export default async function VenueDetailOwnerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-1 text-sm text-slate-500">
        <Link href="/owner/venues" className="hover:text-primary">Cơ sở của tôi</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-slate-900 font-medium">Sân cầu lông Phú Mỹ Hưng</span>
      </nav>

      <PageHeader
        title="Sân cầu lông Phú Mỹ Hưng"
        action={
          <div className="flex items-center gap-3">
            <VenueStatusBadge status="ACTIVE" />
            <Button variant="outline" size="sm" asChild>
              <Link href={`/owner/venues/${id}/courts`}>Quản lý sân</Link>
            </Button>
            <Button size="sm">Lưu thay đổi</Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader><CardTitle className="text-base">Thông tin cơ sở</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Tên cơ sở</Label>
                <Input defaultValue="Sân cầu lông Phú Mỹ Hưng" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Thành phố</Label>
                  <Input defaultValue="TP.HCM" />
                </div>
                <div className="space-y-1.5">
                  <Label>Quận</Label>
                  <Input defaultValue="Quận 7" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Địa chỉ</Label>
                <Input defaultValue="12 Nguyễn Lương Bằng" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Giờ mở cửa</Label>
                  <input type="time" className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" defaultValue="06:00" />
                </div>
                <div className="space-y-1.5">
                  <Label>Giờ đóng cửa</Label>
                  <input type="time" className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" defaultValue="22:00" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Nhanh chóng</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`/owner/venues/${id}/courts`}>Quản lý sân ({6})</Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`/owner/venues/${id}/blocks`}>Khoá sân</Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/owner/bookings">Xem đặt sân</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
