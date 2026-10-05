import "server-only";
import { avg, count, eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { log } from "@/lib/log";
import { db } from "@/server/db/client";
import { carrierProfile, load, review } from "@/server/db/schema";

export type MarketplaceStats = { completedLoads: number; verifiedCarriers: number; reviews: number; averageRating: number | null };

export const MIN_COMPLETED_LOADS = 10;
export const MIN_VERIFIED_CARRIERS = 5;
export const MIN_REVIEWS = 3;

const empty: MarketplaceStats = { completedLoads: 0, verifiedCarriers: 0, reviews: 0, averageRating: null };

export const getMarketplaceStats = unstable_cache(
  async (): Promise<MarketplaceStats> => {
    try {
      const [[loads], [carriers], [ratings]] = await Promise.all([
        db.select({ n: count() }).from(load).where(eq(load.status, "completed")),
        db.select({ n: count() }).from(carrierProfile).where(eq(carrierProfile.fmcsaStatus, "verified")),
        db.select({ n: count(), average: avg(review.rating) }).from(review),
      ]);
      const reviews = Number(ratings?.n ?? 0);
      return {
        completedLoads: Number(loads?.n ?? 0),
        verifiedCarriers: Number(carriers?.n ?? 0),
        reviews,
        averageRating: reviews ? Math.round(Number(ratings?.average ?? 0) * 10) / 10 : null,
      };
    } catch (error) {
      log.error("marketplace stats query failed", { scope: "marketing", err: error });
      return empty;
    }
  },
  ["marketing-marketplace-stats"],
  { revalidate: 3600, tags: ["showcase", "reviews"] },
);
