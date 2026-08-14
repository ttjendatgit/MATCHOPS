"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarDays,
  CalendarX2,
  ChevronRight,
  Clock,
  CreditCard,
  Dumbbell,
  Hash,
  Phone,
  Timer,
  User,
} from "lucide-react";
import { DetailPageHeader, BackLink } from "@/components/shared/BackLink";
import { BookingStatusBadge, PaymentStatusBadge } from "@/components/shared/StatusBadge";
import { cn, formatCurrency } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { getStoredToken } from "@/lib/auth";
import type { ApiResponse } from "@/types/api";
import type { Booking } from "@/types/booking";
import {
  type DisplayBooking,
  normalizeBooking,
  formatDuration,
  formatDateVN,
  PAYMENT_LABELS,
} from "@/lib/bookingDisplayUtils";

// ─── Shared primitives ────────────────────────────────────────────────────────

function GlassCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-white/[0.08]",
        "bg-gradient-to-b from-slate-900 to-slate-950 shadow-xl",
        className,
      )}
    >
      {children}
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
  valueClass,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  valueClass?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="flex shrink-0 items-center gap-1.5 text-slate-500">
        <Icon className="h-3.5 w-3.5 text-slate-600" aria-hidden />
        {label}
      </span>
      <span className={cn("text-right font-medium text-slate-300", valueClass)}>
        {value}
      </span>
    </div>
  );
}

// ─── Loading state ────────────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-700 border-t-[#FF8000]" />
        <p className="text-sm text-slate-500">Đang tải chi tiết đặt sân...</p>
      </div>
    </div>
  );
}

// ─── Not found state ──────────────────────────────────────────────────────────

function NotFoundState() {
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-slate-800/60 ring-1 ring-white/[0.06] mx-auto">
        <CalendarX2 className="h-8 w-8 text-slate-500" aria-hidden />
      </div>
      <h2 className="mb-2 text-lg font-bold text-white">Không tìm thấy lịch đặt sân</h2>
      <p className="mb-8 text-sm leading-relaxed text-slate-400">
        Lịch đặt này không tồn tại hoặc đã bị xoá.
      </p>
      <div className="flex justify-center">
        <BackLink href="/bookings" label="Quay lại lịch đặt sân" />
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function BookingDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [booking, setBooking] = useState<DisplayBooking | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [mounted, setMounted] = useState(false);

  // ── Load booking by ID from API (user-scoped via JWT) ────────────────────
  useEffect(() => {
    if (!id) {
      setIsLoaded(true);
      return;
    }

    const token = getStoredToken();
    if (!token) {
      router.replace("/login");
      return;
    }

    apiFetch<ApiResponse<Booking>>(`/my/bookings/${id}`, { token })
      .then((res) => {
        setBooking(normalizeBooking(res.data));
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "";
        if (msg.includes("401")) {
          router.replace("/login");
          return;
        }
        // 404 or other error → NotFoundState
        setBooking(null);
      })
      .finally(() => setIsLoaded(true));
  }, [id, router]);

  // ── Entrance animation ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!booking) return;
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, [booking]);

  if (!isLoaded) return <LoadingState />;
  if (!booking) return <NotFoundState />;

  const b = booking;
  const needsPayment = b.status === "PENDING_PAYMENT" && b.paymentStatus === "UNPAID";

  async function handlePayNow() {
    const token = getStoredToken();
    if (!token) return;

    try {
      const payRes = await apiFetch<ApiResponse<{ paymentUrl: string }>>(`/my/bookings/${b.id}/pay/vnpay`, {
        method: "POST",
        token,
      });

      if (payRes.success && payRes.data?.paymentUrl) {
        window.location.href = payRes.data.paymentUrl;
      } else {
        alert(payRes.message || "Không thể khởi tạo thanh toán VNPay.");
      }
    } catch (err) {
      alert("Đã xảy ra lỗi khi khởi tạo thanh toán.");
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">

      <DetailPageHeader backLabel="Quay lại lịch đặt" href="/bookings" />

      {/* ── Breadcrumb (desktop) ── */}
      <nav aria-label="Điều hướng" className="mb-6 hidden items-center gap-1 text-sm text-slate-500 md:flex">
        <Link href="/bookings" className="transition-colors hover:text-slate-300">
          Lịch đặt sân
        </Link>
        <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        <span className="font-medium text-slate-300">Chi tiết</span>
      </nav>

      {/* ── Main card ── */}
      <div
        className={cn(
          "mb-5 transition-all duration-500",
          mounted ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
        )}
      >
        <GlassCard>
          <div className="relative p-6">
            {/* Top tint */}
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-24 rounded-t-2xl bg-gradient-to-b from-[#FF8000]/[0.06] to-transparent"
              aria-hidden
            />

            <div className="relative space-y-5">

              {/* ── Header: court + venue + sport + status ── */}
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl font-bold leading-tight text-white">
                    {b.courtName}
                  </h1>
                  <p className="mt-0.5 flex items-center gap-1 text-sm text-slate-400">
                    <Building2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    {b.venueName}
                  </p>
                  {b.sportName && (
                    <div className="mt-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#FF8000]/30 bg-[rgba(255,128,0,0.12)] px-2.5 py-0.5 text-xs font-medium text-[#FF8000]">
                        <Dumbbell className="h-3 w-3" aria-hidden />
                        {b.sportName}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <BookingStatusBadge status={b.status} />
                  <PaymentStatusBadge status={b.paymentStatus} />
                </div>
              </div>

              {/* Booking ID */}
              <div className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-slate-800/50 px-3 py-1">
                <Hash className="h-3 w-3 text-slate-600" aria-hidden />
                <span className="font-mono text-xs text-slate-500">{b.id}</span>
              </div>

              <div className="border-t border-white/[0.06]" />

              {/* ── Date & time ── */}
              <div className="space-y-2.5">
                <DetailRow
                  icon={CalendarDays}
                  label="Ngày"
                  value={formatDateVN(b.date)}
                />
                <DetailRow
                  icon={Clock}
                  label="Giờ"
                  value={
                    <span className="tabular-nums">
                      {b.startTime}
                      <span className="mx-1 text-slate-600">→</span>
                      {b.endTime}
                    </span>
                  }
                />
                <DetailRow
                  icon={Timer}
                  label="Thời lượng"
                  value={formatDuration(b.durationHours)}
                />
              </div>

              <div className="border-t border-white/[0.06]" />

              {/* ── Customer info ── */}
              <div className="space-y-2.5">
                {b.customerName && (
                  <DetailRow icon={User} label="Người đặt" value={b.customerName} />
                )}
                {b.customerPhone && (
                  <DetailRow
                    icon={Phone}
                    label="Điện thoại"
                    value={<span className="tabular-nums">{b.customerPhone}</span>}
                  />
                )}
              </div>

              <div className="border-t border-dashed border-white/[0.08]" />

              {/* ── Payment section ── */}
              <div className="space-y-2.5">
                {b.paymentMethod && (
                  <DetailRow
                    icon={CreditCard}
                    label="Thanh toán qua"
                    value={PAYMENT_LABELS[b.paymentMethod]}
                  />
                )}
                <div className="flex items-end justify-between pt-1">
                  <span className="text-sm text-slate-400">Tổng cộng</span>
                  <span className="bg-gradient-to-r from-[#FF8000] to-[#86D232] bg-clip-text text-2xl font-bold text-transparent tabular-nums">
                    {formatCurrency(b.totalPrice)}
                  </span>
                </div>
              </div>

              {/* ── Note ── */}
              {b.note && (
                <div className="rounded-xl border border-white/[0.06] bg-slate-800/40 px-4 py-3">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                    Ghi chú
                  </p>
                  <p className="text-sm leading-relaxed text-slate-400">{b.note}</p>
                </div>
              )}
            </div>
          </div>
        </GlassCard>
      </div>

      {/* ── CTA buttons ── */}
      <div
        className={cn(
          "flex flex-col gap-3 transition-all duration-500 delay-100",
          mounted ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
        )}
      >
        {/* Pay now — only for PENDING_PAYMENT */}
        {needsPayment && (
          <button
            onClick={handlePayNow}
            className={cn(
              "flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold",
              "bg-[#FF8000] text-white",
              "transition-all duration-200",
              "hover:bg-[#FF8000]/85",
              "active:scale-[0.98]",
            )}
          >
            Thanh toán ngay qua VNPay
            <ArrowRight className="h-4 w-4" aria-hidden />
          </button>
        )}

        {/* Back to bookings list */}
        <Link
          href="/bookings"
          className={cn(
            "flex items-center justify-center gap-2 rounded-xl border border-white/[0.08] px-5 py-3",
            "bg-slate-900/60 text-sm font-medium text-slate-300",
            "transition-all duration-200",
            "hover:border-white/[0.15] hover:bg-slate-800/80 hover:text-white",
            "active:scale-[0.98]",
          )}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Quay lại lịch đặt sân
        </Link>

        {/* Find more courts */}
        <Link
          href="/venues"
          className={cn(
            "flex items-center justify-center gap-1.5 text-sm text-slate-600",
            "transition-colors hover:text-[#FF8000]",
          )}
        >
          Tìm sân thể thao khác
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
