import Link from "next/link";
import { Search, ArrowRight, CheckCircle2, Zap, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

const trustBadges = [
  { icon: CheckCircle2, label: "Miễn phí đăng ký" },
  { icon: Zap,          label: "Xác nhận trong 30s" },
  { icon: Shield,       label: "Sân đã xác thực" },
];

export function FinalCTASection() {
  return (
    <section className="relative overflow-hidden bg-slate-950 px-4 py-28 sm:px-6 lg:px-8">
      {/* ── Ambient glow blobs ───────────────────────────────────────────── */}
      {/* Large emerald center */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[700px] w-[700px] rounded-full bg-emerald-600/[0.11] blur-[140px]"
      />
      {/* Cyan upper-right */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-1/4 top-0 h-[420px] w-[420px] rounded-full bg-cyan-500/[0.08] blur-[100px]"
      />
      {/* Violet lower-left */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-1/4 h-[380px] w-[380px] rounded-full bg-violet-600/[0.08] blur-[100px]"
      />

      {/* ── Dot grid overlay ─────────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[length:32px_32px]"
      />

      {/* ── Top border glow ──────────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent"
      />
      {/* Cyan accent layer on top border */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent"
      />

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <div className="relative mx-auto max-w-3xl text-center">
        {/* Eyebrow — ping dot + sharp pill */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 shadow-inner shadow-emerald-500/10">
          <span className="relative flex h-2 w-2" aria-hidden="true">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
            Bắt đầu ngay hôm nay
          </span>
        </div>

        {/* Headline */}
        <h2 className="text-4xl font-black tracking-tighter leading-[0.95] text-white sm:text-5xl lg:text-6xl">
          Sân trống đang
          <br />
          <span className="bg-gradient-to-r from-emerald-400 via-cyan-300 to-teal-300 bg-clip-text text-transparent">
            chờ bạn.
          </span>
        </h2>

        {/* Subtext */}
        <p className="mx-auto mt-6 max-w-lg text-lg text-slate-400 leading-relaxed">
          Tham gia cùng{" "}
          <span className="font-semibold text-white">50.000+</span> người dùng
          đang đặt sân qua MatchOps mỗi tháng. Hoàn toàn miễn phí.
        </p>

        {/* Trust badges — pill style with subtle bg */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {trustBadges.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 rounded-full border border-white/8 bg-white/5 px-4 py-2 text-sm text-slate-300 backdrop-blur-sm"
            >
              <Icon className="h-4 w-4 shrink-0 text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.6)]" aria-hidden="true" />
              <span>{label}</span>
            </div>
          ))}
        </div>

        {/* CTA buttons */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          {/* Primary — gradient + strong glow */}
          <Button
            size="lg"
            className="gap-2 rounded-xl px-8 py-6 text-base font-bold bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-xl shadow-emerald-500/35 transition-all duration-200 hover:from-emerald-400 hover:to-cyan-400 hover:shadow-emerald-400/55 hover:-translate-y-0.5"
            asChild
          >
            <Link href="/venues">
              <Search className="h-5 w-5" aria-hidden="true" />
              Tìm sân ngay
            </Link>
          </Button>

          {/* Secondary — emerald-tinted on hover */}
          <Button
            size="lg"
            variant="outline"
            className="gap-2 rounded-xl px-8 py-6 text-base font-semibold bg-slate-950/70 border border-white/15 text-white shadow-lg shadow-emerald-950/20 backdrop-blur-md transition-all duration-200 hover:bg-emerald-500/15 hover:border-emerald-400/50 hover:text-emerald-100 hover:shadow-emerald-500/20 focus-visible:ring-2 focus-visible:ring-emerald-400/60"
            asChild
          >
            <Link href="/register">
              Đăng ký làm chủ sân
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
