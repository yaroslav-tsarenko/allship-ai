import "server-only";
import { and, eq, inArray, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { log } from "@/lib/log";
import { ActionError } from "@/server/actions/safe-action";
import type { Actor } from "@/server/actor";
import { auth } from "@/server/auth/auth";
import { db } from "@/server/db/client";
import { auditLog, load, member, organization, user } from "@/server/db/schema";
import { clientIp } from "@/server/rate-limit";
import { inviteMember } from "@/server/team/service";
import { sendDriverSetup } from "./emails";
import { fleetOrg } from "./queries";

export type AddDriverInput = {
  name: string;
  email: string;
  phone: string;
  cdl?: string | null;
  notes?: string | null;
};
export type AddDriverResult =
  { kind: "created"; userId: string; name: string; emailSent: boolean } | { kind: "invited"; email: string };

const busyShipperStatuses = [
  "open",
  "awaiting_payment",
  "booked",
  "assigned",
  "en_route_to_pickup",
  "in_transit",
  "delivered",
  "disputed",
] as const;

async function audit(actor: Actor, action: string, entityId: string, diff: Record<string, unknown>) {
  const h = await headers();
  await db
    .insert(auditLog)
    .values({
      actorId: actor.userId,
      action,
      entity: "member",
      entityId,
      diff,
      ip: await clientIp(),
      userAgent: h.get("user-agent"),
    });
}

async function companyName(orgId: string) {
  const [row] = await db
    .select({ name: organization.name })
    .from(organization)
    .where(eq(organization.id, orgId))
    .limit(1);
  return row?.name ?? "your carrier";
}

function splitName(name: string) {
  const parts = name.trim().split(/\s+/);
  return { firstName: parts[0] ?? name, lastName: parts.length > 1 ? parts.slice(1).join(" ") : null };
}

export async function addDriver(actor: Actor, input: AddDriverInput): Promise<AddDriverResult> {
  const orgId = fleetOrg(actor);
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim().replace(/\s+/g, " ");
  const cdl = input.cdl?.trim() || null;
  const notes = input.notes?.trim() || null;
  if (email === actor.email.toLowerCase())
    throw new ActionError("That's your own email. Use the driver's email address.");

  const [existing] = await db
    .select({ id: user.id, banned: user.banned, accountType: user.accountType, orgId: member.organizationId })
    .from(user)
    .leftJoin(member, eq(member.userId, user.id))
    .where(eq(user.email, email))
    .limit(1);

  if (existing) {
    if (existing.orgId === orgId) throw new ActionError("That person is already on your team.");
    if (existing.orgId)
      throw new ActionError("That person already belongs to another carrier on AllShip AI.");
    if (existing.banned) throw new ActionError("This account can't be added. Use a different email.");
    const [busy] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(load)
      .where(and(eq(load.shipperId, existing.id), inArray(load.status, [...busyShipperStatuses])));
    if ((busy?.n ?? 0) > 0)
      throw new ActionError(
        "This email is used for an account with active shipments. Ask the driver for a different email.",
      );
    await inviteMember(actor, email, "driver");
    await audit(actor, "fleet.driver_invited", existing.id, { orgId, email, cdl, notes });
    return { kind: "invited", email };
  }

  const ctx = await auth.$context;
  const { firstName, lastName } = splitName(name);
  let userId: string;
  try {
    const created = await ctx.internalAdapter.createUser(
      {
        email,
        name,
        emailVerified: false,
        firstName,
        lastName,
        phone: input.phone.trim(),
        accountType: "carrier",
        onboardingCompletedAt: new Date(),
      },
      { method: "magic-link" },
    );
    if (!created) throw new Error("createUser returned nothing");
    userId = created.id;
  } catch (error) {
    log.error("driver account creation failed", { scope: "fleet", err: error });
    throw new ActionError("We couldn't create the driver's account. Check the email and try again.");
  }

  try {
    await auth.api.addMember({ body: { userId, role: "driver", organizationId: orgId } });
  } catch (error) {
    await ctx.internalAdapter.deleteUser(userId).catch(() => undefined);
    log.error("adding driver to org failed", { scope: "fleet", err: error });
    throw new ActionError("We couldn't add the driver to your team. Try again.");
  }

  await audit(actor, "fleet.driver_added", userId, { orgId, email, via: "created", cdl, notes });

  let emailSent = true;
  try {
    await sendDriverSetup(email, {
      firstName,
      companyName: await companyName(orgId),
      inviterName: actor.name,
    });
  } catch (error) {
    emailSent = false;
    log.error("driver setup email failed", { scope: "fleet", err: error });
  }
  return { kind: "created", userId, name, emailSent };
}

export async function resendDriverSetup(actor: Actor, userId: string) {
  const orgId = fleetOrg(actor);
  const [target] = await db
    .select({
      email: user.email,
      name: user.name,
      firstName: user.firstName,
      emailVerified: user.emailVerified,
      role: member.role,
    })
    .from(member)
    .innerJoin(user, eq(user.id, member.userId))
    .where(and(eq(member.organizationId, orgId), eq(member.userId, userId)))
    .limit(1);
  if (!target) throw new ActionError("That person isn't on your team anymore.");
  if (target.role !== "driver") throw new ActionError("Setup links are only for drivers.");
  if (target.emailVerified)
    throw new ActionError(
      `${target.name} already set up their account. They can sign in with ${target.email}.`,
    );
  try {
    await sendDriverSetup(target.email, {
      firstName: target.firstName,
      companyName: await companyName(orgId),
      inviterName: actor.name,
    });
  } catch (error) {
    log.error("driver setup email failed", { scope: "fleet", err: error });
    throw new ActionError("We couldn't send the email. Try again in a minute.");
  }
  await audit(actor, "fleet.setup_link_resent", userId, { orgId });
  return { email: target.email };
}
