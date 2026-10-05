export type LatLng = { lat: number; lng: number };

export type TrackPoint = LatLng & { recordedAt: string; speedMph: number | null; headingDeg: number | null; accuracyM?: number | null };

export type StopInput = { lat?: number | null; lng?: number | null; city?: string | null; state?: string | null; address?: string | null };

export type ResolvedStop = LatLng & { label: string; approximate: boolean };

const stateCentroids: Record<string, [number, number]> = {
  AL: [32.8, -86.8], AK: [61.4, -152.3], AZ: [34.2, -111.6], AR: [34.9, -92.4], CA: [37.2, -119.5], CO: [39.0, -105.5], CT: [41.6, -72.7], DE: [39.0, -75.5],
  DC: [38.9, -77.0], FL: [28.6, -82.4], GA: [32.7, -83.4], HI: [20.8, -156.3], ID: [44.4, -114.6], IL: [40.0, -89.2], IN: [39.9, -86.3], IA: [42.1, -93.5],
  KS: [38.5, -98.4], KY: [37.5, -85.3], LA: [31.1, -92.0], ME: [45.4, -69.2], MD: [39.0, -76.8], MA: [42.3, -71.8], MI: [44.3, -85.4], MN: [46.3, -94.3],
  MS: [32.7, -89.7], MO: [38.4, -92.5], MT: [47.0, -109.6], NE: [41.5, -99.8], NV: [39.3, -116.6], NH: [43.7, -71.6], NJ: [40.2, -74.7], NM: [34.4, -106.1],
  NY: [42.9, -75.5], NC: [35.6, -79.4], ND: [47.5, -100.5], OH: [40.3, -82.8], OK: [35.6, -97.5], OR: [43.9, -120.6], PA: [40.9, -77.8], RI: [41.7, -71.5],
  SC: [33.9, -80.9], SD: [44.4, -100.2], TN: [35.9, -86.4], TX: [31.5, -99.3], UT: [39.3, -111.7], VT: [44.1, -72.7], VA: [37.5, -78.9], WA: [47.4, -120.5],
  WV: [38.6, -80.6], WI: [44.6, -89.9], WY: [43.0, -107.6],
};

export function resolveStop(stop: StopInput): ResolvedStop | null {
  const label = [stop.city, stop.state].filter(Boolean).join(", ") || stop.address || "";
  if (typeof stop.lat === "number" && typeof stop.lng === "number") return { lat: stop.lat, lng: stop.lng, label, approximate: false };
  const centroid = stop.state ? stateCentroids[stop.state.trim().toUpperCase()] : undefined;
  return centroid ? { lat: centroid[0], lng: centroid[1], label, approximate: true } : null;
}

const toRad = (d: number) => (d * Math.PI) / 180;

export function haversineMiles(a: LatLng, b: LatLng) {
  const R = 3958.8;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function bearingDeg(a: LatLng, b: LatLng) {
  const y = Math.sin(toRad(b.lng - a.lng)) * Math.cos(toRad(b.lat));
  const x = Math.cos(toRad(a.lat)) * Math.sin(toRad(b.lat)) - Math.sin(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.cos(toRad(b.lng - a.lng));
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

export function currentSpeedMph(points: TrackPoint[]) {
  const last = points.at(-1);
  if (!last) return null;
  if (last.speedMph != null) return last.speedMph;
  const windowStart = new Date(last.recordedAt).getTime() - 15 * 60_000;
  const recent = points.filter((p) => new Date(p.recordedAt).getTime() >= windowStart);
  if (recent.length < 2) return null;
  let miles = 0;
  for (let i = 1; i < recent.length; i++) miles += haversineMiles(recent[i - 1]!, recent[i]!);
  const hours = (new Date(last.recordedAt).getTime() - new Date(recent[0]!.recordedAt).getTime()) / 3_600_000;
  return hours > 0 ? miles / hours : null;
}

export function headingOf(points: TrackPoint[]) {
  const last = points.at(-1);
  if (!last) return null;
  if (last.headingDeg != null) return last.headingDeg;
  const prev = [...points].reverse().find((p) => haversineMiles(p, last) > 0.05);
  return prev ? bearingDeg(prev, last) : null;
}

export const ROAD_FACTOR = 1.2;

export type TripProgress = {
  target: "pickup" | "dropoff";
  milesLeft: number | null;
  fraction: number | null;
  speedMph: number | null;
  etaMs: number | null;
};

export function tripProgress(phase: "to_pickup" | "to_dropoff" | "done", pickup: LatLng | null, dropoff: LatLng | null, points: TrackPoint[]): TripProgress {
  const last = points.at(-1) ?? null;
  const target = phase === "to_pickup" ? "pickup" : "dropoff";
  const goal = phase === "to_pickup" ? pickup : dropoff;
  const speed = currentSpeedMph(points);
  if (phase === "done") return { target, milesLeft: 0, fraction: 1, speedMph: null, etaMs: null };
  if (!last || !goal) return { target, milesLeft: null, fraction: phase === "to_pickup" ? null : 0, speedMph: speed, etaMs: null };
  const milesLeft = haversineMiles(last, goal) * ROAD_FACTOR;
  let fraction: number | null = null;
  if (phase === "to_dropoff" && pickup && dropoff) {
    const total = haversineMiles(pickup, dropoff);
    fraction = total > 0 ? Math.min(1, Math.max(0, 1 - haversineMiles(last, dropoff) / total)) : null;
  }
  const etaMs = speed && speed >= 5 ? Date.now() + (milesLeft / speed) * 3_600_000 : null;
  return { target, milesLeft, fraction, speedMph: speed, etaMs };
}

export function relativeTime(iso: string | Date, now = Date.now()) {
  const diff = Math.max(0, now - new Date(iso).getTime());
  const s = Math.round(diff / 1000);
  if (s < 45) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  return `${d} ${d === 1 ? "day" : "days"} ago`;
}

export function project(points: LatLng[], width: number, height: number, padding: number) {
  const meanLat = points.reduce((s, p) => s + p.lat, 0) / Math.max(1, points.length);
  const k = Math.cos(toRad(meanLat));
  const xs = points.map((p) => p.lng * k);
  const ys = points.map((p) => -p.lat);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const spanX = Math.max(maxX - minX, 0.02);
  const spanY = Math.max(maxY - minY, 0.02);
  const scale = Math.min((width - padding * 2) / spanX, (height - padding * 2) / spanY);
  const offX = (width - spanX * scale) / 2 - (minX - (spanX - (maxX - minX)) / 2) * scale;
  const offY = (height - spanY * scale) / 2 - (minY - (spanY - (maxY - minY)) / 2) * scale;
  return (p: LatLng) => ({ x: p.lng * k * scale + offX, y: -p.lat * scale + offY });
}
