"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock,
  CreditCard,
  Dumbbell,
  Hash,
  Home,
  ListOrdered,
  Phone,
  Timer,
  User,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { getStoredToken } from "@/lib/auth";
import type { ApiResponse } from "@/types/api";
import {
  BOOKING_CONFIRMATION_KEY,
  type BookingConfirmation,
  type PaymentMethod,
} from "@/lib/mock/bookingMockData";

// ─── Constants ────────────────────────────────────────────────────────────────

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  BANK_TRANSFER: "Chuyển khoản ngân hàng",
  MOMO: "Ví MoMo",
  VNPAY: "VNPay",
  CASH: "Tiền mặt tại sân",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDuration(hours: number): string {
  const total = Math.round(hours * 60);
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m} phút`;
  if (m === 0) return `${h} giờ`;
  return `${h} giờ ${m} phút`;
}

function formatDateVN(dateStr: string): string {
  const labels = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
  const d = new Date(`${dateStr}T12:00:00`);
  const [y, m, day] = dateStr.split("-");
  return `${labels[d.getDay()]}, ${day}/${m}/${y}`;
}

function isValidConfirmation(c: unknown): c is BookingConfirmation {
  if (!c || typeof c !== "object") return false;
  const obj = c as Record<string, unknown>;
  return (
    typeof obj.bookingId === "string" &&
    obj.bookingId.length > 0 &&
    typeof obj.venueName === "string" &&
    typeof obj.courtName === "string" &&
    typeof obj.date === "string" &&
    typeof obj.startTime === "string" &&
    typeof obj.endTime === "string" &&
    typeof obj.durationHours === "number" &&
    typeof obj.totalPrice === "number" &&
    typeof obj.customerName === "string" &&
    typeof obj.customerPhone === "string" &&
    typeof obj.paymentMethod === "string" &&
    obj.status === "CONFIRMED"
  );
}

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

function SummaryRow({
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

// ─── Error state ──────────────────────────────────────────────────────────────

function ConfirmationMissingState() {
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <GlassCard>
        <div className="p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10">
            <AlertCircle className="h-7 w-7 text-amber-400" />
          </div>
          <h1 className="mb-2 text-lg font-bold text-white">
            Không tìm thấy thông tin đặt sân
          </h1>
          <p className="mb-8 text-sm leading-relaxed text-slate-400">
            Phiên xác nhận đã hết hạn hoặc không hợp lệ. Vui lòng thực hiện lại đặt sân.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/venues"
              className="flex items-center justify-center gap-2 rounded-xl border border-[#FF8000]/30 bg-[#FF8000]/10 px-4 py-2.5 text-sm font-medium text-[#FF8000] transition-colors hover:bg-[#FF8000]/20"
            >
              Tìm sân thể thao
            </Link>
            <Link
              href="/bookings"
              className="flex items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-slate-800/50 px-4 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800"
            >
              Xem lịch đặt của tôi
            </Link>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

// ─── Loading state ────────────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-700 border-t-[#FF8000]" />
        <p className="text-sm text-slate-500">Đang tải thông tin xác nhận...</p>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function BookingSuccessPage() {
  const searchParams = useSearchParams();
  const [confirmation, setConfirmation] = useState<BookingConfirmation | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [bookingFromApi, setBookingFromApi] = useState<any>(null);

  useEffect(() => {
    const fetchConfirmation = async () => {
      try {
        // First try to get booking ID from URL (for VNPay callback flow)
        const bookingId = searchParams.get("bookingId");
        const token = getStoredToken();

        if (bookingId && token) {
          // Fetch from backend
          const res = await apiFetch<ApiResponse<any>>(`/api/my/bookings/${bookingId}`);
          if (res.success && res.data?.data) {
            setBookingFromApi(res.data.data);
          }
        }

        // Also check sessionStorage for backup
        const raw = sessionStorage.getItem(BOOKING_CONFIRMATION_KEY);
        if (raw) {
          const parsed: unknown = JSON.parse(raw);
          if (isValidConfirmation(parsed)) {
            setConfirmation(parsed);
          }
        }
      } catch {
        // Malformed JSON — leave as null
      } finally {
        setIsLoaded(true);
      }
    };

    fetchConfirmation();
  }, [searchParams]);

  // Stagger entrance animations after confirmation is ready
  useEffect(() => {
    if (!confirmation) return;
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, [confirmation]);

  if (!isLoaded) return <LoadingState />;
  if (!confirmation && !bookingFromApi) return <ConfirmationMissingState />;

  // Use API booking if available, fallback to sessionStorage confirmation
  const c = bookingFromApi ?? confirmation!;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">

      {/* ── Animated checkmark hero ─────────────────────────────────────────── */}
      <div className="mb-10 flex flex-col items-center text-center">

        {/* Layered pulse + icon */}
        <div className="relative mb-6 flex h-32 w-32 items-center justify-center">
          {/* Outermost pulse ring */}
          <span
            className="absolute h-32 w-32 animate-ping rounded-full bg-[#FF8000]/[0.12]"
            style={{ animationDuration: "2s" }}
            aria-hidden
          />
          {/* Static mid ring */}
          <span
            className="absolute h-24 w-24 rounded-full bg-[#FF8000]/[0.08]"
            aria-hidden
          />
          {/* Icon circle */}
          <div
            className={cn(
              "relative flex h-20 w-20 items-center justify-center rounded-full transition-all duration-700",
              "bg-gradient-to-br from-[#FF8000] via-[#FF9A20] to-[#86D232]",
              "shadow-[0_0_48px_rgba(255,128,0,0.5)]",
              mounted ? "scale-100 opacity-100" : "scale-50 opacity-0",
            )}
            role="img"
            aria-label="Đặt sân thành công"
          >
            <CheckCircle2
              className={cn(
                "h-10 w-10 text-white drop-shadow-md transition-all duration-500 delay-200",
                mounted ? "scale-100 opacity-100" : "scale-75 opacity-0",
              )}
              aria-hidden
            />
          </div>
        </div>

        {/* Headline */}
        <h1
          className={cn(
            "mb-2 text-3xl font-bold tracking-tight text-white transition-all duration-500 delay-150",
            mounted ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
          )}
        >
          Đặt sân thành công!
        </h1>
        <p
          className={cn(
            "mb-5 text-base text-slate-400 transition-all duration-500 delay-200",
            mounted ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
          )}
        >
          Lịch đặt của bạn đã được xác nhận.
        </p>

        {/* Booking ID badge */}
        <div
          className={cn(
            "inline-flex items-center gap-2 rounded-full border border-[#FF8000]/30",
            "bg-[#FF8000]/10 px-4 py-1.5 transition-all duration-500 delay-300",
            mounted ? "scale-100 opacity-100" : "scale-90 opacity-0",
          )}
        >
          <Hash className="h-3.5 w-3.5 text-[#FF8000]" aria-hidden />
          <span className="font-mono text-sm font-semibold tracking-wider text-[#FF8000]">
            {c.bookingId}
          </span>
        </div>
      </div>

      {/* ── Booking summary card ─────────────────────────────────────────────── */}
      <div
        className={cn(
          "mb-6 transition-all duration-500 delay-300",
          mounted ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
        )}
      >
        <GlassCard>
          <div className="relative p-6">
            {/* Subtle top tint */}
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-24 rounded-t-2xl bg-gradient-to-b from-[#FF8000]/[0.06] to-transparent"
              aria-hidden
            />

            <div className="relative space-y-5">

              {/* Venue + court + sport header */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Chi tiết đặt sân
                </p>
                <h2 className="mt-1 text-lg font-bold leading-tight text-white">
                  {c.courtName}
                </h2>
                <p className="mt-0.5 flex items-center gap-1 text-sm text-slate-400">
                  <Building2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  {c.venueName}
                </p>
                {c.sportName && (
                  <div className="mt-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#FF8000]/30 bg-[rgba(255,128,0,0.12)] px-2.5 py-0.5 text-xs font-medium text-[#FF8000]">
                      <Dumbbell className="h-3 w-3" aria-hidden />
                      {c.sportName}
                    </span>
                  </div>
                )}
              </div>

              <div className="border-t border-white/[0.06]" />

              {/* Date & time */}
              <div className="space-y-2.5">
                <SummaryRow
                  icon={CalendarDays}
                  label="Ngày"
                  value={formatDateVN(c.date)}
                />
                <SummaryRow
                  icon={Clock}
                  label="Giờ"
                  value={
                    <span className="tabular-nums">
                      {c.startTime}
                      <span className="mx-1 text-slate-600">→</span>
                      {c.endTime}
                    </span>
                  }
                />
                <SummaryRow
                  icon={Timer}
                  label="Thời lượng"
                  value={formatDuration(c.durationHours)}
                />
              </div>

              <div className="border-t border-white/[0.06]" />

              {/* Customer info */}
              <div className="space-y-2.5">
                <SummaryRow
                  icon={User}
                  label="Người đặt"
                  value={c.customerName}
                />
                <SummaryRow
                  icon={Phone}
                  label="Điện thoại"
                  value={<span className="tabular-nums">{c.customerPhone}</span>}
                />
              </div>

              <div className="border-t border-dashed border-white/[0.08]" />

              {/* Payment + total */}
              <div className="space-y-2.5">
                <SummaryRow
                  icon={CreditCard}
                  label="Thanh toán qua"
                  value={PAYMENT_LABELS[c.paymentMethod]}
                />
                <div className="flex items-end justify-between pt-1">
                  <span className="text-sm text-slate-400">Tổng cộng</span>
                  <span className="bg-gradient-to-r from-[#FF8000] via-[#FF9A20] to-[#86D232] bg-clip-text text-2xl font-bold text-transparent tabular-nums">
                    {formatCurrency(c.totalPrice)}
                  </span>
                </div>
              </div>

              {/* Confirmation status pill */}
              <div className="flex items-center justify-between rounded-xl border border-[#FF8000]/20 bg-[rgba(255,128,0,0.08)] px-4 py-3">
                <span className="text-xs text-slate-400">Trạng thái</span>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-[#86D232]">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#86D232]" aria-hidden />
                  Đã xác nhận · Đã thanh toán
                </span>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* ── CTA buttons ──────────────────────────────────────────────────────── */}
      <div
        className={cn(
          "flex flex-col gap-3 transition-all duration-500 delay-500 sm:flex-row",
          mounted ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
        )}
      >
        {/* Primary: My bookings */}
        <Link
          href="/bookings"
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-xl px-5 py-3",
            "bg-[#FF8000] text-sm font-semibold text-white",
            "transition-all duration-200",
            "hover:bg-[#FF8000]/85 hover:shadow-[0_0_24px_rgba(255,128,0,0.45)]",
            "active:scale-[0.98]",
          )}
        >
          <ListOrdered className="h-4 w-4" aria-hidden />
          Xem lịch đặt của tôi
        </Link>

        {/* Secondary: Home */}
        <Link
          href="/"
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/[0.08] px-5 py-3",
            "bg-slate-900/60 text-sm font-medium text-slate-300",
            "transition-all duration-200",
            "hover:border-white/[0.15] hover:bg-slate-800/80 hover:text-white",
            "active:scale-[0.98]",
          )}
        >
          <Home className="h-4 w-4" aria-hidden />
          Về trang chủ
        </Link>
      </div>
    </div>
  );
}
