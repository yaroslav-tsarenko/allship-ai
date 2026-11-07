import type { VpicCatalog } from "./catalog";

export type DecodedVehicle = { vin: string; year: number | null; make: string | null; model: string | null; body: string | null; bodyType: string | null; vehicleType: string | null };

type ListResponse = { available: boolean; items: string[] };

const lists = new Map<string, Promise<ListResponse>>();

function getList(url: string): Promise<ListResponse> {
  let pending = lists.get(url);
  if (!pending) {
    pending = fetch(url)
      .then((r) => (r.ok ? (r.json() as Promise<ListResponse>) : { available: false, items: [] }))
      .catch(() => ({ available: false, items: [] }));
    pending.then((r) => {
      if (!r.available) lists.delete(url);
    });
    lists.set(url, pending);
  }
  return pending;
}

export function fetchMakes(catalog: VpicCatalog) {
  return getList(`/api/vehicles/makes?catalog=${catalog}`);
}

export function fetchModels(catalog: VpicCatalog, make: string, year: number) {
  return getList(`/api/vehicles/models?catalog=${catalog}&make=${encodeURIComponent(make)}&year=${year}`);
}

export async function decodeVehicle(vin: string): Promise<{ ok: true; vehicle: DecodedVehicle } | { ok: false; message: string }> {
  try {
    const r = await fetch(`/api/vehicles/vin/${encodeURIComponent(vin)}`);
    const body = (await r.json()) as { error?: string; available?: boolean; vehicle?: DecodedVehicle | null };
    if (body.error) return { ok: false, message: body.error };
    if (!body.available || !body.vehicle) return { ok: false, message: "We couldn't look up this VIN right now. Fill in the details below." };
    return { ok: true, vehicle: body.vehicle };
  } catch {
    return { ok: false, message: "We couldn't look up this VIN right now. Fill in the details below." };
  }
}
