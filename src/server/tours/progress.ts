import "server-only";
import { and, eq } from "drizzle-orm";
import { parseBoardFilters } from "@/features/board/filters";
import { listBoardLoads } from "@/features/board/queries";
import { tourIds, type TourId } from "@/features/tours/ids";
import type { Actor } from "@/server/actor";
import { db } from "@/server/db/client";
import { bid, tourProgress } from "@/server/db/schema";
import { listShipperLoads } from "@/server/loads/service";
import { listTrips } from "@/server/trips/service";

export async function completedTourIds(userId: string): Promise<TourId[]> {
  const rows = await db.select({ tourId: tourProgress.tourId }).from(tourProgress).where(eq(tourProgress.userId, userId));
  const known = new Set<string>(tourIds);
  return rows.map((r) => r.tourId).filter((id): id is TourId => known.has(id));
}

export async function markTourCompleted(userId: string, tourId: TourId) {
  await db.insert(tourProgress).values({ userId, tourId }).onConflictDoNothing({ target: [tourProgress.userId, tourProgress.tourId] });
}

export async function tourTarget(actor: Actor, tourId: TourId): Promise<string | null> {
  if (tourId === "compare-bids") {
    if (actor.accountType !== "shipper") return null;
    const loads = await listShipperLoads(actor, "active");
    const withBids = loads.filter((l) => Number(l.bids) > 0 && (l.status === "open" || l.status === "awaiting_payment"));
    const latest = withBids.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    return latest ? `/app/loads/${latest.publicId}` : null;
  }
  if (tourId === "place-bid") {
    if (!actor.orgId || (actor.orgRole !== "owner" && actor.orgRole !== "dispatcher")) return null;
    const [loads, mine] = await Promise.all([
      listBoardLoads(parseBoardFilters({}), actor.orgId),
      db.select({ loadId: bid.loadId }).from(bid).where(and(eq(bid.carrierOrgId, actor.orgId), eq(bid.status, "active"))),
    ]);
    const bidOn = new Set(mine.map((b) => b.loadId));
    const pick = loads.find((l) => !bidOn.has(l.id)) ?? loads[0];
    return pick ? `/app/board/${pick.publicId}` : null;
  }
  if (tourId === "trip-driver") {
    if (!actor.orgId) return null;
    const [active, upcoming] = await Promise.all([listTrips(actor, "active"), listTrips(actor, "upcoming")]);
    const pick = active[0] ?? upcoming[0];
    return pick ? `/app/trips/${pick.publicId}` : null;
  }
  return null;
}
