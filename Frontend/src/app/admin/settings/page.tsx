"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Cài đặt" description="Cấu hình các cài đặt cho hệ thống" />
      <Card>
        <CardHeader>
          <CardTitle>Cài đặt hệ thống</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-500">Trang cài đặt đang được phát triển...</p>
        </CardContent>
      </Card>
    </div>
  );
}
