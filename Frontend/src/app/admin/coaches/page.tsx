"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Search, RotateCcw, ChevronLeft, ChevronRight,
  Eye, AlertTriangle, UserCheck,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CoachStatusBadge } from "@/components/shared/StatusBadge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { apiFetch, ApiError } from "@/lib/api";
import { getStoredToken } from "@/lib/auth";
import type { ApiResponse } from "@/types/api";
import type { AdminCoachListItem, AdminCoachListResponse, CoachProfileStatus } from "@/types/coach";

interface Sport {
  id: string;
  name: string;
}

const STATUS_OPTIONS: { value: CoachProfileStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "Tất cả trạng thái" },
  { value: "PENDING_APPROVAL", label: "Chờ duyệt" },
  { value: "ACTIVE", label: "Đã duyệt" },
  { value: "REJECTED", label: "Từ chối" },
  { value: "SUSPENDED", label: "Tạm khóa" },
];

const PAGE_SIZE = 20;

function formatCurrency(value: number | null): string {
  if (value === null) return "—";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value);
}

function initials(name: string): string {
  return name.trim().slice(0, 2).toUpperCase() || "HL";
}

export default function AdminCoachesPage() {
  const [items, setItems] = useState<AdminCoachListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [sports, setSports] = useState<Sport[]>([]);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<CoachProfileStatus | "ALL">("ALL");
  const [cityInput, setCityInput] = useState("");
  const [city, setCity] = useState("");
  const [districtInput, setDistrictInput] = useState("");
  const [district, setDistrict] = useState("");
  const [sportId, setSportId] = useState<string>("ALL");

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // Debounce free-text inputs so we don't refetch on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    const t = setTimeout(() => {
      setCity(cityInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [cityInput]);

  useEffect(() => {
    const t = setTimeout(() => {
      setDistrict(districtInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [districtInput]);

  useEffect(() => {
    apiFetch<ApiResponse<Sport[]>>("/sports")
      .then((res) => setSports(res.data || []))
      .catch(() => {
        // Sport filter just stays empty if this fails — the rest of the page still works.
      });
  }, []);

  const fetchCoaches = useCallback(async () => {
    const token = getStoredToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (status !== "ALL") params.set("status", status);
      if (city) params.set("city", city);
      if (district) params.set("district", district);
      if (sportId !== "ALL") params.set("sportId", sportId);
      if (search) params.set("search", search);
      params.set("page", String(page));
      params.set("pageSize", String(PAGE_SIZE));

      const res = await apiFetch<ApiResponse<AdminCoachListResponse>>(
        `/admin/coaches?${params.toString()}`,
        { token }
      );
      if (res.success && res.data) {
        setItems(res.data.items);
        setTotalCount(res.data.totalCount);
      } else {
        setError(res.message || "Không thể tải danh sách huấn luyện viên.");
      }
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Không thể tải danh sách huấn luyện viên. Vui lòng thử lại.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [status, city, district, sportId, search, page]);

  useEffect(() => {
    fetchCoaches();
  }, [fetchCoaches]);

  const hasActiveFilters =
    status !== "ALL" || !!city || !!district || sportId !== "ALL" || !!search;

  const resetFilters = () => {
    setSearchInput("");
    setCityInput("");
    setDistrictInput("");
    setStatus("ALL");
    setSportId("ALL");
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-heading">Huấn luyện viên</h1>
          <p className="mt-1 text-sm text-slate-500">
            Xét duyệt hồ sơ ứng tuyển và quản lý trạng thái huấn luyện viên trên nền tảng.
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="relative lg:col-span-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#C4C7C9]/60" aria-hidden />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Tìm theo tên, email..."
                className="pl-9"
                aria-label="Tìm kiếm huấn luyện viên"
              />
            </div>

            <Select value={status} onValueChange={(v) => { setStatus(v as CoachProfileStatus | "ALL"); setPage(1); }}>
              <SelectTrigger aria-label="Lọc theo trạng thái">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
              placeholder="Tỉnh/thành phố"
              aria-label="Lọc theo tỉnh/thành phố"
            />

            <Input
              value={districtInput}
              onChange={(e) => setDistrictInput(e.target.value)}
              placeholder="Quận/huyện"
              aria-label="Lọc theo quận/huyện"
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <div className="w-full sm:w-56">
              <Select value={sportId} onValueChange={(v) => { setSportId(v); setPage(1); }}>
                <SelectTrigger aria-label="Lọc theo môn thể thao">
                  <SelectValue placeholder="Môn thể thao" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả môn thể thao</SelectItem>
                  {sports.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {hasActiveFilters && (
              <Button type="button" variant="ghost" size="sm" onClick={resetFilters} className="gap-1.5">
                <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                Xoá bộ lọc
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {loading ? (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-white/5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-4">
                  <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-white/5" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 w-40 animate-pulse rounded bg-white/5" />
                    <div className="h-3 w-56 animate-pulse rounded bg-white/5" />
                  </div>
                  <div className="h-5 w-20 animate-pulse rounded-full bg-white/5" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <AlertTriangle className="h-8 w-8 text-[#FF4B4B]" aria-hidden />
            <p className="text-sm text-[#C4C7C9]">{error}</p>
            <Button type="button" onClick={fetchCoaches} className="mt-1">Thử lại</Button>
          </CardContent>
        </Card>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <UserCheck className="h-8 w-8 text-[#C4C7C9]/40" aria-hidden />
            <p className="text-sm text-[#C4C7C9]">Chưa có hồ sơ huấn luyện viên phù hợp.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop table */}
          <Card className="hidden md:block">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/[0.02]">
                      <th scope="col" className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-[#C4C7C9]/70">Huấn luyện viên</th>
                      <th scope="col" className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-[#C4C7C9]/70">Khu vực</th>
                      <th scope="col" className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-[#C4C7C9]/70">Môn thể thao</th>
                      <th scope="col" className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-[#C4C7C9]/70">Kinh nghiệm</th>
                      <th scope="col" className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-[#C4C7C9]/70">Giá/giờ</th>
                      <th scope="col" className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-[#C4C7C9]/70">Trạng thái</th>
                      <th scope="col" className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-[#C4C7C9]/70">Ngày gửi</th>
                      <th scope="col" className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-[#C4C7C9]/70">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {items.map((c) => (
                      <tr key={c.id} className="transition-colors hover:bg-white/[0.03]">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarFallback className="bg-[#141414] text-xs text-[#86D232]">
                                {initials(c.displayName || c.userFullName)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="truncate font-medium text-white">{c.displayName || c.userFullName}</p>
                              <p className="truncate text-xs text-[#C4C7C9]/70">{c.userEmail}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-[#C4C7C9]">{c.district}, {c.city}</td>
                        <td className="px-5 py-4">
                          {c.sports.length === 0 ? (
                            <span className="text-xs text-[#C4C7C9]/50">—</span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {c.sports.slice(0, 2).map((s) => (
                                <span key={s.sportId} className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-[#C4C7C9]">{s.sportName}</span>
                              ))}
                              {c.sports.length > 2 && (
                                <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-[#C4C7C9]/70">+{c.sports.length - 2}</span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4 text-[#C4C7C9]">
                          {c.experienceYears !== null ? `${c.experienceYears} năm` : "—"}
                        </td>
                        <td className="px-5 py-4 text-[#C4C7C9]">{formatCurrency(c.hourlyRate)}</td>
                        <td className="px-5 py-4"><CoachStatusBadge status={c.status} /></td>
                        <td className="px-5 py-4 text-[#C4C7C9]/70">{new Date(c.createdAt).toLocaleDateString("vi-VN")}</td>
                        <td className="px-5 py-4 text-right">
                          <Button asChild size="sm" variant="outline" className="gap-1.5 text-xs">
                            <Link href={`/admin/coaches/${c.id}`}>
                              <Eye className="h-3.5 w-3.5" aria-hidden />
                              Xem hồ sơ
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Mobile stacked cards */}
          <div className="space-y-3 md:hidden">
            {items.map((c) => (
              <Card key={c.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarFallback className="bg-[#141414] text-xs text-[#86D232]">
                          {initials(c.displayName || c.userFullName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-white">{c.displayName || c.userFullName}</p>
                        <p className="truncate text-xs text-[#C4C7C9]/70">{c.userEmail}</p>
                      </div>
                    </div>
                    <CoachStatusBadge status={c.status} />
                  </div>

                  {c.sports.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {c.sports.map((s) => (
                        <span key={s.sportId} className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-[#C4C7C9]">{s.sportName}</span>
                      ))}
                    </div>
                  )}

                  <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                    <div>
                      <dt className="text-[#C4C7C9]/60">Khu vực</dt>
                      <dd className="mt-0.5 text-[#C4C7C9]">{c.district}, {c.city}</dd>
                    </div>
                    <div>
                      <dt className="text-[#C4C7C9]/60">Kinh nghiệm</dt>
                      <dd className="mt-0.5 text-[#C4C7C9]">{c.experienceYears !== null ? `${c.experienceYears} năm` : "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-[#C4C7C9]/60">Giá/giờ</dt>
                      <dd className="mt-0.5 text-[#C4C7C9]">{formatCurrency(c.hourlyRate)}</dd>
                    </div>
                    <div>
                      <dt className="text-[#C4C7C9]/60">Ngày gửi</dt>
                      <dd className="mt-0.5 text-[#C4C7C9]">{new Date(c.createdAt).toLocaleDateString("vi-VN")}</dd>
                    </div>
                  </dl>

                  <Button asChild size="sm" variant="outline" className="mt-4 w-full gap-1.5 text-xs">
                    <Link href={`/admin/coaches/${c.id}`}>
                      <Eye className="h-3.5 w-3.5" aria-hidden />
                      Xem hồ sơ
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between gap-3 px-1 text-sm text-slate-500">
            <p>
              Trang {page}/{totalPages} · {totalCount} hồ sơ
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="gap-1"
              >
                <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
                Trước
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="gap-1"
              >
                Sau
                <ChevronRight className="h-3.5 w-3.5" aria-hidden />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
