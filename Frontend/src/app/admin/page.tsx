"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  Building2,
  Loader2,
  Star,
  TrendingUp,
  Users,
  ArrowRight,
  PlayCircle,
  Calendar,
  Settings,
  BarChart3,
  Receipt,
} from "lucide-react";
import Link from "next/link";
import { Pie, PieChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AIInsightCard } from "@/components/shared/AIInsightCard";
import { AIRecommendationsCard } from "@/components/shared/AIRecommendationsCard";
import { ForecastCard } from "@/components/shared/ForecastCard";
import { RevenueAnalysisCard } from "@/components/shared/RevenueAnalysisCard";
import { BookingTrendAnalysisCard } from "@/components/shared/BookingTrendAnalysisCard";
import { apiFetch } from "@/lib/api";
import { getStoredToken } from "@/lib/auth";
import { formatCurrency } from "@/lib/utils";
import type { ApiResponse } from "@/types/api";
import type { DashboardAdminStatistics, DashboardAiSummary } from "@/types/dashboard";

const PIE_COLORS = ["#FF8000", "#86D232", "#60A5FA", "#F59E0B", "#A855F7"];
const QUICK_ACTIONS = [
  { label: "Quản lý người dùng", href: "/admin/users", icon: Users },
  { label: "Duyệt cụm sân", href: "/admin/venues", icon: Building2 },
  { label: "Quản lý sân", href: "/admin/courts", icon: PlayCircle },
  { label: "Xem lịch đặt", href: "/admin/bookings", icon: Calendar },
  { label: "Thống kê", href: "/admin/analytics", icon: BarChart3 },
  { label: "Giao dịch", href: "/admin/transactions", icon: Receipt },
  { label: "Cài đặt", href: "/admin/settings", icon: Settings },
] as const;

function AdminMetric({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-xl border border-[rgba(134,210,50,0.2)] bg-[#0A0A0A] p-5">
      <div className="flex items-center justify-between">
        <div className="rounded-lg bg-[rgba(255,128,0,0.12)] p-2.5">
          <Icon className="h-5 w-5 text-[#FF8000]" />
        </div>
      </div>
      <p className="mt-4 text-xs uppercase tracking-wide text-[#C4C7C9]/60">{label}</p>
      <p className="mt-1 text-2xl font-bold text-white">{value}</p>
      <p className="mt-2 text-xs text-[#C4C7C9]/50">{hint}</p>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardAdminStatistics | null>(null);
  const [ai, setAi] = useState<DashboardAiSummary | null>(null);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setError("Thiếu phiên quản trị viên.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    Promise.all([
      apiFetch<ApiResponse<DashboardAdminStatistics>>("/dashboard/admin/statistics", { token }),
      apiFetch<ApiResponse<DashboardAiSummary>>("/dashboard/admin/ai-summary", { token }),
    ])
      .then(([statsRes, aiRes]) => {
        setStats(statsRes.data);
        setAi(aiRes.data);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Không thể tải phân tích quản trị viên.");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF8000]" />
      </div>
    );
  }

  if (error || !stats || !ai) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-950/20 p-6 text-red-300">
        {error || "Không thể tải phân tích quản trị viên."}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Bảng điều khiển Phân tích AI</h1>
          <p className="mt-1 text-sm text-[#C4C7C9]">
            Hiệu suất MATCHOPS, rủi ro, cơ hội và đề xuất tạo bởi AI cho quản trị viên.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className="flex items-center gap-2 rounded-xl border border-[rgba(134,210,50,0.2)] bg-[#0A0A0A] px-4 py-3 text-sm text-white transition hover:border-[rgba(255,128,0,0.45)] hover:bg-[#141414]"
              >
                <Icon className="h-4 w-4 text-[#FF8000]" />
                {action.label}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetric
          label="Tổng Người dùng"
          value={stats.totalUsers.toString()}
          icon={Users}
          hint={`Giữ chân ${stats.userRetentionRate}%`}
        />
        <AdminMetric
          label="Tổng Cụm sân"
          value={stats.totalVenues.toString()}
          icon={Building2}
          hint={`${stats.topPerformingVenues.length} cụm sân hàng đầu được theo dõi`}
        />
        <AdminMetric
          label="Tổng Đặt sân"
          value={stats.totalBookings.toString()}
          icon={TrendingUp}
          hint={`Tăng trưởng ${stats.bookingGrowthRate}%`}
        />
        <AdminMetric
          label="Tổng Doanh thu"
          value={formatCurrency(stats.totalRevenue)}
          icon={Star}
          hint={`Hủy ${stats.cancellationRate}%`}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <AIInsightCard
          summary={ai.summary}
          insights={ai.insights}
          risks={ai.risks}
          opportunities={ai.opportunities}
          className="xl:col-span-2"
        />
        <div className="space-y-6">
          <AIRecommendationsCard recommendations={ai.recommendations} />
          <ForecastCard forecast={ai.forecast} />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <RevenueAnalysisCard
          title="Biểu đồ Doanh thu"
          description="Doanh thu hàng tháng của nền tảng từ các đơn đặt đã xác nhận và hoàn thành."
          data={stats.monthlyRevenue}
        />
        <BookingTrendAnalysisCard
          title="Biểu đồ Xu hướng Đặt sân"
          description="Số lượng đơn đặt hàng tháng trên nền tảng."
          data={stats.bookingTrend}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="border-white/10 bg-slate-950/50 text-white">
          <CardHeader>
            <CardTitle className="text-base">Biểu đồ Phân bố Môn thể thao</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stats.mostPopularSports} dataKey="count" nameKey="label" innerRadius={50} outerRadius={82} paddingAngle={4}>
                    {stats.mostPopularSports.map((entry, index) => (
                      <Cell key={entry.label} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "#020617", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {stats.mostPopularSports.map((sport, index) => (
                <div key={sport.label} className="flex items-center justify-between text-sm text-slate-300">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                    {sport.label}
                  </div>
                  <span>{sport.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-slate-950/50 text-white">
          <CardHeader>
            <CardTitle className="text-base">Biểu đồ Giờ cao điểm</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.peakBookingHours}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="label" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip contentStyle={{ backgroundColor: "#020617", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }} />
                  <Bar dataKey="count" fill="#3B82F6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-slate-950/50 text-white">
          <CardHeader>
            <CardTitle className="text-base">Tóm tắt Sức khỏe</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-slate-900/50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">Tổng Đánh giá</p>
              <p className="mt-1 text-2xl font-bold text-white">{stats.totalReviews}</p>
            </div>
            <div className="rounded-lg bg-slate-900/50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">Thông báo đã gửi</p>
              <p className="mt-1 flex items-center gap-2 text-2xl font-bold text-[#FF8000]">
                <Star className="h-5 w-5" />
                {stats.totalNotifications}
              </p>
            </div>
            <div className="rounded-lg bg-slate-900/50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">Rủi ro Hoạt động</p>
              <p className="mt-1 text-sm text-slate-300">
                {ai.risks[0] || "Không phát hiện rủi ro hoạt động lớn nào."}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-white/10 bg-slate-950/50 text-white">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Cụm sân Hiệu suất Cao nhất</CardTitle>
          <Link href="/admin/venues" className="flex items-center gap-1 text-sm text-[#FF8000] hover:underline">
            Quản lý cụm sân <ArrowRight className="h-4 w-4" />
          </Link>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {stats.topPerformingVenues.map((venue, index) => (
            <div key={venue.venueId} className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="line-clamp-2 text-sm font-semibold text-white">{venue.venueName}</p>
                {index === 0 && <TrendingUp className="h-4 w-4 text-[#FF8000]" />}
              </div>
              <p className="mt-2 text-lg font-bold text-[#FF8000]">{formatCurrency(venue.revenue)}</p>
              <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                <span>{venue.bookingCount} đơn đặt</span>
                <span>{venue.averageRating} sao</span>
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs text-amber-400">
                <AlertCircle className="h-3.5 w-3.5" />
                {venue.cancellationRate}% hủy
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
