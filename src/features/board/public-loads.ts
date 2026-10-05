import "server-only";
import { unstable_cache } from "next/cache";
import { listOpenLoads } from "@/server/loads/service";
import { log } from "@/lib/log";

export const OPEN_LOADS_TAG = "open-loads";

export type PublicLoad = {
  id: string;
  title: string;
  category: string;
  pickupCity: string | null;
  pickupState: string | null;
  pickupDate: string | null;
  dropoffCity: string | null;
  dropoffState: string | null;
  bids: number;
  biddingClosesAt: string | null;
};

export const listPublicOpenLoads = unstable_cache(
  async (): Promise<PublicLoad[]> => {
    try {
      const rows = await listOpenLoads({ limit: 40 });
      return rows.map((r) => ({
        id: r.id,
        title: r.title,
        category: r.category,
        pickupCity: r.pickupCity,
        pickupState: r.pickupState,
        pickupDate: r.pickupDate,
        dropoffCity: r.dropoffCity,
        dropoffState: r.dropoffState,
        bids: r.bids,
        biddingClosesAt: r.biddingClosesAt ? r.biddingClosesAt.toISOString() : null,
      }));
    } catch (error) {
      log.error("public board query failed", { scope: "loads", err: error });
      return [];
    }
  },
  ["public-open-loads"],
  { tags: [OPEN_LOADS_TAG], revalidate: 300 },
);

export async function currentPublicLoads() {
  const now = Date.now();
  return (await listPublicOpenLoads()).filter((l) => !l.biddingClosesAt || new Date(l.biddingClosesAt).getTime() > now);
}
