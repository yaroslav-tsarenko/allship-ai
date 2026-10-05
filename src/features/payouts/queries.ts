import "server-only";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { carrierProfile, load, payout } from "@/server/db/schema";

export type PayoutSetup = "not_started" | "pending" | "enabled";

export async function getPayoutOverview(orgId: string) {
  const [profile] = await db
    .select({ accountId: carrierProfile.stripeAccountId, payoutsEnabled: carrierProfile.payoutsEnabled })
    .from(carrierProfile)
    .where(eq(carrierProfile.orgId, orgId))
    .limit(1);
  const recent = await db
    .select({
      id: payout.id,
      amountCents: payout.amountCents,
      status: payout.status,
      releaseAfter: payout.releaseAfter,
      paidAt: payout.paidAt,
      createdAt: payout.createdAt,
      loadPublicId: load.publicId,
      loadTitle: load.title,
    })
    .from(payout)
    .innerJoin(load, eq(load.id, payout.loadId))
    .where(eq(payout.carrierOrgId, orgId))
    .orderBy(desc(payout.createdAt))
    .limit(20);
  const setup: PayoutSetup = profile?.payoutsEnabled ? "enabled" : profile?.accountId ? "pending" : "not_started";
  const [totals] = await db
    .select({
      upcoming: sql<number>`coalesce(sum(${payout.amountCents}) filter (where ${payout.status} in ('pending', 'scheduled', 'held')), 0)::int`,
      paid: sql<number>`coalesce(sum(${payout.amountCents}) filter (where ${payout.status} = 'paid'), 0)::int`,
    })
    .from(payout)
    .where(eq(payout.carrierOrgId, orgId));
  return { setup, recent, upcomingCents: totals?.upcoming ?? 0, paidCents: totals?.paid ?? 0 };
}
