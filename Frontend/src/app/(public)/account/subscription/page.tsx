"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import {
  ChevronLeft,
  Star,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  Users,
  Building2,
  TrendingUp,
  Shield,
  Loader2,
  Zap,
  BarChart3,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { getStoredToken } from "@/lib/auth";

// ── Types ──────────────────────────────────────────────────────────────────────

interface MembershipPlanDto {
  id: string;
  code: string;
  name: string;
  targetRole: string;  // "USER" | "OWNER"
  tier: string;        // "FREE" | "STANDARD" | "PRO" | "PREMIUM"
  pricePerMonth: number;
  pricePerYear?: number | null;
  commissionRate?: number | null;
  maxVenues?: number | null;
  maxCourts?: number | null;
  maxMatchPostsPerMonth?: number | null;
  maxJoinRequestsPerMonth?: number | null;
  sortOrder: number;
  features?: string[];
}

interface MembershipUsageDto {
  usedMatchPosts: number;
  maxMatchPosts: number;
  usedJoinRequests: number;
  maxJoinRequests: number;
  usedVenues: number;
  maxVenues: number;
  usedCourts: number;
  maxCourts: number;
  daysRemaining: number;
  periodStart: string;
  periodEnd: string;
}

interface MySubscriptionDto {
  subscriptionId?: string | null;
  status?: string | null;
  startedAt?: string | null;
  expiresAt?: string | null;
  cancelledAt?: string | null;
  isFallbackFreePlan: boolean;
  plan: MembershipPlanDto;
  usage?: MembershipUsageDto | null;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const ROLE_LABEL: Record<string, string> = {
  USER:  "Người chơi",
  OWNER: "Chủ sân",
};

const TIER_LABEL: Record<string, string> = {
  FREE:     "Miễn phí",
  STANDARD: "Standard",
  PRO:      "Pro",
  PREMIUM:  "Premium",
};

interface StatusConfig {
  label: string;
  Icon:  React.ElementType;
  pill:  string;   // tailwind classes for the pill
  text:  string;
}

const STATUS_MAP: Record<string, StatusConfig> = {
  ACTIVE:    { label: "Đang hoạt động",   Icon: CheckCircle2, pill: "border-[rgba(134,210,50,0.3)] bg-[rgba(134,210,50,0.1)]",  text: "text-[#86D232]"     },
  CANCELLED: { label: "Đã hủy",           Icon: XCircle,      pill: "border-red-500/20 bg-red-950/20",                           text: "text-red-400"       },
  EXPIRED:   { label: "Đã hết hạn",       Icon: Clock,        pill: "border-[rgba(200,200,200,0.15)] bg-[#141414]",              text: "text-[#C4C7C9]/60"  },
  PENDING:   { label: "Chờ xác nhận",     Icon: Clock,        pill: "border-amber-500/20 bg-amber-950/20",                       text: "text-amber-400"     },
  DEFAULT:   { label: "Gói mặc định",     Icon: Star,         pill: "border-[rgba(200,200,200,0.15)] bg-[#141414]",              text: "text-[#C4C7C9]/55"  },
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatDateVN(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("vi-VN", {
      day: "2-digit", month: "2-digit", year: "numeric",
    });
  } catch {
    return "—";
  }
}

// ── Sub-components ────────────────────────────────────────────────────────────

function BenefitRow({
  icon: Icon,
  label,
  orange = false,
}: {
  icon: React.ElementType;
  label: string;
  orange?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
          orange ? "bg-[rgba(255,128,0,0.12)]" : "bg-[rgba(134,210,50,0.1)]",
        )}
      >
        <Icon
          className={cn("h-3.5 w-3.5", orange ? "text-[#FF8000]" : "text-[#86D232]")}
          aria-hidden
        />
      </div>
      <span className="text-sm leading-snug text-[#C4C7C9]">{label}</span>
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="animate-pulse rounded-2xl border border-[rgba(134,210,50,0.12)] bg-[#0A0A0A] p-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:justify-between">
          <div className="space-y-2">
            <div className="h-6 w-44 rounded-lg bg-[#141414]" />
            <div className="h-3.5 w-28 rounded bg-[#141414]" />
          </div>
          <div className="h-7 w-32 rounded-full bg-[#141414]" />
        </div>
        <div className="mb-1 h-9 w-36 rounded-lg bg-[#141414]" />
        <div className="mb-6 h-px bg-[#141414]" />
        <div className="grid gap-3 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-7 w-7 shrink-0 rounded-lg bg-[#141414]" />
              <div className="h-3.5 flex-1 rounded bg-[#141414]" />
            </div>
          ))}
        </div>
      </div>
      <div className="flex gap-3">
        <div className="h-12 flex-1 animate-pulse rounded-xl bg-[#141414]" />
        <div className="h-12 w-48 animate-pulse rounded-xl bg-[#141414]" />
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MySubscriptionPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-4xl px-4 py-12">
          <div className="mb-8 space-y-3">
            <div className="h-4 w-32 animate-pulse rounded bg-[#141414]" />
            <div className="h-8 w-48 animate-pulse rounded-lg bg-[#141414]" />
            <div className="h-4 w-80 animate-pulse rounded bg-[#141414]" />
          </div>
          <PageSkeleton />
        </div>
      }
    >
      <MySubscriptionContent />
    </Suspense>
  );
}

function MySubscriptionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [subData,  setSubData]  = useState<MySubscriptionDto | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [isAdmin,  setIsAdmin]  = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"success" | "failed" | null>(null);

  const load = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      router.replace("/login?redirect=/account/subscription");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await apiFetch<ApiResponse<MySubscriptionDto>>(
        "/membership/my-subscription",
        { token },
      );

      if (res.data === null) {
        // ADMIN — no membership plans defined
        setIsAdmin(true);
      } else {
        setSubData(res.data);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Không thể tải thông tin gói thành viên.",
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Handle payment return from VNPay and initial load
  useEffect(() => {
    // Handle payment return
    const payment = searchParams.get("payment");
    const errorMsg = searchParams.get("error");

    if (payment === "success") {
      setPaymentStatus("success");
      toast.success("Thanh toán thành công! Gói của bạn đã được kích hoạt.");
    } else if (payment === "failed") {
      setPaymentStatus("failed");
      if (errorMsg) {
        toast.error(`Thanh toán thất bại: ${decodeURIComponent(errorMsg)}`);
      } else {
        toast.error("Thanh toán thất bại. Vui lòng thử lại.");
      }
    }

    // Clean up URL params
    if (payment) {
      window.history.replaceState({}, "", "/account/subscription");
    }

    // Load subscription data
    load();
  }, [searchParams, load]);

  // ── Derived ────────────────────────────────────────────────────────────────

  const plan      = subData?.plan;
  const isPaid    = (plan?.pricePerMonth ?? 0) > 0;
  const isOwner   = plan?.targetRole === "OWNER";
  const isPro     = plan?.tier === "PRO" || plan?.tier === "PREMIUM";
  const statusKey = subData?.status ?? "DEFAULT";
  const sc        = STATUS_MAP[statusKey] ?? STATUS_MAP.DEFAULT;

  // ── Loading ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="mb-8 space-y-3">
          <div className="h-4 w-32 animate-pulse rounded bg-[#141414]" />
          <div className="h-8 w-48 animate-pulse rounded-lg bg-[#141414]" />
          <div className="h-4 w-80 animate-pulse rounded bg-[#141414]" />
        </div>
        <PageSkeleton />
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <BackLink href="/profile" label="Quay lại trang cá nhân" />
        <div className="mt-8 flex flex-col items-center justify-center gap-4 rounded-2xl border border-red-500/20 bg-red-950/20 py-16 text-center">
          <AlertCircle className="h-10 w-10 text-red-400" aria-hidden />
          <p className="text-sm text-red-400" role="alert">{error}</p>
          <button
            type="button"
            onClick={load}
            className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-950/30 px-4 py-2.5 text-sm font-medium text-red-400 transition hover:bg-red-950/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40"
          >
            <RefreshCw className="h-4 w-4" aria-hidden />
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  // ── ADMIN ──────────────────────────────────────────────────────────────────

  if (isAdmin) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <BackLink href="/" label="Về trang chủ" />
        <div className="mt-8 flex flex-col items-center justify-center gap-4 rounded-2xl border border-[rgba(134,210,50,0.2)] bg-[#0A0A0A] py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(134,210,50,0.1)]">
            <Shield className="h-8 w-8 text-[#86D232]" aria-hidden />
          </div>
          <h2 className="text-lg font-bold text-white">Tài khoản quản trị</h2>
          <p className="max-w-sm text-sm leading-relaxed text-[#C4C7C9]/65">
            Tài khoản quản trị không áp dụng gói thành viên.
          </p>
          <Link
            href="/"
            className="mt-2 flex h-12 items-center gap-2 rounded-xl bg-[#FF8000] px-6 text-sm font-bold text-white transition-all duration-200 hover:bg-[#FF8000]/88 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8000]"
          >
            Về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  // ── Main ───────────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <BackLink href="/profile" label="Quay lại trang cá nhân" />

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Gói của tôi</h1>
        <p className="mt-2 text-slate-400">
          Theo dõi gói thành viên hiện tại, quyền lợi và giới hạn sử dụng trên MatchOps.
        </p>
      </div>

      <div className="space-y-6">

        {/* ── Fallback free notice ── */}
        {subData?.isFallbackFreePlan && (
          <div
            className="flex items-start gap-3 rounded-xl border border-blue-500/20 bg-blue-950/20 px-4 py-3.5"
            role="note"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" aria-hidden />
            <p className="text-sm leading-relaxed text-blue-300">
              Bạn đang sử dụng gói miễn phí mặc định. Có thể{" "}
              <Link
                href="/pricing"
                className="font-semibold underline underline-offset-2 transition-colors hover:text-white"
              >
                nâng cấp
              </Link>{" "}
              để mở thêm quyền lợi.
            </p>
          </div>
        )}

        {/* ── Current plan card ── */}
        {plan && (
          <div
            className={cn(
              "rounded-2xl border p-6 transition-all duration-200",
              isPro
                ? "border-[#FF8000] bg-gradient-to-b from-[rgba(255,128,0,0.06)] to-[#0A0A0A] shadow-[0_0_32px_rgba(255,128,0,0.1)]"
                : "border-[rgba(134,210,50,0.25)] bg-[#0A0A0A]",
            )}
          >
            {/* Card header */}
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h2 className="text-xl font-black text-white">{plan.name}</h2>
                  {/* Tier chip */}
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest",
                      isPro
                        ? "bg-[rgba(255,128,0,0.15)] text-[#FF8000]"
                        : "bg-[#141414] text-[#C4C7C9]/55",
                    )}
                  >
                    {TIER_LABEL[plan.tier] ?? plan.tier}
                  </span>
                </div>
                {/* Role + code */}
                <p className="mt-1 text-sm text-[#C4C7C9]/50">
                  {ROLE_LABEL[plan.targetRole] ?? plan.targetRole}
                  <span className="mx-1.5 opacity-40">·</span>
                  {plan.code}
                </p>
              </div>

              {/* Status pill */}
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 self-start rounded-full border px-3 py-1 text-xs font-semibold",
                  sc.pill, sc.text,
                )}
              >
                <sc.Icon className="h-3.5 w-3.5" aria-hidden />
                {sc.label}
              </span>
            </div>

            {/* Price */}
            <div className="mb-5">
              {plan.pricePerMonth === 0 ? (
                <p className="text-3xl font-black text-white">Miễn phí</p>
              ) : (
                <p className="text-3xl font-black tabular-nums text-[#FF8000]">
                  {Math.round(plan.pricePerMonth / 1000).toLocaleString("vi-VN")}
                  <span className="text-xl font-bold text-[#C4C7C9]/50">.000đ</span>
                  <span className="ml-1 text-base font-medium text-[#C4C7C9]/40">/tháng</span>
                </p>
              )}
            </div>

            {/* Date row — only if a real subscription exists */}
            {!subData?.isFallbackFreePlan &&
              (subData?.startedAt || subData?.expiresAt || subData?.cancelledAt) && (
                <>
                  <div className="mb-5 h-px bg-gradient-to-r from-transparent via-[rgba(134,210,50,0.15)] to-transparent" />
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    {subData?.startedAt && (
                      <DateField label="Bắt đầu" value={formatDateVN(subData.startedAt)} />
                    )}
                    {subData?.expiresAt && (
                      <DateField label="Hết hạn" value={formatDateVN(subData.expiresAt)} />
                    )}
                    {subData?.cancelledAt && (
                      <DateField
                        label="Đã hủy"
                        value={formatDateVN(subData.cancelledAt)}
                        danger
                      />
                    )}
                  </div>
                </>
              )}
          </div>
        )}

        {/* ── Benefits / Limits section ── */}
        {plan && (
          <div className="rounded-2xl border border-[rgba(134,210,50,0.22)] bg-[#0A0A0A] p-6">
            <h2 className="mb-5 text-[11px] font-bold uppercase tracking-widest text-[#C4C7C9]/45">
              Quyền lợi &amp; Giới hạn
            </h2>

            <div className="grid gap-3 sm:grid-cols-2">
              {isOwner ? (
                // OWNER benefits
                <>
                  <BenefitRow
                    icon={Building2}
                    label={
                      plan.maxVenues == null
                        ? "Không giới hạn cụm sân"
                        : `Tối đa ${plan.maxVenues} cụm sân`
                    }
                  />
                  <BenefitRow
                    icon={Building2}
                    label={
                      plan.maxCourts == null
                        ? "Không giới hạn số sân"
                        : `Tối đa ${plan.maxCourts} sân`
                    }
                  />
                  <BenefitRow
                    icon={TrendingUp}
                    label={
                      plan.commissionRate != null
                        ? `Hoa hồng ${(plan.commissionRate * 100).toFixed(0)}%`
                        : "Không có hoa hồng"
                    }
                    orange={
                      plan.commissionRate != null && plan.commissionRate <= 0.03
                    }
                  />
                  <BenefitRow icon={CheckCircle2} label="Quản lý booking & lịch sân" />
                  {plan.tier !== "FREE" && (
                    <BenefitRow icon={CheckCircle2} label="Dashboard doanh thu" />
                  )}
                  {(plan.tier === "PRO" || plan.tier === "PREMIUM") && (
                    <BenefitRow
                      icon={Star}
                      label="Ưu tiên hiển thị trên MatchOps"
                      orange
                    />
                  )}
                  {plan.tier === "PREMIUM" && (
                    <BenefitRow
                      icon={Star}
                      label="Hỗ trợ ưu tiên & chiến dịch marketing"
                      orange
                    />
                  )}
                </>
              ) : (
                // USER benefits
                <>
                  <BenefitRow
                    icon={Users}
                    label={
                      plan.maxMatchPostsPerMonth == null
                        ? "Không giới hạn bài ghép đối"
                        : `${plan.maxMatchPostsPerMonth} bài ghép đối / tháng`
                    }
                  />
                  <BenefitRow
                    icon={CheckCircle2}
                    label={
                      plan.maxJoinRequestsPerMonth == null
                        ? "Không giới hạn yêu cầu tham gia"
                        : `${plan.maxJoinRequestsPerMonth} yêu cầu tham gia / tháng`
                    }
                  />
                  <BenefitRow icon={CheckCircle2} label="Đặt sân cơ bản" />
                  <BenefitRow icon={CheckCircle2} label="Chat sau khi được ghép" />
                  {plan.tier !== "FREE" && (
                    <BenefitRow
                      icon={Star}
                      label="Ưu tiên hiển thị khi ghép đối"
                      orange
                    />
                  )}
                  {plan.tier !== "FREE" && (
                    <BenefitRow
                      icon={Star}
                      label={`Huy hiệu ${TIER_LABEL[plan.tier] ?? plan.tier} trên hồ sơ`}
                      orange
                    />
                  )}
                  {plan.tier === "PREMIUM" && (
                    <BenefitRow
                      icon={Star}
                      label="Tạo nhóm chơi nâng cao"
                      orange
                    />
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* ── Usage Statistics ── */}
        {plan && subData?.usage && (
          <div className="rounded-2xl border border-[rgba(255,128,0,0.25)] bg-[#0A0A0A] p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-[#C4C7C9]/45">
                Sử dụng trong tháng này
              </h2>
              <span className="text-xs text-[#FF8000]">
                <Clock className="mr-1 inline h-3 w-3" />
                {subData.usage.daysRemaining} ngày còn lại
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {isOwner ? (
                // OWNER usage
                <>
                  <UsageBar
                    label="Cụm sân"
                    used={subData.usage.usedVenues}
                    max={subData.usage.maxVenues}
                    icon={Building2}
                  />
                  <UsageBar
                    label="Sân"
                    used={subData.usage.usedCourts}
                    max={subData.usage.maxCourts}
                    icon={BarChart3}
                  />
                </>
              ) : (
                // USER usage
                <>
                  <UsageBar
                    label="Bài ghép đối"
                    used={subData.usage.usedMatchPosts}
                    max={subData.usage.maxMatchPosts}
                    icon={Users}
                  />
                  <UsageBar
                    label="Yêu cầu tham gia"
                    used={subData.usage.usedJoinRequests}
                    max={subData.usage.maxJoinRequests}
                    icon={Zap}
                  />
                </>
              )}
            </div>
          </div>
        )}

        {/* ── CTAs ── */}
        <div className="flex flex-col gap-3 sm:flex-row">
          {/* Primary */}
          <Link
            href="/pricing"
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#FF8000] text-sm font-bold text-white shadow-[0_0_20px_rgba(255,128,0,0.35)] transition-all duration-200 hover:bg-[#FF8000]/88 hover:shadow-[0_0_32px_rgba(255,128,0,0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8000] focus-visible:ring-offset-2 focus-visible:ring-offset-[#030303]"
          >
            Xem các gói khác
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>

          {/* Secondary */}
          <Link
            href="/profile"
            className="flex h-12 items-center justify-center gap-2 rounded-xl border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)] px-6 text-sm font-semibold text-white transition-all duration-200 hover:border-[rgba(255,255,255,0.2)] hover:bg-[rgba(255,255,255,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
          >
            Quay về trang cá nhân
          </Link>
        </div>

      </div>
    </div>
  );
}

// ── Helper sub-components (file-private) ─────────────────────────────────────

function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="mb-8 inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white focus-visible:outline-none focus-visible:underline"
    >
      <ChevronLeft className="h-4 w-4" aria-hidden />
      {label}
    </Link>
  );
}

function DateField({
  label,
  value,
  danger = false,
}: {
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div>
      <p className="mb-0.5 text-[10px] font-bold uppercase tracking-widest text-[#C4C7C9]/40">
        {label}
      </p>
      <p className={cn("text-sm font-semibold", danger ? "text-red-400" : "text-white")}>
        {value}
      </p>
    </div>
  );
}

function UsageBar({
  label,
  used,
  max,
  icon: Icon,
}: {
  label: string;
  used: number;
  max: number;
  icon: React.ElementType;
}) {
  const isUnlimited = max === Number.MAX_SAFE_INTEGER || max === 0;
  const percentage = isUnlimited ? 0 : Math.min((used / max) * 100, 100);
  const isNearLimit = percentage >= 80;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-[#FF8000]" aria-hidden />
          <span className="text-sm font-medium text-[#C4C7C9]">{label}</span>
        </div>
        <span className={cn(
          "text-sm font-semibold tabular-nums",
          isNearLimit ? "text-amber-400" : "text-white"
        )}>
          {used}{!isUnlimited && `/${max}`}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[#141414]">
        {isUnlimited ? (
          <div className="h-full w-full bg-gradient-to-r from-[#86D232] to-[#86D232]/50" />
        ) : (
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              isNearLimit ? "bg-amber-500" : "bg-[#FF8000]"
            )}
            style={{ width: `${percentage}%` }}
          />
        )}
      </div>
    </div>
  );
}
