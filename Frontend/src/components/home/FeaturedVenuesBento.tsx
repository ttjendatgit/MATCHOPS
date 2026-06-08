import Link from "next/link";
import {
  MapPin,
  Star,
  Activity,
  Users,
  ArrowRight,
  ChevronRight,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// ─── Data ────────────────────────────────────────────────────────────────────

const heroVenue = {
  name: "Sân Cầu Lông Quận 7",
  sport: "Cầu lông",
  location: "Quận 7, TP.HCM",
  rating: 4.9,
  reviews: 312,
  price: 150000,
  slots: 4,
  sportBadge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  href: "/venues",
};

const wideVenue = {
  name: "Sân Tennis Phú Nhuận",
  sport: "Tennis",
  location: "Phú Nhuận, TP.HCM",
  rating: 4.8,
  reviews: 198,
  price: 200000,
  slots: 2,
  gradient: "from-yellow-900 via-amber-950 to-slate-950",
  sportBadge: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  accentColor: "text-amber-400",
  href: "/venues",
};

const regularVenue = {
  name: "Sân Bóng Đá Mini Gò Vấp",
  sport: "Bóng đá",
  location: "Gò Vấp, TP.HCM",
  rating: 4.7,
  reviews: 441,
  price: 350000,
  slots: 1,
  gradient: "from-green-900 via-emerald-950 to-slate-950",
  sportBadge: "bg-lime-500/20 text-lime-300 border-lime-500/30",
  accentColor: "text-lime-400",
  href: "/venues",
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function SportBadge({ label, className }: { label: string; className: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold backdrop-blur-sm",
        className
      )}
    >
      {label}
    </span>
  );
}

function RatingBadge({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/15 px-2.5 py-1 text-[11px] font-bold text-amber-300 backdrop-blur-sm">
      <Star className="h-3 w-3 fill-amber-400 text-amber-400" aria-hidden="true" />
      {rating}
    </span>
  );
}

function AvailabilityDot({ slots }: { slots: number }) {
  return (
    <div className="flex items-center gap-1.5 rounded-full border border-[rgba(134,210,50,0.25)] bg-black/60 px-3 py-1 backdrop-blur-sm">
      <span className="h-1.5 w-1.5 rounded-full bg-lime-400 animate-pulse" aria-hidden="true" />
      <span className="text-[11px] font-semibold text-white">Còn {slots} khung giờ</span>
    </div>
  );
}

// ─── Hero Card (tall, col 1 rows 1-2) ────────────────────────────────────────

function HeroVenueCard() {
  return (
    <Link
      href={heroVenue.href}
      className="group relative flex min-h-[440px] flex-col overflow-hidden rounded-2xl border border-white/8 transition-all duration-300 hover:border-[#FF8000]/50 hover:shadow-2xl hover:shadow-[#FF8000]/20 sm:col-span-2 lg:col-span-1 lg:row-span-2"
      aria-label={`Xem chi tiết ${heroVenue.name}`}
    >
      {/* Full-bleed gradient background — deep cinematic */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#1a1a1a] via-[#0f0f0f] to-[#030303]" />

      {/* Top cinematic glow line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#FF8000]/45 to-transparent" />

      {/* Ambient top radial */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_55%_at_50%_0%,rgba(255,128,0,0.12),transparent)]" />

      {/* Hover glow overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_100%_70%_at_50%_50%,rgba(255,128,0,0.07),transparent)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      {/* Decorative large faint icon */}
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.05]"
        aria-hidden="true"
      >
        <Activity className="h-64 w-64 text-white" />
      </div>

      {/* Top bar: sport badge + rating */}
      <div className="relative flex items-start justify-between p-4">
        <SportBadge label={heroVenue.sport} className={heroVenue.sportBadge} />
        <RatingBadge rating={heroVenue.rating} />
      </div>

      {/* Spacer */}
      <div className="relative flex-1" />

      {/* Bottom content overlay */}
      <div className="relative bg-gradient-to-t from-black/90 via-black/60 to-transparent px-5 pb-6 pt-16">
        <AvailabilityDot slots={heroVenue.slots} />

        <h3 className="mt-3 text-xl font-bold leading-tight text-white transition-colors duration-200 group-hover:text-[#FF8000]">
          {heroVenue.name}
        </h3>

        <div className="mt-1.5 flex items-center gap-1.5 text-sm text-slate-300">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
          <span>{heroVenue.location}</span>
        </div>

        <div className="mt-1 flex items-center gap-1 text-xs text-slate-400">
          <Users className="h-3 w-3" aria-hidden="true" />
          <span>{heroVenue.reviews} đánh giá</span>
        </div>

        <div className="mt-5 flex items-center justify-between">
          <div>
            <span className="text-2xl font-black text-[#FF8000]">
              {heroVenue.price.toLocaleString("vi-VN")}đ
            </span>
            <span className="ml-1 text-sm text-slate-400">/ giờ</span>
          </div>
          <Button
            size="sm"
            className="gap-1.5 rounded-xl bg-[#FF8000] text-xs font-bold text-white shadow-lg shadow-[#FF8000]/40 transition-all duration-200 hover:bg-[#FF8000]/85 hover:shadow-[#FF8000]/60"
          >
            Đặt ngay
            <ArrowRight
              className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Button>
        </div>
      </div>
    </Link>
  );
}

// ─── Wide Venue Card (row 1, cols 2-3) ───────────────────────────────────────

function WideVenueCard() {
  return (
    <Link
      href={wideVenue.href}
      className="group relative flex min-h-[200px] overflow-hidden rounded-2xl border border-white/8 transition-all duration-300 hover:border-amber-500/40 hover:shadow-2xl hover:shadow-amber-500/15 sm:col-span-2 lg:col-span-2 lg:col-start-2 lg:row-start-1"
      aria-label={`Xem chi tiết ${wideVenue.name}`}
    >
      {/* Left: gradient image area */}
      <div className={cn("relative w-2/5 shrink-0 bg-gradient-to-br", wideVenue.gradient)}>
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.07]"
          aria-hidden="true"
        >
          <Activity className="h-32 w-32 text-white" />
        </div>
        {/* Fade-to-right edge blend */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/25" />
        <div className="absolute inset-0 flex flex-col items-start justify-between p-3">
          <SportBadge label={wideVenue.sport} className={wideVenue.sportBadge} />
          <AvailabilityDot slots={wideVenue.slots} />
        </div>
      </div>

      {/* Right: info — richer bg */}
      <div className="flex flex-1 flex-col justify-between bg-slate-800/80 p-5 backdrop-blur-sm">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold leading-tight text-white transition-colors duration-200 group-hover:text-amber-300">
              {wideVenue.name}
            </h3>
            <RatingBadge rating={wideVenue.rating} />
          </div>

          <div className="mt-2 flex items-center gap-1.5 text-sm text-slate-400">
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{wideVenue.location}</span>
          </div>

          <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
            <Users className="h-3 w-3" aria-hidden="true" />
            <span>{wideVenue.reviews} đánh giá</span>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div>
            <span className={cn("text-lg font-black", wideVenue.accentColor)}>
              {wideVenue.price.toLocaleString("vi-VN")}đ
            </span>
            <span className="ml-1 text-xs text-slate-400">/ giờ</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="gap-1 rounded-xl border-amber-500/25 text-xs font-semibold text-amber-300 transition-all duration-200 hover:border-amber-500/50 hover:bg-amber-500/10 hover:text-amber-200"
          >
            Đặt ngay
            <ArrowRight className="h-3 w-3" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </Link>
  );
}

// ─── Regular Venue Card (row 2, col 2) ───────────────────────────────────────

function RegularVenueCard() {
  return (
    <Link
      href={regularVenue.href}
      className="group relative flex min-h-[200px] flex-col overflow-hidden rounded-2xl border border-white/8 transition-all duration-300 hover:border-lime-500/40 hover:shadow-xl hover:shadow-lime-500/15 lg:col-start-2 lg:row-start-2"
      aria-label={`Xem chi tiết ${regularVenue.name}`}
    >
      <div className={cn("absolute inset-0 bg-gradient-to-b", regularVenue.gradient)} />

      {/* Hover glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_80%,rgba(132,204,22,0.08),transparent)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.05]"
        aria-hidden="true"
      >
        <Activity className="h-32 w-32 text-white" />
      </div>

      <div className="relative flex items-start justify-between p-3">
        <SportBadge label={regularVenue.sport} className={regularVenue.sportBadge} />
        <RatingBadge rating={regularVenue.rating} />
      </div>

      <div className="relative flex-1" />

      <div className="relative bg-gradient-to-t from-black/90 via-black/55 to-transparent px-4 pb-4 pt-10">
        <AvailabilityDot slots={regularVenue.slots} />
        <h3 className="mt-2 font-bold leading-tight text-white transition-colors duration-200 group-hover:text-lime-300">
          {regularVenue.name}
        </h3>
        <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
          <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
          <span>{regularVenue.location}</span>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className={cn("text-lg font-black", regularVenue.accentColor)}>
            {regularVenue.price.toLocaleString("vi-VN")}đ
            <span className="ml-1 text-xs font-normal text-slate-400">/ giờ</span>
          </span>
          <Clock className="h-4 w-4 text-slate-500 transition-colors duration-200 group-hover:text-lime-500" aria-hidden="true" />
        </div>
      </div>
    </Link>
  );
}

// ─── CTA Tile (row 2, col 3) ──────────────────────────────────────────────────

function CTATile() {
  return (
    <Link
      href="/venues"
      className="group relative flex min-h-[200px] flex-col items-center justify-center overflow-hidden rounded-2xl border border-white/8 bg-slate-800/50 transition-all duration-300 hover:border-[#FF8000]/40 hover:bg-slate-800/80 hover:shadow-xl hover:shadow-[#FF8000]/15 lg:col-start-3 lg:row-start-2"
      aria-label="Xem tất cả sân thể thao"
    >
      {/* Dot-grid pattern */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[length:20px_20px]"
        aria-hidden="true"
      />
      {/* Emerald glow on hover */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_70%_at_50%_50%,rgba(255,128,0,0.09),transparent)] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        aria-hidden="true"
      />

      <div className="relative p-6 text-center">
        {/* Icon ring — glows on hover */}
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#FF8000]/10 ring-1 ring-[#FF8000]/25 transition-all duration-300 group-hover:bg-[#FF8000]/20 group-hover:ring-2 group-hover:ring-[#FF8000]/55 group-hover:shadow-lg group-hover:shadow-[#FF8000]/30">
          <ChevronRight className="h-6 w-6 text-[#FF8000]" aria-hidden="true" />
        </div>
        <h3 className="text-base font-bold text-white">Xem tất cả sân</h3>
        <p className="mt-1 text-sm text-slate-400">3.000+ sân đang chờ bạn</p>
        <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#FF8000] transition-all duration-200 group-hover:gap-2.5">
          Khám phá ngay
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </div>
      </div>
    </Link>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

export function FeaturedVenuesBento() {
  return (
    <section className="relative bg-slate-900 px-4 py-20 sm:px-6 lg:px-8">
      {/* Section depth gradient — cyan tint from bottom */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_40%_at_50%_110%,rgba(255,128,0,0.04),transparent)]" />

      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="mb-3 inline-block text-xs font-bold uppercase tracking-widest text-[#FF8000] drop-shadow-[0_0_8px_rgba(255,128,0,0.5)]">
              Sân nổi bật
            </span>
            <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
              Được đặt nhiều nhất
            </h2>
            <p className="mt-2 text-slate-400">
              Chất lượng đảm bảo, người chơi tin tưởng
            </p>
          </div>
          <Link
            href="/venues"
            className="group hidden shrink-0 items-center gap-1.5 rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-slate-300 transition-all duration-200 hover:border-[#FF8000]/35 hover:bg-[#FF8000]/5 hover:text-white sm:flex"
            aria-label="Xem tất cả sân thể thao"
          >
            Xem tất cả sân
            <ChevronRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        </div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <HeroVenueCard />
          <WideVenueCard />
          <RegularVenueCard />
          <CTATile />
        </div>
      </div>
    </section>
  );
}
