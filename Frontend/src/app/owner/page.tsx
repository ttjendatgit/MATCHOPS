"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  ArrowRight,
  Loader2,
  AlertCircle,
  Repeat,
  Star,
  TrendingUp,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { Pie, PieChart, Cell, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { chartTooltipProps } from "@/lib/chart-styles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AIAnalyticsReport } from "@/components/shared/AIAnalyticsReport";
import { AIRecommendationsCard } from "@/components/shared/AIRecommendationsCard";
import { ForecastCard } from "@/components/shared/ForecastCard";
import { RevenueAnalysisCard } from "@/components/shared/RevenueAnalysisCard";
import { BookingTrendAnalysisCard } from "@/components/shared/BookingTrendAnalysisCard";
import { formatCurrency } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { getStoredToken } from "@/lib/auth";
import type { ApiResponse } from "@/types/api";
import type { DashboardAiSummary, DashboardOwnerStatistics } from "@/types/dashboard";

const PIE_COLORS = ["#FF8000", "#86D232", "#60A5FA", "#F59E0B", "#A855F7"];
const QUICK_ACTIONS = [
  { label: "Create Venue", href: "/owner/venues/new" },
  { label: "Manage Venues", href: "/owner/venues" },
  { label: "Pricing Rules", href: "/owner/pricing" },
  { label: "Bookings", href: "/owner/bookings" },
] as const;

function OwnerMetric({
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

export default function OwnerDashboardPage() {
  const [stats, setStats] = useState<DashboardOwnerStatistics | null>(null);
  const [ai, setAi] = useState<DashboardAiSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setError("Missing owner session.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    Promise.all([
      apiFetch<ApiResponse<DashboardOwnerStatistics>>("/dashboard/owner/statistics", { token }),
      apiFetch<ApiResponse<DashboardAiSummary>>("/dashboard/owner/ai-summary", { token }),
    ])
      .then(([statsRes, aiRes]) => {
        setStats(statsRes.data);
        setAi(aiRes.data);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load owner analytics.");
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
        {error || "Unable to load owner analytics."}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">AI Analytics Dashboard</h1>
          <p className="mt-1 text-sm text-[#C4C7C9]">
            Revenue, utilization, customer behavior, and AI recommendations for your venues.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="rounded-lg border border-[rgba(134,210,50,0.2)] bg-[#0A0A0A] px-3 py-2 text-sm text-white transition hover:border-[rgba(255,128,0,0.45)]"
            >
              {action.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <OwnerMetric label="Revenue Today" value={formatCurrency(stats.revenueToday)} hint="Realized revenue today" icon={Wallet} />
        <OwnerMetric label="Revenue This Month" value={formatCurrency(stats.revenueThisMonth)} hint={`${stats.totalBookings} total bookings`} icon={TrendingUp} />
        <OwnerMetric label="Utilization Rate" value={`${stats.courtUtilizationRate}%`} hint={`${stats.cancellationStatistics.cancellationRate}% cancellation rate`} icon={Building2} />
        <OwnerMetric label="Returning Customers" value={stats.returningCustomers.toString()} hint={`${stats.totalReviews} reviews, ${stats.averageRating} average rating`} icon={Repeat} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <AIAnalyticsReport
          summary={ai.summary}
          fullReport={ai.fullReport}
          actions={ai.actions}
          riskItems={ai.riskItems}
          isFallback={ai.isFallback}
          className="xl:col-span-2"
        />
        <div className="space-y-6">
          <AIRecommendationsCard recommendations={ai.recommendations} />
          <ForecastCard forecast={ai.forecast.length > 0 ? ai.forecast : stats.revenueForecast} />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <RevenueAnalysisCard
          title="Revenue Chart"
          description="Revenue trend for the last tracked period."
          data={stats.revenueTrend}
        />
        <BookingTrendAnalysisCard
          title="Booking Trend Chart"
          description="Daily booking trend across your venues."
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
                  <Pie data={stats.sportDistribution} dataKey="count" nameKey="label" innerRadius={50} outerRadius={82} paddingAngle={4}>
                    {stats.sportDistribution.map((item, index) => (
                      <Cell key={item.label} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip {...chartTooltipProps} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {stats.sportDistribution.map((item, index) => (
                <div key={item.label} className="flex items-center justify-between text-sm text-slate-300">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                    {item.label}
                  </div>
                  <span>{item.count}</span>
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
                <BarChart data={stats.peakHours}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="label" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip {...chartTooltipProps} />
                  <Bar dataKey="count" fill="#86D232" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-slate-950/50 text-white">
          <CardHeader>
            <CardTitle className="text-base">Venue Performance Chart</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.venuePerformance.map((venue) => (
              <div key={venue.venueId} className="rounded-lg border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold">{venue.venueName}</p>
                  <Star className="h-4 w-4 text-[#FF8000]" />
                </div>
                <p className="mt-2 text-lg font-bold text-[#FF8000]">{formatCurrency(venue.revenue)}</p>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                  <span>{venue.bookingCount} bookings</span>
                  <span>{venue.averageRating} rating</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="border-white/10 bg-slate-950/50 text-white">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Most Popular Courts</CardTitle>
          <Link href="/owner/bookings" className="flex items-center gap-1 text-sm text-[#FF8000] hover:underline">
            Open bookings <ArrowRight className="h-4 w-4" />
          </Link>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {stats.mostPopularCourts.map((court) => (
            <div key={court.courtId} className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-semibold text-white">{court.courtName}</p>
              <p className="mt-2 text-lg font-bold text-[#86D232]">{court.bookingCount} bookings</p>
              <p className="mt-1 text-xs text-slate-400">{formatCurrency(court.revenue)} revenue</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
