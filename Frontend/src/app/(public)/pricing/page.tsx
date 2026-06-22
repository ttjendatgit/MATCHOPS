"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Zap,
  Users,
  Building2,
} from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";

// ── Types ──────────────────────────────────────────────────────────────────────

interface MembershipPlanDto {
  id: string;
  code: string;
  name: string;
  targetRole: string;        // "USER" | "OWNER"
  tier: string;              // "FREE" | "STANDARD" | "PRO" | "PREMIUM"
  pricePerMonth: number;
  pricePerYear?: number | null;
  commissionRate?: number | null;
  maxVenues?: number | null;
  maxCourts?: number | null;
  maxMatchPostsPerMonth?: number | null;
  maxJoinRequestsPerMonth?: number | null;
  sortOrder: number;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

type RoleTab = "USER" | "OWNER";

// ── Marketing copy (maps plan Code → display content) ─────────────────────────

interface PlanContent {
  displayName: string;
  description: string;
  features: string[];
  popular?: boolean;
}

const PLAN_CONTENT: Record<string, PlanContent> = {
  USER_FREE: {
    displayName: "Gói Free",
    description: "Dành cho người chơi mới bắt đầu tìm sân và ghép đối.",
    features: [
      "Đặt sân cơ bản",
      "3 bài ghép đối mỗi tháng",
      "5 yêu cầu tham gia mỗi tháng",
      "Chat sau khi được ghép",
    ],
  },
  USER_PRO: {
    displayName: "Gói Pro",
    description: "Dành cho người chơi thường xuyên muốn ghép đối nhanh hơn.",
    features: [
      "20 bài ghép đối mỗi tháng",
      "Không giới hạn yêu cầu tham gia",
      "Ưu tiên hiển thị khi ghép đối",
      "Huy hiệu Pro trên hồ sơ",
    ],
    popular: true,
  },
  USER_PREMIUM: {
    displayName: "Gói Premium",
    description: "Dành cho nhóm trưởng hoặc người chơi nghiêm túc.",
    features: [
      "Không giới hạn bài ghép đối",
      "Không giới hạn yêu cầu tham gia",
      "Tạo nhóm chơi nâng cao",
      "Ưu tiên hỗ trợ",
    ],
  },
  OWNER_FREE: {
    displayName: "Owner Free",
    description: "Dành cho chủ sân muốn bắt đầu đưa sân lên MatchOps.",
    features: [
      "1 cụm sân",
      "Tối đa 3 sân",
      "Quản lý booking cơ bản",
      "Hoa hồng 7%",
    ],
  },
  OWNER_STANDARD: {
    displayName: "Owner Standard",
    description: "Dành cho cụm sân nhỏ cần quản lý lịch và bảng giá.",
    features: [
      "Tối đa 3 cụm sân",
      "Tối đa 10 sân",
      "Quản lý bảng giá linh hoạt",
      "Dashboard doanh thu",
      "Hoa hồng 5%",
    ],
  },
  OWNER_PRO: {
    displayName: "Owner Pro",
    description: "Dành cho chủ sân vận hành thường xuyên và muốn tối ưu doanh thu.",
    features: [
      "Tối đa 10 cụm sân",
      "Không giới hạn số sân",
      "Dashboard nâng cao",
      "Ưu tiên hiển thị trên MatchOps",
      "Hoa hồng 3%",
    ],
    popular: true,
  },
  OWNER_PREMIUM: {
    displayName: "Owner Premium",
    description: "Dành cho hệ thống sân lớn cần khả năng mở rộng tối đa.",
    features: [
      "Không giới hạn cụm sân",
      "Không giới hạn số sân",
      "Hỗ trợ ưu tiên 24/7",
      "Chiến dịch marketing riêng",
      "Hoa hồng 2%",
    ],
  },
};

// ── Price helpers ──────────────────────────────────────────────────────────────

/** Yearly total price — from API or calculated at 20% discount, rounded to nearest thousand. */
function yearlyTotal(plan: MembershipPlanDto): number {
  if (plan.pricePerYear != null) return plan.pricePerYear;
  return Math.round((plan.pricePerMonth * 12 * 0.8) / 1000) * 1000;
}

/** Monthly-equivalent when paying yearly, rounded to nearest thousand. */
function yearlyMonthlyRate(plan: MembershipPlanDto): number {
  return Math.round(yearlyTotal(plan) / 12 / 1000) * 1000;
}

/** Amount saved per year vs monthly billing. */
function yearlySaving(plan: MembershipPlanDto): number {
  return plan.pricePerMonth * 12 - yearlyTotal(plan);
}

/** Format as "49.000" (thousands part only). */
function priceThousands(amount: number): string {
  return `${Math.round(amount / 1000).toLocaleString("vi-VN")}`;
}

function ctaLabel(plan: MembershipPlanDto): string {
  if (plan.pricePerMonth === 0) return "Bắt đầu miễn phí";
  if (plan.code === "OWNER_PREMIUM") return "Liên hệ tư vấn";
  return "Nâng cấp sớm";
}

// ── Skeleton card ──────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-[rgba(134,210,50,0.1)] bg-[#0A0A0A] p-6">
      <div className="mb-3 h-5 w-28 rounded-lg bg-[#141414]" />
      <div className="mb-1 h-3 w-full rounded bg-[#141414]" />
      <div className="mb-6 h-3 w-2/3 rounded bg-[#141414]" />
      <div className="mb-2 h-9 w-28 rounded-lg bg-[#141414]" />
      <div className="mb-1 h-3 w-20 rounded bg-[#141414]" />
      <div className="mb-6 h-px w-full bg-[#141414]" />
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="mb-2.5 flex items-center gap-2.5">
          <div className="h-4 w-4 shrink-0 rounded-full bg-[#141414]" />
          <div className="h-3 flex-1 rounded bg-[#141414]" />
        </div>
      ))}
      <div className="mt-7 h-12 w-full rounded-xl bg-[#141414]" />
    </div>
  );
}

// ── Plan card ──────────────────────────────────────────────────────────────────

function PlanCard({
  plan,
  isYearly,
}: {
  plan: MembershipPlanDto;
  isYearly: boolean;
}) {
  const content = PLAN_CONTENT[plan.code];
  const popular  = content?.popular ?? false;
  const isFree   = plan.pricePerMonth === 0;

  const displayMonthly = isYearly && !isFree ? yearlyMonthlyRate(plan) : plan.pricePerMonth;
  const saving         = isYearly && !isFree ? yearlySaving(plan) : 0;

  function handleCta() {
    if (isFree) { window.location.href = "/register"; return; }
    toast.info("Tính năng nâng cấp gói sẽ được mở ở phase thanh toán.", {
      description: "Hiện tại tất cả tài khoản mới đều dùng gói Miễn phí.",
      duration: 4500,
    });
  }

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl border p-6",
        "transition-all duration-200",
        popular
          ? [
              "border-[#FF8000]",
              "bg-gradient-to-b from-[rgba(255,128,0,0.06)] to-[#0A0A0A]",
              "shadow-[0_0_32px_rgba(255,128,0,0.14),0_0_0_1px_rgba(255,128,0,0.25)]",
              "hover:shadow-[0_0_48px_rgba(255,128,0,0.22)]",
            ]
          : [
              "border-[rgba(134,210,50,0.22)] bg-[#0A0A0A]",
              "hover:border-[rgba(134,210,50,0.48)]",
              "hover:shadow-[0_0_28px_rgba(134,210,50,0.05)]",
            ],
      )}
    >
      {/* Popular badge */}
      {popular && (
        <div className="absolute -top-3.5 left-1/2 z-10 -translate-x-1/2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FF8000] px-4 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-white shadow-[0_0_14px_rgba(255,128,0,0.55)]">
            <Zap className="h-3 w-3" aria-hidden />
            Phổ biến nhất
          </span>
        </div>
      )}

      {/* Plan name + description */}
      <div className={cn("mb-5", popular && "mt-2")}>
        <h3 className="text-base font-bold text-white">
          {content?.displayName ?? plan.name}
        </h3>
        <p className="mt-1.5 text-sm leading-relaxed text-[#C4C7C9]/65">
          {content?.description ?? ""}
        </p>
      </div>

      {/* Price */}
      <div className="mb-5">
        {isFree ? (
          <p className="text-[2.25rem] font-black leading-none text-white">
            Miễn phí
          </p>
        ) : (
          <>
            <div className="flex items-baseline gap-0.5 leading-none">
              <span className="text-[2.25rem] font-black tabular-nums text-white">
                {priceThousands(displayMonthly)}
              </span>
              <span className="text-xl font-bold text-[#C4C7C9]/55">.000đ</span>
            </div>
            <p className="mt-1 text-xs text-[#C4C7C9]/40">
              {isYearly ? "/ tháng · thanh toán hàng năm" : "/ tháng"}
            </p>
            {isYearly && saving > 0 && (
              <p className="mt-1 text-[11px] font-semibold text-[#86D232]">
                ↓&nbsp;Tiết kiệm {priceThousands(saving)}.000đ/năm
              </p>
            )}
            {!isYearly && (
              /* Reserve same space as the savings line so the price block
                 height stays stable when toggling — prevents layout shift  */
              <p className="mt-1 h-4 text-[11px]" aria-hidden />
            )}
          </>
        )}
      </div>

      {/* Separator */}
      <div className="mb-5 h-px bg-gradient-to-r from-transparent via-[rgba(134,210,50,0.2)] to-transparent" />

      {/* Feature list */}
      <ul className="mb-7 flex-1 space-y-2.5" aria-label={`Tính năng gói ${content?.displayName ?? plan.code}`}>
        {(content?.features ?? []).map((feat) => (
          <li key={feat} className="flex items-start gap-2.5">
            <CheckCircle2
              className={cn(
                "mt-px h-4 w-4 shrink-0",
                popular ? "text-[#FF8000]" : "text-[#86D232]",
              )}
              aria-hidden
            />
            <span className="text-sm leading-snug text-[#C4C7C9]">{feat}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <button
        type="button"
        onClick={handleCta}
        className={cn(
          "flex h-12 w-full cursor-pointer items-center justify-center rounded-xl text-sm font-bold",
          "transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#030303]",
          popular
            ? [
                "bg-[#FF8000] text-white",
                "shadow-[0_0_20px_rgba(255,128,0,0.4)]",
                "hover:bg-[#FF8000]/88 hover:shadow-[0_0_36px_rgba(255,128,0,0.65)]",
                "active:scale-[0.98]",
                "focus-visible:ring-[#FF8000]",
              ]
            : [
                "border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)] text-white",
                "hover:border-[rgba(255,255,255,0.22)] hover:bg-[rgba(255,255,255,0.08)]",
                "focus-visible:ring-white/30",
              ],
        )}
      >
        {ctaLabel(plan)}
      </button>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

const ROLE_TABS: { role: RoleTab; label: string; icon: React.ElementType }[] = [
  { role: "USER",  label: "Người chơi", icon: Users      },
  { role: "OWNER", label: "Chủ sân",    icon: Building2  },
];

export default function PricingPage() {
  const [plans,     setPlans]     = useState<MembershipPlanDto[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<RoleTab>("USER");
  const [isYearly,  setIsYearly]  = useState(false);

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<ApiResponse<MembershipPlanDto[]>>("/membership/plans");
      setPlans(res.data ?? []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Không thể tải danh sách gói cước.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  const userPlans  = useMemo(() => plans.filter((p) => p.targetRole === "USER"),  [plans]);
  const ownerPlans = useMemo(() => plans.filter((p) => p.targetRole === "OWNER"), [plans]);
  const activePlans = activeTab === "USER" ? userPlans : ownerPlans;

  const skeletonCount = activeTab === "USER" ? 3 : 4;

  return (
    <section className="min-h-dvh bg-[#030303]">
      <div className="mx-auto max-w-7xl px-4 pb-28 pt-14 sm:px-6 lg:px-8">

        {/* ── Hero ── */}
        <header className="mx-auto mb-12 max-w-3xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[rgba(255,128,0,0.3)] bg-[rgba(255,128,0,0.08)] px-4 py-1.5">
            <Zap className="h-3.5 w-3.5 text-[#FF8000]" aria-hidden />
            <span className="text-xs font-bold uppercase tracking-widest text-[#FF8000]">
              Gói dịch vụ MatchOps
            </span>
          </div>

          <h1 className="text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl">
            Chọn gói phù hợp với cách bạn{" "}
            <span className="bg-gradient-to-r from-[#FF8000] via-[#FF9A20] to-[#86D232] bg-clip-text text-transparent">
              chơi và vận hành sân
            </span>
          </h1>

          <p className="mt-5 text-base leading-relaxed text-[#C4C7C9]/70 sm:text-lg">
            MatchOps có gói linh hoạt cho người chơi cá nhân và chủ sân thể thao —
            từ trải nghiệm miễn phí đến quản lý chuyên nghiệp.
          </p>
        </header>

        {/* ── Role tab selector ── */}
        <div className="mb-8 flex justify-center" role="tablist" aria-label="Chọn loại tài khoản">
          <div className="inline-flex rounded-xl border border-[rgba(134,210,50,0.18)] bg-[#0A0A0A] p-1">
            {ROLE_TABS.map(({ role, label, icon: Icon }) => (
              <button
                key={role}
                type="button"
                role="tab"
                aria-selected={activeTab === role}
                onClick={() => setActiveTab(role)}
                className={cn(
                  "flex min-h-[44px] items-center gap-2 rounded-[10px] px-6 py-2 text-sm font-semibold",
                  "transition-all duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8000] focus-visible:ring-offset-1 focus-visible:ring-offset-[#0A0A0A]",
                  activeTab === role
                    ? "bg-[#FF8000] text-white shadow-[0_0_16px_rgba(255,128,0,0.45)]"
                    : "text-[#C4C7C9]/60 hover:text-white",
                )}
              >
                <Icon className="h-4 w-4" aria-hidden />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Billing toggle ── */}
        <div className="mb-12 flex items-center justify-center gap-3.5">
          <span
            className={cn(
              "select-none text-sm font-semibold transition-colors duration-200",
              !isYearly ? "text-white" : "text-[#C4C7C9]/45",
            )}
          >
            Hàng tháng
          </span>

          <Switch
            checked={isYearly}
            onCheckedChange={setIsYearly}
            aria-label="Chuyển sang thanh toán hàng năm để tiết kiệm 20%"
          />

          <span
            className={cn(
              "flex select-none items-center gap-2 text-sm font-semibold transition-colors duration-200",
              isYearly ? "text-white" : "text-[#C4C7C9]/45",
            )}
          >
            Hàng năm
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[11px] font-bold transition-all duration-200",
                isYearly
                  ? "bg-[rgba(134,210,50,0.18)] text-[#86D232]"
                  : "bg-[rgba(134,210,50,0.08)] text-[#86D232]/50",
              )}
            >
              Tiết kiệm 20%
            </span>
          </span>
        </div>

        {/* ── Loading ── */}
        {loading && (
          <div
            className={cn(
              "mx-auto grid gap-6",
              activeTab === "USER"
                ? "max-w-5xl grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                : "max-w-7xl grid-cols-1 sm:grid-cols-2 xl:grid-cols-4",
            )}
            aria-busy="true"
            aria-label="Đang tải gói cước..."
          >
            {Array.from({ length: skeletonCount }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* ── Error ── */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-red-500/20 bg-red-950/20 py-16 text-center">
            <AlertCircle className="h-10 w-10 text-red-400" aria-hidden />
            <p className="text-sm text-red-400" role="alert">{error}</p>
            <button
              type="button"
              onClick={fetchPlans}
              className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-950/30 px-4 py-2.5 text-sm font-medium text-red-400 transition hover:bg-red-950/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50"
            >
              <RefreshCw className="h-4 w-4" aria-hidden />
              Thử lại
            </button>
          </div>
        )}

        {/* ── Empty ── */}
        {!loading && !error && activePlans.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm text-[#C4C7C9]/40">Không tìm thấy gói cước nào.</p>
          </div>
        )}

        {/* ── Plan cards ── */}
        {!loading && !error && activePlans.length > 0 && (
          <>
            <div
              role="tabpanel"
              aria-label={activeTab === "USER" ? "Gói Người chơi" : "Gói Chủ sân"}
              className={cn(
                "mx-auto grid gap-6",
                activeTab === "USER"
                  ? "max-w-5xl grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                  : "max-w-7xl grid-cols-1 sm:grid-cols-2 xl:grid-cols-4",
              )}
            >
              {activePlans.map((plan) => (
                <PlanCard key={plan.id} plan={plan} isYearly={isYearly} />
              ))}
            </div>

            {/* Yearly disclaimer */}
            {isYearly && (
              <p className="mt-8 text-center text-xs text-[#C4C7C9]/30">
                * Giá hiển thị là giá tương đương mỗi tháng khi đăng ký hàng năm.
                Thanh toán một lần cho cả 12 tháng.
              </p>
            )}
          </>
        )}

        {/* ── Coach coming-soon banner ── */}
        <div className="mx-auto mt-20 max-w-3xl rounded-2xl border border-dashed border-[rgba(255,128,0,0.2)] bg-[rgba(255,128,0,0.03)] px-8 py-10 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[rgba(255,128,0,0.1)] px-3.5 py-1">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FF8000] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#FF8000]" />
            </span>
            <span className="text-xs font-bold uppercase tracking-widest text-[#FF8000]">
              Sắp ra mắt
            </span>
          </div>
          <h2 className="text-xl font-bold text-white">Gói Huấn luyện viên</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#C4C7C9]/55">
            Chúng tôi đang phát triển gói dành riêng cho HLV thể thao chuyên nghiệp.
            Theo dõi MatchOps để nhận thông báo sớm khi ra mắt.
          </p>
        </div>

      </div>
    </section>
  );
}
