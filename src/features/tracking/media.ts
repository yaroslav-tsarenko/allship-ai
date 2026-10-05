import "server-only";
import type { loadMedia } from "@/server/db/schema";
import { signedReadUrl } from "@/server/storage/storage";
import type { TrackPoint } from "./geo";
import type { GalleryItem } from "./media-gallery";

const kindLabels: Record<string, string> = {
  pickup_photo: "Pickup photo",
  pod_photo: "Delivery photo",
  pod_signature: "Recipient signature",
  photo: "Photo",
  document: "Document",
};

export async function signMedia(rows: (typeof loadMedia.$inferSelect)[]): Promise<GalleryItem[]> {
  const urls = await Promise.all(rows.map((r) => signedReadUrl(r.storageKey)));
  return rows.flatMap((r, i) => {
    const url = urls[i];
    if (!url) return [];
    return [{ id: r.id, url, kind: r.kind, label: kindLabels[r.kind] ?? "File", isPdf: r.storageKey.endsWith(".pdf"), createdAt: r.createdAt.toISOString() }];
  });
}

export async function signKeys(keys: string[], label: string): Promise<GalleryItem[]> {
  const urls = await Promise.all(keys.map((k) => signedReadUrl(k)));
  return keys.flatMap((k, i) => {
    const url = urls[i];
    return url ? [{ id: k, url, kind: "evidence", label, isPdf: k.endsWith(".pdf"), createdAt: null }] : [];
  });
}

export function serializePoints(points: { lat: number; lng: number; recordedAt: Date; speedMph: number | null; headingDeg: number | null; accuracyM?: number | null }[]): TrackPoint[] {
  return points.map((p) => ({ lat: p.lat, lng: p.lng, recordedAt: p.recordedAt.toISOString(), speedMph: p.speedMph, headingDeg: p.headingDeg, accuracyM: p.accuracyM ?? null }));
}
