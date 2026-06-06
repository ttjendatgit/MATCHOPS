"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CalendarCheck2,
  CalendarDays,
  Clock,
  Dumbbell,
  Hash,
  Timer,
} from "lucide-react";
import { BookingStatusBadge, PaymentStatusBadge } from "@/components/shared/StatusBadge";
import { cn, formatCurrency } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { getStoredToken } from "@/lib/auth";
import type { ApiResponse } from "@/types/api";
import type { Booking } from "@/types/booking";
import {
  type DisplayBooking,
  type FilterKey,
  FILTER_TABS,
  matchesFilter,
  normalizeBooking,
  formatDuration,
  formatDateVNShort,
  PAYMENT_LABELS_SHORT,
} from "@/lib/bookingDisplayUtils";

// ─── Booking card ─────────────────────────────────────────────────────────────

function BookingCard({ booking }: { booking: DisplayBooking }) {
  return (
    <Link
      href={`/bookings/${booking.id}`}
      className={cn(
        "group block overflow-hidden rounded-2xl border border-white/[0.08]",
        "bg-gradient-to-b from-slate-900 to-slate-950 shadow-lg",
        "transition-all duration-200",
        "hover:border-emerald-500/30 hover:shadow-[0_0_24px_rgba(16,185,129,0.1)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50",
      )}
    >
      <div className="relative p-5">
        {/* Subtle emerald tint */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-16 rounded-t-2xl bg-gradient-to-b from-emerald-500/[0.04] to-transparent"
          aria-hidden
        />

        <div className="relative">
          {/* ── Top row: court name + status badges ── */}
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="mb-0.5 flex flex-wrap items-center gap-2">
                <h3 className="truncate text-base font-bold text-white leading-snug">
                  {booking.courtName}
                </h3>
                {booking.sportName && (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-800/40 bg-emerald-900/30 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                    <Dumbbell className="h-2.5 w-2.5" aria-hidden />
                    {booking.sportName}
                  </span>
                )}
              </div>
              <p className="flex items-center gap-1 text-sm text-slate-400">
                <Building2 className="h-3 w-3 shrink-0 text-slate-600" aria-hidden />
                {booking.venueName}
              </p>
            </div>

            {/* Status badges — stacked */}
            <div className="flex shrink-0 flex-col items-end gap-1">
              <BookingStatusBadge status={booking.status} />
              <PaymentStatusBadge status={booking.paymentStatus} />
            </div>
          </div>

          {/* ── Date / time / duration row ── */}
          <div className="mb-3 flex flex-wrap gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5 text-slate-600" aria-hidden />
              {formatDateVNShort(booking.date)}
            </span>
            <span className="flex items-center gap-1.5 tabular-nums">
              <Clock className="h-3.5 w-3.5 text-slate-600" aria-hidden />
              {booking.startTime}
              <span className="text-slate-700">→</span>
              {booking.endTime}
            </span>
            <span className="flex items-center gap-1.5">
              <Timer className="h-3.5 w-3.5 text-slate-600" aria-hidden />
              {formatDuration(booking.durationHours)}
            </span>
          </div>

          {/* ── Booking ID ── */}
          <div className="mb-4 flex items-center gap-1">
            <Hash className="h-3 w-3 text-slate-700" aria-hidden />
            <span className="font-mono text-[10px] text-slate-600">{booking.id}</span>
          </div>

          {/* ── Bottom row: price + payment method + CTA ── */}
          <div className="flex items-end justify-between">
            <div>
              {booking.paymentMethod && (
                <p className="mb-0.5 text-[10px] text-slate-600">
                  {PAYMENT_LABELS_SHORT[booking.paymentMethod]}
                </p>
              )}
              <p className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-lg font-bold text-transparent tabular-nums">
                {formatCurrency(booking.totalPrice)}
              </p>
            </div>

            <div className="flex items-center gap-1 text-xs font-medium text-slate-600 transition-colors duration-200 group-hover:text-emerald-400">
              Xem chi tiết
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Empty state (dark-themed) ────────────────────────────────────────────────

function EmptyBookingState({ isFiltered }: { isFiltered: boolean }) {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-slate-800/60 ring-1 ring-white/[0.06]">
        <CalendarCheck2 className="h-8 w-8 text-slate-500" aria-hidden />
      </div>
      <h3 className="mb-2 text-base font-semibold text-white">
        {isFiltered
          ? "Không có lịch đặt ở trạng thái này"
          : "Bạn chưa có lịch đặt sân nào"}
      </h3>
      <p className="mb-8 max-w-sm text-sm leading-relaxed text-slate-500">
        {isFiltered
          ? "Thử chọn tab khác để xem các lịch đặt của bạn."
          : "Tìm và đặt sân yêu thích của bạn ngay hôm nay."}
      </p>
      {!isFiltered && (
        <button
          type="button"
          onClick={() => router.push("/venues")}
          className={cn(
            "flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold",
            "bg-gradient-to-r from-emerald-500 to-cyan-500 text-white",
            "transition-all duration-200",
            "hover:from-emerald-400 hover:to-cyan-400 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]",
            "active:scale-[0.98]",
          )}
        >
          Tìm sân ngay
          <ArrowRight className="h-4 w-4" aria-hidden />
        </button>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function BookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<DisplayBooking[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<FilterKey>("ALL");

  // ── Load bookings from API (user-scoped via JWT) ───────────────────────────
  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      router.replace("/login");
      return;
    }

    apiFetch<ApiResponse<Booking[]>>("/my/bookings", { token })
      .then((res) => {
        const items = (res.data ?? []).map(normalizeBooking);
        items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setBookings(items);
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "";
        if (msg.includes("401")) {
          router.replace("/login");
          return;
        }
        // Other errors: leave bookings empty → empty state shown to user
      })
      .finally(() => setIsLoaded(true));
  }, [router]);

  // ── Filter bookings by active tab ──────────────────────────────────────────
  const filtered = useMemo(
    () => bookings.filter((b) => matchesFilter(b, activeTab)),
    [bookings, activeTab],
  );

  // Per-tab count (excluding ALL which uses bookings.length)
  const tabCounts = useMemo(() => {
    const map = new Map<FilterKey, number>();
    for (const tab of FILTER_TABS) {
      map.set(
        tab.key,
        tab.key === "ALL"
          ? bookings.length
          : bookings.filter((b) => matchesFilter(b, tab.key)).length,
      );
    }
    return map;
  }, [bookings]);

  // ── Loading state ──────────────────────────────────────────────────────────
  if (!isLoaded) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-700 border-t-emerald-400" />
          <p className="text-sm text-slate-500">Đang tải lịch đặt sân...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">

      {/* ── Page header ── */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Lịch đặt sân của tôi</h1>
        <p className="mt-1 text-sm text-slate-400">
          Quản lý tất cả các lần đặt sân của bạn
          {bookings.length > 0 && (
            <span className="ml-2 inline-flex items-center rounded-full bg-slate-800 px-2 py-0.5 text-xs font-medium text-slate-400">
              {bookings.length}
            </span>
          )}
        </p>
      </div>

      {/* ── Filter tabs ── */}
      <div
        role="tablist"
        aria-label="Lọc theo trạng thái đặt sân"
        className="mb-6 flex gap-1.5 overflow-x-auto pb-1"
      >
        {FILTER_TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          const count = tabCounts.get(tab.key) ?? 0;

          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium",
                "transition-all duration-200",
                isActive
                  ? "bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-[0_0_14px_rgba(16,185,129,0.35)]"
                  : [
                      "bg-slate-800/70 text-slate-400",
                      "hover:bg-slate-800 hover:text-slate-300",
                    ],
              )}
            >
              {tab.label}
              {count > 0 && (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-slate-700 text-slate-400",
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Booking list / empty state ── */}
      {filtered.length === 0 ? (
        <EmptyBookingState isFiltered={activeTab !== "ALL"} />
      ) : (
        <div className="space-y-3">
          {filtered.map((booking) => (
            <BookingCard key={booking.id} booking={booking} />
          ))}
        </div>
      )}
    </div>
  );
}
