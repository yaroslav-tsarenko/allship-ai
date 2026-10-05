import "server-only";
import { and, asc, desc, eq, notInArray } from "drizzle-orm";
import type { Actor } from "@/server/actor";
import { db } from "@/server/db/client";
import { driverLocation, loadEvent, user } from "@/server/db/schema";
import { signedReadUrl } from "@/server/storage/storage";
import { loadWithRole } from "@/server/trips/access";
import { listOrgDrivers, listTrips, mediaFor } from "@/server/trips/service";

export type TripFilter = "upcoming" | "active" | "done";
export type TripListRow = Awaited<ReturnType<typeof listTrips>>[number];

export async function tripCounts(actor: Actor) {
  const [upcoming, active, done] = await Promise.all([listTrips(actor, "upcoming"), listTrips(actor, "active"), listTrips(actor, "done")]);
  return { upcoming, active, done };
}

export async function getTrip(actor: Actor, publicId: string) {
  const { load, role } = await loadWithRole(actor, publicId, ["carrier", "driver"]);
  const isStaff = Boolean(actor.orgId && actor.orgId === load.carrierOrgId && (actor.orgRole === "owner" || actor.orgRole === "dispatcher"));
  const [shipperRows, driverRows, events, media, points, drivers] = await Promise.all([
    db.select({ name: user.name, firstName: user.firstName, phone: user.phone, email: user.email }).from(user).where(eq(user.id, load.shipperId)).limit(1),
    load.driverId ? db.select({ id: user.id, name: user.name, phone: user.phone }).from(user).where(eq(user.id, load.driverId)).limit(1) : Promise.resolve([]),
    db
      .select({ id: loadEvent.id, type: loadEvent.type, toStatus: loadEvent.toStatus, createdAt: loadEvent.createdAt, payload: loadEvent.payload, actorName: user.name })
      .from(loadEvent)
      .leftJoin(user, eq(user.id, loadEvent.actorId))
      .where(and(eq(loadEvent.loadId, load.id), notInArray(loadEvent.type, ["bid_placed", "bid_updated", "bid_withdrawn", "payment_failed", "payment_after_close"])))
      .orderBy(asc(loadEvent.createdAt)),
    mediaFor(load.id),
    db
      .select({ lat: driverLocation.lat, lng: driverLocation.lng, recordedAt: driverLocation.recordedAt, speedMph: driverLocation.speedMph, headingDeg: driverLocation.headingDeg, accuracyM: driverLocation.accuracyM })
      .from(driverLocation)
      .where(eq(driverLocation.loadId, load.id))
      .orderBy(desc(driverLocation.recordedAt))
      .limit(200),
    isStaff && load.carrierOrgId ? listOrgDrivers(load.carrierOrgId) : Promise.resolve([]),
  ]);
  const gallery = await Promise.all(
    media.map(async (m) => ({ id: m.id, kind: m.kind, createdAt: m.createdAt, isPdf: m.storageKey.endsWith(".pdf"), url: await signedReadUrl(m.storageKey) })),
  );
  return {
    load,
    role,
    isStaff,
    isAssignedDriver: load.driverId === actor.userId,
    shipper: shipperRows[0] ?? null,
    driver: driverRows[0] ?? null,
    events,
    media: gallery.filter((m) => m.url),
    points: points.reverse().map((p) => ({ ...p, recordedAt: p.recordedAt.toISOString() })),
    drivers,
  };
}

export type Trip = Awaited<ReturnType<typeof getTrip>>;
