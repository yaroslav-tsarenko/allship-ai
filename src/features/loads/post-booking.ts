import "server-only";
import { desc, eq } from "drizzle-orm";
import { signKeys, signMedia, serializePoints } from "@/features/tracking/media";
import type { Actor } from "@/server/actor";
import { db } from "@/server/db/client";
import { loadMedia, payout, review, user } from "@/server/db/schema";
import type { LoadStatus } from "@/server/db/schema/enums";
import { disputesForLoad } from "@/server/disputes/service";
import { trackingFor } from "@/server/trips/service";

export const postBookingStatuses: LoadStatus[] = ["booked", "assigned", "en_route_to_pickup", "in_transit", "delivered", "completed", "disputed"];

export async function getPostBooking(actor: Actor, l: { id: string; status: LoadStatus; driverId: string | null; carrierOrgId: string | null }) {
  const [driver, tracking, media, disputes, payouts, rev] = await Promise.all([
    l.driverId ? db.select({ name: user.name, phone: user.phone }).from(user).where(eq(user.id, l.driverId)).limit(1) : Promise.resolve([]),
    trackingFor(actor, l.id, 500),
    db.select().from(loadMedia).where(eq(loadMedia.loadId, l.id)).orderBy(loadMedia.createdAt),
    disputesForLoad(l.id),
    db.select().from(payout).where(eq(payout.loadId, l.id)).orderBy(desc(payout.createdAt)).limit(1),
    db.select().from(review).where(eq(review.loadId, l.id)).limit(1),
  ]);
  const signed = await signMedia(media);
  const latest = disputes[0] ?? null;
  const evidence = latest?.evidence.length ? await signKeys(latest.evidence, "Evidence") : [];
  return {
    driver: driver[0] ?? null,
    points: serializePoints(tracking.points),
    pickupMedia: signed.filter((m) => m.kind === "pickup_photo"),
    deliveryMedia: signed.filter((m) => m.kind === "pod_photo" || m.kind === "pod_signature"),
    dispute: latest,
    disputeEvidence: evidence,
    payout: payouts[0] ?? null,
    review: rev[0] ?? null,
  };
}
