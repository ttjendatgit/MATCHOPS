"use client";

import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency } from "@/lib/utils";
import type { TransactionItem } from "@/types/transaction";

const METHOD_LABELS: Record<string, string> = {
  MOCK: "Mock",
  CASH: "Tiền mặt",
  BANK_TRANSFER: "Chuyển khoản",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Đang chờ",
  SUCCESS: "Thành công",
  FAILED: "Thất bại",
  REFUNDED: "Hoàn tiền",
};

const TYPE_LABELS: Record<string, string> = {
  BOOKING: "Đặt sân",
  MEMBERSHIP: "Gói thành viên",
  COACH_SESSION: "Huấn luyện",
};

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusClass(status: string) {
  switch (status) {
    case "SUCCESS":
      return "bg-[#86D232]/10 text-[#86D232]";
    case "PENDING":
      return "bg-amber-500/10 text-amber-500";
    case "FAILED":
      return "bg-red-500/10 text-red-400";
    case "REFUNDED":
      return "bg-slate-500/10 text-slate-400";
    default:
      return "bg-slate-500/10 text-slate-400";
  }
}

type Props = {
  items: TransactionItem[];
  loading?: boolean;
  showCustomer?: boolean;
  page: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  emptyMessage?: string;
  variant?: "light" | "dark";
};

export function TransactionHistoryTable({
  items,
  loading = false,
  showCustomer = false,
  page,
  pageSize,
  totalCount,
  onPageChange,
  emptyMessage = "Chưa có giao dịch nào.",
  variant = "dark",
}: Props) {
  const isDark = variant === "dark";
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border",
        isDark
          ? "border-[rgba(134,210,50,0.28)] bg-[#0A0A0A]"
          : "border-slate-200 bg-white"
      )}
    >
      <div
        className={cn(
          "border-b px-5 py-4",
          isDark ? "border-[rgba(134,210,50,0.15)] bg-[#141414]" : "border-slate-200 bg-slate-50"
        )}
      >
        <h3 className={cn("text-sm font-bold", isDark ? "text-white" : "text-slate-900")}>
          Lịch sử giao dịch
        </h3>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-[#FF8000]" />
        </div>
      ) : items.length === 0 ? (
        <p className={cn("px-5 py-12 text-center text-sm", isDark ? "text-[#C4C7C9]/60" : "text-slate-500")}>
          {emptyMessage}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead
              className={cn(
                "border-b",
                isDark ? "border-[rgba(134,210,50,0.1)] bg-[#030303]" : "border-slate-200 bg-slate-100"
              )}
            >
              <tr>
                <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#C4C7C9]/40">
                  Mô tả
                </th>
                <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#C4C7C9]/40">
                  Loại
                </th>
                {showCustomer && (
                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#C4C7C9]/40">
                    Khách hàng
                  </th>
                )}
                <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#C4C7C9]/40">
                  Phương thức
                </th>
                <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#C4C7C9]/40">
                  Thời gian
                </th>
                <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#C4C7C9]/40">
                  Số tiền
                </th>
                <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-[#C4C7C9]/40">
                  Trạng thái
                </th>
              </tr>
            </thead>
            <tbody className={cn("divide-y", isDark ? "divide-[rgba(134,210,50,0.05)]" : "divide-slate-100")}>
              {items.map((item) => (
                <tr
                  key={`${item.type}-${item.id}`}
                  className={cn(
                    "transition-colors",
                    isDark ? "hover:bg-[#141414]" : "hover:bg-slate-50"
                  )}
                >
                  <td className="px-5 py-4">
                    <p className={cn("text-xs font-medium", isDark ? "text-white" : "text-slate-900")}>
                      {item.description}
                    </p>
                    {item.transactionCode && (
                      <p className="mt-0.5 font-mono text-[10px] text-[#C4C7C9]/50">
                        #{item.transactionCode}
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-4 text-xs text-[#C4C7C9]/70">
                    {TYPE_LABELS[item.type] ?? item.type}
                  </td>
                  {showCustomer && (
                    <td className="px-5 py-4">
                      <p className={cn("text-xs", isDark ? "text-white" : "text-slate-900")}>
                        {item.customerName ?? "—"}
                      </p>
                      {item.customerEmail && (
                        <p className="text-[10px] text-[#C4C7C9]/50">{item.customerEmail}</p>
                      )}
                    </td>
                  )}
                  <td className="px-5 py-4 text-xs text-[#C4C7C9]/70">
                    {METHOD_LABELS[item.method] ?? item.method}
                  </td>
                  <td className="px-5 py-4 text-xs text-[#C4C7C9]/70">
                    {formatDate(item.paidAt ?? item.createdAt)}
                  </td>
                  <td className="px-5 py-4 text-xs font-bold text-[#FF8000]">
                    {formatCurrency(item.amount)}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span className={cn("rounded px-2 py-0.5 text-[10px] font-bold", statusClass(item.status))}>
                      {STATUS_LABELS[item.status] ?? item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalCount > pageSize && (
        <div
          className={cn(
            "flex items-center justify-between border-t px-5 py-3",
            isDark ? "border-[rgba(134,210,50,0.1)]" : "border-slate-200"
          )}
        >
          <p className="text-xs text-[#C4C7C9]/60">
            Trang {page}/{totalPages} · {totalCount} giao dịch
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="h-8 border-white/10 bg-transparent text-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="h-8 border-white/10 bg-transparent text-white"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
