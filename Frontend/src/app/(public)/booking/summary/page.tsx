"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Clock,
  MapPin,
  Timer,
  User,
  Phone,
  MessageSquare,
  Building2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn, formatCurrency } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import {
  getDurationHours,
  BOOKING_SESSION_KEY,
  type BookingDraft,
} from "@/lib/mock/bookingMockData";
import { isAuthenticated } from "@/lib/auth";

// ─── Backend DTOs ─────────────────────────────────────────────────────────────

interface ApiWrapper<T> {
  success: boolean;
  message: string;
  data: T;
}

interface VenueDto {
  id: string;
  name: string;
  address: string;
  city: string;
  district: string;
}

interface CourtDto {
  id: string;
  venueId: string;
  sportId: string;
  sportName: string;
  name: string;
  type: string | null;
}

interface PriceRuleDto {
  dayType: string;
  startTime: string;
  endTime: string;
  pricePerHour: number;
  status: string;
}

interface SummaryData {
  venue: VenueDto;
  court: CourtDto;
  priceRules: PriceRuleDto[];
}

// ─── Local helpers ────────────────────────────────────────────────────────────

function toHHMM(t: string): string {
  return t.length >= 5 ? t.slice(0, 5) : t;
}

function toMins(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function clean(v: string | null | undefined): string {
  if (!v || v.trim() === "string") return "";
  return v.trim();
}

function formatDuration(hours: number): string {
  const total = Math.round(hours * 60);
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m} phút`;
  if (m === 0) return `${h} giờ`;
  return `${h} giờ ${m} phút`;
}

function formatDateVN(dateStr: string): string {
  const labels = [
    "Chủ nhật",
    "Thứ 2",
    "Thứ 3",
    "Thứ 4",
    "Thứ 5",
    "Thứ 6",
    "Thứ 7",
  ];
  const d = new Date(`${dateStr}T12:00:00`);
  const [y, m, day] = dateStr.split("-");
  return `${labels[d.getDay()]}, ${day}/${m}/${y}`;
}

function isValidViPhone(raw: string): boolean {
  return /^0[3-9]\d{8}$/.test(raw.replace(/[\s-]/g, ""));
}

function calculatePriceFromRules(
  rules: PriceRuleDto[],
  date: string,
  start: string,
  end: string
): number | null {
  if (rules.length === 0) return null;
  const day = new Date(date).getDay();
  const isWeekend = day === 0 || day === 6;
  const applicable = rules.filter((r) => {
    const dt = r.dayType.toUpperCase();
    return (
      dt === "ALL" ||
      (isWeekend && dt === "WEEKEND") ||
      (!isWeekend && dt === "WEEKDAY")
    );
  });
  if (applicable.length === 0) return null;
  const reqStart = toMins(toHHMM(start));
  const reqEnd = toMins(toHHMM(end));
  let total = 0;
  for (const rule of applicable) {
    const rStart = toMins(toHHMM(rule.startTime));
    const rEnd = toMins(toHHMM(rule.endTime));
    const oStart = Math.max(reqStart, rStart);
    const oEnd = Math.min(reqEnd, rEnd);
    if (oEnd > oStart) {
      total += ((oEnd - oStart) / 60) * rule.pricePerHour;
    }
  }
  return total > 0 ? Math.round(total) : null;
}

// ─── Section heading ──────────────────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-400">
      <span className="h-px flex-1 bg-white/5" />
      {children}
      <span className="h-px flex-1 bg-white/5" />
    </h2>
  );
}

// ─── Info row ─────────────────────────────────────────────────────────────────

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#FF8000]/10">
        <Icon className="h-3.5 w-3.5 text-[#FF8000]" aria-hidden />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
          {label}
        </p>
        <div className="mt-0.5 text-sm font-medium text-slate-200">{value}</div>
      </div>
    </div>
  );
}

// ─── Glass card ───────────────────────────────────────────────────────────────

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
        "relative overflow-hidden rounded-2xl border border-white/8",
        "bg-gradient-to-b from-slate-900 to-slate-950 shadow-xl",
        className
      )}
    >
      {children}
    </div>
  );
}

// ─── Field error ──────────────────────────────────────────────────────────────

function FieldError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p
      className="mt-1.5 flex items-center gap-1.5 text-xs text-red-400"
      role="alert"
    >
      <AlertCircle className="h-3 w-3 shrink-0" aria-hidden />
      {message}
    </p>
  );
}

// ─── Invalid state ────────────────────────────────────────────────────────────

function InvalidState({
  venueId,
  message,
}: {
  venueId?: string;
  message: string;
}) {
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <GlassCard>
        <div className="p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10">
            <AlertCircle className="h-7 w-7 text-amber-400" />
          </div>
          <h1 className="mb-2 text-lg font-bold text-white">
            Thông tin đặt sân không hợp lệ
          </h1>
          <p className="mb-8 text-sm leading-relaxed text-slate-400">
            {message}
          </p>
          <div className="flex flex-col gap-3">
            {venueId && (
              <Link
                href={`/venues/${venueId}`}
                className="flex items-center justify-center gap-2 rounded-xl border border-[#FF8000]/30 bg-[#FF8000]/10 px-4 py-2.5 text-sm font-medium text-[#FF8000] transition-colors hover:bg-[#FF8000]/20"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden />
                Quay lại chọn giờ
              </Link>
            )}
            <Link
              href="/venues"
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:border-slate-600 hover:text-slate-300"
            >
              Tìm sân khác
            </Link>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

// ─── Main page content ────────────────────────────────────────────────────────

function SummaryPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const courtId = searchParams.get("courtId") ?? "";
  const venueId = searchParams.get("venueId") ?? "";
  const date = searchParams.get("date") ?? "";
  const start = searchParams.get("start") ?? "";
  const end = searchParams.get("end") ?? "";

  // ── Auth guard ──────────────────────────────────────────────────────────────
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      const redirectUrl = encodeURIComponent(
        window.location.pathname + window.location.search
      );
      router.replace(`/login?redirect=${redirectUrl}`);
      return;
    }
    setAuthChecked(true);
  }, [router]);

  // ── Data loading ────────────────────────────────────────────────────────────
  const [dataLoading, setDataLoading] = useState(true);
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [dataError, setDataError] = useState<string | null>(null);

  // ── Form state ──────────────────────────────────────────────────────────────
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [touched, setTouched] = useState({ name: false, phone: false });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Fetch venue + court + price rules ────────────────────────────────────────
  useEffect(() => {
    if (!authChecked) return;
    if (!venueId || !courtId) {
      setDataLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        const [venueRes, courtsRes] = await Promise.all([
          apiFetch<ApiWrapper<VenueDto>>(`/venues/${venueId}`),
          apiFetch<ApiWrapper<CourtDto[]>>(`/venues/${venueId}/courts`),
        ]);

        if (cancelled) return;

        const venueDto = venueRes.data ?? null;
        const courtDto =
          courtsRes.data?.find((c) => c.id === courtId) ?? null;

        let priceRules: PriceRuleDto[] = [];
        if (courtDto) {
          try {
            const prRes = await apiFetch<ApiWrapper<PriceRuleDto[]>>(
              `/courts/${courtId}/price-rules`
            );
            priceRules = (prRes.data ?? []).filter(
              (r) => r.status.toLowerCase() === "active"
            );
          } catch {
            // price rules are optional — page still usable without them
          }
        }

        if (!cancelled && venueDto && courtDto) {
          setSummaryData({ venue: venueDto, court: courtDto, priceRules });
        }
      } catch (e) {
        if (!cancelled) {
          setDataError(
            e instanceof Error
              ? e.message
              : "Không thể tải dữ liệu đặt sân."
          );
        }
      } finally {
        if (!cancelled) setDataLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [venueId, courtId, authChecked]);

  // ── Param validation ─────────────────────────────────────────────────────────
  const hasRequiredParams = !!(courtId && venueId && date && start && end);
  const paramsFormatOk =
    hasRequiredParams &&
    /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    /^\d{2}:\d{2}$/.test(start) &&
    /^\d{2}:\d{2}$/.test(end);

  const duration = paramsFormatOk ? getDurationHours(start, end) : 0;
  const durationOk = duration >= 0.5 && duration <= 4;

  // ── Form validation ──────────────────────────────────────────────────────────
  const nameError =
    touched.name && name.trim().length < 2
      ? "Vui lòng nhập họ tên (tối thiểu 2 ký tự)"
      : null;

  const phoneError =
    touched.phone && !isValidViPhone(phone)
      ? "Số điện thoại không hợp lệ (VD: 0912 345 678)"
      : null;

  // ── Submit handler ───────────────────────────────────────────────────────────
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!summaryData) return;

    setTouched({ name: true, phone: true });

    if (name.trim().length < 2) {
      document.getElementById("customer-name")?.focus();
      return;
    }
    if (!isValidViPhone(phone)) {
      document.getElementById("customer-phone")?.focus();
      return;
    }

    setIsSubmitting(true);

    try {
      const effectivePrice = calculatePriceFromRules(
        summaryData.priceRules,
        date,
        start,
        end
      );

      const draft: BookingDraft = {
        venueId: summaryData.venue.id,
        venueName: summaryData.venue.name,
        courtId: summaryData.court.id,
        courtName: summaryData.court.name,
        sportId: summaryData.court.sportId,
        sportName: summaryData.court.sportName,
        date,
        startTime: start,
        endTime: end,
        durationHours: duration,
        pricePerHour:
          duration > 0 && effectivePrice !== null
            ? Math.round(effectivePrice / duration)
            : 0,
        totalPrice: effectivePrice ?? 0,
        customerName: name.trim(),
        customerPhone: phone.replace(/[\s-]/g, ""),
        note: note.trim() || undefined,
      };

      // 2. Clear previous session and write current draft to sessionStorage
      // (This ensures payment page has latest info if redirected back)
      sessionStorage.setItem("MATCHOP_BOOKING_DRAFT", JSON.stringify(draft));

      router.push("/booking/payment");
    } catch (err) {
      alert("Đã xảy ra lỗi khi chuẩn bị đặt sân.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Loading state ────────────────────────────────────────────────────────────
  if (!authChecked || dataLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div
            className="h-6 w-6 animate-spin rounded-full border-2 border-slate-700 border-t-[#FF8000]"
            aria-hidden
          />
          <p className="text-sm text-slate-500">
            Đang tải thông tin đặt sân...
          </p>
        </div>
      </div>
    );
  }

  // ── Invalid state ────────────────────────────────────────────────────────────
  const invalidReason = !hasRequiredParams
    ? "Thiếu thông tin đặt sân. Vui lòng chọn lại từ trang sân."
    : !paramsFormatOk
      ? "Thiếu hoặc sai định dạng thông tin ngày/giờ. Vui lòng chọn lại."
      : !durationOk
        ? `Thời gian đặt phải từ 30 phút đến 4 giờ (đã chọn: ${formatDuration(duration)}).`
        : dataError
          ? dataError
          : !summaryData
            ? "Không tìm thấy thông tin sân hoặc cơ sở. Có thể đường dẫn bị sai hoặc đã hết hạn."
            : null;

  if (invalidReason || !summaryData) {
    return (
      <InvalidState
        venueId={venueId || undefined}
        message={invalidReason ?? "Thông tin không hợp lệ."}
      />
    );
  }

  // ── Valid: derive display values ─────────────────────────────────────────────
  const { venue, court, priceRules } = summaryData;
  const courtType = clean(court.type) || undefined;
  const totalPrice = calculatePriceFromRules(priceRules, date, start, end);

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back link */}
      <Link
        href={`/venues/${venueId}`}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-300"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Quay lại chọn giờ
      </Link>

      <form id="booking-summary-form" onSubmit={handleSubmit} noValidate>
        <div className="mt-2 grid gap-6 lg:grid-cols-12">
          {/* ── Left column: details + customer form ── */}
          <div className="space-y-6 lg:col-span-7">
            {/* Booking details card */}
            <GlassCard>
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-28 rounded-t-2xl bg-gradient-to-b from-[#FF8000]/8 to-transparent"
                aria-hidden
              />
              <div className="relative p-6">
                <SectionHeading>Chi tiết đặt sân</SectionHeading>

                <div className="mt-5 space-y-4">
                  <InfoRow icon={Building2} label="Cơ sở" value={venue.name} />
                  <InfoRow
                    icon={MapPin}
                    label="Sân"
                    value={
                      <span className="flex flex-wrap items-center gap-2">
                        {court.name}
                        {court.sportName && (
                          <Badge className="border-[#FF8000]/30 bg-[rgba(255,128,0,0.12)] px-1.5 py-0 text-[10px] text-[#FF8000]">
                            {court.sportName}
                          </Badge>
                        )}
                        {courtType && (
                          <span className="text-xs text-slate-500">
                            {courtType}
                          </span>
                        )}
                      </span>
                    }
                  />
                  <InfoRow
                    icon={CalendarDays}
                    label="Ngày chơi"
                    value={formatDateVN(date)}
                  />
                  <InfoRow
                    icon={Clock}
                    label="Khung giờ"
                    value={
                      <span className="tabular-nums">
                        {start}
                        <span className="mx-1.5 text-slate-500">→</span>
                        {end}
                      </span>
                    }
                  />
                  <InfoRow
                    icon={Timer}
                    label="Thời lượng"
                    value={formatDuration(duration)}
                  />
                </div>
              </div>
            </GlassCard>

            {/* Customer information form */}
            <GlassCard>
              <div className="p-6">
                <SectionHeading>Thông tin người đặt</SectionHeading>

                <div className="mt-5 space-y-5">
                  {/* Họ tên */}
                  <div>
                    <Label
                      htmlFor="customer-name"
                      className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-slate-300"
                    >
                      <User className="h-3.5 w-3.5 text-slate-500" aria-hidden />
                      Họ và tên
                      <span className="text-red-400" aria-label="bắt buộc">
                        *
                      </span>
                    </Label>
                    <Input
                      id="customer-name"
                      type="text"
                      autoComplete="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                      placeholder="Nguyễn Văn A"
                      aria-required
                      aria-describedby={nameError ? "name-error" : undefined}
                      aria-invalid={!!nameError}
                      className={cn(
                        "h-11 border-slate-700/60 bg-slate-800/50 text-white placeholder:text-slate-500",
                        "focus-visible:border-[#FF8000]/40 focus-visible:ring-[#FF8000]/40",
                        nameError &&
                          "border-red-500/50 focus-visible:ring-red-500/30"
                      )}
                    />
                    <div id="name-error">
                      <FieldError message={nameError} />
                    </div>
                  </div>

                  {/* Số điện thoại */}
                  <div>
                    <Label
                      htmlFor="customer-phone"
                      className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-slate-300"
                    >
                      <Phone
                        className="h-3.5 w-3.5 text-slate-500"
                        aria-hidden
                      />
                      Số điện thoại
                      <span className="text-red-400" aria-label="bắt buộc">
                        *
                      </span>
                    </Label>
                    <Input
                      id="customer-phone"
                      type="tel"
                      autoComplete="tel"
                      inputMode="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      onBlur={() =>
                        setTouched((t) => ({ ...t, phone: true }))
                      }
                      placeholder="0912 345 678"
                      aria-required
                      aria-describedby={
                        phoneError ? "phone-error" : "phone-hint"
                      }
                      aria-invalid={!!phoneError}
                      className={cn(
                        "h-11 border-slate-700/60 bg-slate-800/50 text-white placeholder:text-slate-500",
                        "focus-visible:border-[#FF8000]/40 focus-visible:ring-[#FF8000]/40",
                        phoneError &&
                          "border-red-500/50 focus-visible:ring-red-500/30"
                      )}
                    />
                    {!phoneError && (
                      <p
                        id="phone-hint"
                        className="mt-1 text-[10px] text-slate-600"
                      >
                        Số điện thoại Việt Nam (VD: 0912 345 678)
                      </p>
                    )}
                    <div id="phone-error">
                      <FieldError message={phoneError} />
                    </div>
                  </div>

                  {/* Ghi chú */}
                  <div>
                    <Label
                      htmlFor="note"
                      className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-slate-400"
                    >
                      <MessageSquare
                        className="h-3.5 w-3.5 text-slate-500"
                        aria-hidden
                      />
                      Ghi chú
                      <span className="ml-1 font-normal text-slate-600">
                        (không bắt buộc)
                      </span>
                    </Label>
                    <textarea
                      id="note"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="VD: Cần mang thêm vợt, nhóm 4 người..."
                      rows={3}
                      className={cn(
                        "w-full resize-none rounded-lg border border-slate-700/60 bg-slate-800/50 px-3 py-2.5",
                        "text-sm text-white placeholder:text-slate-500",
                        "focus:border-[#FF8000]/40 focus:outline-none focus:ring-2 focus:ring-[#FF8000]/40",
                        "transition-colors duration-150"
                      )}
                    />
                  </div>
                </div>

                <p className="mt-4 text-[10px] text-slate-600">
                  <span className="text-red-400">*</span> Bắt buộc nhập
                </p>
              </div>
            </GlassCard>
          </div>

          {/* ── Right column: sticky summary + CTA ── */}
          <div className="lg:col-span-5">
            <div className="space-y-4 lg:sticky lg:top-24">
              {/* Summary card */}
              <GlassCard>
                <div
                  className="pointer-events-none absolute inset-x-0 top-0 h-24 rounded-t-2xl bg-gradient-to-b from-[#FF8000]/6 to-transparent"
                  aria-hidden
                />

                <div className="relative p-6">
                  {/* Court + venue heading */}
                  <div className="mb-4">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      Tóm tắt đặt sân
                    </p>
                    <h3 className="mt-1 text-base font-bold leading-tight text-white">
                      {court.name}
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {venue.name}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {court.sportName && (
                        <Badge className="border-[#FF8000]/30 bg-[rgba(255,128,0,0.12)] px-2 text-xs text-[#FF8000]">
                          {court.sportName}
                        </Badge>
                      )}
                      {courtType && (
                        <Badge className="border-slate-700 bg-slate-800 px-2 text-xs text-slate-400">
                          {courtType}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <Separator className="my-4 bg-white/6" />

                  {/* Date + time details */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <CalendarDays
                          className="h-3.5 w-3.5 text-slate-600"
                          aria-hidden
                        />
                        Ngày
                      </span>
                      <span className="font-medium text-slate-200">
                        {formatDateVN(date)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <Clock
                          className="h-3.5 w-3.5 text-slate-600"
                          aria-hidden
                        />
                        Giờ
                      </span>
                      <span className="font-medium tabular-nums text-slate-200">
                        {start}
                        <span className="mx-1 text-slate-600">→</span>
                        {end}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <Timer
                          className="h-3.5 w-3.5 text-slate-600"
                          aria-hidden
                        />
                        Thời lượng
                      </span>
                      <span className="font-medium text-slate-200">
                        {formatDuration(duration)}
                      </span>
                    </div>
                  </div>

                  <Separator className="my-4 bg-white/6" />

                  {/* Price breakdown */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Giá sân</span>
                      <span className="tabular-nums text-slate-300">
                        {totalPrice !== null
                          ? formatCurrency(totalPrice)
                          : "Liên hệ"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Phí đặt lịch</span>
                      <span className="font-medium text-[#86D232]">
                        Miễn phí
                      </span>
                    </div>
                  </div>

                  <div className="my-4 border-t border-dashed border-white/8" />

                  {/* Total */}
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Tổng cộng
                      </p>
                      <p className="mt-0.5 text-[10px] text-slate-600">
                        Giá có thể biến động theo khung giờ
                      </p>
                    </div>
                    {totalPrice !== null ? (
                      <p className="bg-gradient-to-r from-[#FF8000] via-[#FF9A20] to-[#86D232] bg-clip-text text-2xl font-bold text-transparent tabular-nums">
                        {formatCurrency(totalPrice)}
                      </p>
                    ) : (
                      <p className="text-xl font-bold text-slate-300">
                        Liên hệ
                      </p>
                    )}
                  </div>
                </div>
              </GlassCard>

              {/* CTA */}
              <button
                type="submit"
                form="booking-summary-form"
                disabled={isSubmitting}
                className={cn(
                  "flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all duration-200",
                  !isSubmitting
                    ? [
                        "cursor-pointer bg-[#FF8000] text-white",
                        "hover:bg-[#FF8000]/85",
                        "hover:shadow-[0_0_28px_rgba(255,128,0,0.5)]",
                        "active:scale-[0.98]",
                      ]
                    : "cursor-not-allowed bg-slate-800 text-slate-500"
                )}
              >
                {isSubmitting ? (
                  <>
                    <span
                      className="h-4 w-4 animate-spin rounded-full border-2 border-slate-600 border-t-slate-300"
                      aria-hidden
                    />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    Tiếp tục thanh toán
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </>
                )}
              </button>

              <p className="text-center text-[10px] text-slate-600">
                Bằng cách tiếp tục, bạn đồng ý với{" "}
                <span className="text-slate-500">điều khoản sử dụng</span> của
                MatchOps.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

// ─── Page export with Suspense boundary ──────────────────────────────────────

export default function BookingSummaryPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-700 border-t-[#FF8000]" />
            <p className="text-sm text-slate-500">
              Đang tải thông tin đặt sân...
            </p>
          </div>
        </div>
      }
    >
      <SummaryPageInner />
    </Suspense>
  );
}
