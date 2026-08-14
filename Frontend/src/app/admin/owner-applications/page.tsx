"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  Building2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OwnerApplicationStatusBadge } from "@/components/shared/StatusBadge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiFetch } from "@/lib/api";
import { getStoredToken } from "@/lib/auth";
import type { ApiResponse } from "@/types/api";
import type {
  AdminOwnerApplicationListItem,
  AdminOwnerApplicationListResponse,
  OwnerApplicationStatus,
} from "@/types/owner-application";

const STATUS_OPTIONS: { value: OwnerApplicationStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "Tất cả trạng thái" },
  { value: "PENDING_APPROVAL", label: "Chờ duyệt" },
  { value: "APPROVED", label: "Đã duyệt" },
  { value: "REJECTED", label: "Từ chối" },
];

const PAGE_SIZE = 20;

export default function AdminOwnerApplicationsPage() {
  const [items, setItems] = useState<AdminOwnerApplicationListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<OwnerApplicationStatus | "ALL">("PENDING_APPROVAL");

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const loadItems = useCallback(async () => {
    const token = getStoredToken();
    if (!token) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
      });
      if (status !== "ALL") params.set("status", status);
      if (search) params.set("search", search);

      const res = await apiFetch<ApiResponse<AdminOwnerApplicationListResponse>>(
        `/admin/owner-applications?${params}`,
        { token }
      );
      setItems(res.data?.items ?? []);
      setTotalCount(res.data?.totalCount ?? 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Đăng ký chủ sân</h1>
        <p className="text-sm text-[#C4C7C9]">Duyệt hồ sơ đăng ký làm chủ sân trên nền tảng</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#C4C7C9]/50" />
          <Input
            placeholder="Tìm theo tên, email, cơ sở..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9 bg-[#0A0A0A] border-[rgba(134,210,50,0.2)] text-white"
          />
        </div>
        <Select value={status} onValueChange={(v) => { setStatus(v as OwnerApplicationStatus | "ALL"); setPage(1); }}>
          <SelectTrigger className="w-[180px] bg-[#0A0A0A] border-[rgba(134,210,50,0.2)] text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#0A0A0A] border-[rgba(134,210,50,0.2)]">
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="border-[rgba(134,210,50,0.2)] bg-[#0A0A0A] text-white">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgba(134,210,50,0.2)]">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#C4C7C9]/60">Người đăng ký</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#C4C7C9]/60">Cơ sở</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#C4C7C9]/60">Khu vực</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#C4C7C9]/60">Trạng thái</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#C4C7C9]/60">Ngày gửi</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[#C4C7C9]/60">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(134,210,50,0.15)]">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-[#C4C7C9]">Đang tải...</td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-[#C4C7C9]">Không có đơn đăng ký nào.</td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.id} className="hover:bg-[#141414]/50 transition-colors">
                      <td className="px-4 py-4">
                        <p className="font-medium text-white">{item.userFullName}</p>
                        <p className="text-xs text-[#C4C7C9]/60">{item.userEmail}</p>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-[#FF8000]" />
                          <span>{item.businessName}</span>
                        </div>
                        <p className="text-xs text-[#C4C7C9]/60 mt-0.5">{item.contactPhone}</p>
                      </td>
                      <td className="px-4 py-4 text-[#C4C7C9]">
                        {item.district}, {item.city}
                      </td>
                      <td className="px-4 py-4">
                        <OwnerApplicationStatusBadge status={item.status} />
                      </td>
                      <td className="px-4 py-4 text-[#C4C7C9]/60">
                        {new Date(item.createdAt).toLocaleDateString("vi-VN")}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <Button asChild variant="ghost" size="sm" className="text-[#86D232] hover:text-[#86D232]">
                          <Link href={`/admin/owner-applications/${item.id}`}>
                            <Eye className="mr-1 h-4 w-4" />
                            Xem
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-[rgba(134,210,50,0.15)] px-4 py-3">
              <p className="text-xs text-[#C4C7C9]/60">
                Trang {page}/{totalPages} · {totalCount} đơn
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="border-[rgba(134,210,50,0.2)]">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="border-[rgba(134,210,50,0.2)]">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
