"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  ChevronLeft,
  DollarSign,
  Download,
  Loader2,
  Receipt,
  TrendingUp,
  UserCog,
} from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api";
import { getStoredToken } from "@/lib/auth";
import { formatCurrency } from "@/lib/utils";
import type { ApiResponse } from "@/types/api";
import type { DashboardAiSummary, DashboardCoachStatistics } from "@/types/dashboard";
import type { TransactionHistoryResponse, TransactionItem } from "@/types/transaction";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RevenueAnalysisCard } from "@/components/shared/RevenueAnalysisCard";
import { AIAnalyticsReport } from "@/components/shared/AIAnalyticsReport";
import { AIRecommendationsCard } from "@/components/shared/AIRecommendationsCard";
import { ForecastCard } from "@/components/shared/ForecastCard";
import { TransactionHistoryTable } from "@/components/shared/TransactionHistoryTable";
import { toast } from "sonner";

function buildQuery(page: number) {
  return `/transactions/coach?page=${page}&pageSize=10`;
}

export default function CoachRevenuePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [stats, setStats] = useState<DashboardCoachStatistics | null>(null);
  const [ai, setAi] = useState<DashboardAiSummary | null>(null);
  const [history, setHistory] = useState<TransactionHistoryResponse | null>(null);

  const loadData = useCallback(async (token: string, currentPage: number) => {
    setLoading(true);
    try {
      const [statsRes, aiRes, historyRes] = await Promise.all([
        apiFetch<ApiResponse<DashboardCoachStatistics>>("/dashboard/coach/statistics", { token }),
        apiFetch<ApiResponse<DashboardAiSummary>>("/dashboard/coach/ai-summary", { token }),
        apiFetch<ApiResponse<TransactionHistoryResponse>>(buildQuery(currentPage), { token }),
      ]);
      setStats(statsRes.data);
      setAi(aiRes.data);
      setHistory(historyRes.data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        router.replace("/coach/apply");
        return;
      }
      console.error(err);
      toast.error("Không thể tải dữ liệu doanh thu huấn luyện viên.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      router.push("/login?redirect=/coach/manage/revenue");
      return;
    }
    loadData(token, page);
  }, [router, page, loadData]);

  const handleExportReport = () => {
    const items = history?.items ?? [];
    if (items.length === 0) {
      toast.error("Không có dữ liệu để xuất báo cáo.");
      return;
    }

    const rows = [
      ["Ma giao dich", "Mo ta", "Hoc vien", "So tien", "Trang thai", "Thoi gian"],
      ...items.map((item: TransactionItem) => [
        item.transactionCode ?? item.id,
        item.description,
        item.customerName ?? "",
        item.amount.toString(),
        item.status,
        item.paidAt ?? item.createdAt,
      ]),
    ];

    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `coach-revenue-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Xuất báo cáo thành công.");
  };

  if (loading && !history) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF8000]" />
      </div>
    );
  }

  const summary = history?.summary;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/coach/manage"
            className="mb-3 inline-flex items-center gap-1 text-xs text-slate-500 transition-colors hover:text-white"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Quản lý huấn luyện viên
          </Link>
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            <UserCog className="h-3.5 w-3.5 text-[#FF8000]" aria-hidden />
            Dashboard huấn luyện viên
          </div>
          <h1 className="text-2xl font-black text-white sm:text-3xl">Doanh thu & Giao dịch</h1>
          <p className="mt-2 text-sm text-slate-400">
            Theo dõi thu nhập từ các buổi huấn luyện và lịch sử thanh toán.
          </p>
        </div>
        <Button
          variant="outline"
          className="border-white/10 bg-slate-900/50 text-white gap-2"
          onClick={handleExportReport}
          disabled={(history?.items.length ?? 0) === 0}
        >
          <Download className="h-4 w-4" />
          Xuất báo cáo
        </Button>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-white/10 bg-slate-900/50">
          <CardContent className="p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[#FF8000]/10">
              <DollarSign className="h-5 w-5 text-[#FF8000]" />
            </div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Tổng doanh thu</p>
            <p className="mt-1 text-2xl font-bold text-white">
              {formatCurrency(stats?.totalRevenue ?? summary?.totalAmount ?? 0)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-slate-900/50">
          <CardContent className="p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[#86D232]/10">
              <TrendingUp className="h-5 w-5 text-[#86D232]" />
            </div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Doanh thu tháng này</p>
            <p className="mt-1 text-2xl font-bold text-white">
              {formatCurrency(stats?.revenueThisMonth ?? summary?.thisMonthAmount ?? 0)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-slate-900/50">
          <CardContent className="p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
              <Calendar className="h-5 w-5 text-amber-400" />
            </div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Doanh thu hôm nay</p>
            <p className="mt-1 text-2xl font-bold text-white">
              {formatCurrency(stats?.revenueToday ?? 0)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-slate-900/50">
          <CardContent className="p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
              <Receipt className="h-5 w-5 text-blue-400" />
            </div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Buổi đã thanh toán</p>
            <p className="mt-1 text-2xl font-bold text-white">{stats?.paidSessions ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      {stats?.revenueTrend && stats.revenueTrend.length > 0 && (
        <div className="mb-8">
          <RevenueAnalysisCard
            title="Biểu đồ doanh thu 14 ngày"
            description={`TB ${formatCurrency(stats.averageSessionRevenue)} / buổi · ${stats.pendingPaymentSessions} buổi chờ thanh toán`}
            data={stats.revenueTrend}
          />
        </div>
      )}

      {ai && (
        <div className="mb-8 grid gap-6 xl:grid-cols-3">
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
      )}

      <TransactionHistoryTable
        items={history?.items ?? []}
        loading={loading}
        showCustomer
        page={history?.page ?? page}
        pageSize={history?.pageSize ?? 10}
        totalCount={history?.totalCount ?? 0}
        onPageChange={setPage}
        emptyMessage="Chưa có giao dịch buổi huấn luyện nào."
      />
    </div>
  );
}
