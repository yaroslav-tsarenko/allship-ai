import "server-only";
import { and, count, eq, gt, sql } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { log } from "@/lib/log";
import { db } from "@/server/db/client";
import { carrierProfile, load } from "@/server/db/schema";

export type LiveBoardStats = { openLoads: number; carrierStates: number };

export const getLiveBoardStats = unstable_cache(
  async (): Promise<LiveBoardStats> => {
    try {
      const [[open], [states]] = await Promise.all([
        db
          .select({ n: count() })
          .from(load)
          .where(and(eq(load.status, "open"), gt(load.biddingClosesAt, new Date()))),
        db
          .select({ n: sql<number>`count(distinct s)::int` })
          .from(sql`${carrierProfile}, unnest(${carrierProfile.serviceStates}) as s`)
          .where(eq(carrierProfile.fmcsaStatus, "verified")),
      ]);
      return { openLoads: Number(open?.n ?? 0), carrierStates: Number(states?.n ?? 0) };
    } catch (error) {
      log.error("live board stats query failed", { scope: "marketing", err: error });
      return { openLoads: 0, carrierStates: 0 };
    }
  },
  ["marketing-live-board-stats"],
  { revalidate: 300, tags: ["loads"] },
);
