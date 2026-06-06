import Link from "next/link";
import {
  Zap,
  Target,
  Activity,
  TrendingUp,
  Users,
  Star,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const sports = [
  {
    name: "Cầu lông",
    icon: Zap,
    count: "1.200+",
    dotColor: "bg-emerald-400",
    iconGradient: "from-emerald-400 to-teal-500",
    cardBg: "from-emerald-950 via-teal-950/70 to-slate-950",
    borderHover: "hover:border-emerald-500/60",
    shadowHover: "hover:shadow-emerald-500/20",
    countColor: "text-emerald-400",
    glowColor: "rgba(16,185,129,0.18)",
    slug: "Cầu lông",
  },
  {
    name: "Bóng đá",
    icon: Target,
    count: "800+",
    dotColor: "bg-lime-400",
    iconGradient: "from-lime-400 to-green-600",
    cardBg: "from-green-950 via-emerald-950/60 to-slate-950",
    borderHover: "hover:border-lime-500/60",
    shadowHover: "hover:shadow-lime-500/20",
    countColor: "text-lime-400",
    glowColor: "rgba(132,204,22,0.16)",
    slug: "Bóng đá",
  },
  {
    name: "Tennis",
    icon: Activity,
    count: "600+",
    dotColor: "bg-amber-400",
    iconGradient: "from-amber-400 to-orange-500",
    cardBg: "from-amber-950 via-orange-950/60 to-slate-950",
    borderHover: "hover:border-amber-500/60",
    shadowHover: "hover:shadow-amber-500/20",
    countColor: "text-amber-400",
    glowColor: "rgba(245,158,11,0.16)",
    slug: "Tennis",
  },
  {
    name: "Bóng rổ",
    icon: TrendingUp,
    count: "400+",
    dotColor: "bg-orange-400",
    iconGradient: "from-orange-400 to-red-500",
    cardBg: "from-orange-950 via-red-950/60 to-slate-950",
    borderHover: "hover:border-orange-500/60",
    shadowHover: "hover:shadow-orange-500/20",
    countColor: "text-orange-400",
    glowColor: "rgba(249,115,22,0.16)",
    slug: "Bóng rổ",
  },
  {
    name: "Bóng chuyền",
    icon: Users,
    count: "300+",
    dotColor: "bg-violet-400",
    iconGradient: "from-violet-400 to-indigo-600",
    cardBg: "from-violet-950 via-indigo-950/60 to-slate-950",
    borderHover: "hover:border-violet-500/60",
    shadowHover: "hover:shadow-violet-500/20",
    countColor: "text-violet-400",
    glowColor: "rgba(167,139,250,0.16)",
    slug: "Bóng chuyền",
  },
  {
    name: "Pickleball",
    icon: Star,
    count: "200+",
    dotColor: "bg-purple-400",
    iconGradient: "from-purple-400 to-violet-600",
    cardBg: "from-purple-950 via-violet-950/60 to-slate-950",
    borderHover: "hover:border-purple-500/60",
    shadowHover: "hover:shadow-purple-500/20",
    countColor: "text-purple-400",
    glowColor: "rgba(192,132,252,0.16)",
    slug: "Pickleball",
  },
] as const;

export function SportsSection() {
  return (
    <section className="relative bg-slate-950 px-4 py-20 sm:px-6 lg:px-8">
      {/* Section top depth glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_40%_at_50%_-10%,rgba(16,185,129,0.06),transparent)]" />

      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-12 flex items-end justify-between">
          <div>
            <span className="mb-3 inline-block text-xs font-bold uppercase tracking-widest text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]">
              Khám phá
            </span>
            <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
              Chọn môn thể thao
            </h2>
            <p className="mt-2 max-w-md text-slate-400">
              Hàng nghìn sân chất lượng cho mọi môn bạn yêu thích
            </p>
          </div>
          <Link
            href="/venues"
            className="hidden shrink-0 items-center gap-1.5 text-sm font-medium text-slate-400 transition-colors duration-200 hover:text-emerald-400 sm:flex"
            aria-label="Xem tất cả sân thể thao"
          >
            Xem tất cả
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Sport cards grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {sports.map((sport) => {
            const Icon = sport.icon;
            return (
              <Link
                key={sport.name}
                href={`/venues?sport=${encodeURIComponent(sport.slug)}`}
                className={cn(
                  "group relative flex flex-col overflow-hidden rounded-2xl",
                  "border border-white/8 cursor-pointer",
                  "transition-all duration-300 ease-out",
                  "hover:-translate-y-2 hover:shadow-2xl",
                  sport.borderHover,
                  sport.shadowHover
                )}
                aria-label={`Tìm sân ${sport.name}`}
              >
                {/* Gradient image area */}
                <div
                  className={cn(
                    "relative flex items-center justify-center py-8 bg-gradient-to-br",
                    sport.cardBg
                  )}
                >
                  {/* Sport-colored radial glow — appears on hover */}
                  <div
                    className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    style={{
                      background: `radial-gradient(ellipse 90% 70% at 50% 80%, ${sport.glowColor}, transparent)`,
                    }}
                    aria-hidden="true"
                  />

                  {/* Faint background icon — decorative */}
                  <div
                    className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.06]"
                    aria-hidden="true"
                  >
                    <Icon className="h-24 w-24 text-white" />
                  </div>

                  {/* Foreground gradient icon badge */}
                  <div
                    className={cn(
                      "relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br",
                      "shadow-lg ring-1 ring-white/15",
                      "transition-all duration-300 group-hover:scale-110 group-hover:shadow-2xl group-hover:ring-white/30",
                      sport.iconGradient
                    )}
                  >
                    <Icon className="h-7 w-7 text-white drop-shadow-sm" aria-hidden="true" />
                  </div>

                  {/* Live status dot */}
                  <div
                    className="absolute bottom-2.5 right-3 flex items-center gap-1"
                    aria-hidden="true"
                  >
                    <span className={cn("h-1.5 w-1.5 rounded-full animate-pulse", sport.dotColor)} />
                    <span className="text-[10px] font-medium text-white/50">Live</span>
                  </div>
                </div>

                {/* Text content */}
                <div className="border-t border-white/5 bg-slate-900/95 px-3 pb-4 pt-3 text-center backdrop-blur-sm">
                  <p className="text-sm font-bold text-white">{sport.name}</p>
                  <p className={cn("mt-0.5 text-xs font-semibold", sport.countColor)}>
                    {sport.count} sân
                  </p>
                  <div className="mt-2 flex items-center justify-center gap-1 opacity-0 transition-all duration-200 group-hover:opacity-100">
                    <span className={cn("text-xs font-semibold", sport.countColor)}>Khám phá</span>
                    <ArrowRight
                      className={cn(
                        "h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5",
                        sport.countColor
                      )}
                      aria-hidden="true"
                    />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Mobile view-all link */}
        <div className="mt-8 flex justify-center sm:hidden">
          <Link
            href="/venues"
            className="flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-emerald-400 transition-colors duration-200"
          >
            Xem tất cả môn thể thao
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
