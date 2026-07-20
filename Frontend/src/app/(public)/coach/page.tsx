"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import type { ApiResponse } from "@/types/api";
import type { PublicCoachListItem, PublicCoachListResponse } from "@/types/coach";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 9;
const DEBOUNCE_MS = 350;

interface Sport {
  id: string;
  name: string;
}

// ─── Pure helpers ─────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "HLV";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatLocation(city: string, district: string): string {
  const c = city.trim();
  const d = district.trim();
  if (d && c) return `${d}, ${c}`;
  return d || c || "Chưa cập nhật khu vực";
}

function formatHourlyRate(rate: number | null): string {
  if (rate === null) return "Liên hệ";
  return `${Math.round(rate / 1000)}k/giờ`;
}

// ─── Coach card ───────────────────────────────────────────────────────────────

function CoachCard({ coach }: { coach: PublicCoachListItem }) {
  return (
    <Link
      href={`/coach/${coach.id}`}
      className={cn(
        "group block overflow-hidden rounded-2xl border border-white/[0.08] p-5",
        "bg-gradient-to-b from-slate-900 to-slate-950 shadow-lg",
        "transition-all duration-300",
        "hover:-translate-y-0.5 hover:border-[#FF8000]/30",
        "hover:shadow-[0_8px_32px_rgba(255,128,0,0.15)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8000]/50",
      )}
    >
      {/* Header: avatar + name + location */}
      <div className="flex items-start gap-3">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF8000] to-[#86D232] text-sm font-black text-slate-950"
          aria-hidden
        >
          {getInitials(coach.displayName)}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-bold text-white transition-colors duration-200 group-hover:text-[#FF8000]">
            {coach.displayName}
          </h3>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
            <MapPin className="h-3 w-3 shrink-0 text-slate-600" aria-hidden />
            <span className="truncate">{formatLocation(coach.city, coach.district)}</span>
          </p>
        </div>
      </div>

      {/* Sport tags */}
      {coach.sports.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {coach.sports.map((s) => (
            <span
              key={s.sportId}
              className="inline-flex items-center rounded-full border border-[#FF8000]/30 bg-[rgba(255,128,0,0.10)] px-2 py-0.5 text-[10px] font-medium text-[#FF8000]"
            >
              {s.sportName}
            </span>
          ))}
        </div>
      )}

      {/* Bio preview */}
      {coach.bioPreview && (
        <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-slate-500">
          {coach.bioPreview}
        </p>
      )}

      {/* Footer: experience + price */}
      <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-3 text-xs">
        <span className="flex items-center gap-1 text-slate-500">
          <Briefcase className="h-3 w-3 shrink-0 text-slate-600" aria-hidden />
          {coach.experienceYears !== null
            ? `${coach.experienceYears} năm kinh nghiệm`
            : "Chưa cập nhật kinh nghiệm"}
        </span>
        <span className="font-semibold text-[#86D232]">
          {formatHourlyRate(coach.hourlyRate)}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-end gap-1 text-xs font-medium text-slate-600 transition-colors duration-200 group-hover:text-[#FF8000]">
        Xem chi tiết
        <ArrowRight className="h-3.5 w-3.5" aria-hidden />
      </div>
    </Link>
  );
}

// ─── Skeleton card ────────────────────────────────────────────────────────────

function CoachCardSkeleton() {
  return (
    <div
      className="animate-pulse rounded-2xl border border-white/[0.08] bg-slate-900/60 p-5"
      aria-hidden
    >
      <div className="flex items-start gap-3">
        <div className="h-12 w-12 shrink-0 rounded-xl bg-slate-800" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-2/3 rounded bg-slate-800" />
          <div className="h-3 w-1/2 rounded bg-slate-800" />
        </div>
      </div>
      <div className="mt-4 flex gap-1.5">
        <div className="h-5 w-16 rounded-full bg-slate-800" />
        <div className="h-5 w-14 rounded-full bg-slate-800" />
      </div>
      <div className="mt-4 space-y-1.5">
        <div className="h-3 w-full rounded bg-slate-800" />
        <div className="h-3 w-3/4 rounded bg-slate-800" />
      </div>
      <div className="mt-4 h-3 w-full rounded bg-slate-800" />
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({
  hasFilters,
  isError,
  onReset,
}: {
  hasFilters: boolean;
  isError: boolean;
  onReset: () => void;
}) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-slate-800/60 ring-1 ring-white/[0.06]">
        <Users className="h-8 w-8 text-slate-500" aria-hidden />
      </div>
      <h3 className="mb-2 text-base font-semibold text-white">
        {isError
          ? "Không thể tải danh sách huấn luyện viên"
          : hasFilters
          ? "Không tìm thấy huấn luyện viên phù hợp"
          : "Chưa có huấn luyện viên đang hoạt động"}
      </h3>
      <p className="mb-8 max-w-sm text-sm leading-relaxed text-slate-500">
        {isError
          ? "Đã có lỗi xảy ra khi kết nối tới máy chủ. Vui lòng thử lại sau."
          : hasFilters
          ? "Thử thay đổi bộ lọc hoặc từ khoá tìm kiếm để xem thêm kết quả."
          : "Các huấn luyện viên đã được MatchOps xác minh sẽ xuất hiện tại đây ngay khi có hồ sơ được duyệt."}
      </p>
      {hasFilters && (
        <button
          type="button"
          onClick={onReset}
          className={cn(
            "flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold",
            "bg-[#FF8000] text-white",
            "transition-all duration-200 hover:bg-[#FF8000]/85",
            "hover:shadow-[0_0_20px_rgba(255,128,0,0.4)] active:scale-[0.98]",
          )}
        >
          Xoá bộ lọc
        </button>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CoachPage() {
  const [coaches, setCoaches] = useState<PublicCoachListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sports, setSports] = useState<Sport[]>([]);

  const [searchRaw, setSearchRaw] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [sportId, setSportId] = useState("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [page, setPage] = useState(1);

  const hasFilters =
    searchRaw.trim() !== "" ||
    city.trim() !== "" ||
    district.trim() !== "" ||
    sportId !== "all" ||
    minPrice !== "" ||
    maxPrice !== "";

  const resetFilters = useCallback(() => {
    setSearchRaw("");
    setCity("");
    setDistrict("");
    setSportId("all");
    setMinPrice("");
    setMaxPrice("");
    setPage(1);
  }, []);

  // Sport options — fetched once from the existing public sports list.
  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch<ApiResponse<Sport[]>>("/sports");
        if (res.success && res.data) setSports(res.data);
      } catch {
        // Sport dropdown just stays empty — not fatal for the page.
      }
    })();
  }, []);

  // Any filter change (other than page itself) restarts pagination at 1.
  useEffect(() => {
    setPage(1);
  }, [searchRaw, city, district, sportId, minPrice, maxPrice]);

  const fetchCoaches = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchRaw.trim()) params.set("search", searchRaw.trim());
      if (city.trim()) params.set("city", city.trim());
      if (district.trim()) params.set("district", district.trim());
      if (sportId !== "all") params.set("sportId", sportId);
      if (minPrice) params.set("minHourlyRate", minPrice);
      if (maxPrice) params.set("maxHourlyRate", maxPrice);
      params.set("page", String(page));
      params.set("pageSize", String(PAGE_SIZE));

      const res = await apiFetch<ApiResponse<PublicCoachListResponse>>(
        `/coaches?${params.toString()}`
      );
      if (res.success && res.data) {
        setCoaches(res.data.items);
        setTotalCount(res.data.totalCount);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Không thể tải danh sách huấn luyện viên.";
      setError(message);
      setCoaches([]);
      setTotalCount(0);
      toast.error(message);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchRaw, city, district, sportId, minPrice, maxPrice, page]);

  // Debounced fetch — covers text input keystrokes as well as
  // select/price/page changes without needing separate timers.
  useEffect(() => {
    const t = setTimeout(() => {
      fetchCoaches();
    }, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [fetchCoaches]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* ── Hero ── */}
      <div className="relative mb-10 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-950 p-8 sm:p-10">
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-[#FF8000]/10 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-[#86D232]/10 blur-3xl"
          aria-hidden
        />
        <div className="relative z-10">
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-[#86D232]/30 bg-[#86D232]/10 px-3 py-1 text-xs font-semibold text-[#86D232]">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
            Đã được MatchOps xác minh
          </div>
          <h1 className="max-w-2xl text-3xl font-black leading-tight text-white sm:text-4xl">
            Tìm{" "}
            <span className="bg-gradient-to-r from-[#FF8000] to-[#86D232] bg-clip-text text-transparent">
              huấn luyện viên
            </span>{" "}
            phù hợp với bạn
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-400 sm:text-base">
            Duyệt qua danh sách huấn luyện viên đã được MatchOps xác minh theo môn thể thao và
            khu vực. Bạn có thể xem hồ sơ chi tiết để tìm người phù hợp — tính năng đặt lịch
            trực tiếp với huấn luyện viên sẽ sớm được ra mắt.
          </p>
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
            aria-hidden
          />
          <Input
            type="search"
            value={searchRaw}
            onChange={(e) => setSearchRaw(e.target.value)}
            placeholder="Tìm theo tên, giới thiệu..."
            aria-label="Tìm kiếm huấn luyện viên"
            className="h-11 border-white/[0.08] bg-slate-900 pl-9 pr-9 text-sm text-white placeholder:text-slate-500 focus-visible:border-[#FF8000]/40 focus-visible:ring-[#FF8000]/30"
          />
          {searchRaw && (
            <button
              type="button"
              onClick={() => setSearchRaw("")}
              aria-label="Xoá từ khoá tìm kiếm"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          )}
        </div>

        <label className="sr-only" htmlFor="coach-sport-filter">
          Lọc theo môn thể thao
        </label>
        <Select value={sportId} onValueChange={setSportId}>
          <SelectTrigger
            id="coach-sport-filter"
            className="h-11 w-full border-white/[0.08] bg-slate-900 text-sm text-white sm:w-44"
          >
            <div className="flex items-center gap-2">
              <Dumbbell className="h-4 w-4 text-slate-500" aria-hidden />
              <SelectValue placeholder="Môn thể thao" />
            </div>
          </SelectTrigger>
          <SelectContent className="border-white/10 bg-slate-900 text-white">
            <SelectItem value="all">Tất cả môn</SelectItem>
            {sports.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Tỉnh/thành phố"
          aria-label="Lọc theo tỉnh/thành phố"
          className="h-11 w-full border-white/[0.08] bg-slate-900 text-sm text-white placeholder:text-slate-500 focus-visible:border-[#FF8000]/40 focus-visible:ring-[#FF8000]/30 sm:w-40"
        />

        <Input
          value={district}
          onChange={(e) => setDistrict(e.target.value)}
          placeholder="Quận/huyện"
          aria-label="Lọc theo quận/huyện"
          className="h-11 w-full border-white/[0.08] bg-slate-900 text-sm text-white placeholder:text-slate-500 focus-visible:border-[#FF8000]/40 focus-visible:ring-[#FF8000]/30 sm:w-40"
        />

        <div className="flex w-full items-center gap-2 sm:w-auto">
          <label className="sr-only" htmlFor="coach-min-price">
            Giá tối thiểu mỗi giờ
          </label>
          <Input
            id="coach-min-price"
            type="number"
            min={0}
            inputMode="numeric"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            placeholder="Giá từ"
            className="h-11 w-full border-white/[0.08] bg-slate-900 text-sm text-white placeholder:text-slate-500 focus-visible:border-[#FF8000]/40 focus-visible:ring-[#FF8000]/30 sm:w-28"
          />
          <span className="text-slate-600" aria-hidden>
            –
          </span>
          <label className="sr-only" htmlFor="coach-max-price">
            Giá tối đa mỗi giờ
          </label>
          <Input
            id="coach-max-price"
            type="number"
            min={0}
            inputMode="numeric"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder="Giá đến"
            className="h-11 w-full border-white/[0.08] bg-slate-900 text-sm text-white placeholder:text-slate-500 focus-visible:border-[#FF8000]/40 focus-visible:ring-[#FF8000]/30 sm:w-28"
          />
        </div>
      </div>

      {/* ── Results meta ── */}
      <div className="mb-5 flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {loading ? (
            "Đang tải..."
          ) : (
            <>
              Tìm thấy <span className="font-semibold text-white">{totalCount}</span> huấn
              luyện viên
            </>
          )}
        </p>
        {hasFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="flex items-center gap-1.5 text-xs text-slate-500 transition-colors hover:text-[#FF8000]"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
            Xoá bộ lọc
          </button>
        )}
      </div>

      {/* ── Coach grid ── */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          Array.from({ length: PAGE_SIZE }).map((_, i) => <CoachCardSkeleton key={i} />)
        ) : coaches.length === 0 ? (
          <EmptyState hasFilters={hasFilters} isError={!!error} onReset={resetFilters} />
        ) : (
          coaches.map((coach) => <CoachCard key={coach.id} coach={coach} />)
        )}
      </div>

      {/* ── Pagination ── */}
      {!loading && coaches.length > 0 && totalPages > 1 && (
        <nav
          aria-label="Điều hướng danh sách huấn luyện viên"
          className="mt-10 flex items-center justify-center gap-4"
        >
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className={cn(
              "flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-300",
              "transition-colors hover:border-[#FF8000]/30 hover:text-white",
              "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-white/[0.08] disabled:hover:text-slate-300",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8000]/50",
            )}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
            Trước
          </button>
          <span className="text-sm text-slate-500" aria-live="polite">
            Trang <span className="font-semibold text-white">{page}</span> / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className={cn(
              "flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-300",
              "transition-colors hover:border-[#FF8000]/30 hover:text-white",
              "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-white/[0.08] disabled:hover:text-slate-300",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8000]/50",
            )}
          >
            Sau
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        </nav>
      )}

      {/* ── Honest note ── */}
      <div className="mt-12 flex items-start gap-3 rounded-2xl border border-white/[0.06] bg-slate-900/40 p-5">
        <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-[#FF8000]" aria-hidden />
        <p className="text-xs leading-relaxed text-slate-500">
          <BadgeCheck className="mr-1 inline h-3.5 w-3.5 text-[#86D232]" aria-hidden />
          Tất cả huấn luyện viên hiển thị ở đây đều đã được đội ngũ MatchOps xét duyệt hồ sơ.
          Chức năng đặt lịch trực tiếp với huấn luyện viên đang được phát triển và sẽ sớm ra
          mắt.
        </p>
      </div>
    </div>
  );
}
