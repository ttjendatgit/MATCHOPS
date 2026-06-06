import { Metadata } from "next";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import Link from "next/link";

export const metadata: Metadata = { title: "Quản lý sân – Owner" };

export default async function CourtDetailPage({ params }: { params: Promise<{ id: string; courtId: string }> }) {
  const { id } = await params;
  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-1 text-sm text-slate-500">
        <Link href={`/owner/venues/${id}/courts`} className="hover:text-primary">Danh sách sân</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-slate-900">Sân A1</span>
      </nav>

      <PageHeader
        title="Sân A1"
        action={<Button size="sm">Lưu thay đổi</Button>}
      />

      <div className="max-w-2xl space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Thông tin sân</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Tên sân</Label>
              <Input defaultValue="Sân A1" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Loại sân</Label>
                <Input defaultValue="Cầu lông" />
              </div>
              <div className="space-y-1.5">
                <Label>Sức chứa</Label>
                <Input type="number" defaultValue={4} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Quy tắc giá hiện tại</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { dayType: "Tất cả", start: "06:00", end: "17:00", price: 80000 },
                { dayType: "Cuối tuần", start: "17:00", end: "22:00", price: 120000 },
              ].map((rule, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3 text-sm">
                  <span className="text-slate-600">{rule.dayType} · {rule.start}–{rule.end}</span>
                  <span className="font-semibold text-emerald-600">{(rule.price / 1000).toFixed(0)}k/h</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
