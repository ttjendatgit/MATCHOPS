"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BarChart2,
  Calendar,
  DollarSign,
  Download,
  Loader2,
  Receipt,
  TrendingUp,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { getStoredToken } from "@/lib/auth";
import { formatCurrency } from "@/lib/utils";
import type { ApiResponse } from "@/types/api";
import type { DashboardOwnerStatistics } from "@/types/dashboard";
import type { TransactionHistoryResponse, TransactionItem } from "@/types/transaction";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RevenueAnalysisCard } from "@/components/shared/RevenueAnalysisCard";
import { TransactionHistoryTable } from "@/components/shared/TransactionHistoryTable";
import { toast } from "sonner";

function buildQuery(page: number) {
  return `/transactions/owner?page=${page}&pageSize=10`;
}

export default function OwnerRevenuePage() {
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [stats, setStats] = useState<DashboardOwnerStatistics | null>(null);
  const [history, setHistory] = useState<TransactionHistoryResponse | null>(null);

  const loadData = useCallback(async (token: string, currentPage: number) => {
    setLoading(true);
    try {
      const [statsRes, historyRes] = await Promise.all([
        apiFetch<ApiResponse<DashboardOwnerStatistics>>("/dashboard/owner/statistics", { token }),
        apiFetch<ApiResponse<TransactionHistoryResponse>>(buildQuery(currentPage), { token }),
      ]);
      setStats(statsRes.data);
      setHistory(historyRes.data);
    } catch (err) {
      console.error(err);
      toast.error("Không thể tải dữ liệu doanh thu.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;
    loadData(token, page);
  }, [page, loadData]);

  const handleExportReport = () => {
    const items = history?.items ?? [];
    if (items.length === 0) {
      toast.error("Không có dữ liệu để xuất báo cáo.");
      return;
    }

    const rows = [
      ["Ma giao dich", "Mo ta", "So tien", "Phuong thuc", "Trang thai", "Thoi gian"],
      ...items.map((item: TransactionItem) => [
        item.transactionCode ?? item.id,
        item.description,
        item.amount.toString(),
        item.method,
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
    link.download = `owner-revenue-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Xuất báo cáo thành công.");
  };

  if (loading && !history) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF8000]" />
      </div>
    );
  }

  const summary = history?.summary;
  const avgOrder =
    summary && summary.successCount > 0
      ? summary.totalAmount / summary.successCount
      : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-heading tracking-tight">Doanh thu</h1>
          <p className="mt-1 text-sm text-[#C4C7C9]">
            Theo dõi hiệu quả kinh doanh và lịch sử giao dịch từ các cụm sân.
          </p>
        </div>
        <Button
          variant="outline"
          className="border-[rgba(134,210,50,0.2)] bg-[#141414] text-white gap-2"
          onClick={handleExportReport}
          disabled={(history?.items.length ?? 0) === 0}
        >
          <Download className="h-4 w-4" />
          Xuất báo cáo
        </Button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-[#0A0A0A] border-[rgba(134,210,50,0.28)]">
          <CardContent className="p-6">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-[#FF8000]/10">
              <DollarSign className="h-5 w-5 text-[#FF8000]" />
            </div>
            <p className="text-xs uppercase tracking-wider font-bold text-[#C4C7C9]/60">Tổng doanh thu</p>
            <p className="mt-1 text-2xl font-black text-white">
              {formatCurrency(summary?.totalAmount ?? 0)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[#0A0A0A] border-[rgba(134,210,50,0.28)]">
          <CardContent className="p-6">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-[#86D232]/10">
              <TrendingUp className="h-5 w-5 text-[#86D232]" />
            </div>
            <p className="text-xs uppercase tracking-wider font-bold text-[#C4C7C9]/60">Doanh thu tháng này</p>
            <p className="mt-1 text-2xl font-black text-white">
              {formatCurrency(stats?.revenueThisMonth ?? summary?.thisMonthAmount ?? 0)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[#0A0A0A] border-[rgba(134,210,50,0.28)]">
          <CardContent className="p-6">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
              <Calendar className="h-5 w-5 text-amber-500" />
            </div>
            <p className="text-xs uppercase tracking-wider font-bold text-[#C4C7C9]/60">Doanh thu hôm nay</p>
            <p className="mt-1 text-2xl font-black text-white">
              {formatCurrency(stats?.revenueToday ?? 0)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[#0A0A0A] border-[rgba(134,210,50,0.28)]">
          <CardContent className="p-6">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
              <Receipt className="h-5 w-5 text-blue-500" />
            </div>
            <p className="text-xs uppercase tracking-wider font-bold text-[#C4C7C9]/60">Giá TB / giao dịch</p>
            <p className="mt-1 text-2xl font-black text-white">{formatCurrency(avgOrder)}</p>
          </CardContent>
        </Card>
      </div>

      {stats?.revenueTrend && stats.revenueTrend.length > 0 && (
        <RevenueAnalysisCard
          title="Biểu đồ doanh thu 14 ngày"
          description="Doanh thu thực tế từ các đơn đặt sân đã thanh toán"
          data={stats.revenueTrend}
          className="border-[rgba(134,210,50,0.28)] bg-[#0A0A0A] text-white"
        />
      )}

      {!stats?.revenueTrend?.length && (
        <Card className="bg-[#0A0A0A] border-[rgba(134,210,50,0.28)] overflow-hidden">
          <CardContent className="flex flex-col items-center p-12 text-center">
            <BarChart2 className="mb-4 h-12 w-12 text-[#C4C7C9]/30" />
            <p className="text-sm text-[#C4C7C9]/60">Chưa có dữ liệu biểu đồ doanh thu.</p>
          </CardContent>
        </Card>
      )}

      <TransactionHistoryTable
        items={history?.items ?? []}
        loading={loading}
        showCustomer
        page={history?.page ?? page}
        pageSize={history?.pageSize ?? 10}
        totalCount={history?.totalCount ?? 0}
        onPageChange={setPage}
      />
    </div>
  );
}
