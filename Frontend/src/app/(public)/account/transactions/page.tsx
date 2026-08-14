"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BackLink } from "@/components/shared/BackLink";
import { apiFetch } from "@/lib/api";
import { getStoredToken } from "@/lib/auth";
import type { ApiResponse } from "@/types/api";
import type { TransactionHistoryResponse } from "@/types/transaction";
import { TransactionHistoryTable } from "@/components/shared/TransactionHistoryTable";

function buildQuery(page: number) {
  return `/transactions/my?page=${page}&pageSize=10`;
}

export default function UserTransactionsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [history, setHistory] = useState<TransactionHistoryResponse | null>(null);

  const loadData = useCallback(async (token: string, currentPage: number) => {
    setLoading(true);
    try {
      const historyRes = await apiFetch<ApiResponse<TransactionHistoryResponse>>(
        buildQuery(currentPage),
        { token },
      );
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

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <BackLink href="/profile" label="Quay lại trang cá nhân" className="mb-8" />

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Lịch sử giao dịch</h1>
        <p className="mt-2 text-slate-400">
          Xem các giao dịch đặt sân, gói thành viên và thanh toán huấn luyện viên.
        </p>
      </div>

      <TransactionHistoryTable
        items={history?.items ?? []}
        loading={loading}
        page={history?.page ?? page}
        pageSize={history?.pageSize ?? 10}
        totalCount={history?.totalCount ?? 0}
        onPageChange={setPage}
        emptyMessage="Chưa có giao dịch nào."
      />
    </div>
  );
}
