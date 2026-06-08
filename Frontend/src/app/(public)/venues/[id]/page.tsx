import { Metadata } from "next";
import { notFound } from "next/navigation";
import { MapPin, Clock, Star, ChevronRight, Users } from "lucide-react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { TimeSlotPicker } from "@/components/booking/TimeSlotPicker";
import type { Venue, VenueStatus } from "@/types/venue";
import type { Court, CourtStatus, PriceRule, Sport } from "@/types/court";

export const metadata: Metadata = { title: "Chi tiết cơ sở – MatchOps" };

// ─── Backend DTOs ─────────────────────────────────────────────────────────────

interface ApiWrapper<T> {
  success: boolean;
  message: string;
  data: T;
}

interface VenueResponseDto {
  id: string;
  ownerId: string;
  name: string;
  address: string;
  city: string;
  district: string;
  ward: string | null;
  description: string | null;
  coverImageUrl: string | null;
  openingTime: string;
  closingTime: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface CourtResponseDto {
  id: string;
  venueId: string;
  sportId: string;
  sportName: string;
  name: string;
  type: string | null;
  capacity: number | null;
  locationNote: string | null;
  description: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface PriceRuleResponseDto {
  id: string;
  courtId: string;
  dayType: string;
  startTime: string;
  endTime: string;
  pricePerHour: number;
  status: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toHHMM(t: string): string {
  return t.length >= 5 ? t.slice(0, 5) : t;
}

function clean(v: string | null | undefined): string {
  if (!v || v.trim() === "string") return "";
  return v.trim();
}

function mapPriceRuleDto(r: PriceRuleResponseDto): PriceRule {
  return {
    id: r.id,
    courtId: r.courtId,
    dayType: r.dayType as PriceRule["dayType"],
    startTime: toHHMM(r.startTime),
    endTime: toHHMM(r.endTime),
    pricePerHour: r.pricePerHour,
    priority: 1,
    status: r.status.toLowerCase() === "active" ? "ACTIVE" : "INACTIVE",
  };
}

function mapCourtDto(
  c: CourtResponseDto,
  priceRuleDtos: PriceRuleResponseDto[]
): Court {
  const priceRules = priceRuleDtos
    .filter((r) => r.status.toLowerCase() === "active")
    .map(mapPriceRuleDto);

  return {
    id: c.id,
    venueId: c.venueId,
    sportId: c.sportId,
    name: c.name,
    type: clean(c.type) || undefined,
    capacity: c.capacity ?? undefined,
    locationNote: clean(c.locationNote) || undefined,
    description: clean(c.description) || undefined,
    status: c.status.toUpperCase() as CourtStatus,
    priceRules,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}

function mapVenueDto(v: VenueResponseDto): Venue {
  return {
    id: v.id,
    ownerId: v.ownerId,
    name: v.name,
    address: clean(v.address),
    city: clean(v.city),
    district: clean(v.district),
    ward: clean(v.ward) || undefined,
    description: clean(v.description) || undefined,
    openingTime: toHHMM(v.openingTime),
    closingTime: toHHMM(v.closingTime),
    coverImageUrl: v.coverImageUrl || undefined,
    status: v.status.toUpperCase() as VenueStatus,
    createdAt: v.createdAt,
    updatedAt: v.updatedAt,
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function VenueDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // ── Fetch venue ─────────────────────────────────────────────────────────────
  let venue: Venue | null = null;
  let venueError: string | null = null;

  try {
    const res = await apiFetch<ApiWrapper<VenueResponseDto>>(`/venues/${id}`);
    venue = res.data ? mapVenueDto(res.data) : null;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes(": 404")) notFound();
    venueError = msg || "Không thể tải thông tin cơ sở.";
  }

  if (venueError) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 text-center sm:px-6 lg:px-8">
        <p className="text-sm text-red-400">{venueError}</p>
        <Link
          href="/venues"
          className="mt-4 inline-block text-sm text-[#FF8000] hover:underline"
        >
          ← Quay lại danh sách sân
        </Link>
      </div>
    );
  }

  if (!venue) notFound();

  // ── Fetch courts + price rules (non-fatal) ──────────────────────────────────
  let courts: Court[] = [];
  let sports: Sport[] = [];

  try {
    const courtsRes = await apiFetch<ApiWrapper<CourtResponseDto[]>>(
      `/venues/${id}/courts`
    );
    const courtDtos = courtsRes.data ?? [];

    const priceResults = await Promise.allSettled(
      courtDtos.map((c) =>
        apiFetch<ApiWrapper<PriceRuleResponseDto[]>>(
          `/courts/${c.id}/price-rules`
        )
      )
    );

    courts = courtDtos.map((c, i) => {
      const result = priceResults[i];
      const prDtos =
        result.status === "fulfilled" ? (result.value.data ?? []) : [];
      return mapCourtDto(c, prDtos);
    });

    sports = [
      ...new Map(
        courtDtos.map((c) => [
          c.sportId,
          { id: c.sportId, name: c.sportName, status: "ACTIVE" as const },
        ])
      ).values(),
    ];
  } catch {
    // courts and sports stay empty; the rest of the page still renders
  }

  // ── Display helpers ─────────────────────────────────────────────────────────
  const displayAddress = [venue.address, venue.district, venue.city]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-1 text-sm text-slate-500">
        <Link href="/" className="transition-colors hover:text-slate-300">
          Trang chủ
        </Link>
        <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        <Link href="/venues" className="transition-colors hover:text-slate-300">
          Sân thể thao
        </Link>
        <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        <span className="max-w-[200px] truncate font-medium text-slate-200">
          {venue.name}
        </span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* ── Main content ── */}
        <div className="space-y-6 lg:col-span-2">
          {/* Cover image / fallback */}
          {venue.coverImageUrl ? (
            <div className="relative h-72 w-full overflow-hidden rounded-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={venue.coverImageUrl}
                alt={venue.name}
                className="h-full w-full object-cover"
              />
              <div
                className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950/60 to-transparent"
                aria-hidden
              />
            </div>
          ) : (
            <div className="relative flex h-72 w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-[#141414] to-[#0A0A0A]">
              <MapPin className="h-16 w-16 text-[#FF8000]/25" aria-hidden />
              <div
                className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950/60 to-transparent"
                aria-hidden
              />
            </div>
          )}

          {/* Venue header */}
          <div>
            <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-white">{venue.name}</h1>
                {displayAddress && (
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-400">
                    <MapPin
                      className="h-3.5 w-3.5 shrink-0 text-slate-600"
                      aria-hidden
                    />
                    {displayAddress}
                  </p>
                )}
              </div>

              {/* Static rating badge */}
              <div className="flex items-center gap-1.5 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-sm font-medium text-amber-400">
                <Star
                  className="h-4 w-4 fill-amber-400 text-amber-400"
                  aria-hidden
                />
                4.8
                <span className="font-normal text-amber-600">
                  (124 đánh giá)
                </span>
              </div>
            </div>

            {/* Sport pills derived from courts */}
            {sports.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-2">
                {sports.map((sport) => (
                  <span
                    key={sport.id}
                    className="inline-flex items-center rounded-full border border-[#FF8000]/30 bg-[rgba(255,128,0,0.12)] px-2.5 py-0.5 text-xs font-medium text-[#FF8000]"
                  >
                    {sport.name}
                  </span>
                ))}
              </div>
            )}

            {/* Opening hours */}
            <div className="mb-5 flex items-center gap-2 text-sm text-slate-400">
              <Clock className="h-4 w-4 shrink-0 text-slate-600" aria-hidden />
              Mở cửa: {venue.openingTime} – {venue.closingTime} mỗi ngày
            </div>

            {/* Description */}
            {venue.description && (
              <p className="text-sm leading-relaxed text-slate-400">
                {venue.description}
              </p>
            )}
          </div>

          {/* Courts list */}
          <div>
            <h2 className="mb-4 text-lg font-semibold text-white">
              Danh sách sân ({courts.length})
            </h2>
            {courts.length === 0 ? (
              <p className="text-sm text-slate-500">Chưa có sân nào.</p>
            ) : (
              <div className="space-y-3">
                {courts.map((court) => {
                  const sport = sports.find((s) => s.id === court.sportId);
                  const courtMinPrice =
                    court.priceRules?.length
                      ? Math.min(
                          ...court.priceRules.map((r) => r.pricePerHour)
                        )
                      : null;
                  return (
                    <div
                      key={court.id}
                      className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-slate-900/50 p-4 transition-colors hover:border-[#FF8000]/20 hover:bg-slate-900/70"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-slate-200">
                          {court.name}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          {sport && (
                            <span className="rounded-full border border-[#FF8000]/30 bg-[rgba(255,128,0,0.10)] px-2 py-0.5 text-[10px] font-medium text-[#FF8000]">
                              {sport.name}
                            </span>
                          )}
                          {court.type && <span>{court.type}</span>}
                          {court.capacity && (
                            <span className="flex items-center gap-0.5">
                              <Users className="h-3 w-3" aria-hidden />
                              {court.capacity} người
                            </span>
                          )}
                          {court.locationNote && (
                            <span>{court.locationNote}</span>
                          )}
                        </div>
                      </div>

                      <div className="ml-4 shrink-0 text-right">
                        {courtMinPrice !== null ? (
                          <p className="text-sm font-semibold text-[#FF8000]">
                            từ {(courtMinPrice / 1000).toFixed(0)}k/h
                          </p>
                        ) : (
                          <p className="text-sm text-slate-500">Liên hệ</p>
                        )}
                        <a
                          href="#booking-panel"
                          className="mt-2 inline-block rounded-lg bg-[#FF8000] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#FF8000]/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8000]"
                        >
                          Đặt sân
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Booking sidebar ── */}
        <div className="lg:col-span-1">
          <TimeSlotPicker venue={venue} courts={courts} sports={sports} />
        </div>
      </div>
    </div>
  );
}
