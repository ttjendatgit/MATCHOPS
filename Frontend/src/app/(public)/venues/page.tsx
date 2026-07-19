import { Metadata } from "next";
import { apiFetch } from "@/lib/api";
import {
  VenueDiscovery,
  type VenueDisplayData,
} from "@/components/venues/VenueDiscovery";

export const metadata: Metadata = {
  title: "Tìm sân thể thao – MatchOps",
};

interface VenuesPageProps {
  // Contract emitted by the homepage: Hero search (sport, district, datetime)
  // and SportsSection sport cards (sport). Kept backwards compatible — do not
  // rename without updating both emitters.
  searchParams: Promise<{
    sport?: string;
    district?: string;
    datetime?: string;
  }>;
}

// Case/whitespace-insensitive match against the real, available option list.
// Falls back to "no filter" rather than crashing or showing a broken
// selected state when the URL carries a value that doesn't exist in the data.
//
// Vietnamese diacritics can round-trip through a URL as either NFC (composed,
// what a person normally types) or NFD (decomposed, what this backend's data
// happens to use) — visually identical but byte-different strings that a
// plain toLowerCase() comparison would treat as a mismatch. Normalizing both
// sides to NFC before comparing makes the match robust to that either way.
function matchOption(value: string | undefined, options: string[]): string {
  if (!value) return "";
  const trimmed = value.trim().normalize("NFC");
  if (!trimmed) return "";
  const found = options.find((o) => o.normalize("NFC").toLowerCase() === trimmed.toLowerCase());
  return found ?? "";
}

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

// TimeOnly from .NET serializes as "HH:mm:ss" — trim to "HH:mm"
function toHHMM(t: string): string {
  return t.length >= 5 ? t.slice(0, 5) : t;
}

// Treat the backend placeholder literal "string" as an empty value
function clean(v: string | null | undefined): string {
  if (!v || v.trim() === "string") return "";
  return v.trim();
}

async function fetchVenueEnrichment(venueId: string): Promise<{
  minPricePerHour: number | null;
  sports: string[];
  sportIds: string[];
}> {
  try {
    const courtsRes = await apiFetch<ApiWrapper<CourtDto[]>>(
      `/venues/${venueId}/courts`
    );
    const courts = courtsRes.data ?? [];

    const sports = [
      ...new Set(
        courts
          .map((c) => c.sportName)
          .filter((s) => s && s !== "string")
      ),
    ];
    const sportIds = [
      ...new Set(courts.map((c) => c.sportId).filter(Boolean)),
    ];

    const priceResults = await Promise.allSettled(
      courts.map((c) =>
        apiFetch<ApiWrapper<PriceRuleDto[]>>(`/courts/${c.id}/price-rules`)
      )
    );

    let minPrice: number | null = null;
    for (const result of priceResults) {
      if (result.status === "fulfilled") {
        for (const rule of result.value.data ?? []) {
          if (
            rule.status === "Active" &&
            (minPrice === null || rule.pricePerHour < minPrice)
          ) {
            minPrice = rule.pricePerHour;
          }
        }
      }
    }

    return { minPricePerHour: minPrice, sports, sportIds };
  } catch {
    return { minPricePerHour: null, sports: [], sportIds: [] };
  }
}

export default async function VenuesPage({ searchParams }: VenuesPageProps) {
  const params = await searchParams;

  let venues: VenueDisplayData[] = [];
  let fetchError: string | null = null;

  try {
    const res = await apiFetch<ApiWrapper<VenueResponseDto[]>>("/venues");
    const raw = res.data ?? [];

    const enrichments = await Promise.allSettled(
      raw.map((v) => fetchVenueEnrichment(v.id))
    );

    venues = raw.map((v, idx) => {
      const result = enrichments[idx];
      const enrichment =
        result.status === "fulfilled"
          ? result.value
          : { minPricePerHour: null, sports: [], sportIds: [] };

      return {
        id: v.id,
        name: v.name,
        address: clean(v.address),
        city: clean(v.city),
        district: clean(v.district),
        openingTime: toHHMM(v.openingTime),
        closingTime: toHHMM(v.closingTime),
        coverImageUrl: v.coverImageUrl ?? null,
        sports: enrichment.sports,
        sportIds: enrichment.sportIds,
        minPricePerHour: enrichment.minPricePerHour,
        rating: 4.8,
        reviewCount: 0,
        gradientIndex: idx,
      };
    });
  } catch (e) {
    fetchError =
      e instanceof Error ? e.message : "Không thể tải danh sách sân.";
  }

  if (fetchError) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <p className="text-sm text-red-400">{fetchError}</p>
      </div>
    );
  }

  const allSports = [...new Set(venues.flatMap((v) => v.sports))].sort();
  const allDistricts = [
    ...new Set(venues.map((v) => v.district).filter((d) => d.length > 0)),
  ].sort();

  const initialSport = matchOption(params.sport, allSports);
  const initialDistrict = matchOption(params.district, allDistricts);
  // No real availability data exists to filter by yet — the raw value is
  // only preserved (not validated against anything) so it survives in the
  // URL rather than being silently dropped. See VenueDiscovery.
  const initialDatetime = params.datetime?.trim() || "";

  return (
    <VenueDiscovery
      venues={venues}
      allSports={allSports}
      allDistricts={allDistricts}
      initialSport={initialSport}
      initialDistrict={initialDistrict}
      initialDatetime={initialDatetime}
    />
  );
}
