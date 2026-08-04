"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Clock,
  Timer,
  User,
  Phone,
  MessageSquare,
  Building2,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn, formatCurrency } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { getStoredToken } from "@/lib/auth";
import type { ApiResponse } from "@/types/api";
import {
  MOCK_PAYMENT_METHODS,
  BOOKING_SESSION_KEY,
  BOOKING_CONFIRMATION_KEY,
  LOCAL_BOOKINGS_KEY,
  type BookingDraft,
  type BookingConfirmation,
  type PaymentMethod,
} from "@/lib/mock/bookingMockData";
import { PaymentMethodCard } from "@/components/booking/PaymentMethodCard";

// ─── Constants ────────────────────────────────────────────────────────────────

const CONFIRM_DELAY_MS = 700;

// ─── Local helpers ─────────────────────────────────────────────────────────────

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

function generateBookingId(): string {
  const d = new Date();
  const date = [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("");
  const rand = Math.floor(Math.random() * 9000 + 1000).toString();
  return `BK-${date}-${rand}`;
}

// ─── Small shared sub-components ─────────────────────────────────────────────

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
        "overflow-hidden rounded-2xl border border-white/8",
        "bg-gradient-to-b from-slate-900 to-slate-950 shadow-xl",
        className,
      )}
    >
      {children}
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-400">
      <span className="h-px flex-1 bg-white/5" />
      {children}
      <span className="h-px flex-1 bg-white/5" />
    </h2>
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
    <div className="flex items-start justify-between gap-2 text-sm">
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

// ─── Error / empty state ────────────────────────────────────────────────────

function DraftMissingState() {
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <GlassCard>
        <div className="p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10">
            <AlertCircle className="h-7 w-7 text-amber-400" />
          </div>
          <h1 className="mb-2 text-lg font-bold text-white">
            Phiên đặt sân đã hết hạn
          </h1>
          <p className="mb-8 text-sm leading-relaxed text-slate-400">
            Thông tin đặt sân không còn. Vui lòng bắt đầu lại từ bước chọn sân.
          </p>
          <Link
            href="/venues"
            className="flex items-center justify-center gap-2 rounded-xl border border-[#FF8000]/30 bg-[#FF8000]/10 px-4 py-2.5 text-sm font-medium text-[#FF8000] transition-colors hover:bg-[#FF8000]/20"
          >
            Tìm sân thể thao
          </Link>
        </div>
      </GlassCard>
    </div>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-700 border-t-[#FF8000]" />
        <p className="text-sm text-slate-500">Đang tải thông tin thanh toán...</p>
      </div>
    </div>
  );
}

// ─── Main page component ────────────────────────────────────────────────────

export default function PaymentPage() {
  const router = useRouter();

  const [draft, setDraft] = useState<BookingDraft | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  // ── Read draft from sessionStorage ──────────────────────────────────────
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("MATCHOP_BOOKING_DRAFT");
      if (raw) {
        const parsed = JSON.parse(raw) as BookingDraft;
        // Minimal field check
        if (
          parsed.courtId &&
          parsed.venueId &&
          parsed.date &&
          parsed.startTime &&
          parsed.endTime &&
          typeof parsed.totalPrice === "number" &&
          parsed.customerName &&
          parsed.customerPhone
        ) {
          setDraft(parsed);
        }
      }
    } catch {
      // Malformed JSON — leave draft as null
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // ── Confirm handler ──────────────────────────────────────────────────────
  async function handleConfirm() {
    if (!selectedMethod || !draft || isConfirming) return;
    
    const token = getStoredToken();
    if (!token) {
      router.push("/login");
      return;
    }

    setIsConfirming(true);

    try {
      // 1. Create the real booking in Backend
      const createRes = await apiFetch<ApiResponse<{ id: string }>>("/bookings", {
        method: "POST",
        token,
        body: JSON.stringify({
          courtId: draft.courtId,
          bookingDate: draft.date,
          startTime: draft.startTime,
          endTime: draft.endTime,
          note: draft.note
        }),
      });

      if (!createRes.success || !createRes.data) {
        throw new Error(createRes.message || "Không thể tạo lịch đặt sân.");
      }

      const bookingId = createRes.data.id;

      // 2. Tích hợp thanh toán VNPay thực tế nếu chọn VNPay
      if (selectedMethod === "VNPAY") {
        const payRes = await apiFetch<ApiResponse<any>>(`/my/bookings/${bookingId}/pay/vnpay`, {
          method: "POST",
          token,
        });

        if (payRes.success && payRes.data?.data?.paymentUrl) {
          // Redirect user sang cổng thanh toán VNPay
          // Store booking ID for callback page to fetch status
          sessionStorage.setItem("MATCHOP_LAST_BOOKING_ID", bookingId);
          window.location.href = payRes.data.data.paymentUrl;
          return;
        } else {
          throw new Error(payRes.message || "Không thể khởi tạo thanh toán VNPay.");
        }
      }

      // 3. Tiền mặt tại sân – xác nhận ngay, không qua cổng thanh toán
      if (selectedMethod === "CASH") {
        const payRes = await apiFetch<ApiResponse<any>>(`/my/bookings/${bookingId}/pay/cash`, {
          method: "POST",
          token,
        });

        if (!payRes.success) {
          throw new Error(payRes.message || "Không thể xác nhận thanh toán tiền mặt.");
        }
      } else if (selectedMethod === "MOCK") {
        // 4. Mock payment cho testing
        const payRes = await apiFetch<ApiResponse<any>>(`/my/bookings/${bookingId}/pay/mock`, {
          method: "POST",
          token,
          body: JSON.stringify({ transactionCode: `MOCK-${Date.now()}` }),
        });

        if (!payRes.success) {
          throw new Error(payRes.message || "Thanh toán không thành công.");
        }
      }

      const confirmation: BookingConfirmation = {
        ...draft,
        bookingId: bookingId,
        paymentMethod: selectedMethod,
        status: "CONFIRMED",
        paymentStatus: "PAID",
        createdAt: new Date().toISOString(),
      };

      // Write confirmation for success page
      sessionStorage.setItem(
        BOOKING_CONFIRMATION_KEY,
        JSON.stringify(confirmation),
      );
      
      router.push("/booking/success");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Đã xảy ra lỗi khi thanh toán.");
    } finally {
      setIsConfirming(false);
    }
  }

  // ── Render states ────────────────────────────────────────────────────────
  if (!isLoaded) return <LoadingState />;
  if (!draft) return <DraftMissingState />;

  // Back link reconstructs the summary URL from draft data
  const summaryUrl = `/booking/summary?courtId=${draft.courtId}&venueId=${draft.venueId}&date=${draft.date}&start=${draft.startTime}&end=${draft.endTime}`;
  const canConfirm = selectedMethod !== null && !isConfirming;

  // ── Main render ──────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back link */}
      <Link
        href={summaryUrl}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-300"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Quay lại xem lại
      </Link>

      <div className="mt-2 grid gap-6 lg:grid-cols-12">

        {/* ── Left column: payment methods ── */}
        <div className="space-y-4 lg:col-span-7">

          {/* Method selection card */}
          <GlassCard>
            <div className="relative p-6">
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-28 rounded-t-2xl bg-gradient-to-b from-[#FF8000]/6 to-transparent"
                aria-hidden
              />
              <div className="relative">
                <SectionHeading>Phương thức thanh toán</SectionHeading>

                <fieldset className="mt-5" aria-label="Chọn phương thức thanh toán">
                  <legend className="sr-only">
                    Chọn phương thức thanh toán
                  </legend>
                  <div
                    className="space-y-3"
                    role="radiogroup"
                    aria-label="Phương thức thanh toán"
                  >
                    {MOCK_PAYMENT_METHODS.map((method) => (
                      <PaymentMethodCard
                        key={method.id}
                        method={method}
                        isSelected={selectedMethod === method.id}
                        onSelect={() => setSelectedMethod(method.id)}
                      />
                    ))}
                  </div>
                </fieldset>
              </div>
            </div>
          </GlassCard>

          {/* Security note */}
          <div className="flex items-center gap-2.5 rounded-xl border border-white/5 bg-slate-900/40 px-4 py-3">
            <ShieldCheck className="h-4 w-4 shrink-0 text-[#86D232]" aria-hidden />
            <p className="text-xs text-slate-500">
              Thông tin đặt sân được bảo mật. MatchOps không lưu thông tin thẻ
              ngân hàng.
            </p>
          </div>
        </div>

        {/* ── Right column: sticky summary + CTA ── */}
        <div className="lg:col-span-5">
          <div className="space-y-4 lg:sticky lg:top-24">

            {/* Full booking summary card */}
            <GlassCard>
              <div className="relative p-6">
                <div
                  className="pointer-events-none absolute inset-x-0 top-0 h-24 rounded-t-2xl bg-gradient-to-b from-[#FF8000]/6 to-transparent"
                  aria-hidden
                />
                <div className="relative">
                  {/* Header */}
                  <div className="mb-4">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      Thông tin đặt sân
                    </p>
                    <h3 className="mt-1 text-base font-bold leading-tight text-white">
                      {draft.courtName}
                    </h3>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                      <Building2 className="h-3 w-3" aria-hidden />
                      {draft.venueName}
                    </p>
                    {draft.sportName && (
                      <div className="mt-2">
                        <Badge className="border-[#FF8000]/30 bg-[rgba(255,128,0,0.12)] px-2 text-xs text-[#FF8000]">
                          {draft.sportName}
                        </Badge>
                      </div>
                    )}
                  </div>

                  <Separator className="my-3 bg-white/6" />

                  {/* Date/time */}
                  <div className="space-y-2">
                    <SummaryRow
                      icon={CalendarDays}
                      label="Ngày"
                      value={formatDateVN(draft.date)}
                    />
                    <SummaryRow
                      icon={Clock}
                      label="Giờ"
                      value={
                        <span className="tabular-nums">
                          {draft.startTime}
                          <span className="mx-1 text-slate-600">→</span>
                          {draft.endTime}
                        </span>
                      }
                    />
                    <SummaryRow
                      icon={Timer}
                      label="Thời lượng"
                      value={formatDuration(draft.durationHours)}
                    />
                  </div>

                  <Separator className="my-3 bg-white/6" />

                  {/* Customer info */}
                  <div className="space-y-2">
                    <SummaryRow
                      icon={User}
                      label="Người đặt"
                      value={draft.customerName}
                    />
                    <SummaryRow
                      icon={Phone}
                      label="Điện thoại"
                      value={<span className="tabular-nums">{draft.customerPhone}</span>}
                    />
                    {draft.note && (
                      <SummaryRow
                        icon={MessageSquare}
                        label="Ghi chú"
                        value={
                          <span className="max-w-[140px] break-words text-xs">
                            {draft.note}
                          </span>
                        }
                      />
                    )}
                  </div>

                  <div className="my-3 border-t border-dashed border-white/8" />

                  {/* Price */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Giá sân</span>
                      <span className="tabular-nums text-slate-300">
                        {formatCurrency(draft.totalPrice)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Phí đặt lịch</span>
                      <span className="font-medium text-[#86D232]">Miễn phí</span>
                    </div>
                  </div>

                  <div className="my-3 border-t border-dashed border-white/8" />

                  {/* Total */}
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Tổng cộng
                      </p>
                    </div>
                    <p className="bg-gradient-to-r from-[#FF8000] via-[#FF9A20] to-[#86D232] bg-clip-text text-2xl font-bold text-transparent tabular-nums">
                      {formatCurrency(draft.totalPrice)}
                    </p>
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* CTA */}
            <button
              type="button"
              disabled={!canConfirm}
              onClick={handleConfirm}
              aria-label={
                !selectedMethod
                  ? "Vui lòng chọn phương thức thanh toán"
                  : "Xác nhận đặt sân"
              }
              className={cn(
                "flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all duration-200",
                canConfirm
                  ? [
                      "cursor-pointer bg-[#FF8000] text-white",
                      "hover:bg-[#FF8000]/85",
                      "hover:shadow-[0_0_28px_rgba(255,128,0,0.5)]",
                      "active:scale-[0.98]",
                    ]
                  : "cursor-not-allowed bg-slate-800 text-slate-500 border border-slate-700/50",
              )}
            >
              {isConfirming ? (
                <>
                  <span
                    className="h-4 w-4 animate-spin rounded-full border-2 border-slate-600 border-t-slate-300"
                    aria-hidden
                  />
                  Đang xác nhận...
                </>
              ) : (
                <>
                  Xác nhận đặt sân
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </>
              )}
            </button>

            {/* Disabled hint */}
            {!selectedMethod && (
              <p className="text-center text-[10px] text-slate-600">
                Vui lòng chọn phương thức thanh toán để tiếp tục
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
