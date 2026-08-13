import Link from "next/link";
import {
  MapPin,
  Activity,
  ArrowRight,
  ChevronRight,
  Compass,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Data contract ──────────────────────────────────────────────────────────
// Filled in server-side by (public)/page.tsx from the real /venues (+
// /venues/{id}/courts + /courts/{id}/price-rules) endpoints. Every field here
// either comes straight from the API or is null when the API has nothing to
// report — never a fake placeholder value.

export interface FeaturedVenue {
  id: string;
  name: string;
  district: string;
  city: string;
  coverImageUrl: string | null;
  minPricePerHour: number | null;
  primarySport: string | null;
  openingTime: string; // "HH:mm"
  closingTime: string; // "HH:mm"
}

const ACCENTS = [
  {
    border: "hover:border-[#FF8000]/50",
    shadow: "hover:shadow-[#FF8000]/20",
    text: "group-hover:text-[#FF8000]",
    price: "text-[#FF8000]",
    badge: "bg-[#FF8000]/20 text-orange-200 border-[#FF8000]/30",
    icon: "bg-[#FF8000]/15 text-[#FF8000] ring-[#FF8000]/30 group-hover:bg-[#FF8000]/25 group-hover:ring-[#FF8000]/50",
    gradient: "from-[#1a1a1a] via-[#0f0f0f] to-[#030303]",
  },
  {
    border: "hover:border-amber-500/40",
    shadow: "hover:shadow-amber-500/15",
    text: "group-hover:text-amber-300",
    price: "text-amber-400",
    badge: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    icon: "border-amber-500/25 text-amber-300 group-hover:border-amber-500/50 group-hover:bg-amber-500/10 group-hover:text-amber-200",
    gradient: "from-yellow-900 via-amber-950 to-slate-950",
  },
  {
    border: "hover:border-[#86D232]/40",
    shadow: "hover:shadow-[#86D232]/15",
    text: "group-hover:text-[#86D232]",
    price: "text-[#86D232]",
    badge: "bg-[#86D232]/20 text-lime-200 border-[#86D232]/30",
    icon: "text-[#86D232] group-hover:text-lime-300",
    gradient: "from-green-900 via-emerald-950 to-slate-950",
  },
] as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatLocation(district: string, city: string): string {
  if (district && city) return `${district}, ${city}`;
  return district || city || "Chưa cập nhật khu vực";
}

function formatPrice(minPricePerHour: number | null): string {
  return minPricePerHour === null ? "Liên hệ" : `${minPricePerHour.toLocaleString("vi-VN")}đ`;
}

function toMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function isOpenNow(openingTime: string, closingTime: string): boolean {
  if (!openingTime || !closingTime) return false;
  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();
  return cur >= toMinutes(openingTime) && cur < toMinutes(closingTime);
}

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

function OpenBadge({ open }: { open: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-full border bg-black/60 px-3 py-1 backdrop-blur-sm",
        open ? "border-[rgba(134,210,50,0.25)]" : "border-white/10"
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          open ? "bg-lime-400 animate-pulse" : "bg-slate-500"
        )}
        aria-hidden="true"
      />
      <span className="text-[11px] font-semibold text-white">
        {open ? "Đang mở cửa" : "Đã đóng cửa"}
      </span>
    </div>
  );
}

function CoverBackground({ venue, gradient }: { venue: FeaturedVenue; gradient: string }) {
  if (venue.coverImageUrl) {
    return (
      <>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={venue.coverImageUrl}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/45" />
      </>
    );
  }
  return (
    <>
      <div className={cn("absolute inset-0 bg-gradient-to-b", gradient)} />
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.06]"
        aria-hidden="true"
      >
        <Activity className="h-56 w-56 text-white" />
      </div>
    </>
  );
}

// ─── Hero Card (tall, col 1 rows 1-2) ────────────────────────────────────────

function HeroVenueCard({ venue }: { venue: FeaturedVenue }) {
  const accent = ACCENTS[0];
  const open = isOpenNow(venue.openingTime, venue.closingTime);

  return (
    <Link
      href={`/venues/${venue.id}`}
      className={cn(
        "group relative flex min-h-[440px] flex-col overflow-hidden rounded-2xl border border-white/8 transition-all duration-300 hover:shadow-2xl sm:col-span-2 lg:col-span-1 lg:row-span-2",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8000]/50",
        accent.border,
        accent.shadow
      )}
      aria-label={`Xem chi tiết ${venue.name}`}
    >
      <CoverBackground venue={venue} gradient={accent.gradient} />

      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#FF8000]/45 to-transparent" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_100%_70%_at_50%_50%,rgba(255,128,0,0.07),transparent)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="relative flex items-start justify-between p-4">
        {venue.primarySport && <SportBadge label={venue.primarySport} className={accent.badge} />}
        <div className="ml-auto">
          <OpenBadge open={open} />
        </div>
      </div>

      <div className="relative flex-1" />

      <div className="relative bg-gradient-to-t from-black/90 via-black/60 to-transparent px-5 pb-6 pt-16">
        <h3 className={cn("text-xl font-bold leading-tight text-white transition-colors duration-200", accent.text)}>
          {venue.name}
        </h3>

        <div className="mt-1.5 flex items-center gap-1.5 text-sm text-slate-300">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
          <span>{formatLocation(venue.district, venue.city)}</span>
        </div>

        <div className="mt-5 flex items-center justify-between">
          <div>
            <span className={cn("text-2xl font-black", accent.price)}>{formatPrice(venue.minPricePerHour)}</span>
            {venue.minPricePerHour !== null && <span className="ml-1 text-sm text-slate-400">/ giờ</span>}
          </div>
          <span
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ring-1 transition-all duration-200",
              accent.icon
            )}
            aria-hidden="true"
          >
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

// ─── Wide Venue Card (row 1, cols 2-3) ───────────────────────────────────────

function WideVenueCard({ venue }: { venue: FeaturedVenue }) {
  const accent = ACCENTS[1];
  const open = isOpenNow(venue.openingTime, venue.closingTime);

  return (
    <Link
      href={`/venues/${venue.id}`}
      className={cn(
        "group relative flex min-h-[200px] overflow-hidden rounded-2xl border border-white/8 transition-all duration-300 hover:shadow-2xl sm:col-span-2 lg:col-span-2 lg:col-start-2 lg:row-start-1",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50",
        accent.border,
        accent.shadow
      )}
      aria-label={`Xem chi tiết ${venue.name}`}
    >
      <div className={cn("relative w-2/5 shrink-0 overflow-hidden bg-gradient-to-br", accent.gradient)}>
        {venue.coverImageUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={venue.coverImageUrl} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-black/35" />
          </>
        ) : (
          <div
            className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.07]"
            aria-hidden="true"
          >
            <Activity className="h-32 w-32 text-white" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/25" />
        <div className="absolute inset-0 flex flex-col items-start justify-between p-3">
          {venue.primarySport ? (
            <SportBadge label={venue.primarySport} className={accent.badge} />
          ) : (
            <span />
          )}
          <OpenBadge open={open} />
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between bg-slate-800/80 p-5 backdrop-blur-sm">
        <div>
          <h3 className={cn("font-bold leading-tight text-white transition-colors duration-200", accent.text)}>
            {venue.name}
          </h3>

          <div className="mt-2 flex items-center gap-1.5 text-sm text-slate-400">
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{formatLocation(venue.district, venue.city)}</span>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div>
            <span className={cn("text-lg font-black", accent.price)}>{formatPrice(venue.minPricePerHour)}</span>
            {venue.minPricePerHour !== null && <span className="ml-1 text-xs text-slate-400">/ giờ</span>}
          </div>
          <span
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border transition-all duration-200",
              accent.icon
            )}
            aria-hidden="true"
          >
            <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

// ─── Regular Venue Card (row 2, col 2 — also used as the uniform fallback) ──

function RegularVenueCard({
  venue,
  gridClassName,
}: {
  venue: FeaturedVenue;
  gridClassName?: string;
}) {
  const accent = ACCENTS[2];
  const open = isOpenNow(venue.openingTime, venue.closingTime);

  return (
    <Link
      href={`/venues/${venue.id}`}
      className={cn(
        "group relative flex min-h-[200px] flex-col overflow-hidden rounded-2xl border border-white/8 transition-all duration-300 hover:shadow-xl",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#86D232]/50",
        accent.border,
        accent.shadow,
        gridClassName
      )}
      aria-label={`Xem chi tiết ${venue.name}`}
    >
      <CoverBackground venue={venue} gradient={accent.gradient} />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_80%,rgba(132,204,22,0.08),transparent)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="relative flex items-start justify-between p-3">
        {venue.primarySport && <SportBadge label={venue.primarySport} className={accent.badge} />}
        <div className="ml-auto">
          <OpenBadge open={open} />
        </div>
      </div>

      <div className="relative flex-1" />

      <div className="relative bg-gradient-to-t from-black/90 via-black/55 to-transparent px-4 pb-4 pt-10">
        <h3 className={cn("font-bold leading-tight text-white transition-colors duration-200", accent.text)}>
          {venue.name}
        </h3>
        <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
          <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
          <span>{formatLocation(venue.district, venue.city)}</span>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className={cn("text-lg font-black", accent.price)}>
            {formatPrice(venue.minPricePerHour)}
            {venue.minPricePerHour !== null && (
              <span className="ml-1 text-xs font-normal text-slate-400">/ giờ</span>
            )}
          </span>
        </div>
      </div>
    </Link>
  );
}

// ─── CTA Tile ─────────────────────────────────────────────────────────────────

function CTATile({ gridClassName }: { gridClassName?: string }) {
  return (
    <Link
      href="/venues"
      className={cn(
        "group relative flex min-h-[200px] flex-col items-center justify-center overflow-hidden rounded-2xl border border-white/8 bg-slate-800/50 transition-all duration-300 hover:border-[#FF8000]/40 hover:bg-slate-800/80 hover:shadow-xl hover:shadow-[#FF8000]/15",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8000]/50",
        gridClassName
      )}
      aria-label="Xem tất cả sân thể thao"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[length:20px_20px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_70%_at_50%_50%,rgba(255,128,0,0.09),transparent)] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        aria-hidden="true"
      />

      <div className="relative p-6 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#FF8000]/10 ring-1 ring-[#FF8000]/25 transition-all duration-300 group-hover:bg-[#FF8000]/20 group-hover:ring-2 group-hover:ring-[#FF8000]/55 group-hover:shadow-lg group-hover:shadow-[#FF8000]/30">
          <ChevronRight className="h-6 w-6 text-[#FF8000]" aria-hidden="true" />
        </div>
        <h3 className="text-base font-bold text-white">Xem tất cả sân</h3>
        <p className="mt-1 text-sm text-slate-400">Khám phá toàn bộ sân đang mở đặt</p>
        <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#FF8000] transition-all duration-200 group-hover:gap-2.5">
          Khám phá ngay
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </div>
      </div>
    </Link>
  );
}

// ─── Empty state (no active venues from the API yet) ─────────────────────────

function EmptyState() {
  return (
    <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border border-white/8 bg-slate-800/30 px-6 py-16 text-center">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#FF8000]/10 ring-1 ring-[#FF8000]/25">
        <Compass className="h-7 w-7 text-[#FF8000]" aria-hidden="true" />
      </div>
      <h3 className="text-base font-bold text-white">Chưa có sân nổi bật</h3>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-400">
        Danh sách sân đang được cập nhật. Xem toàn bộ sân hiện có trên MatchOps.
      </p>
      <Link
        href="/venues"
        className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-[#FF8000] px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-[#FF8000]/90 hover:shadow-[0_0_20px_rgba(255,128,0,0.4)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8000]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
      >
        Xem tất cả sân
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </div>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

export function FeaturedVenuesBento({ venues }: { venues: FeaturedVenue[] }) {
  return (
    <section className="relative bg-slate-900 px-4 py-20 sm:px-6 lg:px-8">
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

        {venues.length === 0 ? (
          <div className="grid grid-cols-1">
            <EmptyState />
          </div>
        ) : venues.length >= 3 ? (
          // Full bento layout — needs exactly the 3 distinct card shapes below.
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <HeroVenueCard venue={venues[0]} />
            <WideVenueCard venue={venues[1]} />
            <RegularVenueCard venue={venues[2]} gridClassName="lg:col-start-2 lg:row-start-2" />
            <CTATile gridClassName="lg:col-start-3 lg:row-start-2" />
          </div>
        ) : (
          // Fewer than 3 real venues — a simple uniform grid avoids leaving
          // empty holes from the bento layout's fixed grid positions.
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {venues.map((venue) => (
              <RegularVenueCard key={venue.id} venue={venue} />
            ))}
            <CTATile />
          </div>
        )}
      </div>
    </section>
  );
}
