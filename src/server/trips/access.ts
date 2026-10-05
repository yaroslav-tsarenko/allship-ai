import "server-only";
import { eq } from "drizzle-orm";
import { ActionError } from "@/server/actions/safe-action";
import type { Actor } from "@/server/actor";
import { db } from "@/server/db/client";
import { load } from "@/server/db/schema";

export type LoadRole = "shipper" | "carrier" | "driver" | "admin";
export type LoadRow = typeof load.$inferSelect;

export function roleOnLoad(actor: Actor, row: Pick<LoadRow, "shipperId" | "carrierOrgId" | "driverId">): LoadRole | null {
  if (row.shipperId === actor.userId) return "shipper";
  if (row.carrierOrgId && actor.orgId === row.carrierOrgId && (actor.orgRole === "owner" || actor.orgRole === "dispatcher")) return "carrier";
  if (row.driverId === actor.userId && row.carrierOrgId && actor.orgId === row.carrierOrgId) return "driver";
  if (actor.isAdmin) return "admin";
  return null;
}

export async function loadWithRole(actor: Actor, ref: string, allowed: LoadRole[] = ["shipper", "carrier", "driver", "admin"]) {
  const isUuid = /^[0-9a-f-]{36}$/i.test(ref);
  const [row] = await db
    .select()
    .from(load)
    .where(isUuid ? eq(load.id, ref) : eq(load.publicId, ref))
    .limit(1);
  const role = row ? roleOnLoad(actor, row) : null;
  if (!row || !role || !allowed.includes(role)) throw new ActionError("Load not found.");
  return { load: row, role };
}
