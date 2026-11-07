import "server-only";
import { log } from "@/lib/log";
import { bodyTypeFromVpic, displayMake, popularMakes, vpicTypes, VPIC_FIRST_YEAR, type VpicCatalog } from "@/features/vehicles/catalog";
import { normalizeVin, vinIssue } from "@/features/vehicles/vin";

const BASE = "https://vpic.nhtsa.dot.gov/api/vehicles";
const WEEK = 7 * 86_400;
const MAX_ENTRIES = 400;
const FAILURE_COOLDOWN_MS = 5 * 60_000;

export type VpicResult<T> = { ok: true; data: T } | { ok: false };

export type DecodedVin = { vin: string; year: number | null; make: string | null; model: string | null; body: string | null; bodyType: string | null; vehicleType: string | null };

const cache = new Map<string, { at: number; value: unknown }>();
let warned = false;
let downUntil = 0;

function remember(key: string, value: unknown) {
  cache.delete(key);
  cache.set(key, { at: Date.now(), value });
  while (cache.size > MAX_ENTRIES) cache.delete(cache.keys().next().value!);
}

function recall<T>(key: string): T | undefined {
  const hit = cache.get(key);
  if (!hit) return undefined;
  if (Date.now() - hit.at > WEEK * 1000) {
    cache.delete(key);
    return undefined;
  }
  cache.delete(key);
  cache.set(key, hit);
  return hit.value as T;
}

export function resetVpicCache() {
  cache.clear();
  warned = false;
  downUntil = 0;
}

async function getResults<T>(path: string): Promise<T[] | null> {
  if (Date.now() < downUntil) return null;
  try {
    const res = await fetch(`${BASE}/${path}${path.includes("?") ? "&" : "?"}format=json`, { next: { revalidate: WEEK }, signal: AbortSignal.timeout(6000) });
    if (!res.ok) throw new Error(`vPIC responded ${res.status}`);
    const body = (await res.json()) as { Results?: T[] };
    if (!Array.isArray(body.Results)) throw new Error("vPIC returned no Results");
    return body.Results;
  } catch (err) {
    downUntil = Date.now() + FAILURE_COOLDOWN_MS;
    if (!warned) {
      warned = true;
      log.warn("vPIC unavailable, vehicle fields fall back to free text", { scope: "vpic", err });
    }
    return null;
  }
}

async function cached<T>(key: string, load: () => Promise<T | null>): Promise<VpicResult<T>> {
  const hit = recall<T>(key);
  if (hit !== undefined) return { ok: true, data: hit };
  const value = await load();
  if (value === null) return { ok: false };
  remember(key, value);
  return { ok: true, data: value };
}

const uniqueSorted = (names: string[]) => [...new Set(names.map((n) => n.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }));

export function getMakes(catalog: VpicCatalog) {
  return cached(`makes:${catalog}`, async () => {
    const lists = await Promise.all(vpicTypes[catalog].map((t) => getResults<{ MakeName?: string }>(`GetMakesForVehicleType/${encodeURIComponent(t)}`)));
    if (lists.every((l) => l === null)) return null;
    const known = popularMakes[catalog];
    return uniqueSorted(lists.flatMap((l) => l ?? []).map((r) => displayMake(r.MakeName ?? "", known)));
  });
}

export function getModels(catalog: VpicCatalog, make: string, year: number) {
  const m = make.trim();
  return cached(`models:${catalog}:${m.toLowerCase()}:${year}`, async () => {
    if (!m || year < VPIC_FIRST_YEAR) return [];
    const lists = await Promise.all(
      vpicTypes[catalog].map((t) => getResults<{ Model_Name?: string }>(`GetModelsForMakeYear/make/${encodeURIComponent(m)}/modelyear/${year}/vehicletype/${encodeURIComponent(t)}`)),
    );
    if (lists.every((l) => l === null)) return null;
    return uniqueSorted(lists.flatMap((l) => l ?? []).map((r) => r.Model_Name ?? ""));
  });
}

type RawDecode = { ModelYear?: string; Make?: string; Model?: string; BodyClass?: string; VehicleType?: string; ErrorCode?: string };

export function decodeVin(raw: string): Promise<VpicResult<DecodedVin> | { ok: false; invalid: string }> {
  const vin = normalizeVin(raw);
  const issue = vinIssue(vin);
  if (issue) return Promise.resolve({ ok: false, invalid: issue });
  return cached(`vin:${vin}`, async () => {
    const rows = await getResults<RawDecode>(`DecodeVinValuesExtended/${vin}`);
    if (!rows) return null;
    const r = rows[0] ?? {};
    const year = Number(r.ModelYear);
    const body = r.BodyClass?.trim() || null;
    return {
      vin,
      year: Number.isInteger(year) && year > 1900 ? year : null,
      make: r.Make?.trim() ? displayMake(r.Make, [...popularMakes.car, ...popularMakes.motorcycle, ...popularMakes.truck]) : null,
      model: r.Model?.trim() || null,
      body,
      bodyType: body ? bodyTypeFromVpic(body) : null,
      vehicleType: r.VehicleType?.trim() || null,
    };
  });
}
