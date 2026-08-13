import { apiFetch } from "@/lib/api";
import type { ApiResponse } from "@/types/api";
import type { Sport } from "@/types/court";
import type { PublicCoachListItem, PublicCoachListResponse } from "@/types/coach";
import { StatsBar } from "@/components/home/StatsBar";
import { SportsSection } from "@/components/home/SportsSection";
import { FeaturedVenuesBento, type FeaturedVenue } from "@/components/home/FeaturedVenuesBento";
import { FeaturedCoachesSection } from "@/components/home/FeaturedCoachesSection";
import { FinalCTASection } from "@/components/home/FinalCTASection";
import { HeroIntro } from "@/components/home/HeroIntro";
import { PricingTeaserSection } from "@/components/home/PricingTeaserSection";
import { Hero, type HeroSport, type HeroVenue } from "@/components/home/Hero";

// ─── Server-side data for the Hero ─────────────────────────────────────────
// Mirrors the fetch/enrichment pattern already used by (public)/venues/page.tsx.

interface ApiWrapper<T> {
  success: boolean;
  message: string;
  data: T;
}

interface VenueResponseDto {
  id: string;
  name: string;
  address: string;
  city: string;
  district: string;
  ward: string | null;
  openingTime: string;
  closingTime: string;
  coverImageUrl: string | null;
  status: string;
}

interface CourtDto {
  id: string;
  sportId: string;
  sportName: string;
  status: string;
}

interface PriceRuleDto {
  pricePerHour: number;
  status: string;
}

function toHHMM(t: string): string {
  return t && t.length >= 5 ? t.slice(0, 5) : t ?? "";
}

function clean(v: string | null | undefined): string {
  if (!v || v.trim() === "string") return "";
  return v.trim();
}

async function fetchSports(): Promise<HeroSport[]> {
  try {
    const res = await apiFetch<ApiResponse<Sport[]>>("/sports");
    return (res.data ?? [])
      .filter((s) => s.status === "ACTIVE")
      .map((s) => ({ id: s.id, name: s.name }));
  } catch {
    return [];
  }
}

async function fetchHeroVenue(): Promise<{ venue: HeroVenue | null; districts: string[] }> {
  try {
    const res = await apiFetch<ApiWrapper<VenueResponseDto[]>>("/venues");
    const raw = (res.data ?? []).filter((v) => v.status === "ACTIVE");

    const districts = [
      ...new Set(raw.map((v) => clean(v.district)).filter(Boolean)),
    ].sort();

    const candidate = raw.find((v) => v.coverImageUrl) ?? raw[0];
    if (!candidate) return { venue: null, districts };

    let minPricePerHour: number | null = null;
    let primarySport: string | null = null;

    try {
      const courtsRes = await apiFetch<ApiWrapper<CourtDto[]>>(
        `/venues/${candidate.id}/courts`
      );
      const courts = courtsRes.data ?? [];
      primarySport = courts.find((c) => c.sportName && c.sportName !== "string")?.sportName ?? null;

      const priceResults = await Promise.allSettled(
        courts.map((c) =>
          apiFetch<ApiWrapper<PriceRuleDto[]>>(`/courts/${c.id}/price-rules`)
        )
      );
      for (const result of priceResults) {
        if (result.status === "fulfilled") {
          for (const rule of result.value.data ?? []) {
            if (
              rule.status === "Active" &&
              (minPricePerHour === null || rule.pricePerHour < minPricePerHour)
            ) {
              minPricePerHour = rule.pricePerHour;
            }
          }
        }
      }
    } catch {
      // Enrichment is best-effort — venue card still renders with base fields.
    }

    const venue: HeroVenue = {
      id: candidate.id,
      name: candidate.name,
      district: clean(candidate.district),
      city: clean(candidate.city),
      minPricePerHour,
      openingTime: toHHMM(candidate.openingTime),
      closingTime: toHHMM(candidate.closingTime),
      primarySport,
    };

    return { venue, districts };
  } catch {
    return { venue: null, districts: [] };
  }
}

// ─── Server-side data for the featured courts section ──────────────────────
// Same enrichment pattern as fetchHeroVenue above and (public)/venues/page.tsx,
// just applied to a small batch of venues instead of a single candidate.

async function fetchFeaturedVenues(limit: number): Promise<FeaturedVenue[]> {
  try {
    const res = await apiFetch<ApiWrapper<VenueResponseDto[]>>("/venues");
    const raw = (res.data ?? []).filter((v) => v.status === "ACTIVE");

    // Venues with a cover image make a nicer grid — prefer them, same idea
    // as the hero candidate selection above.
    const withImage = raw.filter((v) => v.coverImageUrl);
    const withoutImage = raw.filter((v) => !v.coverImageUrl);
    const ordered = [...withImage, ...withoutImage].slice(0, limit);

    return await Promise.all(
      ordered.map(async (v) => {
        let minPricePerHour: number | null = null;
        let primarySport: string | null = null;

        try {
          const courtsRes = await apiFetch<ApiWrapper<CourtDto[]>>(
            `/venues/${v.id}/courts`
          );
          const courts = courtsRes.data ?? [];
          primarySport =
            courts.find((c) => c.sportName && c.sportName !== "string")?.sportName ?? null;

          const priceResults = await Promise.allSettled(
            courts.map((c) =>
              apiFetch<ApiWrapper<PriceRuleDto[]>>(`/courts/${c.id}/price-rules`)
            )
          );
          for (const result of priceResults) {
            if (result.status === "fulfilled") {
              for (const rule of result.value.data ?? []) {
                if (
                  rule.status === "Active" &&
                  (minPricePerHour === null || rule.pricePerHour < minPricePerHour)
                ) {
                  minPricePerHour = rule.pricePerHour;
                }
              }
            }
          }
        } catch {
          // Enrichment is best-effort — card still renders with base fields.
        }

        return {
          id: v.id,
          name: v.name,
          district: clean(v.district),
          city: clean(v.city),
          coverImageUrl: v.coverImageUrl ?? null,
          minPricePerHour,
          primarySport,
          openingTime: toHHMM(v.openingTime),
          closingTime: toHHMM(v.closingTime),
        };
      })
    );
  } catch {
    return [];
  }
}

// ─── Server-side data for the featured coaches section ─────────────────────
// Same public endpoint and types already used by (public)/coach/page.tsx.

async function fetchFeaturedCoaches(limit: number): Promise<PublicCoachListItem[]> {
  try {
    const res = await apiFetch<ApiResponse<PublicCoachListResponse>>(
      `/coaches?page=1&pageSize=${limit}`
    );
    return res.success && res.data ? res.data.items : [];
  } catch {
    return [];
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const [sports, { venue, districts }, featuredVenuesRaw, featuredCoaches] =
    await Promise.all([
      fetchSports(),
      fetchHeroVenue(),
      fetchFeaturedVenues(4),
      fetchFeaturedCoaches(3),
    ]);

  // Avoid showing the exact same venue in both the hero search card and the
  // featured grid right below it.
  const featuredVenues = featuredVenuesRaw
    .filter((v) => v.id !== venue?.id)
    .slice(0, 3);

  return (
    <>
      <HeroIntro />

      <Hero sports={sports} districts={districts} venue={venue} />

      <StatsBar />
      <SportsSection />
      <FeaturedVenuesBento venues={featuredVenues} />
      <FeaturedCoachesSection coaches={featuredCoaches} />
      <PricingTeaserSection />
      <FinalCTASection />
    </>
  );
}
