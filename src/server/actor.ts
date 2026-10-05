import "server-only";
import { asc, eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { carrierProfile, member, user } from "@/server/db/schema";
import { ActionError } from "@/server/actions/safe-action";

export type Actor = {
  userId: string;
  name: string;
  email: string;
  accountType: "shipper" | "carrier";
  isAdmin: boolean;
  orgId: string | null;
  orgRole: "owner" | "dispatcher" | "driver" | null;
  carrierVerified: boolean;
  payoutsEnabled: boolean;
};

export async function getActor(userId: string): Promise<Actor> {
  const [row] = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      accountType: user.accountType,
      role: user.role,
      twoFactorEnabled: user.twoFactorEnabled,
      banned: user.banned,
      orgId: member.organizationId,
      orgRole: member.role,
      fmcsa: carrierProfile.fmcsaStatus,
      payouts: carrierProfile.payoutsEnabled,
    })
    .from(user)
    .leftJoin(member, eq(member.userId, user.id))
    .leftJoin(carrierProfile, eq(carrierProfile.orgId, member.organizationId))
    .where(eq(user.id, userId))
    .orderBy(asc(member.createdAt))
    .limit(1);
  if (!row || row.banned) throw new ActionError("Your account is not available.");
  return {
    userId: row.id,
    name: row.name,
    email: row.email,
    accountType: row.accountType,
    isAdmin: row.role === "admin" && Boolean(row.twoFactorEnabled),
    orgId: row.orgId,
    orgRole: (row.orgRole as Actor["orgRole"]) ?? null,
    carrierVerified: row.fmcsa === "verified",
    payoutsEnabled: Boolean(row.payouts),
  };
}

export function assertShipper(actor: Actor) {
  if (actor.accountType !== "shipper") throw new ActionError("Only shipper accounts can do this.");
}

export function assertCarrierStaff(actor: Actor) {
  if (!actor.orgId || (actor.orgRole !== "owner" && actor.orgRole !== "dispatcher")) {
    throw new ActionError("Only carrier owners and dispatchers can do this.");
  }
  return actor.orgId;
}

export function assertAdmin(actor: Actor) {
  if (!actor.isAdmin) throw new ActionError("Admins with two-step verification only.");
}
