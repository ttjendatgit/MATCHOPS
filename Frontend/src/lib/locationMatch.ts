const PREFIX_PATTERN = /^(quan|huyen|thanh pho|tp)\s+/i;

export function normalizeLocationKey(value?: string | null): string {
  if (!value) return "";
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(PREFIX_PATTERN, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeCityKey(city?: string | null): string {
  const key = normalizeLocationKey(city);
  if (!key) return "";
  if (key.includes("hcm") || key.includes("ho chi minh") || key.includes("sai gon")) return "hcm";
  if (key.includes("ha noi") || key === "hn") return "ha noi";
  if (key.includes("da nang")) return "da nang";
  return key;
}

export function cityMatches(a?: string | null, b?: string | null): boolean {
  if (!b) return true;
  if (!a) return false;
  const na = normalizeCityKey(a);
  const nb = normalizeCityKey(b);
  return na === nb || na.includes(nb) || nb.includes(na);
}

export function districtMatches(a?: string | null, b?: string | null): boolean {
  if (!b) return true;
  if (!a) return false;
  const na = normalizeLocationKey(a);
  const nb = normalizeLocationKey(b);
  if (!na || !nb) return false;
  return na === nb || na.includes(nb) || nb.includes(na);
}

export function districtMatchScore(venueDistrict: string, selectedDistrict: string): number {
  if (!selectedDistrict) return 0;
  if (districtMatches(venueDistrict, selectedDistrict)) return 2;
  return 0;
}

export function formatDistrictLabel(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;
  if (/^(quận|huyện|thành phố)/i.test(trimmed)) return trimmed;
  if (/^\d+$/.test(trimmed.replace(/\D/g, "")) || /^quận\s+\d/i.test(trimmed)) {
    return trimmed.startsWith("Quận") ? trimmed : `Quận ${trimmed}`;
  }
  return trimmed;
}

export function mergeLocationLabels(...groups: string[][]): string[] {
  const map = new Map<string, string>();
  for (const group of groups) {
    for (const item of group) {
      const label = item.trim();
      if (!label) continue;
      const key = normalizeLocationKey(label);
      if (!key) continue;
      if (!map.has(key)) map.set(key, formatDistrictLabel(label));
    }
  }
  return Array.from(map.values()).sort((a, b) => a.localeCompare(b, "vi"));
}

export function mergeCityLabels(...groups: string[][]): string[] {
  const map = new Map<string, string>();
  for (const group of groups) {
    for (const item of group) {
      const label = item.trim();
      if (!label) continue;
      const key = normalizeCityKey(label);
      if (!key) continue;
      if (!map.has(key)) map.set(key, label);
    }
  }
  return Array.from(map.values()).sort((a, b) => a.localeCompare(b, "vi"));
}
