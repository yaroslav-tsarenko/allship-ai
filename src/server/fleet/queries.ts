import "server-only";
import { and, asc, desc, eq, gt, inArray, isNotNull, sql } from "drizzle-orm";
import { ActionError } from "@/server/actions/safe-action";
import type { Actor } from "@/server/actor";
import { db } from "@/server/db/client";
import { auditLog, driverLocation, invitation, load, member, organization, user } from "@/server/db/schema";
import type { LoadStop } from "@/server/db/schema/loads";
import {
  ACTIVE_TRIP_STATUSES,
  canViewFleet,
  deriveDriverStatus,
  isLiveTrip,
  pickActiveTrip,
  wasOnTime,
  type DriverStatus,
} from "./status";

export type FleetStop = {
  city: string | null;
  state: string | null;
  lat: number | null;
  lng: number | null;
  windowStart: string | null;
  windowEnd: string | null;
};
export type FleetTrip = {
  id: string;
  publicId: string;
  status: string;
  title: string;
  pickup: FleetStop;
  dropoff: FleetStop;
};
export type FleetPosition = {
  lat: number;
  lng: number;
  headingDeg: number | null;
  speedMph: number | null;
  recordedAt: string;
};
export type FleetDriver = {
  key: string;
  userId: string | null;
  memberId: string | null;
  invitationId: string | null;
  role: "owner" | "dispatcher" | "driver";
  name: string;
  email: string;
  phone: string | null;
  status: DriverStatus;
  trip: FleetTrip | null;
  position: FleetPosition | null;
  joinedAt: string;
};
export type FleetSnapshot = { orgName: string; drivers: FleetDriver[]; generatedAt: string };

export function fleetOrg(actor: Actor) {
  if (!canViewFleet(actor)) throw new ActionError("Only carrier owners and dispatchers can see the fleet.");
  return actor.orgId!;
}

function toStop(stop: LoadStop): FleetStop {
  return {
    city: stop.city ?? null,
    state: stop.state ?? null,
    lat: typeof stop.lat === "number" ? stop.lat : null,
    lng: typeof stop.lng === "number" ? stop.lng : null,
    windowStart: stop.windowStart ?? null,
    windowEnd: stop.windowEnd ?? null,
  };
}

function toTrip(row: {
  id: string;
  publicId: string;
  status: string;
  title: string;
  pickup: LoadStop;
  dropoff: LoadStop;
}): FleetTrip {
  return {
    id: row.id,
    publicId: row.publicId,
    status: row.status,
    title: row.title,
    pickup: toStop(row.pickup),
    dropoff: toStop(row.dropoff),
  };
}

async function latestPositions(loadIds: string[]) {
  if (loadIds.length === 0) return new Map<string, FleetPosition>();
  const rows = await db
    .selectDistinctOn([driverLocation.loadId], {
      loadId: driverLocation.loadId,
      driverId: driverLocation.driverId,
      lat: driverLocation.lat,
      lng: driverLocation.lng,
      headingDeg: driverLocation.headingDeg,
      speedMph: driverLocation.speedMph,
      recordedAt: driverLocation.recordedAt,
    })
    .from(driverLocation)
    .where(inArray(driverLocation.loadId, loadIds))
    .orderBy(driverLocation.loadId, desc(driverLocation.recordedAt));
  return new Map(
    rows.map((r) => [
      r.loadId,
      {
        lat: r.lat,
        lng: r.lng,
        headingDeg: r.headingDeg,
        speedMph: r.speedMph,
        recordedAt: r.recordedAt.toISOString(),
      },
    ]),
  );
}

export async function fleetSnapshot(actor: Actor): Promise<FleetSnapshot> {
  const orgId = fleetOrg(actor);
  const [members, trips, invites, orgRows] = await Promise.all([
    db
      .select({
        memberId: member.id,
        userId: user.id,
        role: member.role,
        name: user.name,
        email: user.email,
        phone: user.phone,
        emailVerified: user.emailVerified,
        joinedAt: member.createdAt,
      })
      .from(member)
      .innerJoin(user, eq(user.id, member.userId))
      .where(eq(member.organizationId, orgId))
      .orderBy(asc(user.name)),
    db
      .select({
        id: load.id,
        publicId: load.publicId,
        status: load.status,
        title: load.title,
        pickup: load.pickup,
        dropoff: load.dropoff,
        driverId: load.driverId,
      })
      .from(load)
      .where(
        and(
          eq(load.carrierOrgId, orgId),
          isNotNull(load.driverId),
          inArray(load.status, [...ACTIVE_TRIP_STATUSES]),
        ),
      ),
    db
      .select({ id: invitation.id, email: invitation.email, createdAt: invitation.createdAt })
      .from(invitation)
      .where(
        and(
          eq(invitation.organizationId, orgId),
          eq(invitation.role, "driver"),
          eq(invitation.status, "pending"),
          gt(invitation.expiresAt, new Date()),
        ),
      )
      .orderBy(desc(invitation.createdAt)),
    db.select({ name: organization.name }).from(organization).where(eq(organization.id, orgId)).limit(1),
  ]);

  const tripsByDriver = new Map<string, typeof trips>();
  for (const t of trips) tripsByDriver.set(t.driverId!, [...(tripsByDriver.get(t.driverId!) ?? []), t]);
  const activeByDriver = new Map(
    [...tripsByDriver].map(([driverId, list]) => [driverId, pickActiveTrip(list)!]),
  );
  const positions = await latestPositions(
    [...activeByDriver.values()].filter((t) => isLiveTrip(t.status)).map((t) => t.id),
  );

  const memberEmails = new Set(members.map((m) => m.email.toLowerCase()));
  const drivers: FleetDriver[] = members
    .filter((m) => m.role === "driver" || activeByDriver.has(m.userId))
    .map((m) => {
      const trip = activeByDriver.get(m.userId) ?? null;
      return {
        key: m.userId,
        userId: m.userId,
        memberId: m.memberId,
        invitationId: null,
        role: m.role as FleetDriver["role"],
        name: m.name,
        email: m.email,
        phone: m.phone,
        status: deriveDriverStatus({ activated: m.emailVerified, tripStatus: trip?.status }),
        trip: trip ? toTrip(trip) : null,
        position: trip ? (positions.get(trip.id) ?? null) : null,
        joinedAt: m.joinedAt.toISOString(),
      };
    });
  const invited: FleetDriver[] = invites
    .filter((i) => !memberEmails.has(i.email.toLowerCase()))
    .map((i) => ({
      key: `invite:${i.id}`,
      userId: null,
      memberId: null,
      invitationId: i.id,
      role: "driver",
      name: i.email,
      email: i.email,
      phone: null,
      status: "invited",
      trip: null,
      position: null,
      joinedAt: i.createdAt.toISOString(),
    }));

  return {
    orgName: orgRows[0]?.name ?? "",
    drivers: [...drivers, ...invited],
    generatedAt: new Date().toISOString(),
  };
}

export async function driverDetail(actor: Actor, userId: string) {
  const orgId = fleetOrg(actor);
  const [profile] = await db
    .select({
      memberId: member.id,
      role: member.role,
      joinedAt: member.createdAt,
      userId: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      emailVerified: user.emailVerified,
    })
    .from(member)
    .innerJoin(user, eq(user.id, member.userId))
    .where(and(eq(member.organizationId, orgId), eq(member.userId, userId)))
    .limit(1);
  if (!profile) return null;

  const scope = and(eq(load.carrierOrgId, orgId), eq(load.driverId, userId));
  const [recent, active, history, notes] = await Promise.all([
    db
      .select({
        id: load.id,
        publicId: load.publicId,
        status: load.status,
        title: load.title,
        pickup: load.pickup,
        dropoff: load.dropoff,
        deliveredAt: load.deliveredAt,
        updatedAt: load.updatedAt,
      })
      .from(load)
      .where(scope)
      .orderBy(desc(load.updatedAt))
      .limit(10),
    db
      .select({
        id: load.id,
        publicId: load.publicId,
        status: load.status,
        title: load.title,
        pickup: load.pickup,
        dropoff: load.dropoff,
      })
      .from(load)
      .where(and(scope, inArray(load.status, [...ACTIVE_TRIP_STATUSES]))),
    db
      .select({
        status: load.status,
        deliveredAt: load.deliveredAt,
        windowEnd: sql<string | null>`${load.dropoff}->>'windowEnd'`,
        windowStart: sql<string | null>`${load.dropoff}->>'windowStart'`,
      })
      .from(load)
      .where(and(scope, inArray(load.status, ["delivered", "completed", "disputed"])))
      .orderBy(desc(load.deliveredAt))
      .limit(500),
    db
      .select({ diff: auditLog.diff })
      .from(auditLog)
      .where(
        and(
          inArray(auditLog.action, ["fleet.driver_added", "fleet.driver_invited"]),
          eq(auditLog.entity, "member"),
          eq(auditLog.entityId, userId),
          sql`${auditLog.diff}->>'orgId' = ${orgId}`,
        ),
      )
      .orderBy(desc(auditLog.createdAt))
      .limit(1),
  ]);

  const current = pickActiveTrip(active);
  const trail =
    current && isLiveTrip(current.status)
      ? (
          await db
            .select({
              lat: driverLocation.lat,
              lng: driverLocation.lng,
              headingDeg: driverLocation.headingDeg,
              speedMph: driverLocation.speedMph,
              recordedAt: driverLocation.recordedAt,
            })
            .from(driverLocation)
            .where(eq(driverLocation.loadId, current.id))
            .orderBy(desc(driverLocation.recordedAt))
            .limit(300)
        )
          .reverse()
          .map((p) => ({ ...p, recordedAt: p.recordedAt.toISOString() }))
      : [];

  const judged = history
    .map((h) => wasOnTime(h.deliveredAt, h.windowEnd, h.windowStart))
    .filter((v): v is boolean => v !== null);
  const extra = (notes[0]?.diff ?? {}) as { cdl?: string | null; notes?: string | null };

  return {
    profile: {
      ...profile,
      role: profile.role as FleetDriver["role"],
      joinedAt: profile.joinedAt.toISOString(),
      cdl: extra.cdl ?? null,
      notes: extra.notes ?? null,
    },
    status: deriveDriverStatus({ activated: profile.emailVerified, tripStatus: current?.status }),
    generatedAt: Date.now(),
    trip: current ? toTrip(current) : null,
    trail,
    recent: recent.map((r) => ({
      ...toTrip(r),
      deliveredAt: r.deliveredAt?.toISOString() ?? null,
      updatedAt: r.updatedAt.toISOString(),
    })),
    stats: {
      delivered: history.filter((h) => h.status !== "disputed").length,
      onTime: judged.filter(Boolean).length,
      judged: judged.length,
    },
  };
}

export type DriverDetail = NonNullable<Awaited<ReturnType<typeof driverDetail>>>;
