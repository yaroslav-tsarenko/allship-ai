import "server-only";
import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/server/db/client";
import { rateLimit } from "@/server/db/schema";

export async function clientIp() {
  const h = await headers();
  return h.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export async function consumeRateLimit(key: string, max: number, windowSeconds: number) {
  const now = Date.now();
  const windowStart = now - windowSeconds * 1000;
  const [row] = await db
    .insert(rateLimit)
    .values({ id: randomUUID(), key, count: 1, lastRequest: now })
    .onConflictDoUpdate({
      target: rateLimit.key,
      set: {
        count: sql`case when ${rateLimit.lastRequest} < ${windowStart} then 1 else ${rateLimit.count} + 1 end`,
        lastRequest: now,
      },
    })
    .returning({ count: rateLimit.count });
  return (row?.count ?? 1) <= max;
}
