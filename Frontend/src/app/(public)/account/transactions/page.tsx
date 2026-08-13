"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DollarSign,
  Loader2,
  Receipt,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { getStoredToken } from "@/lib/auth";
import { formatCurrency } from "@/lib/utils";
import type { ApiResponse } from "@/types/api";
import type { DashboardUserStatistics } from "@/types/dashboard";
import type { TransactionHistoryResponse } from "@/types/transaction";
import { Card, CardContent } from "@/components/ui/card";
import { RevenueAnalysisCard } from "@/components/shared/RevenueAnalysisCard";
import { TransactionHistoryTable } from "@/components/shared/TransactionHistoryTable";

function buildQuery(page: number) {
  return `/transactions/my?page=${page}&pageSize=10`;
}

export default function UserTransactionsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [stats, setStats] = useState<DashboardUserStatistics | null>(null);
  const [history, setHistory] = useState<TransactionHistoryResponse | null>(null);

  const loadData = useCallback(async (token: string, currentPage: number) => {
    setLoading(true);
    try {
      const [statsRes, historyRes] = await Promise.all([
        apiFetch<ApiResponse<DashboardUserStatistics>>("/dashboard/user/statistics", { token }),
        apiFetch<ApiResponse<TransactionHistoryResponse>>(buildQuery(currentPage), { token }),
      ]);
      setStats(statsRes.data);
      setHistory(historyRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      router.push("/login?redirect=/account/transactions");
      return;
    }
    loadData(token, page);
  }, [router, page, loadData]);

  if (loading && !history) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF8000]" />
      </div>
    );
  }

  const spending = stats?.spendingStatistics;
  const summary = history?.summary;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Dashboard chi tiêu</h1>
        <p className="mt-2 text-slate-400">
          Theo dõi chi tiêu đặt sân, gói thành viên và lịch sử giao dịch.
        </p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-white/10 bg-slate-900/50">
          <CardContent className="p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[#FF8000]/10">
              <Wallet className="h-5 w-5 text-[#FF8000]" />
            </div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Tổng chi tiêu</p>
            <p className="mt-1 text-2xl font-bold text-white">
              {formatCurrency(summary?.totalAmount ?? spending?.totalSpent ?? 0)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-slate-900/50">
          <CardContent className="p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[#86D232]/10">
              <TrendingUp className="h-5 w-5 text-[#86D232]" />
            </div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Tháng này</p>
            <p className="mt-1 text-2xl font-bold text-white">
              {formatCurrency(summary?.thisMonthAmount ?? spending?.thisMonthSpent ?? 0)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-slate-900/50">
          <CardContent className="p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
              <Receipt className="h-5 w-5 text-blue-400" />
            </div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Giao dịch</p>
            <p className="mt-1 text-2xl font-bold text-white">{summary?.totalCount ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-slate-900/50">
          <CardContent className="p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
              <DollarSign className="h-5 w-5 text-amber-400" />
            </div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Chi tiêu TB</p>
            <p className="mt-1 text-2xl font-bold text-white">
              {formatCurrency(spending?.averageSpend ?? 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {stats?.spendingTrend && stats.spendingTrend.length > 0 && (
        <div className="mb-8">
          <RevenueAnalysisCard
            title="Xu hướng chi tiêu"
            description="Chi tiêu theo tháng trong 6 tháng gần nhất"
            data={stats.spendingTrend}
          />
        </div>
      )}

      <TransactionHistoryTable
        items={history?.items ?? []}
        loading={loading}
        page={history?.page ?? page}
        pageSize={history?.pageSize ?? 10}
        totalCount={history?.totalCount ?? 0}
        onPageChange={setPage}
      />
    </div>
  );
}
