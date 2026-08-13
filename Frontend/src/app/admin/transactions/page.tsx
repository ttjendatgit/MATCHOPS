"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DollarSign,
  Loader2,
  Receipt,
  TrendingUp,
  Users,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { getStoredToken } from "@/lib/auth";
import { formatCurrency } from "@/lib/utils";
import type { ApiResponse } from "@/types/api";
import type { DashboardAdminStatistics } from "@/types/dashboard";
import type { TransactionHistoryResponse } from "@/types/transaction";
import { Card, CardContent } from "@/components/ui/card";
import { RevenueAnalysisCard } from "@/components/shared/RevenueAnalysisCard";
import { TransactionHistoryTable } from "@/components/shared/TransactionHistoryTable";

function buildQuery(page: number) {
  return `/transactions/admin?page=${page}&pageSize=15`;
}

export default function AdminTransactionsPage() {
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [stats, setStats] = useState<DashboardAdminStatistics | null>(null);
  const [history, setHistory] = useState<TransactionHistoryResponse | null>(null);

  const loadData = useCallback(async (token: string, currentPage: number) => {
    setLoading(true);
    try {
      const [statsRes, historyRes] = await Promise.all([
        apiFetch<ApiResponse<DashboardAdminStatistics>>("/dashboard/admin/statistics", { token }),
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
    if (!token) return;
    loadData(token, page);
  }, [page, loadData]);

  if (loading && !history) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF8000]" />
      </div>
    );
  }

  const summary = history?.summary;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Doanh thu & Giao dịch</h1>
        <p className="mt-1 text-sm text-[#C4C7C9]">
          Thống kê doanh thu toàn nền tảng và lịch sử giao dịch chi tiết.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-[rgba(134,210,50,0.2)] bg-[#0A0A0A]">
          <CardContent className="p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[#FF8000]/10">
              <DollarSign className="h-5 w-5 text-[#FF8000]" />
            </div>
            <p className="text-xs uppercase tracking-wide text-[#C4C7C9]/60">Doanh thu nền tảng</p>
            <p className="mt-1 text-2xl font-bold text-white">
              {formatCurrency(stats?.totalRevenue ?? summary?.totalAmount ?? 0)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-[rgba(134,210,50,0.2)] bg-[#0A0A0A]">
          <CardContent className="p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[#86D232]/10">
              <TrendingUp className="h-5 w-5 text-[#86D232]" />
            </div>
            <p className="text-xs uppercase tracking-wide text-[#C4C7C9]/60">Giao dịch tháng này</p>
            <p className="mt-1 text-2xl font-bold text-white">
              {formatCurrency(summary?.thisMonthAmount ?? 0)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-[rgba(134,210,50,0.2)] bg-[#0A0A0A]">
          <CardContent className="p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
              <Receipt className="h-5 w-5 text-blue-400" />
            </div>
            <p className="text-xs uppercase tracking-wide text-[#C4C7C9]/60">Tổng giao dịch</p>
            <p className="mt-1 text-2xl font-bold text-white">{summary?.totalCount ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="border-[rgba(134,210,50,0.2)] bg-[#0A0A0A]">
          <CardContent className="p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
              <Users className="h-5 w-5 text-purple-400" />
            </div>
            <p className="text-xs uppercase tracking-wide text-[#C4C7C9]/60">Người dùng</p>
            <p className="mt-1 text-2xl font-bold text-white">{stats?.totalUsers ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      {stats?.monthlyRevenue && stats.monthlyRevenue.length > 0 && (
        <RevenueAnalysisCard
          title="Doanh thu theo tháng"
          description="6 tháng gần nhất trên toàn nền tảng"
          data={stats.monthlyRevenue}
          className="border-[rgba(134,210,50,0.2)] bg-[#0A0A0A] text-white"
        />
      )}

      <TransactionHistoryTable
        items={history?.items ?? []}
        loading={loading}
        showCustomer
        page={history?.page ?? page}
        pageSize={history?.pageSize ?? 15}
        totalCount={history?.totalCount ?? 0}
        onPageChange={setPage}
      />
    </div>
  );
}
