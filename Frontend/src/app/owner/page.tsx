"use client";

import { useState, useEffect, useMemo } from "react";
import {
  TrendingUp,
  CalendarCheck2,
  Building2,
  Clock,
  Plus,
  CheckCircle2,
  Circle,
  ArrowRight,
  Zap,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { BookingStatusBadge, VenueStatusBadge } from "@/components/shared/StatusBadge";
import { formatCurrency } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { getStoredToken } from "@/lib/auth";
import type { ApiResponse } from "@/types/api";
import type { BookingStatus } from "@/types/booking";
import type { VenueStatus } from "@/types/venue";

// ── DTOs ─────────────────────────────────────────────────────────────────────

interface BookingDto {
  id: string;
  venueName: string;
  courtName: string;
  customerName: string;
  bookingDate: string; // "YYYY-MM-DD" from DateOnly
  startTime: string;   // "HH:mm:ss"
  endTime: string;     // "HH:mm:ss"
  totalPrice: number;
  status: string;
  createdAt: string;   // ISO datetime — used to sort "recent" bookings
}

interface VenueDto {
  id: string;
  name: string;
  status: string;
}

// ── Static navigation shortcuts — not mock data ───────────────────────────────

const QUICK_ACTIONS = [
  { label: "Tạo cụm sân mới",  href: "/owner/venues/new", description: "Thêm địa điểm mới"       },
  { label: "Thêm sân",          href: "/owner/venues",     description: "Thêm sân vào cụm có sẵn"  },
  { label: "Chặn khung giờ",    href: "/owner/pricing",    description: "Khoá lịch không cho đặt"  },
  { label: "Xem lịch đặt",      href: "/owner/bookings",   description: "Toàn bộ đặt sân"           },
] as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Returns today's date as YYYY-MM-DD in local time (matches bookingDate from backend). */
function getTodayStr(): string {
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Returns the last 7 days (oldest first) as { dateStr, label } pairs. */
function getLast7Days(): { dateStr: string; label: string }[] {
  const labels = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i)); // oldest → newest
    const pad = (n: number) => n.toString().padStart(2, "0");
    const dateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    return { dateStr, label: labels[d.getDay()] };
  });
}

/** True if a booking should be counted toward revenue. */
function isRevenue(status: string): boolean {
  return status === "CONFIRMED" || status === "COMPLETED";
}

/** Compact currency label for chart bars: 5M, 500K, 250K … */
function shortCurrency(n: number): string {
  if (n === 0) return "";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000)     return `${Math.round(n / 1_000)}K`;
  return String(n);
}

/** Trim "HH:mm:ss" → "HH:mm". */
function hhmm(t: string): string {
  return t?.length >= 5 ? t.slice(0, 5) : t ?? "";
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function OwnerDashboardPage() {
  const [bookings, setBookings]   = useState<BookingDto[]>([]);
  const [venues,   setVenues]     = useState<VenueDto[]>([]);
  const [loading,  setLoading]    = useState(true);
  const [error,    setError]      = useState<string | null>(null);

  const fetchData = () => {
    const token = getStoredToken();
    if (!token) {
      setError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    Promise.all([
      apiFetch<ApiResponse<BookingDto[]>>("/owner/bookings", { token }),
      apiFetch<ApiResponse<VenueDto[]>>("/owner/venues",    { token }),
    ])
      .then(([bookingRes, venueRes]) => {
        setBookings(bookingRes.data ?? []);
        setVenues(venueRes.data   ?? []);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Không thể tải dữ liệu dashboard.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived KPIs ──────────────────────────────────────────────────────────

  const today    = getTodayStr();
  const last7    = useMemo(() => getLast7Days(), []);

  const revenueToday = useMemo(
    () => bookings
      .filter((b) => b.bookingDate === today && isRevenue(b.status))
      .reduce((s, b) => s + b.totalPrice, 0),
    [bookings, today],
  );

  const bookingsToday = useMemo(
    () => bookings.filter((b) => b.bookingDate === today).length,
    [bookings, today],
  );

  const activeVenues  = useMemo(() => venues.filter((v) => v.status === "ACTIVE").length,             [venues]);
  const totalVenues   = venues.length;
  const pendingCount  = useMemo(() => venues.filter((v) => v.status === "PENDING_APPROVAL").length,   [venues]);
  // Sort by createdAt DESC so we show the most recently placed bookings,
  // not bookings with the furthest future court date (the API sorts by bookingDate).
  const recentBookings = useMemo(
    () =>
      [...bookings]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5),
    [bookings],
  );

  // Revenue chart — last 7 days
  const revenueChart = useMemo(() => {
    const rows = last7.map(({ dateStr, label }) => ({
      label,
      raw: bookings
        .filter((b) => b.bookingDate === dateStr && isRevenue(b.status))
        .reduce((s, b) => s + b.totalPrice, 0),
    }));
    const max = Math.max(...rows.map((r) => r.raw), 1);
    return rows.map((r) => ({
      label: r.label,
      value:  Math.round((r.raw / max) * 100),
      raw:    r.raw,
    }));
  }, [bookings, last7]);

  const totalRevenue7 = useMemo(
    () => last7.reduce((s, { dateStr }) =>
      s + bookings.filter((b) => b.bookingDate === dateStr && isRevenue(b.status))
                  .reduce((ss, b) => ss + b.totalPrice, 0), 0),
    [bookings, last7],
  );

  const chartMaxValue = useMemo(
    () => Math.max(...revenueChart.map((d) => d.raw), 0),
    [revenueChart],
  );

  // Dynamic setup checklist
  const checklist = useMemo(() => [
    { id: "profile",  label: "Hồ sơ chủ sân",         done: true },
    { id: "venues",   label: "Cụm sân đã tạo",         done: venues.length > 0 },
    { id: "approved", label: "Sân đã được duyệt",      done: venues.some((v) => v.status === "ACTIVE") },
    { id: "booking",  label: "Đã có booking đầu tiên", done: bookings.length > 0 },
  ], [venues, bookings]);

  const completedCount = checklist.filter((c) => c.done).length;

  // Dynamic date display
  const todayDisplay = new Date().toLocaleDateString("vi-VN", {
    weekday: "long",
    day:     "2-digit",
    month:   "2-digit",
    year:    "numeric",
  });

  // ── Loading ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF8000]" />
        <p className="text-sm text-[#C4C7C9]/60">Đang tải dữ liệu...</p>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────

  if (error) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 rounded-xl border border-red-500/20 bg-red-950/20 p-12 text-center">
        <AlertCircle className="h-10 w-10 text-red-400" />
        <p className="text-sm text-red-400">{error}</p>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-950/30 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-950/50"
        >
          <RefreshCw className="h-4 w-4" />
          Thử lại
        </button>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* ── Welcome header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Zap className="h-5 w-5 text-[#FF8000]" />
            <h1 className="text-2xl font-bold text-white font-heading tracking-tight">
              Quản lý sân của bạn
            </h1>
          </div>
          <p className="text-sm text-[#C4C7C9]">
            Theo dõi hoạt động, lịch đặt và doanh thu từ tất cả cụm sân.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-[rgba(134,210,50,0.25)] bg-[#0A0A0A] px-4 py-2">
          <span className="text-xs text-[#C4C7C9]/60">Hôm nay</span>
          <span className="h-3 w-px bg-[rgba(134,210,50,0.3)]" />
          <span className="text-xs font-semibold text-[#86D232] capitalize">{todayDisplay}</span>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">

        {/* Revenue today */}
        <div className="col-span-2 rounded-xl border border-[rgba(255,128,0,0.3)] bg-[#0A0A0A] p-5 lg:col-span-1 relative overflow-hidden transition-all duration-200 motion-safe:hover:-translate-y-0.5 hover:border-[rgba(255,128,0,0.5)] hover:shadow-[0_0_20px_rgba(255,128,0,0.12)]">
          <div className="absolute inset-0 bg-gradient-to-br from-[rgba(255,128,0,0.06)] to-transparent pointer-events-none" />
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[rgba(255,128,0,0.15)] relative">
            <TrendingUp className="h-[18px] w-[18px] text-[#FF8000]" />
          </div>
          <p className="mt-3 text-xl font-bold tabular-nums text-white relative">
            {revenueToday > 0
              ? formatCurrency(revenueToday)
              : <span className="text-sm font-normal text-[#C4C7C9]/40">Chưa có</span>}
          </p>
          <p className="mt-0.5 text-xs text-[#C4C7C9]/60 relative">Doanh thu hôm nay</p>
        </div>

        {/* Bookings today */}
        <div className="rounded-xl border border-[rgba(134,210,50,0.28)] bg-[#0A0A0A] p-5 transition-all duration-200 motion-safe:hover:-translate-y-0.5 hover:border-[rgba(134,210,50,0.45)]">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[rgba(96,165,250,0.12)]">
            <CalendarCheck2 className="h-[18px] w-[18px] text-blue-400" />
          </div>
          <p className="mt-3 text-xl font-bold tabular-nums text-white">{bookingsToday}</p>
          <p className="mt-0.5 text-xs text-[#C4C7C9]/60">Lịch đặt hôm nay</p>
        </div>

        {/* Active venues */}
        <div className="rounded-xl border border-[rgba(134,210,50,0.28)] bg-[#0A0A0A] p-5 transition-all duration-200 motion-safe:hover:-translate-y-0.5 hover:border-[rgba(134,210,50,0.45)]">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[rgba(251,191,36,0.12)]">
            <Building2 className="h-[18px] w-[18px] text-amber-400" />
          </div>
          <p className="mt-3 text-xl font-bold tabular-nums text-white">
            {activeVenues}
            <span className="text-sm font-normal text-[#C4C7C9]/50">/{totalVenues}</span>
          </p>
          <p className="mt-0.5 text-xs text-[#C4C7C9]/60">Cụm sân hoạt động</p>
        </div>

        {/* Pending approvals */}
        <div className="rounded-xl border border-[rgba(251,191,36,0.35)] bg-[rgba(251,191,36,0.05)] p-5 transition-all duration-200 motion-safe:hover:-translate-y-0.5 hover:border-[rgba(251,191,36,0.55)]">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[rgba(251,191,36,0.12)]">
            <Clock className="h-[18px] w-[18px] text-amber-400" />
          </div>
          <p className="mt-3 text-xl font-bold tabular-nums text-white">{pendingCount}</p>
          <p className="mt-0.5 text-xs text-amber-400/70">Chờ duyệt</p>
        </div>
      </div>

      {/* ── Mid row: Revenue chart + Quick actions ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

        {/* Revenue chart — 7 days */}
        <div className="rounded-xl border border-[rgba(134,210,50,0.28)] bg-[#0A0A0A] p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white">Doanh thu 7 ngày</h2>
              <p className="text-xs text-[#C4C7C9]/60">7 ngày gần nhất</p>
            </div>
            <span className="text-xs font-semibold text-[#FF8000] bg-[rgba(255,128,0,0.1)] px-2 py-1 rounded-md">
              Tổng: {formatCurrency(totalRevenue7)}
            </span>
          </div>

          {chartMaxValue === 0 ? (
            /* Empty chart state */
            <div className="flex h-36 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-[rgba(134,210,50,0.15)]">
              <p className="text-xs text-[#C4C7C9]/30">Chưa có doanh thu trong 7 ngày qua</p>
            </div>
          ) : (
            <div className="flex h-36 items-end gap-1.5">
              {revenueChart.map((d, i) => {
                const isHighest = d.raw > 0 && d.raw === chartMaxValue;
                return (
                  <div key={`${d.label}-${i}`} className="flex flex-1 flex-col items-center gap-1.5">
                    <span className="text-[9px] font-semibold tabular-nums text-[#C4C7C9]/50 leading-none">
                      {d.raw > 0 ? shortCurrency(d.raw) : ""}
                    </span>
                    <div
                      title={d.raw > 0 ? formatCurrency(d.raw) : "Không có doanh thu"}
                      className={`w-full rounded-t-md transition-all hover:opacity-90 ${
                        isHighest
                          ? "bg-[#FF8000]"
                          : i % 2 === 0
                          ? "bg-[rgba(134,210,50,0.35)]"
                          : "bg-[rgba(255,128,0,0.2)]"
                      }`}
                      style={{ height: d.value > 0 ? `${Math.max(d.value, 4)}%` : "2px", opacity: d.value === 0 ? 0.2 : 1 }}
                    />
                    <span className="text-[9px] text-[#C4C7C9]/40">{d.label}</span>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-3 flex items-center justify-between border-t border-[rgba(134,210,50,0.15)] pt-3">
            <span className="text-xs text-[#C4C7C9]/50">
              {chartMaxValue > 0
                ? `Cao nhất: ${formatCurrency(chartMaxValue)}`
                : "Thêm booking để xem biểu đồ"}
            </span>
            <Link
              href="/owner/revenue"
              className="flex items-center gap-1 text-xs font-medium text-[#FF8000] hover:underline"
            >
              Xem chi tiết <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Quick actions */}
        <div className="rounded-xl border border-[rgba(134,210,50,0.28)] bg-[#0A0A0A] p-5">
          <h2 className="mb-4 text-sm font-semibold text-white">Thao tác nhanh</h2>
          <div className="space-y-2">
            {QUICK_ACTIONS.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="group flex items-center gap-3 rounded-lg border border-[rgba(134,210,50,0.15)] bg-[#141414] px-3 py-3 text-sm transition-all duration-200 hover:border-[rgba(255,128,0,0.35)] hover:bg-[rgba(255,128,0,0.06)] active:scale-[0.99]"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[rgba(255,128,0,0.12)]">
                  <Plus className="h-3.5 w-3.5 text-[#FF8000]" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">{action.label}</p>
                  <p className="truncate text-xs text-[#C4C7C9]/60">{action.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom row: Recent bookings + Venue status & Checklist ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

        {/* Recent bookings */}
        <div className="rounded-xl border border-[rgba(134,210,50,0.28)] bg-[#0A0A0A] lg:col-span-2 overflow-hidden">
          <div className="flex items-center justify-between border-b border-[rgba(134,210,50,0.15)] px-5 py-4">
            <h2 className="text-sm font-semibold text-white">Lịch đặt gần đây</h2>
            <Link
              href="/owner/bookings"
              className="flex items-center gap-1 text-xs font-medium text-[#FF8000] hover:underline"
            >
              Xem tất cả <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {recentBookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <CalendarCheck2 className="h-8 w-8 text-[#C4C7C9]/15" />
              <p className="text-sm text-[#C4C7C9]/40">Chưa có lịch đặt nào</p>
              <Link
                href="/owner/venues"
                className="text-xs font-medium text-[#FF8000] hover:underline"
              >
                Quản lý sân để bắt đầu nhận booking
              </Link>
            </div>
          ) : (
            recentBookings.map((b, i) => (
              <div
                key={b.id}
                className={`flex items-center gap-4 px-5 py-3.5 transition-colors duration-150 hover:bg-[#141414] ${
                  i < recentBookings.length - 1 ? "border-b border-[rgba(134,210,50,0.1)]" : ""
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{b.customerName}</p>
                  <p className="truncate text-xs text-[#C4C7C9]/60">
                    {b.courtName} · {b.venueName}
                  </p>
                </div>
                <div className="hidden shrink-0 text-right sm:block">
                  <p className="text-xs text-[#C4C7C9]/70">
                    {hhmm(b.startTime)} – {hhmm(b.endTime)}
                  </p>
                </div>
                <BookingStatusBadge status={b.status as BookingStatus} />
                <p className="shrink-0 text-sm font-bold tabular-nums text-[#FF8000]">
                  {formatCurrency(b.totalPrice)}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">

          {/* Venue status panel */}
          <div className="rounded-xl border border-[rgba(134,210,50,0.28)] bg-[#0A0A0A] p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">Trạng thái cụm sân</h2>
              <Link href="/owner/venues" className="text-xs font-medium text-[#FF8000] hover:underline">
                Quản lý
              </Link>
            </div>
            {venues.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-4 text-center">
                <Building2 className="h-6 w-6 text-[#C4C7C9]/15" />
                <p className="text-xs text-[#C4C7C9]/40">Chưa có cụm sân nào</p>
                <Link href="/owner/venues/new" className="text-xs font-medium text-[#FF8000] hover:underline">
                  Tạo ngay →
                </Link>
              </div>
            ) : (
              <div className="space-y-2.5">
                {venues.map((v) => (
                  <div key={v.id} className="flex items-center justify-between gap-3">
                    <p className="min-w-0 truncate text-xs text-[#C4C7C9]">{v.name}</p>
                    <VenueStatusBadge status={v.status as VenueStatus} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Dynamic setup checklist */}
          <div className="rounded-xl border border-[rgba(134,210,50,0.28)] bg-[#0A0A0A] p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">Thiết lập hồ sơ</h2>
              <span className="text-xs font-semibold text-[#86D232]">
                {completedCount}/{checklist.length}
              </span>
            </div>
            <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-[#141414]">
              <div
                className="h-full rounded-full bg-[#FF8000] transition-all shadow-[0_0_8px_rgba(255,128,0,0.5)]"
                style={{ width: `${(completedCount / checklist.length) * 100}%` }}
              />
            </div>
            <ul className="space-y-2">
              {checklist.map((item) => (
                <li key={item.id} className="flex items-center gap-2.5">
                  {item.done ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-[#86D232]" />
                  ) : (
                    <Circle className="h-4 w-4 shrink-0 text-[#C4C7C9]/30" />
                  )}
                  <span className={item.done ? "text-xs text-[#C4C7C9]/40 line-through" : "text-xs text-[#C4C7C9]"}>
                    {item.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
