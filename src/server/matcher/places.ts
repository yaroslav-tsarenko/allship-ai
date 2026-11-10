export type Place = {
  label: string;
  city: string;
  state: string;
  postalCode?: string;
  lat: number;
  lng: number;
  placeId?: string;
  precision: "exact" | "zip" | "city";
};

export type GeoData = { zip3Data: string; cityData: string };

type City = { city: string; state: string; lat: number; lng: number; key: string };
type Index = { zip3: Map<string, { lat: number; lng: number; state: string; city: string }>; cities: City[]; byKey: Map<string, City> };

const stateNames: Record<string, string> = {
  alabama: "AL", alaska: "AK", arizona: "AZ", arkansas: "AR", california: "CA", colorado: "CO", connecticut: "CT", delaware: "DE", "district of columbia": "DC", florida: "FL", georgia: "GA", hawaii: "HI", idaho: "ID", illinois: "IL", indiana: "IN", iowa: "IA", kansas: "KS", kentucky: "KY", louisiana: "LA", maine: "ME", maryland: "MD", massachusetts: "MA", michigan: "MI", minnesota: "MN", mississippi: "MS", missouri: "MO", montana: "MT", nebraska: "NE", nevada: "NV", "new hampshire": "NH", "new jersey": "NJ", "new mexico": "NM", "new york": "NY", "north carolina": "NC", "north dakota": "ND", ohio: "OH", oklahoma: "OK", oregon: "OR", pennsylvania: "PA", "rhode island": "RI", "south carolina": "SC", "south dakota": "SD", tennessee: "TN", texas: "TX", utah: "UT", vermont: "VT", virginia: "VA", washington: "WA", "west virginia": "WV", wisconsin: "WI", wyoming: "WY", "puerto rico": "PR",
};
const stateCodes = new Set(Object.values(stateNames));

export const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\bsaint\b/g, "st")
    .replace(/\bfort\b/g, "ft")
    .replace(/\bmount\b/g, "mt")
    .replace(/[.'’]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const cache = new WeakMap<GeoData, Index>();

function indexOf(data: GeoData): Index {
  let idx = cache.get(data);
  if (idx) return idx;
  const zip3 = new Map<string, { lat: number; lng: number; state: string; city: string }>();
  for (const row of data.zip3Data.split("|")) {
    const [p, lat, lng, state, city] = row.split(",");
    if (p && lat && lng && state && city) zip3.set(p, { lat: Number(lat), lng: Number(lng), state, city });
  }
  const cities: City[] = [];
  const byKey = new Map<string, City>();
  for (const row of data.cityData.split("|")) {
    const [city, state, lat, lng] = row.split(",");
    if (!city || !state || !lat || !lng) continue;
    const c = { city, state, lat: Number(lat), lng: Number(lng), key: `${norm(city)}|${state}` };
    cities.push(c);
    if (!byKey.has(c.key)) byKey.set(c.key, c);
  }
  idx = { zip3, cities, byKey };
  cache.set(data, idx);
  return idx;
}

function stateFrom(raw: string) {
  const t = raw.trim();
  if (/^[A-Za-z]{2}$/.test(t) && stateCodes.has(t.toUpperCase())) return t.toUpperCase();
  return stateNames[norm(t)] ?? null;
}

export function lookupPlace(query: string, data: GeoData): Place | null {
  const idx = indexOf(data);
  const q = query.trim().replace(/,?\s*(usa|united states)$/i, "");
  const zip = q.match(/\b(\d{5})(?:-\d{4})?\b/)?.[1];
  if (zip) {
    const z = idx.zip3.get(zip.slice(0, 3));
    if (!z) return null;
    return { label: `${z.city}, ${z.state} ${zip}`, city: z.city, state: z.state, postalCode: zip, lat: z.lat, lng: z.lng, precision: "zip" };
  }
  const parts = q.split(",").map((p) => p.trim()).filter(Boolean);
  let cityPart = parts[0] ?? "";
  let state: string | null = parts.length > 1 ? stateFrom(parts[parts.length - 1]!) : null;
  if (!state && parts.length === 1) {
    const words = cityPart.split(/\s+/);
    for (let take = Math.min(3, words.length - 1); take >= 1; take--) {
      const candidate = stateFrom(words.slice(-take).join(" "));
      if (candidate) {
        state = candidate;
        cityPart = words.slice(0, -take).join(" ");
        break;
      }
    }
  }
  const name = norm(cityPart);
  if (!name) return null;
  let hit: City | undefined;
  if (state) hit = idx.byKey.get(`${name}|${state}`);
  else {
    const matches = idx.cities.filter((c) => c.key.startsWith(`${name}|`));
    if (matches.length === 1) hit = matches[0];
  }
  if (!hit) return null;
  return { label: `${hit.city}, ${hit.state}`, city: hit.city, state: hit.state, lat: hit.lat, lng: hit.lng, precision: "city" };
}

export function suggestPlaces(query: string, data: GeoData, limit = 6): string[] {
  const idx = indexOf(data);
  const q = query.trim();
  if (q.length < 2) return [];
  if (/^\d{3,5}$/.test(q)) {
    const z = idx.zip3.get(q.slice(0, 3));
    return z && q.length === 5 ? [`${z.city}, ${z.state} ${q}`] : [];
  }
  const [cityRaw = "", stateRaw] = q.split(",");
  const name = norm(cityRaw);
  const state = stateRaw ? stateFrom(stateRaw) : null;
  const statePrefix = stateRaw?.trim().toUpperCase() ?? "";
  const out: string[] = [];
  for (const c of idx.cities) {
    if (!c.key.startsWith(name)) continue;
    if (state ? c.state !== state : statePrefix && !c.state.startsWith(statePrefix)) continue;
    out.push(`${c.city}, ${c.state}`);
    if (out.length >= limit) break;
  }
  return out;
}

export const ROAD_FACTOR = 1.2;

export function haversineMiles(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 3958.8 * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function roadMiles(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  return haversineMiles(a, b) * ROAD_FACTOR;
}
