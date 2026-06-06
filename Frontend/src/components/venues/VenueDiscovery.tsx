"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Circle,
  Clock,
  Feather,
  LayoutGrid,
  MapPin,
  Search,
  Star,
  Target,
  Trophy,
  Wind,
  X,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VenueDisplayData {
  id: string;
  name: string;
  address: string;
  city: string;
  district: string;
  openingTime: string;  // "HH:mm"
  closingTime: string;  // "HH:mm"
  sports: string[];
  sportIds: string[];
  minPricePerHour: number | null;  // null = "Liên hệ"
  rating: number;
  reviewCount: number;
  gradientIndex: number;
  coverImageUrl: string | null;
}

export interface VenueDiscoveryProps {
  venues: VenueDisplayData[];
  allSports: string[];
  allDistricts: string[];
}

type PriceFilter = "ALL" | "UNDER_100K" | "100K_TO_200K" | "OVER_200K";
type RatingFilter = "ALL" | "4_PLUS" | "4_5_PLUS";

// ─── Static configuration ─────────────────────────────────────────────────────

const SPORT_ICONS: Record<string, LucideIcon> = {
  "Tất cả":       LayoutGrid,
  "Cầu lông":     Feather,
  "Bóng đá":      Trophy,
  "Tennis":       Circle,
  "Bóng rổ":      Activity,
  "Bóng chuyền":  Wind,
  "Pickleball":   Target,
};

const CARD_GRADIENTS: Array<{ bg: string; Icon: LucideIcon }> = [
  { bg: "from-emerald-900 to-teal-950",  Icon: Feather   },
  { bg: "from-green-900 to-slate-950",   Icon: Trophy    },
  { bg: "from-cyan-900 to-slate-950",    Icon: Circle    },
  { bg: "from-violet-900 to-slate-950",  Icon: Activity  },
];

const PRICE_OPTIONS: Array<{ key: PriceFilter; label: string }> = [
  { key: "ALL",          label: "Mọi mức giá"  },
  { key: "UNDER_100K",   label: "Dưới 100k/h"  },
  { key: "100K_TO_200K", label: "100–200k/h"   },
  { key: "OVER_200K",    label: "Trên 200k/h"  },
];

const RATING_OPTIONS: Array<{ key: RatingFilter; label: string }> = [
  { key: "ALL",      label: "Mọi đánh giá" },
  { key: "4_PLUS",   label: "4.0 sao+"    },
  { key: "4_5_PLUS", label: "4.5 sao+"    },
];

// ─── Pure helpers ─────────────────────────────────────────────────────────────

function toMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function isOpenNow(openingTime: string, closingTime: string): boolean {
  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();
  return cur >= toMinutes(openingTime) && cur < toMinutes(closingTime);
}

function matchesPrice(minPrice: number | null, filter: PriceFilter): boolean {
  if (filter === "ALL") return true;
  if (minPrice === null) return false;
  if (filter === "UNDER_100K") return minPrice < 100000;
  if (filter === "100K_TO_200K") return minPrice >= 100000 && minPrice <= 200000;
  return minPrice > 200000;
}

function cleanLocation(district: string, city: string): string {
  const d = district.trim();
  const c = city.trim();
  if (d && c) return `${d}, ${c}`;
  return d || c;
}

function matchesRating(rating: number, filter: RatingFilter): boolean {
  if (filter === "ALL") return true;
  if (filter === "4_PLUS") return rating >= 4.0;
  return rating >= 4.5;
}

// ─── Star rating ──────────────────────────────────────────────────────────────

function StarRating({ rating, reviewCount }: { rating: number; reviewCount: number }) {
  const full = Math.floor(rating);
  return (
    <div className="flex items-center gap-1.5" aria-label={`${rating} trên 5 sao`}>
      <div className="flex items-center gap-0.5" aria-hidden>
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={cn(
              "h-3 w-3",
              i <= full
                ? "fill-amber-400 text-amber-400"
                : "fill-slate-700 text-slate-700",
            )}
          />
        ))}
      </div>
      <span className="text-xs text-slate-400 tabular-nums">
        {rating.toFixed(1)}
        <span className="ml-1 text-slate-600">({reviewCount})</span>
      </span>
    </div>
  );
}

// ─── Sport chip ───────────────────────────────────────────────────────────────

function SportChip({
  label,
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  const Icon = SPORT_ICONS[label] ?? Activity;
  return (
    <button
      type="button"
      aria-pressed={isActive}
      onClick={onClick}
      className={cn(
        "flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-medium",
        "whitespace-nowrap transition-all duration-200",
        isActive
          ? [
              "bg-gradient-to-r from-emerald-500 to-cyan-500 text-white",
              "shadow-[0_0_18px_rgba(16,185,129,0.5)]",
            ]
          : [
              "border border-white/[0.08] bg-slate-800/70 text-slate-400",
              "hover:border-emerald-500/25 hover:bg-slate-800 hover:text-slate-200",
            ],
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {label}
    </button>
  );
}

// ─── Venue card ───────────────────────────────────────────────────────────────

function VenueCard({ venue }: { venue: VenueDisplayData }) {
  const [imgError, setImgError] = useState(false);
  const { bg, Icon: GradientIcon } =
    CARD_GRADIENTS[venue.gradientIndex % CARD_GRADIENTS.length];
  const openNow = isOpenNow(venue.openingTime, venue.closingTime);
  const showCoverImage = !!venue.coverImageUrl && !imgError;

  return (
    <Link
      href={`/venues/${venue.id}`}
      className={cn(
        "group block overflow-hidden rounded-2xl border border-white/[0.08]",
        "bg-gradient-to-b from-slate-900 to-slate-950 shadow-lg",
        "transition-all duration-300",
        "hover:-translate-y-0.5 hover:border-emerald-500/30",
        "hover:shadow-[0_8px_32px_rgba(16,185,129,0.15)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50",
      )}
    >
      {/* ── Cover ── */}
      <div
        className={cn(
          "relative h-44 overflow-hidden",
          showCoverImage ? "bg-slate-900" : cn("bg-gradient-to-br", bg),
        )}
      >
        {showCoverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={venue.coverImageUrl!}
            alt={venue.name}
            onError={() => setImgError(true)}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <>
            <GradientIcon
              className="absolute -right-6 -top-6 h-36 w-36 rotate-12 text-white/[0.06]"
              aria-hidden
            />
            <GradientIcon
              className="absolute -bottom-8 -left-4 h-28 w-28 -rotate-6 text-white/[0.04]"
              aria-hidden
            />
          </>
        )}

        {showCoverImage && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        )}

        {/* Open badge */}
        <div className="absolute right-3 top-3">
          {openNow ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-slate-950/80 px-2.5 py-1 text-[10px] font-semibold text-emerald-400 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" aria-hidden />
              Đang mở cửa
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full border border-white/[0.08] bg-slate-950/80 px-2.5 py-1 text-[10px] font-medium text-slate-500 backdrop-blur-sm">
              Đã đóng cửa
            </span>
          )}
        </div>

        {/* Price overlay */}
        <div className="absolute bottom-3 left-3">
          <span className="inline-flex items-center rounded-full bg-slate-950/70 px-2.5 py-1 text-xs font-semibold backdrop-blur-sm">
            {venue.minPricePerHour !== null ? (
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                từ {formatCurrency(venue.minPricePerHour)}/giờ
              </span>
            ) : (
              <span className="text-slate-400">Liên hệ</span>
            )}
          </span>
        </div>
      </div>

      {/* ── Card body ── */}
      <div className="p-4">
        {/* Venue name */}
        <h3 className="mb-1 line-clamp-1 text-base font-bold text-white transition-colors duration-200 group-hover:text-emerald-400">
          {venue.name}
        </h3>

        {/* Location */}
        <p className="mb-3 flex items-center gap-1 text-xs text-slate-400">
          <MapPin className="h-3 w-3 shrink-0 text-slate-600" aria-hidden />
          {cleanLocation(venue.district, venue.city)}
        </p>

        {/* Sport tags */}
        <div className="mb-3 flex flex-wrap gap-1.5">
          {venue.sports.map((sport) => (
            <span
              key={sport}
              className="inline-flex items-center rounded-full border border-white/[0.06] bg-slate-800/60 px-2 py-0.5 text-[10px] font-medium text-slate-400"
            >
              {sport}
            </span>
          ))}
        </div>

        {/* Rating */}
        <div className="mb-3">
          <StarRating rating={venue.rating} reviewCount={venue.reviewCount} />
        </div>

        {/* Footer: hours + CTA */}
        <div className="flex items-center justify-between border-t border-white/[0.06] pt-3">
          <span className="flex items-center gap-1 text-xs text-slate-500">
            <Clock className="h-3 w-3 text-slate-600" aria-hidden />
            {venue.openingTime} – {venue.closingTime}
          </span>
          <span className="flex items-center gap-1 text-xs font-medium text-slate-600 transition-colors duration-200 group-hover:text-emerald-400">
            Xem chi tiết
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </span>
        </div>
      </div>
    </Link>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyVenueState({ onReset }: { onReset: () => void }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-slate-800/60 ring-1 ring-white/[0.06]">
        <MapPin className="h-8 w-8 text-slate-500" aria-hidden />
      </div>
      <h3 className="mb-2 text-base font-semibold text-white">
        Không tìm thấy sân nào phù hợp
      </h3>
      <p className="mb-8 max-w-sm text-sm leading-relaxed text-slate-500">
        Thử thay đổi bộ lọc hoặc từ khoá tìm kiếm để xem thêm kết quả.
      </p>
      <button
        type="button"
        onClick={onReset}
        className={cn(
          "flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold",
          "bg-gradient-to-r from-emerald-500 to-cyan-500 text-white",
          "transition-all duration-200 hover:from-emerald-400 hover:to-cyan-400",
          "hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] active:scale-[0.98]",
        )}
      >
        Xoá bộ lọc
      </button>
    </div>
  );
}

// ─── Select wrapper ───────────────────────────────────────────────────────────

function FilterSelect({
  value,
  onChange,
  className,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("relative", className)}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-11 w-full appearance-none rounded-xl border border-white/[0.08] bg-slate-900",
          "pl-4 pr-9 text-sm focus:outline-none",
          "focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/30",
          "transition-colors cursor-pointer",
          value === "ALL" ? "text-slate-500" : "text-white",
        )}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
        aria-hidden
      />
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function VenueDiscovery({ venues, allSports, allDistricts }: VenueDiscoveryProps) {
  const [searchRaw, setSearchRaw]       = useState("");
  const [searchQ, setSearchQ]           = useState("");
  const [sportFilter, setSportFilter]   = useState<string>("ALL");
  const [districtFilter, setDistrict]   = useState<string>("ALL");
  const [priceFilter, setPriceFilter]   = useState<PriceFilter>("ALL");
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>("ALL");
  const [openNowOnly, setOpenNowOnly]   = useState(false);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setSearchQ(searchRaw.trim()), 280);
    return () => clearTimeout(t);
  }, [searchRaw]);

  const resetFilters = useCallback(() => {
    setSearchRaw("");
    setSearchQ("");
    setSportFilter("ALL");
    setDistrict("ALL");
    setPriceFilter("ALL");
    setRatingFilter("ALL");
    setOpenNowOnly(false);
  }, []);

  const hasFilter =
    searchQ ||
    sportFilter !== "ALL" ||
    districtFilter !== "ALL" ||
    priceFilter !== "ALL" ||
    ratingFilter !== "ALL" ||
    openNowOnly;

  const filtered = useMemo(() => {
    const q = searchQ.toLowerCase();
    return venues.filter((v) => {
      if (
        q &&
        !v.name.toLowerCase().includes(q) &&
        !v.address.toLowerCase().includes(q) &&
        !v.district.toLowerCase().includes(q)
      )
        return false;
      if (sportFilter !== "ALL" && !v.sports.includes(sportFilter)) return false;
      if (districtFilter !== "ALL" && v.district !== districtFilter) return false;
      if (!matchesPrice(v.minPricePerHour, priceFilter)) return false;
      if (!matchesRating(v.rating, ratingFilter)) return false;
      if (openNowOnly && !isOpenNow(v.openingTime, v.closingTime)) return false;
      return true;
    });
  }, [venues, searchQ, sportFilter, districtFilter, priceFilter, ratingFilter, openNowOnly]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

      {/* ── Page header ── */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white sm:text-3xl">
          Tìm sân thể thao
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Khám phá và đặt sân chơi thể thao tốt nhất gần bạn
        </p>
      </div>

      {/* ── Filter bar ── */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">

        {/* Search */}
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
            aria-hidden
          />
          <input
            type="search"
            value={searchRaw}
            onChange={(e) => setSearchRaw(e.target.value)}
            placeholder="Tìm sân, địa chỉ, quận..."
            aria-label="Tìm kiếm sân thể thao"
            className={cn(
              "h-11 w-full rounded-xl border border-white/[0.08] bg-slate-900",
              "pl-9 pr-9 text-sm text-white placeholder:text-slate-500",
              "transition-colors focus:border-emerald-500/40 focus:outline-none focus:ring-1 focus:ring-emerald-500/30",
            )}
          />
          {searchRaw && (
            <button
              type="button"
              onClick={() => setSearchRaw("")}
              aria-label="Xoá tìm kiếm"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          )}
        </div>

        {/* District */}
        <FilterSelect
          value={districtFilter}
          onChange={setDistrict}
          className="w-full sm:w-40"
        >
          <option value="ALL">Tất cả quận</option>
          {allDistricts.map((d) => (
            <option key={d} value={d} className="bg-slate-900 text-white">
              {d}
            </option>
          ))}
        </FilterSelect>

        {/* Price range */}
        <FilterSelect
          value={priceFilter}
          onChange={(v) => setPriceFilter(v as PriceFilter)}
          className="w-full sm:w-44"
        >
          {PRICE_OPTIONS.map((o) => (
            <option key={o.key} value={o.key} className="bg-slate-900 text-white">
              {o.label}
            </option>
          ))}
        </FilterSelect>

        {/* Rating */}
        <FilterSelect
          value={ratingFilter}
          onChange={(v) => setRatingFilter(v as RatingFilter)}
          className="w-full sm:w-36"
        >
          {RATING_OPTIONS.map((o) => (
            <option key={o.key} value={o.key} className="bg-slate-900 text-white">
              {o.label}
            </option>
          ))}
        </FilterSelect>

        {/* Open now toggle */}
        <button
          type="button"
          aria-pressed={openNowOnly}
          onClick={() => setOpenNowOnly((p) => !p)}
          className={cn(
            "flex h-11 shrink-0 items-center gap-2 rounded-xl border px-4 text-sm font-medium",
            "whitespace-nowrap transition-all duration-200",
            openNowOnly
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
              : "border-white/[0.08] bg-slate-900 text-slate-500 hover:border-white/[0.15] hover:text-slate-300",
          )}
        >
          {openNowOnly && <CheckCircle2 className="h-4 w-4" aria-hidden />}
          Đang mở cửa
        </button>
      </div>

      {/* ── Sport chips ── */}
      <div
        role="group"
        aria-label="Lọc theo môn thể thao"
        className="mb-6 flex gap-2 overflow-x-auto pb-1"
      >
        <SportChip
          label="Tất cả"
          isActive={sportFilter === "ALL"}
          onClick={() => setSportFilter("ALL")}
        />
        {allSports.map((sport) => (
          <SportChip
            key={sport}
            label={sport}
            isActive={sportFilter === sport}
            onClick={() =>
              setSportFilter(sportFilter === sport ? "ALL" : sport)
            }
          />
        ))}
      </div>

      {/* ── Results meta ── */}
      <div className="mb-5 flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Tìm thấy{" "}
          <span className="font-semibold text-white">{filtered.length}</span>{" "}
          cơ sở thể thao
        </p>
        {hasFilter && (
          <button
            type="button"
            onClick={resetFilters}
            className="flex items-center gap-1.5 text-xs text-slate-500 transition-colors hover:text-emerald-400"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
            Xoá bộ lọc
          </button>
        )}
      </div>

      {/* ── Venue grid ── */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.length === 0 ? (
          <EmptyVenueState onReset={resetFilters} />
        ) : (
          filtered.map((venue) => <VenueCard key={venue.id} venue={venue} />)
        )}
      </div>
    </div>
  );
}
