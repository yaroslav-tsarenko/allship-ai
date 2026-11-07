export type ZipPlace = { city: string; state: string; lat: number; lng: number };

type Table = Record<string, [string, string, number, number]>;

const cache = new Map<string, Promise<Table | null | undefined>>();

function prefixFile(prefix: string) {
  let pending = cache.get(prefix);
  if (!pending) {
    pending = fetch(`/data/zip/${prefix}.json`)
      .then((r) => (r.ok ? (r.json() as Promise<Table>) : r.status === 404 ? null : undefined))
      .catch(() => undefined);
    pending.then((t) => {
      if (t === undefined) cache.delete(prefix);
    });
    cache.set(prefix, pending);
  }
  return pending;
}

export async function findZip(zip: string): Promise<ZipPlace | null | undefined> {
  if (!/^\d{5}$/.test(zip)) return null;
  const table = await prefixFile(zip.slice(0, 3));
  if (table === undefined) return undefined;
  const row = table?.[zip];
  return row ? { city: row[0], state: row[1], lat: row[2], lng: row[3] } : null;
}

export async function lookupZip(zip: string): Promise<ZipPlace | null> {
  return (await findZip(zip)) ?? null;
}

export async function zipStates(zips: string[]) {
  const entries = await Promise.all(
    zips
      .filter((z) => /^\d{5}$/.test(z))
      .map(async (z) => {
        const hit = await findZip(z);
        return [z, hit === undefined ? undefined : (hit?.state ?? null)] as const;
      }),
  );
  const map = new Map<string, string | null | undefined>(entries);
  return (zip: string) => map.get(zip);
}

export function milesBetween(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 3958.8 * 2 * Math.asin(Math.sqrt(h));
}
