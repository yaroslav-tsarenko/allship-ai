import "server-only";
import { and, desc, eq, inArray, lt } from "drizzle-orm";
import { ActionError } from "@/server/actions/safe-action";
import type { Actor } from "@/server/actor";
import { db } from "@/server/db/client";
import { driverLocation, load, loadEvent, loadMedia, member, user } from "@/server/db/schema";
import type { LoadStatus } from "@/server/db/schema/enums";
import { transitionLoad } from "@/server/loads/service";
import { notifyUsers, orgStaffIds } from "@/server/notifications/notify";
import { releasePayout } from "@/server/payments/payouts";
import { publish } from "@/server/realtime/publish";
import { topics } from "@/server/realtime/topics";
import { objectExists } from "@/server/storage/storage";
import { loadWithRole, type LoadRole, type LoadRow } from "./access";
import { log } from "@/lib/log";
import { enrollUser, safely } from "@/server/nurture";

export const AUTO_COMPLETE_HOURS = 72;
export const LOCATION_MIN_INTERVAL_MS = 20_000;
const trackingStatuses: LoadStatus[] = ["en_route_to_pickup", "in_transit"];

function transitionKind(role: LoadRole) {
  return role === "admin" ? "admin" : role;
}

async function announceStatus(row: Pick<LoadRow, "id">, status: LoadStatus) {
  await publish(topics.load(row.id), { event: "load_status", payload: { loadId: row.id, status } });
}

async function attachMedia(loadId: string, keys: string[], kind: "pickup_photo" | "pod_photo" | "pod_signature" | "photo" | "document", userId: string) {
  const unique = [...new Set(keys)].filter((k) => k.startsWith(`loads/${loadId}/`));
  if (unique.length === 0) return [];
  const checks = await Promise.all(unique.map(objectExists));
  const verified = unique.filter((_, i) => checks[i]);
  if (verified.length !== unique.length) throw new ActionError("Some photos didn't finish uploading. Try again.");
  return db
    .insert(loadMedia)
    .values(verified.map((storageKey) => ({ loadId, kind, storageKey, contentType: storageKey.endsWith(".pdf") ? "application/pdf" : "image/*", uploadedBy: userId })))
    .returning({ id: loadMedia.id });
}

export async function listOrgDrivers(orgId: string) {
  return db
    .select({ userId: member.userId, role: member.role, name: user.name, email: user.email, phone: user.phone, image: user.image })
    .from(member)
    .innerJoin(user, eq(user.id, member.userId))
    .where(eq(member.organizationId, orgId))
    .orderBy(member.role, user.name);
}

export async function assignDriver(actor: Actor, loadId: string, driverId: string) {
  const { load: row } = await loadWithRole(actor, loadId, ["carrier"]);
  if (!["booked", "assigned"].includes(row.status)) throw new ActionError("You can assign a driver once the load is booked and before pickup starts.");
  const [membership] = await db
    .select({ userId: member.userId, name: user.name })
    .from(member)
    .innerJoin(user, eq(user.id, member.userId))
    .where(and(eq(member.organizationId, row.carrierOrgId ?? ""), eq(member.userId, driverId)))
    .limit(1);
  if (!membership) throw new ActionError("That person isn't on your team.");
  await db.transaction(async (tx) => {
    if (row.status === "booked") {
      await transitionLoad(tx, row, "assigned", { kind: "carrier", userId: actor.userId }, { driverId, assignedAt: new Date() }, { driverId });
    } else {
      await tx.update(load).set({ driverId, assignedAt: new Date() }).where(eq(load.id, row.id));
      await tx.insert(loadEvent).values({ loadId: row.id, type: "driver_reassigned", actorId: actor.userId, payload: { from: row.driverId, to: driverId } });
    }
  });
  await Promise.allSettled([
    announceStatus(row, "assigned"),
    notifyUsers([driverId], {
      type: "trip_assigned",
      title: `New trip: ${row.publicId}`,
      body: `${row.pickup.city ?? ""}, ${row.pickup.state ?? ""} → ${row.dropoff.city ?? ""}, ${row.dropoff.state ?? ""}. Open the trip for addresses and pickup window.`,
      href: `/app/trips/${row.publicId}`,
      email: { subject: `You're assigned to ${row.publicId}`, actionLabel: "Open trip" },
    }),
    notifyUsers([row.shipperId], {
      type: "driver_assigned",
      title: `Driver assigned to ${row.publicId}`,
      body: `${membership.name} will handle "${row.title}". You'll see live location once they head to pickup.`,
      href: `/app/loads/${row.publicId}`,
    }),
  ]);
}

export async function startTrip(actor: Actor, loadId: string) {
  const { load: row, role } = await loadWithRole(actor, loadId, ["driver", "carrier"]);
  await db.transaction((tx) => transitionLoad(tx, row, "en_route_to_pickup", { kind: transitionKind(role) as "driver" | "carrier", userId: actor.userId }));
  await Promise.allSettled([
    announceStatus(row, "en_route_to_pickup"),
    notifyUsers([row.shipperId], {
      type: "trip_started",
      title: `${row.publicId}: driver is on the way`,
      body: `The driver is heading to pickup in ${row.pickup.city ?? "your city"}. Track them live on the load page.`,
      href: `/app/loads/${row.publicId}`,
      email: { subject: `Your driver is on the way (${row.publicId})`, actionLabel: "Track live" },
    }),
  ]);
}

export async function confirmPickup(actor: Actor, loadId: string, photoKeys: string[], note?: string) {
  const { load: row, role } = await loadWithRole(actor, loadId, ["driver", "carrier"]);
  if (photoKeys.length === 0) throw new ActionError("Add at least one photo of the shipment at pickup.");
  await attachMedia(row.id, photoKeys, "pickup_photo", actor.userId);
  await db.transaction((tx) => transitionLoad(tx, row, "in_transit", { kind: transitionKind(role) as "driver" | "carrier", userId: actor.userId }, { pickedUpAt: new Date() }, { photos: photoKeys.length, note: note ?? null }));
  await Promise.allSettled([
    announceStatus(row, "in_transit"),
    notifyUsers([row.shipperId], {
      type: "picked_up",
      title: `${row.publicId} picked up`,
      body: `Your shipment is loaded and in transit to ${row.dropoff.city ?? "the destination"}. Pickup photos are on the load page.`,
      href: `/app/loads/${row.publicId}`,
      email: { subject: `Picked up: ${row.title}`, actionLabel: "See photos" },
    }),
  ]);
}

export async function confirmDelivery(actor: Actor, loadId: string, input: { recipientName: string; photoKeys: string[]; signatureKey?: string; note?: string }) {
  const { load: row, role } = await loadWithRole(actor, loadId, ["driver", "carrier"]);
  if (input.photoKeys.length === 0) throw new ActionError("Add at least one proof-of-delivery photo.");
  await attachMedia(row.id, input.photoKeys, "pod_photo", actor.userId);
  if (input.signatureKey) await attachMedia(row.id, [input.signatureKey], "pod_signature", actor.userId);
  await db.transaction((tx) =>
    transitionLoad(tx, row, "delivered", { kind: transitionKind(role) as "driver" | "carrier", userId: actor.userId }, { deliveredAt: new Date(), podRecipientName: input.recipientName.slice(0, 120) }, { recipientName: input.recipientName, photos: input.photoKeys.length, note: input.note ?? null }),
  );
  await Promise.allSettled([
    announceStatus(row, "delivered"),
    notifyUsers([row.shipperId], {
      type: "delivered",
      title: `${row.publicId} delivered — please confirm`,
      body: `Signed for by ${input.recipientName}. Confirm delivery to release payment to the carrier, or report a problem within ${AUTO_COMPLETE_HOURS} hours. After that we release it automatically.`,
      href: `/app/loads/${row.publicId}`,
      email: { subject: `Delivered: ${row.title}`, actionLabel: "Confirm delivery" },
    }),
    notifyUsers(await orgStaffIds(row.carrierOrgId ?? ""), {
      type: "delivered",
      title: `${row.publicId} delivered`,
      body: `Proof of delivery is in. Payment releases when the shipper confirms, or automatically in ${AUTO_COMPLETE_HOURS} hours.`,
      href: `/app/trips/${row.publicId}`,
    }),
  ]);
}

async function complete(row: LoadRow, actor: { kind: "shipper" | "system" | "admin"; userId: string | null }) {
  await db.transaction((tx) => transitionLoad(tx, row, "completed", actor, { completedAt: new Date() }));
  await announceStatus(row, "completed");
  await releasePayout(row.id);
  await notifyUsers([row.shipperId], {
    type: "completed",
    title: `${row.publicId} is complete`,
    body: "Thanks for shipping with AllShip AI. How did the carrier do? A quick review helps other shippers.",
    href: `/app/loads/${row.publicId}#review`,
  });
  await safely("load completed", () => enrollUser("post_delivery", row.shipperId, { loadId: row.id, context: { publicId: row.publicId, title: row.title } }));
}

export async function confirmCompletion(actor: Actor, loadId: string) {
  const { load: row } = await loadWithRole(actor, loadId, ["shipper"]);
  if (row.status !== "delivered") throw new ActionError("You can confirm once the carrier marks the load delivered.");
  await complete(row, { kind: "shipper", userId: actor.userId });
}

export async function autoCompleteDelivered() {
  const cutoff = new Date(Date.now() - AUTO_COMPLETE_HOURS * 3_600_000);
  const due = await db.select().from(load).where(and(eq(load.status, "delivered"), lt(load.deliveredAt, cutoff))).limit(25);
  let done = 0;
  for (const row of due) {
    try {
      await complete(row, { kind: "system", userId: null });
      done++;
    } catch (error) {
      log.error("trip auto-complete failed", { scope: "trips", loadPublicId: row.publicId, err: error });
    }
  }
  return done;
}

export async function recordLocation(actor: Actor, loadId: string, point: { lat: number; lng: number; accuracyM?: number; headingDeg?: number | null; speedMph?: number | null }) {
  const { load: row } = await loadWithRole(actor, loadId, ["driver", "carrier"]);
  if (row.driverId !== actor.userId) throw new ActionError("Only the assigned driver can share location.");
  if (!trackingStatuses.includes(row.status)) return { stored: false as const, reason: "not_tracking" };
  const [last] = await db
    .select({ recordedAt: driverLocation.recordedAt })
    .from(driverLocation)
    .where(eq(driverLocation.loadId, row.id))
    .orderBy(desc(driverLocation.recordedAt))
    .limit(1);
  if (last && Date.now() - last.recordedAt.getTime() < LOCATION_MIN_INTERVAL_MS) return { stored: false as const, reason: "throttled" };
  const [saved] = await db
    .insert(driverLocation)
    .values({
      loadId: row.id,
      driverId: actor.userId,
      lat: Number(point.lat.toFixed(6)),
      lng: Number(point.lng.toFixed(6)),
      accuracyM: point.accuracyM ? Math.round(point.accuracyM) : null,
      headingDeg: point.headingDeg == null ? null : Math.round(point.headingDeg),
      speedMph: point.speedMph == null ? null : Math.round(point.speedMph),
    })
    .returning();
  await publish(topics.load(row.id), {
    event: "location",
    payload: { loadId: row.id, lat: saved!.lat, lng: saved!.lng, recordedAt: saved!.recordedAt.toISOString(), speedMph: saved!.speedMph, headingDeg: saved!.headingDeg },
  });
  return { stored: true as const };
}

export async function trackingFor(actor: Actor, loadId: string, limit = 200) {
  const { load: row, role } = await loadWithRole(actor, loadId);
  if (role === "shipper" && !["en_route_to_pickup", "in_transit", "delivered", "completed", "disputed"].includes(row.status)) return { load: row, points: [] };
  const points = await db
    .select({ lat: driverLocation.lat, lng: driverLocation.lng, recordedAt: driverLocation.recordedAt, speedMph: driverLocation.speedMph, headingDeg: driverLocation.headingDeg, accuracyM: driverLocation.accuracyM })
    .from(driverLocation)
    .where(eq(driverLocation.loadId, row.id))
    .orderBy(desc(driverLocation.recordedAt))
    .limit(limit);
  return { load: row, points: points.reverse() };
}

export async function listTrips(actor: Actor, filter: "upcoming" | "active" | "done") {
  const statuses: Record<typeof filter, LoadStatus[]> = {
    upcoming: ["booked", "assigned"],
    active: ["en_route_to_pickup", "in_transit", "delivered", "disputed"],
    done: ["completed", "cancelled"],
  };
  const scope =
    actor.orgRole === "driver" ? eq(load.driverId, actor.userId) : actor.orgId && (actor.orgRole === "owner" || actor.orgRole === "dispatcher") ? eq(load.carrierOrgId, actor.orgId) : null;
  if (!scope) throw new ActionError("Only carrier teams have trips.");
  return db
    .select({
      id: load.id,
      publicId: load.publicId,
      title: load.title,
      category: load.category,
      status: load.status,
      pickup: load.pickup,
      dropoff: load.dropoff,
      driverId: load.driverId,
      driverName: user.name,
      assignedAt: load.assignedAt,
      pickedUpAt: load.pickedUpAt,
      deliveredAt: load.deliveredAt,
      updatedAt: load.updatedAt,
    })
    .from(load)
    .leftJoin(user, eq(user.id, load.driverId))
    .where(and(scope, inArray(load.status, statuses[filter])))
    .orderBy(desc(load.updatedAt))
    .limit(100);
}

export async function mediaFor(loadId: string) {
  return db.select().from(loadMedia).where(eq(loadMedia.loadId, loadId)).orderBy(loadMedia.createdAt);
}
