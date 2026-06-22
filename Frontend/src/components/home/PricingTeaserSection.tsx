import Link from "next/link";
import { ArrowRight, CheckCircle2, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Static teaser data — full truth is at /pricing with real API ──────────────

const TEASER_PLANS = [
  {
    code: "USER_PRO",
    name: "Người chơi Pro",
    price: "49.000đ",
    features: [
      "20 bài ghép đối mỗi tháng",
      "Không giới hạn yêu cầu tham gia",
    ],
    highlight: false,
    badge: null as string | null,
  },
  {
    code: "USER_PREMIUM",
    name: "Người chơi Premium",
    price: "99.000đ",
    features: [
      "Không giới hạn bài ghép đối",
      "Tạo nhóm chơi nâng cao",
    ],
    highlight: false,
    badge: null as string | null,
  },
  {
    code: "OWNER_PRO",
    name: "Owner Pro",
    price: "499.000đ",
    features: [
      "Tối đa 10 cụm sân",
      "Hoa hồng 3%",
    ],
    highlight: true,
    badge: "Dành cho chủ sân",
  },
] as const;

export function PricingTeaserSection() {
  return (
    <section className="relative overflow-hidden bg-[#030303] py-20">
      {/* Ambient radial glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#FF8000]/[0.04] blur-[120px]"
        aria-hidden
      />

      {/* Top edge glow line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(134,210,50,0.3)] to-transparent" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* ── Section header ── */}
        <div className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[rgba(255,128,0,0.3)] bg-[rgba(255,128,0,0.08)] px-3.5 py-1">
              <Zap className="h-3.5 w-3.5 text-[#FF8000]" aria-hidden />
              <span className="text-xs font-bold uppercase tracking-widest text-[#FF8000]">
                Gói thành viên
              </span>
            </div>
            <h2 className="text-2xl font-black text-white sm:text-3xl">
              Gói thành viên MatchOps
            </h2>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-[#C4C7C9]/65">
              Từ người chơi cá nhân đến chủ sân chuyên nghiệp — chọn gói phù hợp
              với cách bạn sử dụng MatchOps.
            </p>
          </div>

          {/* Desktop inline link */}
          <Link
            href="/pricing"
            className="hidden shrink-0 items-center gap-1.5 text-sm font-semibold text-[#FF8000] transition-colors duration-200 hover:text-[#FF8000]/75 sm:flex focus-visible:outline-none focus-visible:underline"
          >
            Xem tất cả gói
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>

        {/* ── Teaser cards ── */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {TEASER_PLANS.map((plan) => (
            <div
              key={plan.code}
              className={cn(
                "relative flex flex-col rounded-2xl border p-6 transition-all duration-200",
                plan.highlight
                  ? [
                      "border-[#FF8000]",
                      "bg-gradient-to-b from-[rgba(255,128,0,0.06)] to-[#0A0A0A]",
                      "shadow-[0_0_24px_rgba(255,128,0,0.1)]",
                      "hover:shadow-[0_0_36px_rgba(255,128,0,0.18)]",
                    ]
                  : [
                      "border-[rgba(134,210,50,0.22)] bg-[#0A0A0A]",
                      "hover:border-[rgba(134,210,50,0.46)]",
                      "hover:shadow-[0_0_20px_rgba(134,210,50,0.04)]",
                    ],
              )}
            >
              {/* Badge */}
              {plan.badge && (
                <span className="mb-3 inline-flex w-fit items-center rounded-full border border-[rgba(255,128,0,0.3)] bg-[rgba(255,128,0,0.1)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#FF8000]">
                  {plan.badge}
                </span>
              )}

              {/* Plan name */}
              <h3 className="text-sm font-bold text-white">{plan.name}</h3>

              {/* Price */}
              <div className="mt-2 flex items-baseline gap-0.5">
                <span className="text-2xl font-black tabular-nums text-white">
                  {plan.price}
                </span>
                <span className="text-xs text-[#C4C7C9]/45">/tháng</span>
              </div>

              {/* Separator */}
              <div className="my-4 h-px bg-gradient-to-r from-transparent via-[rgba(134,210,50,0.15)] to-transparent" />

              {/* Features */}
              <ul className="flex-1 space-y-2" aria-label={`Tính năng ${plan.name}`}>
                {plan.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-2">
                    <CheckCircle2
                      className={cn(
                        "mt-0.5 h-3.5 w-3.5 shrink-0",
                        plan.highlight ? "text-[#FF8000]" : "text-[#86D232]",
                      )}
                      aria-hidden
                    />
                    <span className="text-xs leading-snug text-[#C4C7C9]">{feat}</span>
                  </li>
                ))}
              </ul>

              {/* Card CTA */}
              <Link
                href="/pricing"
                className={cn(
                  "mt-5 flex h-10 items-center justify-center rounded-xl text-xs font-bold",
                  "transition-all duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#030303]",
                  plan.highlight
                    ? [
                        "bg-[#FF8000] text-white",
                        "hover:bg-[#FF8000]/88",
                        "focus-visible:ring-[#FF8000]",
                      ]
                    : [
                        "border border-[rgba(255,255,255,0.1)] bg-transparent text-white",
                        "hover:border-[rgba(255,255,255,0.22)] hover:bg-[rgba(255,255,255,0.06)]",
                        "focus-visible:ring-white/30",
                      ],
                )}
              >
                Xem gói
              </Link>
            </div>
          ))}
        </div>

        {/* ── Section CTA ── */}
        <div className="mt-10 flex justify-center">
          <Link
            href="/pricing"
            className="flex items-center gap-2 rounded-xl border border-[rgba(255,128,0,0.28)] bg-[rgba(255,128,0,0.07)] px-6 py-3 text-sm font-bold text-[#FF8000] transition-all duration-200 hover:bg-[rgba(255,128,0,0.14)] hover:shadow-[0_0_22px_rgba(255,128,0,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8000]/50"
          >
            Xem tất cả gói thành viên
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>

      </div>
    </section>
  );
}
