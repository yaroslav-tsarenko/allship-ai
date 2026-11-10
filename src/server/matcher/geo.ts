import "server-only";
import { env } from "@/env";
import { log } from "@/lib/log";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { allCityData } from "./city-data.generated";
import { zip3Data } from "./geo-data";
import { lookupPlace, roadMiles, type Place } from "./places";

export type { Place } from "./places";

export type ResolvedRoute = { origin: Place; destination: Place; miles: number; method: "routed" | "estimated" };

async function googleGeocode(query: string): Promise<Place | null> {
  const key = env.GOOGLE_MAPS_SERVER_KEY;
  if (!key) return null;
  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("address", query);
  url.searchParams.set("components", "country:US");
  url.searchParams.set("key", key);
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(4000), next: { revalidate: 86_400 } });
    const data = (await res.json()) as {
      status: string;
      results?: Array<{ formatted_address: string; place_id: string; geometry: { location: { lat: number; lng: number } }; address_components: Array<{ short_name: string; long_name: string; types: string[] }> }>;
    };
    const hit = data.results?.[0];
    if (data.status !== "OK" || !hit) return null;
    const part = (type: string) => hit.address_components.find((c) => c.types.includes(type));
    const state = part("administrative_area_level_1")?.short_name;
    if (!state) return null;
    const city = part("locality")?.long_name ?? part("postal_town")?.long_name ?? part("sublocality")?.long_name ?? part("administrative_area_level_2")?.long_name ?? state;
    return { label: hit.formatted_address.replace(/, USA$/, ""), city, state, postalCode: part("postal_code")?.short_name, lat: hit.geometry.location.lat, lng: hit.geometry.location.lng, placeId: hit.place_id, precision: "exact" };
  } catch (err) {
    log.warn("geocode failed", { scope: "matcher", err });
    return null;
  }
}

async function googleRouteMiles(a: Place, b: Place): Promise<number | null> {
  const key = env.GOOGLE_MAPS_SERVER_KEY;
  if (!key) return null;
  try {
    const res = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
      method: "POST",
      headers: { "content-type": "application/json", "X-Goog-Api-Key": key, "X-Goog-FieldMask": "routes.distanceMeters" },
      body: JSON.stringify({
        origin: { location: { latLng: { latitude: a.lat, longitude: a.lng } } },
        destination: { location: { latLng: { latitude: b.lat, longitude: b.lng } } },
        travelMode: "DRIVE",
        units: "IMPERIAL",
      }),
      signal: AbortSignal.timeout(5000),
    });
    const data = (await res.json()) as { routes?: Array<{ distanceMeters?: number }> };
    const meters = data.routes?.[0]?.distanceMeters;
    return typeof meters === "number" && meters >= 0 ? meters / 1609.344 : null;
  } catch (err) {
    log.warn("route distance failed", { scope: "matcher", err });
    return null;
  }
}

const geoData = { zip3Data, cityData: allCityData };
const zipTables = new Map<string, Promise<Record<string, [string, string, number, number]> | null>>();

function zipTable(prefix: string) {
  let pending = zipTables.get(prefix);
  if (!pending) {
    pending = readFile(join(process.cwd(), "public/data/zip", `${prefix}.json`), "utf8")
      .then((raw) => JSON.parse(raw) as Record<string, [string, string, number, number]>)
      .catch(() => null);
    zipTables.set(prefix, pending);
  }
  return pending;
}

export async function exactZip(zip: string): Promise<Place | null> {
  if (!/^\d{5}$/.test(zip)) return null;
  const row = (await zipTable(zip.slice(0, 3)))?.[zip];
  if (!row) return null;
  const [city, state, lat, lng] = row;
  return { label: `${city}, ${state} ${zip}`, city, state, postalCode: zip, lat, lng, precision: "zip" };
}

export async function resolvePlace(query: string): Promise<Place | null> {
  const google = await googleGeocode(query);
  if (google) return google;
  const zip = query.match(/\b(\d{5})(?:-\d{4})?\b/)?.[1];
  if (zip) return (await exactZip(zip)) ?? lookupPlace(query, geoData);
  return lookupPlace(query, geoData);
}

export async function resolveRoute(from: string, to: string): Promise<ResolvedRoute | { error: "origin" | "destination" }> {
  const [origin, destination] = await Promise.all([resolvePlace(from), resolvePlace(to)]);
  if (!origin) return { error: "origin" };
  if (!destination) return { error: "destination" };
  const routed = origin.precision === "exact" && destination.precision === "exact" ? await googleRouteMiles(origin, destination) : null;
  if (routed !== null) return { origin, destination, miles: Math.round(routed * 10) / 10, method: "routed" };
  return { origin, destination, miles: Math.round(roadMiles(origin, destination) * 10) / 10, method: "estimated" };
}
