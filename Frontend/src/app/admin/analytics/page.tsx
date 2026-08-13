"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AIAnalyticsReport } from "@/components/shared/AIAnalyticsReport";
import { RevenueAnalysisCard } from "@/components/shared/RevenueAnalysisCard";
import { BookingTrendAnalysisCard } from "@/components/shared/BookingTrendAnalysisCard";
import { ForecastCard } from "@/components/shared/ForecastCard";
import { AIRecommendationsCard } from "@/components/shared/AIRecommendationsCard";
import { apiFetch } from "@/lib/api";
import { getStoredToken } from "@/lib/auth";
import type { ApiResponse } from "@/types/api";
import type { DashboardAdminStatistics, DashboardAiSummary } from "@/types/dashboard";

export default function AdminAnalyticsPage() {
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF8000]" />
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Phân tích dữ liệu</h1>
        <p className="text-sm text-[#C4C7C9]">Xem các thống kê và phân tích chi tiết về nền tảng</p>
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
          <ForecastCard forecast={ai.forecast} />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <RevenueAnalysisCard
          title="Biểu đồ doanh thu"
          description="Doanh thu hàng tháng của nền tảng từ các đơn đặt đã xác nhận và hoàn thành."
          data={stats.monthlyRevenue}
        />
        <BookingTrendAnalysisCard
          title="Biểu đồ xu hướng đặt sân"
          description="Số lượng đơn đặt hàng tháng trên nền tảng."
          data={stats.bookingTrend}
        />
      </div>
    </div>
  );
}
