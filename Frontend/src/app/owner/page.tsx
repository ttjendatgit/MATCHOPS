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
      {/* ── Welcome ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-heading">
            Quản lý sân của bạn
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Theo dõi hoạt động, lịch đặt và doanh thu từ tất cả cụm sân.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-4 py-2">
          <span className="text-xs text-slate-500">Hôm nay</span>
          <span className="h-3 w-px bg-slate-700" />
          <span className="text-xs font-medium text-slate-300">
            Thứ Sáu, 06/06/2026
          </span>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {/* Revenue */}
        <div className="col-span-2 rounded-xl border border-slate-800 bg-slate-900 p-5 lg:col-span-1">
          <div className="flex items-start justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <TrendingUp className="h-4.5 w-4.5 h-[18px] w-[18px] text-primary" />
            </div>
            <span className="flex items-center gap-1 text-xs font-medium text-emerald-400">
              <ArrowUpRight className="h-3 w-3" />
              +{mockRevenueDelta.revenue.value}%
            </span>
          </div>
          <p className="mt-3 text-xl font-bold tabular-nums text-white">
            {formatCurrency(mockKpis.revenueToday)}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">Doanh thu hôm nay</p>
        </div>

        {/* Bookings */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-start justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10">
              <CalendarCheck2 className="h-[18px] w-[18px] text-blue-400" />
            </div>
            <span className="flex items-center gap-1 text-xs font-medium text-emerald-400">
              <ArrowUpRight className="h-3 w-3" />
              +{mockRevenueDelta.bookings.value}
            </span>
          </div>
          <p className="mt-3 text-xl font-bold tabular-nums text-white">
            {mockKpis.bookingsToday}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">Lịch đặt hôm nay</p>
        </div>

        {/* Occupancy */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-start justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10">
              <Building2 className="h-[18px] w-[18px] text-violet-400" />
            </div>
            <span className="flex items-center gap-1 text-xs font-medium text-red-400">
              <ArrowDownRight className="h-3 w-3" />
              {mockRevenueDelta.occupancy.value}%
            </span>
          </div>
          <p className="mt-3 text-xl font-bold tabular-nums text-white">
            {mockKpis.occupancyRate}%
          </p>
          <p className="mt-0.5 text-xs text-slate-500">Tỷ lệ lấp đầy</p>
        </div>

        {/* Active venues */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10">
            <Building2 className="h-[18px] w-[18px] text-amber-400" />
          </div>
          <p className="mt-3 text-xl font-bold tabular-nums text-white">
            {mockKpis.activeVenues.current}
            <span className="text-sm font-normal text-slate-500">
              /{mockKpis.activeVenues.total}
            </span>
          </p>
          <p className="mt-0.5 text-xs text-slate-500">Cụm sân hoạt động</p>
        </div>

        {/* Pending */}
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10">
            <Clock className="h-[18px] w-[18px] text-amber-400" />
          </div>
          <p className="mt-3 text-xl font-bold tabular-nums text-white">
            {mockKpis.pendingApprovals}
          </p>
          <p className="mt-0.5 text-xs text-amber-500/80">Chờ duyệt</p>
        </div>
      </div>

      {/* ── Mid row: Revenue chart + Quick actions ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Revenue chart */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white">Doanh thu 7 ngày</h2>
              <p className="text-xs text-slate-500">T2 – CN tuần này</p>
            </div>
            <span className="text-xs font-medium text-primary">
              Tổng: 25.2M
            </span>
          </div>
          <div className="flex h-36 items-end gap-2">
            {mockRevenueChart.map((d) => (
              <div
                key={d.day}
                className="flex flex-1 flex-col items-center gap-1.5"
              >
                <span className="text-[9px] font-medium tabular-nums text-slate-500">
                  {d.label}
                </span>
                <div
                  className="w-full rounded-t-md bg-primary/25 transition-colors hover:bg-primary/50"
                  style={{ height: `${d.value}%` }}
                />
                <span className="text-[9px] text-slate-600">{d.day}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-slate-800 pt-3">
            <span className="text-xs text-slate-500">
              Cao nhất: Thứ Bảy – 5.0M
            </span>
            <Link
              href="/owner/revenue"
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              Xem chi tiết <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Quick actions */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="mb-4 text-sm font-semibold text-white">
            Thao tác nhanh
          </h2>
          <div className="space-y-2">
            {mockQuickActions.map((action) => (
              <Link
                key={action.href + action.label}
                href={action.href}
                className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-3 text-sm transition-colors hover:border-primary/30 hover:bg-primary/5"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10">
                  <Plus className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-200">
                    {action.label}
                  </p>
                  <p className="truncate text-xs text-slate-500">
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
        <div className="rounded-xl border border-slate-800 bg-slate-900 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
            <h2 className="text-sm font-semibold text-white">
              Lịch đặt gần đây
            </h2>
            <Link
              href="/owner/bookings"
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              Xem tất cả <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-slate-800">
            {mockRecentBookings.map((b) => (
              <div
                key={b.id}
                className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-slate-800/40"
              >
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-white">
                    {b.customerName}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {b.courtName} · {b.venueName}
                  </p>
                </div>
                <div className="hidden shrink-0 text-right sm:block">
                  <p className="text-xs text-slate-400">{b.time}</p>
                </div>
                <BookingStatusBadge status={b.status} />
                <p className="shrink-0 text-sm font-semibold tabular-nums text-slate-200">
                  {formatCurrency(b.amount)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Right column: Venue approvals + Checklist */}
        <div className="flex flex-col gap-4">
          {/* Venue approval panel */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">
                Trạng thái cụm sân
              </h2>
              <Link
                href="/owner/venues"
                className="text-xs text-primary hover:underline"
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
                  <p className="min-w-0 truncate text-xs text-slate-400">
                    {v.name}
                  </p>
                  <VenueStatusBadge status={v.status} />
                </div>
              ))}
            </div>
          </div>

          {/* Operations checklist */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">
                Thiết lập hồ sơ
              </h2>
              <span className="text-xs text-slate-500">
                {completedChecklist}/{mockChecklist.length}
              </span>
            </div>
            {/* Progress bar */}
            <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{
                  width: `${(completedChecklist / mockChecklist.length) * 100}%`,
                }}
              />
            </div>
            <ul className="space-y-2">
              {mockChecklist.map((item) => (
                <li key={item.id} className="flex items-center gap-2.5">
                  {item.done ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                  ) : (
                    <Circle className="h-4 w-4 shrink-0 text-slate-600" />
                  )}
                  <span
                    className={
                      item.done
                        ? "text-xs text-slate-400 line-through"
                        : "text-xs text-slate-300"
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
