"use client";

import Image from "next/image";
import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  MapPin,
  Clock,
  ShieldCheck,
  Zap,
  Dumbbell,
  Star,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface HeroSport {
  id: string;
  name: string;
}

export interface HeroVenue {
  id: string;
  name: string;
  district: string;
  city: string;
  minPricePerHour: number | null;
  openingTime: string; // "HH:mm"
  closingTime: string; // "HH:mm"
  primarySport: string | null;
}

interface HeroProps {
  sports: HeroSport[];
  districts: string[];
  venue: HeroVenue | null;
}

// ─── Fallback / example content ────────────────────────────────────────────
// These values are illustrative only — NOT verified platform statistics.
// Replace with real API-backed data once corresponding endpoints exist
// (aggregate rating/review count and a public "latest booking" source).
const HERO_FALLBACK = {
  // Used only when the venues API is unreachable, so the proof cluster
  // never renders an empty gap — clearly isolated, not a real listing.
  venue: {
    id: "fallback",
    name: "Sân Cầu Lông Quận 7",
    district: "Quận 7",
    city: "TP. Hồ Chí Minh",
    minPricePerHour: 150000,
    openingTime: "06:00",
    closingTime: "22:00",
    primarySport: "Cầu lông",
  },
  bookingExample: {
    courtName: "Sân A",
    time: "19:00 – 21:00",
    status: "Đã xác nhận",
  },
  trust: {
    rating: 4.8,
    reviewCountLabel: "1.200+ đánh giá",
  },
} as const;

const TRUST_POINTS = [
  { icon: ShieldCheck, label: "Sân đã xác thực" },
  { icon: Zap, label: "Đặt nhanh" },
  { icon: Dumbbell, label: "Hỗ trợ nhiều môn thể thao" },
] as const;

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Real, computed from the venue's own opening/closing hours — not a guess. */
function isVenueOpenNow(openingTime: string, closingTime: string): boolean | null {
  if (!openingTime || !closingTime) return null;
  const [oh, om] = openingTime.split(":").map(Number);
  const [ch, cm] = closingTime.split(":").map(Number);
  if ([oh, om, ch, cm].some((n) => Number.isNaN(n))) return null;
  if (ch * 60 + cm <= oh * 60 + om) return null; // overnight/unclear hours — skip the claim

  const now = new Date();
  const minutesNow = now.getHours() * 60 + now.getMinutes();
  return minutesNow >= oh * 60 + om && minutesNow < ch * 60 + cm;
}

function formatPrice(price: number): string {
  return `${price.toLocaleString("vi-VN")}đ`;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function Hero({ sports, districts, venue }: HeroProps) {
  const router = useRouter();
  const [sport, setSport] = useState("");
  const [district, setDistrict] = useState("");
  const [datetime, setDatetime] = useState("");

  const sportId = useId();
  const districtId = useId();
  const datetimeId = useId();

  const displayVenue = venue ?? HERO_FALLBACK.venue;
  const openNow = isVenueOpenNow(displayVenue.openingTime, displayVenue.closingTime);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (sport) params.set("sport", sport);
    if (district) params.set("district", district);
    if (datetime) params.set("datetime", datetime);
    const qs = params.toString();
    router.push(qs ? `/venues?${qs}` : "/venues");
  }

  return (
    <section className="relative isolate overflow-hidden bg-[#030303] pt-12 pb-16 sm:pt-16 sm:pb-20 lg:pt-24 lg:pb-24">
      {/* ── Background: dedicated Hero court photo + controlled overlay stack ── */}
      <div className="absolute inset-0 -z-10">
        <Image
          src="/images/home/matchops-hero-court-blue.png"
          alt=""
          fill
          priority
          sizes="100vw"
          quality={85}
          className="object-cover object-[13%_50%] sm:object-[center_38%] lg:object-[58%_78%]"
        />
        {/* Left-to-right readability gradient behind copy + search */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(100deg, rgba(3,3,3,0.95) 0%, rgba(3,3,3,0.86) 30%, rgba(3,3,3,0.48) 58%, rgba(3,3,3,0.22) 76%, rgba(3,3,3,0.40) 100%)",
          }}
        />
        {/* Subtle top darkening for the navbar transition */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(3,3,3,0.55) 0%, rgba(3,3,3,0.18) 14%, transparent 26%)",
          }}
        />
        {/* Subtle orange warmth near the product-card cluster */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 55% 45% at 94% 92%, rgba(255,128,0,0.14) 0%, transparent 60%)",
          }}
        />
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-5 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-10 lg:px-8">
        {/* ── Left: copy + search ── */}
        <div className="motion-safe:animate-fade-up">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/55">
            Đặt sân <span className="text-[#FF8000]">·</span> Ghép trận{" "}
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
              <span className="text-[#FF8000]">·</span> Book coach
              <span className="inline-flex items-center rounded-full border border-white/15 bg-white/[0.07] px-2 py-0.5 text-[10px] font-bold tracking-wide text-white/55">
                Sắp ra mắt
              </span>
            </span>
          </p>

          <p className="mt-4 text-sm font-bold uppercase tracking-[0.32em] text-[#FF8000]">
            MatchOps
          </p>

          <h1 className="mt-3 text-5xl font-black leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-[4rem]">
            Chơi đúng nơi.
            <br />
            Gặp đúng người.
          </h1>

          <p className="mt-5 max-w-md text-lg leading-relaxed text-slate-300">
            Đặt sân, ghép trận và tìm huấn luyện viên trên một nền tảng.
          </p>

          {/* ── Search form ── */}
          <form
            onSubmit={handleSubmit}
            className="mt-8 rounded-2xl border border-white/[0.14] bg-black/45 p-3 shadow-[0_20px_50px_rgba(0,0,0,0.55)] backdrop-blur-md"
          >
            <div className="flex flex-col gap-2.5">
              {/* Row 1: Sport + Area — each gets equal, generous width */}
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {/* Sport */}
                <div className="flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3.5 min-w-0 transition-colors focus-within:border-[#FF8000]/50 focus-within:bg-white/[0.09]">
                  <Dumbbell className="h-4 w-4 shrink-0 text-[#FF8000]" aria-hidden />
                  <label htmlFor={sportId} className="sr-only">
                    Môn thể thao
                  </label>
                  <select
                    id={sportId}
                    value={sport}
                    onChange={(e) => setSport(e.target.value)}
                    className="h-full w-full min-w-0 flex-1 appearance-none bg-transparent text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-[#FF8000] rounded-md [&>option]:bg-slate-900"
                  >
                    <option value="">Môn thể thao</option>
                    {sports.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Area */}
                <div className="flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3.5 min-w-0 transition-colors focus-within:border-[#FF8000]/50 focus-within:bg-white/[0.09]">
                  <MapPin className="h-4 w-4 shrink-0 text-[#FF8000]" aria-hidden />
                  <label htmlFor={districtId} className="sr-only">
                    Khu vực
                  </label>
                  <select
                    id={districtId}
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="h-full w-full min-w-0 flex-1 appearance-none bg-transparent text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-[#FF8000] rounded-md [&>option]:bg-slate-900"
                  >
                    <option value="">Khu vực</option>
                    {districts.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Date & time + primary CTA */}
              <div className="flex flex-col gap-2.5 sm:flex-row">
                <div className="flex h-11 flex-1 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3.5 min-w-0 transition-colors focus-within:border-[#FF8000]/50 focus-within:bg-white/[0.09]">
                  <Clock className="h-4 w-4 shrink-0 text-[#FF8000]" aria-hidden />
                  <label htmlFor={datetimeId} className="sr-only">
                    Ngày & giờ
                  </label>
                  <input
                    id={datetimeId}
                    type="datetime-local"
                    value={datetime}
                    onChange={(e) => setDatetime(e.target.value)}
                    className="h-full w-full min-w-0 flex-1 bg-transparent text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-[#FF8000] rounded-md [color-scheme:dark]"
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="h-11 shrink-0 gap-2 rounded-xl bg-[#FF8000] px-6 font-bold text-white hover:bg-[#FF8000]/90 focus-visible:ring-2 focus-visible:ring-[#FF8000] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                >
                  <Search className="h-4 w-4" aria-hidden />
                  Tìm sân ngay
                </Button>
              </div>
            </div>
          </form>

          {/* ── Trust indicators ── */}
          <ul className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2">
            {TRUST_POINTS.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-1.5 text-sm text-slate-300">
                <Icon className="h-3.5 w-3.5 shrink-0 text-[#FF8000]" aria-hidden />
                {label}
              </li>
            ))}
          </ul>
        </div>

        {/* ── Right: product proof cluster ── */}
        <div className="relative flex flex-col items-center gap-4 lg:items-end">
          {/* 1. Main venue card — highest visual weight, real data when available */}
          <div className="motion-safe:animate-float w-full max-w-[320px] rounded-2xl border border-white/[0.14] bg-slate-950/85 p-5 shadow-[0_28px_70px_rgba(0,0,0,0.7)] backdrop-blur-xl ring-1 ring-inset ring-white/[0.04]">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate text-base font-bold text-white">{displayVenue.name}</h3>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                  <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  <span className="truncate">
                    {displayVenue.district ? `${displayVenue.district}, ` : ""}
                    {displayVenue.city}
                  </span>
                </div>
              </div>
              {displayVenue.primarySport && (
                <span className="shrink-0 rounded-full border border-[#FF8000]/28 bg-[#FF8000]/12 px-2.5 py-0.5 text-[10px] font-semibold text-[#FF8000]">
                  {displayVenue.primarySport}
                </span>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" aria-hidden />
                <span className="text-sm font-semibold text-white">
                  {HERO_FALLBACK.trust.rating}
                </span>
              </div>
              {displayVenue.minPricePerHour != null && (
                <span className="text-sm font-bold text-[#FF8000]">
                  {formatPrice(displayVenue.minPricePerHour)}
                  <span className="ml-1 text-xs font-normal text-slate-400">/giờ</span>
                </span>
              )}
            </div>

            {openNow !== null && (
              <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-white/[0.06] px-3 py-2">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${openNow ? "bg-[#86D232]" : "bg-slate-500"}`}
                  aria-hidden
                />
                <span className="text-xs font-medium text-slate-300">
                  {openNow ? "Đang mở cửa" : "Đã đóng cửa"}
                </span>
              </div>
            )}
          </div>

          {/* 2. Booking confirmation card — medium weight, illustrative product state */}
          <div className="hidden w-[250px] rounded-xl border border-white/10 bg-slate-950/70 p-4 shadow-[0_18px_40px_rgba(0,0,0,0.5)] backdrop-blur-lg lg:mr-6 lg:block motion-safe:animate-float-delayed">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#86D232]/25 bg-[#86D232]/12">
                <CheckCircle2 className="h-4 w-4 text-[#86D232]" aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white">Đặt sân thành công</p>
                <p className="mt-0.5 truncate text-[11px] text-slate-400">
                  {HERO_FALLBACK.bookingExample.courtName} · {HERO_FALLBACK.bookingExample.time}
                </p>
              </div>
            </div>
          </div>

          {/* 3. Compact trust / social-proof pill — lowest visual weight */}
          <div className="hidden w-[210px] rounded-lg border border-white/[0.08] bg-slate-950/55 px-4 py-2.5 shadow-[0_10px_24px_rgba(0,0,0,0.4)] backdrop-blur lg:mr-3 lg:block motion-safe:animate-float-slow">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" aria-hidden />
              ))}
              <span className="ml-1 text-xs font-semibold text-white">
                {HERO_FALLBACK.trust.rating}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              {HERO_FALLBACK.trust.reviewCountLabel} từ người chơi
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
