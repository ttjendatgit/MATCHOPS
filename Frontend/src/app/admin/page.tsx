import { Metadata } from "next";
import { Building2, Users, CalendarCheck2, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { VenueStatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const metadata: Metadata = { title: "Tổng quan – Admin" };

const kpis = [
  { label: "Tổng cơ sở",       value: "248",           icon: Building2,      color: "text-blue-600",    bg: "bg-blue-50" },
  { label: "Người dùng",        value: "12.450",        icon: Users,          color: "text-violet-600",  bg: "bg-violet-50" },
  { label: "Đặt sân hôm nay",   value: "1.234",         icon: CalendarCheck2, color: "text-emerald-600", bg: "bg-emerald-50" },
  { label: "Doanh thu tháng",   value: "2.1 tỷ đ",     icon: TrendingUp,     color: "text-amber-600",   bg: "bg-amber-50" },
];

const pendingVenues = [
  { id: "1", name: "Sân tennis Quận 1 Premium", ownerName: "Nguyễn Minh", city: "TP.HCM", createdAt: "2026-05-29", status: "PENDING_APPROVAL" as const },
  { id: "2", name: "SportZone Cầu Giấy", ownerName: "Trần Văn Hùng", city: "Hà Nội", createdAt: "2026-05-30", status: "PENDING_APPROVAL" as const },
];

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      <PageHeader title="Tổng quan hệ thống" description="Theo dõi hoạt động toàn nền tảng" />

      {/* KPI cards */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label}>
              <CardContent className="flex items-center gap-4 p-5">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${kpi.bg}`}>
                  <Icon className={`h-6 w-6 ${kpi.color}`} />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{kpi.label}</p>
                  <p className="text-xl font-bold text-slate-900">{kpi.value}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Pending approvals */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Cơ sở chờ duyệt</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/venues">Xem tất cả</Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100">
            {pendingVenues.map((v) => (
              <div key={v.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 text-sm">{v.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{v.ownerName} · {v.city} · {v.createdAt}</p>
                </div>
                <VenueStatusBadge status={v.status} />
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/5 text-xs">Từ chối</Button>
                  <Button size="sm" className="text-xs">Duyệt</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
