export type ZipPlace = { city: string; state: string; lat: number; lng: number };

const cache = new Map<string, Promise<Record<string, [string, string, number, number]> | null>>();

function prefixFile(prefix: string) {
  let pending = cache.get(prefix);
  if (!pending) {
    pending = fetch(`/data/zip/${prefix}.json`)
      .then((r) => (r.ok ? (r.json() as Promise<Record<string, [string, string, number, number]>>) : null))
      .catch(() => null);
    cache.set(prefix, pending);
  }
  return pending;
}

export async function lookupZip(zip: string): Promise<ZipPlace | null> {
  if (!/^\d{5}$/.test(zip)) return null;
  const table = await prefixFile(zip.slice(0, 3));
  const row = table?.[zip];
  return row ? { city: row[0], state: row[1], lat: row[2], lng: row[3] } : null;
}

export function milesBetween(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 3958.8 * 2 * Math.asin(Math.sqrt(h));
}
