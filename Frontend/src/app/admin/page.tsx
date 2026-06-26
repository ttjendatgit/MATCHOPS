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
      setError("Missing admin session.");
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
        setError(err instanceof Error ? err.message : "Failed to load admin analytics.");
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
        {error || "Unable to load admin analytics."}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">AI Analytics Dashboard</h1>
          <p className="mt-1 text-sm text-[#C4C7C9]">
            MATCHOPS performance, risks, opportunities, and AI-generated recommendations for admins.
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
          label="Total Users"
          value={stats.totalUsers.toString()}
          icon={Users}
          hint={`Retention ${stats.userRetentionRate}%`}
        />
        <AdminMetric
          label="Total Venues"
          value={stats.totalVenues.toString()}
          icon={Building2}
          hint={`${stats.topPerformingVenues.length} top venues tracked`}
        />
        <AdminMetric
          label="Total Bookings"
          value={stats.totalBookings.toString()}
          icon={TrendingUp}
          hint={`Growth ${stats.bookingGrowthRate}%`}
        />
        <AdminMetric
          label="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          icon={Star}
          hint={`Cancellation ${stats.cancellationRate}%`}
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
          title="Revenue Chart"
          description="Monthly platform revenue from confirmed and completed bookings."
          data={stats.monthlyRevenue}
        />
        <BookingTrendAnalysisCard
          title="Booking Trend Chart"
          description="Monthly booking volume across the platform."
          data={stats.bookingTrend}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="border-white/10 bg-slate-950/50 text-white">
          <CardHeader>
            <CardTitle className="text-base">Sport Distribution Chart</CardTitle>
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
            <CardTitle className="text-base">Peak Hour Chart</CardTitle>
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
            <CardTitle className="text-base">Health Snapshot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-slate-900/50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">Total Reviews</p>
              <p className="mt-1 text-2xl font-bold text-white">{stats.totalReviews}</p>
            </div>
            <div className="rounded-lg bg-slate-900/50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">Notifications Sent</p>
              <p className="mt-1 flex items-center gap-2 text-2xl font-bold text-[#FF8000]">
                <Star className="h-5 w-5" />
                {stats.totalNotifications}
              </p>
            </div>
            <div className="rounded-lg bg-slate-900/50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">Operational Risk</p>
              <p className="mt-1 text-sm text-slate-300">
                {ai.risks[0] || "No major operational risk detected."}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-white/10 bg-slate-950/50 text-white">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Top Performing Venues</CardTitle>
          <Link href="/admin/venues" className="flex items-center gap-1 text-sm text-[#FF8000] hover:underline">
            Manage venues <ArrowRight className="h-4 w-4" />
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
                <span>{venue.bookingCount} bookings</span>
                <span>{venue.averageRating} rating</span>
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs text-amber-400">
                <AlertCircle className="h-3.5 w-3.5" />
                {venue.cancellationRate}% cancellations
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
