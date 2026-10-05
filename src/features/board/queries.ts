import "server-only";
import { and, asc, desc, eq, gt, inArray, ne, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { bid, load, user } from "@/server/db/schema";
import type { BoardFilters } from "./filters";

export async function listBoardLoads(filters: BoardFilters, orgId: string | null) {
  const conditions = [eq(load.status, "open"), gt(load.biddingClosesAt, new Date())];
  if (filters.categories.length) conditions.push(inArray(load.category, filters.categories));
  if (filters.from) conditions.push(sql`${load.pickup}->>'state' = ${filters.from}`);
  if (filters.to) conditions.push(sql`${load.dropoff}->>'state' = ${filters.to}`);
  const order =
    filters.sort === "pickup"
      ? [asc(sql`${load.pickup}->>'windowStart'`), desc(load.publishedAt)]
      : filters.sort === "target"
        ? [sql`${load.targetPriceCents} desc nulls last`, desc(load.publishedAt)]
        : [desc(load.publishedAt)];
  return db
    .select({
      id: load.id,
      publicId: load.publicId,
      title: load.title,
      category: load.category,
      pickupCity: sql<string | null>`${load.pickup}->>'city'`,
      pickupState: sql<string | null>`${load.pickup}->>'state'`,
      pickupStart: sql<string | null>`${load.pickup}->>'windowStart'`,
      pickupEnd: sql<string | null>`${load.pickup}->>'windowEnd'`,
      dropoffCity: sql<string | null>`${load.dropoff}->>'city'`,
      dropoffState: sql<string | null>`${load.dropoff}->>'state'`,
      distanceMiles: load.distanceMiles,
      details: load.details,
      targetPriceCents: load.targetPriceCents,
      biddingClosesAt: load.biddingClosesAt,
      publishedAt: load.publishedAt,
      bids: sql<number>`(select count(*)::int from ${bid} where ${bid.loadId} = "load"."id" and ${bid.status} = 'active')`,
      myBidCents: orgId
        ? sql<number | null>`(select ${bid.amountCents} from ${bid} where ${bid.loadId} = "load"."id" and ${bid.status} = 'active' and ${bid.carrierOrgId} = ${orgId} limit 1)`
        : sql<number | null>`null::int`,
    })
    .from(load)
    .where(and(...conditions))
    .orderBy(...order)
    .limit(60);
}

export type BoardLoad = Awaited<ReturnType<typeof listBoardLoads>>[number];

export async function shipperTrackRecord(loadId: string) {
  const [row] = await db
    .select({
      memberSince: user.createdAt,
      posted: sql<number>`(select count(*)::int from ${load} l2 where l2.shipper_id = "user"."id" and l2.status <> 'draft')`,
      completed: sql<number>`(select count(*)::int from ${load} l2 where l2.shipper_id = "user"."id" and l2.status = 'completed')`,
    })
    .from(load)
    .innerJoin(user, eq(user.id, load.shipperId))
    .where(eq(load.id, loadId))
    .limit(1);
  return row ?? null;
}

export async function carrierBoardSummary(orgId: string) {
  const [row] = await db
    .select({
      active: sql<number>`count(*) filter (where ${bid.status} = 'active')::int`,
      won: sql<number>`count(*) filter (where ${bid.status} = 'accepted')::int`,
    })
    .from(bid)
    .where(and(eq(bid.carrierOrgId, orgId), ne(bid.status, "withdrawn")));
  const [open] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(load)
    .where(and(eq(load.status, "open"), gt(load.biddingClosesAt, new Date())));
  return { activeBids: row?.active ?? 0, wonBids: row?.won ?? 0, openLoads: open?.n ?? 0 };
}
