import { Metadata } from "next";
import {
  TrendingUp,
  CalendarCheck2,
  Building2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  CheckCircle2,
  Circle,
  ArrowRight,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { BookingStatusBadge, VenueStatusBadge } from "@/components/shared/StatusBadge";
import { formatCurrency } from "@/lib/utils";
import {
  mockKpis,
  mockRevenueDelta,
  mockRevenueChart,
  mockRecentBookings,
  mockVenueApprovals,
  mockChecklist,
  mockQuickActions,
} from "@/lib/mock/ownerMockData";

export const metadata: Metadata = { title: "Dashboard – Owner | MatchOps" };

export default function OwnerDashboardPage() {
  const completedChecklist = mockChecklist.filter((c) => c.done).length;

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
          <span className="text-xs font-semibold text-[#86D232]">
            Thứ Sáu, 06/06/2026
          </span>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">

        {/* Revenue — highlighted card */}
        <div className="col-span-2 rounded-xl border border-[rgba(255,128,0,0.3)] bg-[#0A0A0A] p-5 lg:col-span-1 relative overflow-hidden transition-all duration-200 motion-safe:hover:-translate-y-0.5 hover:border-[rgba(255,128,0,0.5)] hover:shadow-[0_0_20px_rgba(255,128,0,0.12)]">
          <div className="absolute inset-0 bg-gradient-to-br from-[rgba(255,128,0,0.06)] to-transparent pointer-events-none" />
          <div className="flex items-start justify-between relative">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[rgba(255,128,0,0.15)]">
              <TrendingUp className="h-[18px] w-[18px] text-[#FF8000]" />
            </div>
            <span className="flex items-center gap-1 text-xs font-semibold text-[#86D232]">
              <ArrowUpRight className="h-3 w-3" />
              +{mockRevenueDelta.revenue.value}%
            </span>
          </div>
          <p className="mt-3 text-xl font-bold tabular-nums text-white relative">
            {formatCurrency(mockKpis.revenueToday)}
          </p>
          <p className="mt-0.5 text-xs text-[#C4C7C9]/60 relative">Doanh thu hôm nay</p>
        </div>

        {/* Bookings */}
        <div className="rounded-xl border border-[rgba(134,210,50,0.28)] bg-[#0A0A0A] p-5 transition-all duration-200 motion-safe:hover:-translate-y-0.5 hover:border-[rgba(134,210,50,0.45)]">
          <div className="flex items-start justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[rgba(96,165,250,0.12)]">
              <CalendarCheck2 className="h-[18px] w-[18px] text-blue-400" />
            </div>
            <span className="flex items-center gap-1 text-xs font-semibold text-[#86D232]">
              <ArrowUpRight className="h-3 w-3" />
              +{mockRevenueDelta.bookings.value}
            </span>
          </div>
          <p className="mt-3 text-xl font-bold tabular-nums text-white">
            {mockKpis.bookingsToday}
          </p>
          <p className="mt-0.5 text-xs text-[#C4C7C9]/60">Lịch đặt hôm nay</p>
        </div>

        {/* Occupancy */}
        <div className="rounded-xl border border-[rgba(134,210,50,0.28)] bg-[#0A0A0A] p-5 transition-all duration-200 motion-safe:hover:-translate-y-0.5 hover:border-[rgba(134,210,50,0.45)]">
          <div className="flex items-start justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[rgba(167,139,250,0.12)]">
              <Building2 className="h-[18px] w-[18px] text-violet-400" />
            </div>
            <span className="flex items-center gap-1 text-xs font-semibold text-[#FF4B4B]">
              <ArrowDownRight className="h-3 w-3" />
              {mockRevenueDelta.occupancy.value}%
            </span>
          </div>
          <p className="mt-3 text-xl font-bold tabular-nums text-white">
            {mockKpis.occupancyRate}%
          </p>
          <p className="mt-0.5 text-xs text-[#C4C7C9]/60">Tỷ lệ lấp đầy</p>
        </div>

        {/* Active venues */}
        <div className="rounded-xl border border-[rgba(134,210,50,0.28)] bg-[#0A0A0A] p-5 transition-all duration-200 motion-safe:hover:-translate-y-0.5 hover:border-[rgba(134,210,50,0.45)]">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[rgba(251,191,36,0.12)]">
            <Building2 className="h-[18px] w-[18px] text-amber-400" />
          </div>
          <p className="mt-3 text-xl font-bold tabular-nums text-white">
            {mockKpis.activeVenues.current}
            <span className="text-sm font-normal text-[#C4C7C9]/50">
              /{mockKpis.activeVenues.total}
            </span>
          </p>
          <p className="mt-0.5 text-xs text-[#C4C7C9]/60">Cụm sân hoạt động</p>
        </div>

        {/* Pending */}
        <div className="rounded-xl border border-[rgba(251,191,36,0.35)] bg-[rgba(251,191,36,0.05)] p-5 transition-all duration-200 motion-safe:hover:-translate-y-0.5 hover:border-[rgba(251,191,36,0.55)]">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[rgba(251,191,36,0.12)]">
            <Clock className="h-[18px] w-[18px] text-amber-400" />
          </div>
          <p className="mt-3 text-xl font-bold tabular-nums text-white">
            {mockKpis.pendingApprovals}
          </p>
          <p className="mt-0.5 text-xs text-amber-400/70">Chờ duyệt</p>
        </div>
      </div>

      {/* ── Mid row: Revenue chart + Quick actions ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

        {/* Revenue chart */}
        <div className="rounded-xl border border-[rgba(134,210,50,0.28)] bg-[#0A0A0A] p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white">Doanh thu 7 ngày</h2>
              <p className="text-xs text-[#C4C7C9]/60">T2 – CN tuần này</p>
            </div>
            <span className="text-xs font-semibold text-[#FF8000] bg-[rgba(255,128,0,0.1)] px-2 py-1 rounded-md">
              Tổng: 25.2M
            </span>
          </div>
          <div className="flex h-36 items-end gap-1.5">
            {mockRevenueChart.map((d, i) => {
              const isHighest = d.value === Math.max(...mockRevenueChart.map((x) => x.value));
              return (
                <div
                  key={d.day}
                  className="flex flex-1 flex-col items-center gap-1.5"
                >
                  <span className="text-[9px] font-semibold tabular-nums text-[#C4C7C9]/50">
                    {d.label}
                  </span>
                  <div
                    className={`w-full rounded-t-md transition-all hover:opacity-90 ${
                      isHighest
                        ? "bg-[#FF8000]"
                        : i % 2 === 0
                        ? "bg-[rgba(134,210,50,0.35)]"
                        : "bg-[rgba(255,128,0,0.2)]"
                    }`}
                    style={{ height: `${d.value}%` }}
                  />
                  <span className="text-[9px] text-[#C4C7C9]/40">{d.day}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-[rgba(134,210,50,0.15)] pt-3">
            <span className="text-xs text-[#C4C7C9]/50">
              Cao nhất: Thứ Bảy – 5.0M
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
          <h2 className="mb-4 text-sm font-semibold text-white">
            Thao tác nhanh
          </h2>
          <div className="space-y-2">
            {mockQuickActions.map((action) => (
              <Link
                key={action.href + action.label}
                href={action.href}
                className="group flex items-center gap-3 rounded-lg border border-[rgba(134,210,50,0.15)] bg-[#141414] px-3 py-3 text-sm transition-all duration-200 hover:border-[rgba(255,128,0,0.35)] hover:bg-[rgba(255,128,0,0.06)] active:scale-[0.99]"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[rgba(255,128,0,0.12)]">
                  <Plus className="h-3.5 w-3.5 text-[#FF8000]" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">
                    {action.label}
                  </p>
                  <p className="truncate text-xs text-[#C4C7C9]/60">
                    {action.description}
                  </p>
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
            <h2 className="text-sm font-semibold text-white">
              Lịch đặt gần đây
            </h2>
            <Link
              href="/owner/bookings"
              className="flex items-center gap-1 text-xs font-medium text-[#FF8000] hover:underline"
            >
              Xem tất cả <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div>
            {mockRecentBookings.map((b, i) => (
              <div
                key={b.id}
                className={`flex items-center gap-4 px-5 py-3.5 transition-colors duration-150 hover:bg-[#141414] ${
                  i < mockRecentBookings.length - 1
                    ? "border-b border-[rgba(134,210,50,0.1)]"
                    : ""
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-semibold text-white">
                    {b.customerName}
                  </p>
                  <p className="truncate text-xs text-[#C4C7C9]/60">
                    {b.courtName} · {b.venueName}
                  </p>
                </div>
                <div className="hidden shrink-0 text-right sm:block">
                  <p className="text-xs text-[#C4C7C9]/70">{b.time}</p>
                </div>
                <BookingStatusBadge status={b.status} />
                <p className="shrink-0 text-sm font-bold tabular-nums text-[#FF8000]">
                  {formatCurrency(b.amount)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">

          {/* Venue approval panel */}
          <div className="rounded-xl border border-[rgba(134,210,50,0.28)] bg-[#0A0A0A] p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">
                Trạng thái cụm sân
              </h2>
              <Link
                href="/owner/venues"
                className="text-xs font-medium text-[#FF8000] hover:underline"
              >
                Quản lý
              </Link>
            </div>
            <div className="space-y-2.5">
              {mockVenueApprovals.map((v) => (
                <div
                  key={v.id}
                  className="flex items-center justify-between gap-3"
                >
                  <p className="min-w-0 truncate text-xs text-[#C4C7C9]">
                    {v.name}
                  </p>
                  <VenueStatusBadge status={v.status} />
                </div>
              ))}
            </div>
          </div>

          {/* Operations checklist */}
          <div className="rounded-xl border border-[rgba(134,210,50,0.28)] bg-[#0A0A0A] p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">
                Thiết lập hồ sơ
              </h2>
              <span className="text-xs font-semibold text-[#86D232]">
                {completedChecklist}/{mockChecklist.length}
              </span>
            </div>
            {/* Progress bar */}
            <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-[#141414]">
              <div
                className="h-full rounded-full bg-[#FF8000] transition-all shadow-[0_0_8px_rgba(255,128,0,0.5)]"
                style={{
                  width: `${(completedChecklist / mockChecklist.length) * 100}%`,
                }}
              />
            </div>
            <ul className="space-y-2">
              {mockChecklist.map((item) => (
                <li key={item.id} className="flex items-center gap-2.5">
                  {item.done ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-[#86D232]" />
                  ) : (
                    <Circle className="h-4 w-4 shrink-0 text-[#C4C7C9]/30" />
                  )}
                  <span
                    className={
                      item.done
                        ? "text-xs text-[#C4C7C9]/40 line-through"
                        : "text-xs text-[#C4C7C9]"
                    }
                  >
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
