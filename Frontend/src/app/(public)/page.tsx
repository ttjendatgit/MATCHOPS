import Link from "next/link";
import {
  Search,
  MapPin,
  Star,
  Clock,
  Shield,
  ArrowRight,
  CheckCircle2,
  Zap,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ParticleHero } from "@/components/animated-hero";
import { StatsBar } from "@/components/home/StatsBar";
import { SportsSection } from "@/components/home/SportsSection";
import { FeaturedVenuesBento } from "@/components/home/FeaturedVenuesBento";
import { FinalCTASection } from "@/components/home/FinalCTASection";
import { HeroIntro } from "@/components/home/HeroIntro";
import { PricingTeaserSection } from "@/components/home/PricingTeaserSection";

// ─── Sub-components ───────────────────────────────────────────────────────────

function HeroFloatingCards() {
  return (
    <div className="relative hidden lg:flex flex-col gap-4 items-end pt-8">
      {/* Venue preview card */}
      <div className="animate-float w-[280px] rounded-2xl border border-white/[0.16] bg-slate-950/80 backdrop-blur-xl p-4 shadow-[0_24px_64px_rgba(0,0,0,0.70),0_0_0_1px_rgba(255,255,255,0.05)] ring-1 ring-inset ring-white/[0.04]">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-[#FF8000] animate-pulse" />
            <span className="text-xs font-medium text-[#FF8000]">Còn 4 khung giờ</span>
          </div>
          <Badge className="bg-[#FF8000]/12 text-[#FF8000] border border-[#FF8000]/28 text-[10px] px-2">
            Nổi bật
          </Badge>
        </div>
        <h4 className="text-sm font-semibold text-white mb-1">Sân Cầu Lông Quận 7</h4>
        <div className="flex items-center gap-1 text-slate-400 text-xs mb-3">
          <MapPin className="h-3 w-3" />
          <span>TP. Hồ Chí Minh</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
            <span className="text-xs font-semibold text-white">4.9</span>
            <span className="text-slate-500 text-xs">· 312 đánh giá</span>
          </div>
          <span className="text-[#FF8000] text-xs font-bold">150k/giờ</span>
        </div>
        <div className="mt-3 rounded-lg h-16 bg-gradient-to-br from-[#1c1c1c] via-[#111111] to-slate-900/80 border border-white/[0.06] flex items-center justify-center overflow-hidden relative">
          <div className="absolute inset-0 bg-[#FF8000]/[0.04]" />
          <Activity className="h-6 w-6 text-[#FF8000]/75 relative z-10" />
        </div>
      </div>

      {/* Confirmation card */}
      <div className="animate-float-delayed w-[240px] rounded-2xl border border-white/[0.16] bg-slate-950/80 backdrop-blur-xl p-4 shadow-[0_24px_64px_rgba(0,0,0,0.70),0_0_0_1px_rgba(255,255,255,0.05)] ring-1 ring-inset ring-white/[0.04] mr-8">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FF8000]/14 border border-[#FF8000]/20">
            <CheckCircle2 className="h-5 w-5 text-[#FF8000]" />
          </div>
          <div>
            <p className="text-xs font-semibold text-white">Đặt sân thành công</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Sân A · 19:00 – 21:00</p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-white/[0.06] border border-white/[0.06] px-3 py-2">
          <Clock className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-[11px] text-slate-400">Xác nhận trong 28 giây</span>
        </div>
      </div>

      {/* Rating pill */}
      <div className="animate-float-slow w-[200px] rounded-2xl border border-white/[0.16] bg-slate-950/80 backdrop-blur-xl px-4 py-3 shadow-[0_24px_64px_rgba(0,0,0,0.70),0_0_0_1px_rgba(255,255,255,0.05)] ring-1 ring-inset ring-white/[0.04] mr-4">
        <div className="flex items-center gap-2 mb-1.5">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star key={s} className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
          ))}
        </div>
        <p className="text-xs font-semibold text-white">4.9 · 1.200+ đánh giá</p>
        <p className="text-[11px] text-slate-400 mt-0.5">từ người dùng thực tế</p>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <>
      <HeroIntro />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <ParticleHero particleCount={20}>
        <div className="w-full py-16 sm:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left: headline + search */}
              <div className="animate-fade-up">
                {/* Brand slogan */}
                <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#C4C7C9]/55 select-none">
                  Match More<span className="mx-1.5 text-[#FF8000]" aria-hidden>·</span>Play More
                </p>

                {/* Eyebrow */}
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#FF8000]/35 bg-[#FF8000]/12 px-4 py-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-[#FF8000] animate-pulse" />
                  <span className="text-xs font-semibold uppercase tracking-widest text-[#FF8000]">
                    Nền tảng đặt sân #1 Việt Nam
                  </span>
                </div>

                {/* Headline */}
                <h1 className="text-5xl font-black tracking-tighter leading-[0.95] text-white sm:text-6xl lg:text-7xl">
                  Tìm sân.<br />
                  <span className="bg-gradient-to-r from-[#FF8000] to-[#86D232] bg-clip-text text-transparent">
                    Đặt ngay.
                  </span><br />
                  Chơi thôi.
                </h1>

                <p className="mt-6 text-lg text-slate-300 leading-relaxed max-w-md">
                  Hơn <span className="text-white font-semibold">3.000 sân</span> thể thao trên toàn quốc.
                  Đặt sân trong <span className="text-white font-semibold">30 giây</span>, xác nhận tức thì.
                </p>

                {/* Glassmorphism search panel */}
                <div className="mt-8 rounded-2xl border border-white/[0.18] bg-slate-950/60 p-2 shadow-[0_20px_60px_rgba(0,0,0,0.65)] backdrop-blur-xl ring-1 ring-inset ring-white/[0.04]">
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <div className="flex flex-1 items-center gap-2 rounded-xl border border-white/10 bg-white/8 px-4 py-3 min-w-0">
                      <Activity className="h-4 w-4 shrink-0 text-[#FF8000]" />
                      <input
                        type="text"
                        placeholder="Môn thể thao..."
                        className="w-full bg-transparent text-sm text-white placeholder:text-white/50 outline-none"
                        suppressHydrationWarning
                      />
                    </div>
                    <div className="flex flex-1 items-center gap-2 rounded-xl border border-white/10 bg-white/8 px-4 py-3 min-w-0">
                      <MapPin className="h-4 w-4 shrink-0 text-[#FF8000]" />
                      <input
                        type="text"
                        placeholder="Khu vực..."
                        className="w-full bg-transparent text-sm text-white placeholder:text-white/50 outline-none"
                        suppressHydrationWarning
                      />
                    </div>
                    <div className="flex flex-1 items-center gap-2 rounded-xl border border-white/10 bg-white/8 px-4 py-3 min-w-0">
                      <Clock className="h-4 w-4 shrink-0 text-[#FF8000]" />
                      <input
                        type="text"
                        placeholder="Ngày & giờ..."
                        className="w-full bg-transparent text-sm text-white placeholder:text-white/50 outline-none"
                        suppressHydrationWarning
                      />
                    </div>
                    <Button
                      size="lg"
                      className="shrink-0 gap-2 rounded-xl px-6 font-semibold bg-[#FF8000] hover:bg-[#FF8000]/85 text-white shadow-[0_0_24px_rgba(255,128,0,0.45)]"
                      asChild
                    >
                      <Link href="/venues">
                        <Search className="h-4 w-4" />
                        Tìm sân ngay
                      </Link>
                    </Button>
                  </div>
                </div>

                {/* Trust indicators */}
                <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
                  {[
                    { icon: CheckCircle2, label: "3.000+ sân" },
                    { icon: Zap, label: "Đặt sân trong 30 giây" },
                    { icon: Shield, label: "Sân đã xác thực" },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} className="flex items-center gap-1.5 text-sm text-slate-300">
                      <Icon className="h-3.5 w-3.5 text-[#FF8000] shrink-0" />
                      <span>{label}</span>
                    </div>
                  ))}
                </div>

                {/* Secondary CTA */}
                <div className="mt-5">
                  <Button
                    variant="outline"
                    className="gap-2 rounded-xl bg-[#030303]/70 border border-white/15 text-white shadow-lg backdrop-blur-md text-sm transition-all duration-200 hover:bg-[#FF8000]/10 hover:border-[#FF8000]/40 hover:text-white hover:shadow-[0_0_16px_rgba(255,128,0,0.18)] focus-visible:ring-2 focus-visible:ring-[#FF8000]/50"
                    asChild
                  >
                    <Link href="/pricing">
                      Xem gói thành viên
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Right: floating cards */}
              <HeroFloatingCards />
            </div>
          </div>
        </div>
      </ParticleHero>

      <StatsBar />
      <SportsSection />
      <FeaturedVenuesBento />
      <PricingTeaserSection />
      <FinalCTASection />
    </>
  );
}
