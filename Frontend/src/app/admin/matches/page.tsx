"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";

export default function AdminMatchesPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Quản lý trận đấu" description="Xem và quản lý các trận đấu trên nền tảng" />
      <Card>
        <CardHeader>
          <CardTitle>Danh sách trận đấu</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-500">Trang quản lý trận đấu đang được phát triển...</p>
        </CardContent>
      </Card>
    </div>
  );
}
