"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { VIETNAM_CITIES, DISTRICTS_BY_CITY, getDistrictsForCity } from "@/lib/vietnamLocations";
import {
  cityMatches,
  districtMatchScore,
  districtMatches,
  mergeCityLabels,
  mergeLocationLabels,
  normalizeCityKey,
} from "@/lib/locationMatch";
import { apiFetch } from "@/lib/api";
import type { ApiResponse } from "@/types/api";
import type { Venue } from "@/types/venue";

export type VenueSource = "matchop" | "external";

export interface MatchPostLocationValue {
  city: string;
  district: string;
  hasVenue: boolean;
  venueSource: VenueSource;
  venueId: string;
  courtId: string;
  externalVenueName: string;
}

interface CourtOption {
  id: string;
  name: string;
  sportId: string;
}

interface MatchPostLocationFieldsProps {
  value: MatchPostLocationValue;
  onChange: (value: MatchPostLocationValue) => void;
  sportId?: string;
}

export function createEmptyMatchPostLocation(): MatchPostLocationValue {
  return {
    city: "TP.HCM",
    district: "",
    hasVenue: false,
    venueSource: "matchop",
    venueId: "",
    courtId: "",
    externalVenueName: "",
  };
}

export function MatchPostLocationFields({
  value,
  onChange,
  sportId,
}: MatchPostLocationFieldsProps) {
  const [allVenues, setAllVenues] = useState<Venue[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [courts, setCourts] = useState<CourtOption[]>([]);
  const [venuesLoading, setVenuesLoading] = useState(false);
  const [courtsLoading, setCourtsLoading] = useState(false);
  const [locationsLoading, setLocationsLoading] = useState(true);
  const [venueHint, setVenueHint] = useState<string | null>(null);

  const patch = useCallback(
    (partial: Partial<MatchPostLocationValue>) => {
      onChange({ ...value, ...partial });
    },
    [onChange, value]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLocationsLoading(true);
      try {
        const res = await apiFetch<ApiResponse<Venue[]>>("/venues");
        if (!cancelled && res.success && res.data) {
          setAllVenues(res.data.filter((v) => v.status === "ACTIVE"));
        }
      } catch {
        if (!cancelled) setAllVenues([]);
      } finally {
        if (!cancelled) setLocationsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const cityOptions = useMemo(
    () =>
      mergeCityLabels(
        [...VIETNAM_CITIES],
        allVenues.map((v) => v.city)
      ),
    [allVenues]
  );

  const districts = useMemo(() => {
    const staticDistricts = getDistrictsForCity(value.city);
    const fromVenues = allVenues
      .filter((v) => cityMatches(v.city, value.city))
      .map((v) => v.district);
    return mergeLocationLabels(staticDistricts, fromVenues);
  }, [allVenues, value.city]);

  const fetchVenues = useCallback(async () => {
    if (!value.hasVenue || value.venueSource !== "matchop") {
      setVenues([]);
      setVenueHint(null);
      return;
    }

    setVenuesLoading(true);
    try {
      const params = new URLSearchParams();
      if (sportId) params.set("sportId", sportId);
      const qs = params.toString();
      const res = await apiFetch<ApiResponse<Venue[]>>(qs ? `/venues?${qs}` : "/venues");
      const raw = res.success && res.data
        ? res.data.filter(
            (v) => v.status === "ACTIVE" && cityMatches(v.city, value.city)
          )
        : [];

      const sorted = [...raw].sort((a, b) => {
        const scoreDiff =
          districtMatchScore(b.district, value.district) -
          districtMatchScore(a.district, value.district);
        if (scoreDiff !== 0) return scoreDiff;
        return a.name.localeCompare(b.name, "vi");
      });

      setVenues(sorted);

      if (sorted.length === 0) {
        if (!sportId) {
          setVenueHint("Chưa có cơ sở MATCHOP trong khu vực này.");
        } else {
          setVenueHint(
            `Chưa có sân phù hợp môn đã chọn tại ${value.city}. Thử đổi môn hoặc chọn "Sân khác".`
          );
        }
        return;
      }

      const inDistrict = value.district
        ? sorted.filter((v) => districtMatches(v.district, value.district))
        : sorted;

      if (value.district && inDistrict.length === 0) {
        setVenueHint(
          `Không có sân môn này tại ${value.district}. Đang hiển thị thêm ${sorted.length} cơ sở khác trong ${value.city}.`
        );
      } else if (value.district && inDistrict.length < sorted.length) {
        setVenueHint(
          `Ưu tiên ${inDistrict.length} cơ sở tại ${value.district}, và ${sorted.length - inDistrict.length} cơ sở khác trong ${value.city}.`
        );
      } else {
        setVenueHint(null);
      }
    } catch {
      setVenues([]);
      setVenueHint("Không thể tải danh sách sân MATCHOP.");
    } finally {
      setVenuesLoading(false);
    }
  }, [value.hasVenue, value.venueSource, value.city, value.district, sportId]);

  useEffect(() => {
    fetchVenues();
  }, [fetchVenues]);

  useEffect(() => {
    if (!value.hasVenue || value.venueSource !== "matchop" || !value.venueId) {
      setCourts([]);
      return;
    }

    let cancelled = false;
    (async () => {
      setCourtsLoading(true);
      try {
        const res = await apiFetch<ApiResponse<CourtOption[]>>(
          `/venues/${value.venueId}/courts`
        );
        if (!cancelled && res.success && res.data) {
          const filtered = sportId
            ? res.data.filter((c) => c.sportId === sportId)
            : res.data;
          setCourts(filtered);
        }
      } catch {
        if (!cancelled) setCourts([]);
      } finally {
        if (!cancelled) setCourtsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [value.hasVenue, value.venueSource, value.venueId, sportId]);

  const handleCityChange = (city: string) => {
    patch({
      city,
      district: "",
      venueId: "",
      courtId: "",
    });
  };

  const handleDistrictChange = (district: string) => {
    patch({
      district,
      venueId: "",
      courtId: "",
    });
  };

  const handleVenueChange = (venueId: string) => {
    const venue = venues.find((v) => v.id === venueId);
    patch({
      venueId,
      courtId: "",
      ...(venue ? { city: venue.city, district: venue.district } : {}),
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>
            Thành phố <span className="text-red-400">*</span>
          </Label>
          <Select value={value.city} onValueChange={handleCityChange}>
            <SelectTrigger className="bg-slate-900 border-white/10">
              <SelectValue placeholder="Chọn thành phố" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-white/10 text-white max-h-60">
              {locationsLoading && cityOptions.length === 0 ? (
                <SelectItem value="__loading" disabled>
                  Đang tải...
                </SelectItem>
              ) : (
                cityOptions.map((city) => (
                  <SelectItem key={normalizeCityKey(city) || city} value={city}>
                    {city}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>
            Quận/Huyện <span className="text-red-400">*</span>
          </Label>
          <Select
            value={value.district || undefined}
            onValueChange={handleDistrictChange}
            disabled={districts.length === 0}
          >
            <SelectTrigger className="bg-slate-900 border-white/10">
              <SelectValue placeholder="Chọn quận/huyện" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-white/10 text-white max-h-60">
              {districts.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-900/50 px-4 py-3">
        <div>
          <p className="text-sm font-medium text-white">Đã có sân</p>
          <p className="text-xs text-slate-400">
            Bật nếu bạn đã đặt hoặc chọn được sân cụ thể
          </p>
        </div>
        <Switch
          checked={value.hasVenue}
          onCheckedChange={(checked) =>
            patch({
              hasVenue: checked,
              venueId: "",
              courtId: "",
              externalVenueName: "",
            })
          }
        />
      </div>

      {value.hasVenue && (
        <div className="space-y-4 rounded-xl border border-white/10 bg-slate-900/30 p-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() =>
                patch({
                  venueSource: "matchop",
                  externalVenueName: "",
                })
              }
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                value.venueSource === "matchop"
                  ? "bg-[#FF8000] text-white"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              Sân trên MATCHOP
            </button>
            <button
              type="button"
              onClick={() =>
                patch({
                  venueSource: "external",
                  venueId: "",
                  courtId: "",
                })
              }
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                value.venueSource === "external"
                  ? "bg-[#FF8000] text-white"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              Sân khác
            </button>
          </div>

          {value.venueSource === "matchop" ? (
            <div className="space-y-3">
              {!sportId && (
                <p className="text-xs text-amber-400/90">
                  Chọn môn thể thao trước để lọc sân phù hợp.
                </p>
              )}
              {venueHint && (
                <p className="text-xs text-slate-400 leading-relaxed">{venueHint}</p>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Cơ sở thể thao</Label>
                  <Select
                    value={value.venueId || undefined}
                    onValueChange={handleVenueChange}
                    disabled={venuesLoading || venues.length === 0}
                  >
                    <SelectTrigger className="bg-slate-900 border-white/10">
                      {venuesLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <SelectValue
                          placeholder={
                            venues.length === 0 ? "Không có sân phù hợp" : "Chọn cơ sở"
                          }
                        />
                      )}
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10 text-white max-h-60">
                      {venues.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.name} · {v.district}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Sân (tùy chọn)</Label>
                  <Select
                    value={value.courtId || undefined}
                    onValueChange={(courtId) => patch({ courtId })}
                    disabled={!value.venueId || courtsLoading || courts.length === 0}
                  >
                    <SelectTrigger className="bg-slate-900 border-white/10">
                      {courtsLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <SelectValue
                          placeholder={
                            value.venueId && courts.length === 0
                              ? "Không có sân môn này"
                              : "Chọn sân"
                          }
                        />
                      )}
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10 text-white max-h-60">
                      {courts.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Tên sân / địa điểm</Label>
              <Input
                placeholder="VD: Sân ABC, 123 Nguyễn Văn Linh..."
                value={value.externalVenueName}
                onChange={(e) => patch({ externalVenueName: e.target.value })}
                className="bg-slate-900 border-white/10"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
