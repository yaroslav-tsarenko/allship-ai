import "server-only";
import { and, count, eq, inArray, ne, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { load, member, organization, payment, payout, user } from "@/server/db/schema";
import type { LoadStatus } from "@/server/db/schema/enums";
import { activeShipperStatuses } from "@/server/loads/transitions";

export type DeletionBlocker = { code: string; title: string; detail: string; href?: string };

const tripStatuses: LoadStatus[] = ["booked", "assigned", "en_route_to_pickup", "in_transit", "delivered", "disputed"];

const sample = (ids: string[]) => (ids.length > 3 ? `${ids.slice(0, 3).join(", ")} and ${ids.length - 3} more` : ids.join(", "));
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export async function deletionBlockers(userId: string): Promise<DeletionBlocker[]> {
  const blockers: DeletionBlocker[] = [];

  const [account] = await db.select({ role: user.role }).from(user).where(eq(user.id, userId)).limit(1);
  if (account?.role === "admin") {
    blockers.push({
      code: "admin",
      title: "Admin accounts can't delete themselves",
      detail: "Ask another admin to remove your admin role first, so the console always has an accountable owner.",
    });
  }

  const shipperLoads = await db
    .select({ publicId: load.publicId })
    .from(load)
    .where(and(eq(load.shipperId, userId), inArray(load.status, activeShipperStatuses)));
  if (shipperLoads.length) {
    blockers.push({
      code: "active_loads",
      title: `You have ${plural(shipperLoads.length, "active load")}`,
      detail: `${sample(shipperLoads.map((l) => l.publicId))}. Cancel loads that are still open, and wait until booked loads are delivered and confirmed so the escrow can be released or refunded.`,
      href: "/app/loads",
    });
  }

  const [escrow] = await db
    .select({ n: count() })
    .from(payment)
    .where(and(eq(payment.shipperId, userId), inArray(payment.status, ["processing", "disputed"])));
  if (escrow && escrow.n > 0) {
    blockers.push({
      code: "escrow",
      title: `${plural(escrow.n, "payment")} still being processed`,
      detail: "Payments that are processing or disputed must settle before we can close the account.",
    });
  }

  const driverTrips = await db
    .select({ publicId: load.publicId })
    .from(load)
    .where(and(eq(load.driverId, userId), inArray(load.status, tripStatuses)));
  if (driverTrips.length) {
    blockers.push({
      code: "driver_trips",
      title: `You're the driver on ${plural(driverTrips.length, "trip")} in progress`,
      detail: `${sample(driverTrips.map((l) => l.publicId))}. Finish the delivery or ask your dispatcher to reassign the trip.`,
      href: "/app/trips",
    });
  }

  const owned = await db
    .select({ orgId: member.organizationId, orgName: organization.name })
    .from(member)
    .innerJoin(organization, eq(organization.id, member.organizationId))
    .where(and(eq(member.userId, userId), eq(member.role, "owner")));

  for (const org of owned) {
    const [otherOwners] = await db
      .select({ n: count() })
      .from(member)
      .where(and(eq(member.organizationId, org.orgId), eq(member.role, "owner"), ne(member.userId, userId)));
    if (otherOwners && otherOwners.n > 0) continue;

    const trips = await db
      .select({ publicId: load.publicId })
      .from(load)
      .where(and(eq(load.carrierOrgId, org.orgId), inArray(load.status, tripStatuses)));
    if (trips.length) {
      blockers.push({
        code: "carrier_trips",
        title: `${org.orgName} has ${plural(trips.length, "trip")} in progress`,
        detail: `You're the only owner, and ${sample(trips.map((l) => l.publicId))} still need a responsible carrier until they're delivered and paid out.`,
        href: "/app/trips",
      });
    }

    const [pendingPayouts] = await db
      .select({ n: count(), cents: sql<number>`coalesce(sum(${payout.amountCents}), 0)::int` })
      .from(payout)
      .where(and(eq(payout.carrierOrgId, org.orgId), inArray(payout.status, ["pending", "scheduled", "held"])));
    if (pendingPayouts && pendingPayouts.n > 0) {
      blockers.push({
        code: "carrier_payouts",
        title: `${org.orgName} has ${plural(pendingPayouts.n, "payout")} waiting`,
        detail: `$${(pendingPayouts.cents / 100).toFixed(2)} is still held for your company. Wait until it's paid out to your bank account.`,
        href: "/app/payouts",
      });
    }

    const [others] = await db
      .select({ n: count() })
      .from(member)
      .where(and(eq(member.organizationId, org.orgId), ne(member.userId, userId)));
    if (others && others.n > 0) {
      blockers.push({
        code: "sole_owner",
        title: `You're the only owner of ${org.orgName}`,
        detail: `${plural(others.n, "teammate")} still ${others.n === 1 ? "works" : "work"} under this company. Make someone else an owner or remove the team before closing your account.`,
        href: "/app/team",
      });
    }
  }

  return blockers;
}
