import { Metadata } from "next";
import { Building2, CalendarCheck2, TrendingUp, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { BookingStatusBadge } from "@/components/shared/StatusBadge";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";
import Link from "next/link";

export const metadata: Metadata = { title: "Tổng quan – Owner" };

const kpis = [
  { label: "Tổng cơ sở",    value: "3",         icon: Building2,      color: "text-blue-600",    bg: "bg-blue-50" },
  { label: "Đặt sân hôm nay", value: "12",       icon: CalendarCheck2, color: "text-emerald-600", bg: "bg-emerald-50" },
  { label: "Doanh thu tháng", value: "12.400.000đ", icon: TrendingUp,  color: "text-violet-600",  bg: "bg-violet-50" },
  { label: "Chờ xác nhận",   value: "4",         icon: Clock,          color: "text-amber-600",   bg: "bg-amber-50" },
];

const recentBookings = [
  { id: "1", courtName: "Sân A1", customerName: "Nguyễn Văn A", bookingDate: "2026-06-01", startTime: "08:00:00", endTime: "10:00:00", totalPrice: 160000, status: "CONFIRMED" as const },
  { id: "2", courtName: "Sân B2", customerName: "Trần Thị B",   bookingDate: "2026-06-01", startTime: "14:00:00", endTime: "16:00:00", totalPrice: 200000, status: "PENDING_PAYMENT" as const },
  { id: "3", courtName: "Sân A2", customerName: "Lê Văn C",     bookingDate: "2026-06-02", startTime: "07:00:00", endTime: "09:00:00", totalPrice: 160000, status: "CONFIRMED" as const },
];

export default function OwnerDashboardPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Tổng quan"
        description="Chào buổi sáng! Đây là tình trạng hoạt động hôm nay."
      />

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

      {/* Recent bookings */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Đặt sân gần đây</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/owner/bookings">Xem tất cả</Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100">
            {recentBookings.map((b) => (
              <div key={b.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 text-sm">{b.customerName}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{b.courtName} · {formatDate(b.bookingDate)} · {formatTime(b.startTime)}–{formatTime(b.endTime)}</p>
                </div>
                <BookingStatusBadge status={b.status} />
                <p className="text-sm font-semibold text-slate-900 tabular-nums">{formatCurrency(b.totalPrice)}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
