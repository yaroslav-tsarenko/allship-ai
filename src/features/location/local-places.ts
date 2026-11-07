export type LocalPlace = { label: string; city: string; state: string; postalCode?: string };

const cache = new Map<string, Promise<string[]>>();

export function parsePlaceLabel(label: string): LocalPlace | null {
  const m = label.match(/^(.+?),\s*([A-Z]{2})(?:\s+(\d{5}))?$/);
  if (!m) return null;
  return { label, city: m[1]!, state: m[2]!, ...(m[3] ? { postalCode: m[3] } : {}) };
}

export function searchLocalPlaces(query: string): Promise<LocalPlace[]> {
  const key = query.trim().toLowerCase();
  if (key.length < 2) return Promise.resolve([]);
  let pending = cache.get(key);
  if (!pending) {
    pending = fetch(`/moving/places?q=${encodeURIComponent(key)}`)
      .then((r) => (r.ok ? (r.json() as Promise<{ items: string[] }>) : { items: [] }))
      .then((d) => d.items)
      .catch(() => {
        cache.delete(key);
        return [];
      });
    cache.set(key, pending);
  }
  return pending.then((items) => items.map(parsePlaceLabel).filter((p): p is LocalPlace => p !== null));
}
