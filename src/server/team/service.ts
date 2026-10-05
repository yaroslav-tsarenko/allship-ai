import "server-only";
import { APIError } from "better-auth/api";
import { and, asc, desc, eq, gt, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { ActionError } from "@/server/actions/safe-action";
import type { Actor } from "@/server/actor";
import { auth } from "@/server/auth/auth";
import { db } from "@/server/db/client";
import { invitation, load, member, organization, user } from "@/server/db/schema";
import { log } from "@/lib/log";

export type TeamRole = "owner" | "dispatcher" | "driver";
export type InviteRole = "dispatcher" | "driver";

const friendly: Record<string, string> = {
  USER_IS_ALREADY_A_MEMBER_OF_THIS_ORGANIZATION: "That person is already on your team.",
  USER_IS_ALREADY_INVITED_TO_THIS_ORGANIZATION: "That email already has a pending invitation. Resend it from the list below.",
  INVITATION_LIMIT_REACHED: "You've reached the limit for pending invitations. Cancel a few and try again.",
  YOU_ARE_NOT_ALLOWED_TO_INVITE_USERS_TO_THIS_ORGANIZATION: "You don't have permission to invite people.",
  YOU_ARE_NOT_ALLOWED_TO_CANCEL_THIS_INVITATION: "You don't have permission to cancel this invitation.",
  INVITATION_NOT_FOUND: "This invitation is no longer valid. Ask for a new one.",
  YOU_ARE_NOT_THE_RECIPIENT_OF_THE_INVITATION: "This invitation was sent to a different email address.",
  EMAIL_VERIFICATION_REQUIRED_BEFORE_ACCEPTING_OR_REJECTING_INVITATION: "Confirm your email address before accepting.",
  ORGANIZATION_MEMBERSHIP_LIMIT_REACHED: "This team is full.",
  YOU_CANNOT_LEAVE_THE_ORGANIZATION_AS_THE_ONLY_OWNER: "The company owner can't be removed.",
  YOU_CANNOT_LEAVE_THE_ORGANIZATION_WITHOUT_AN_OWNER: "The company needs an owner.",
};

function toActionError(error: unknown, fallback: string): never {
  if (error instanceof ActionError) throw error;
  if (error instanceof APIError) {
    const code = (error.body as { code?: string } | undefined)?.code;
    throw new ActionError((code && friendly[code]) || error.body?.message || fallback);
  }
  log.error("team operation failed", { scope: "team", err: error });
  throw new ActionError(fallback);
}

export function canManageTeam(actor: Pick<Actor, "orgRole">) {
  return actor.orgRole === "owner";
}

export function canInvite(actor: Pick<Actor, "orgRole">, role: InviteRole) {
  return actor.orgRole === "owner" || (actor.orgRole === "dispatcher" && role === "driver");
}

function staffOrg(actor: Actor) {
  if (!actor.orgId || (actor.orgRole !== "owner" && actor.orgRole !== "dispatcher")) throw new ActionError("Only carrier owners and dispatchers can manage the team.");
  return actor.orgId;
}

export async function teamFor(orgId: string) {
  const [members, invitations] = await Promise.all([
    db
      .select({
        memberId: member.id,
        userId: user.id,
        role: member.role,
        joinedAt: member.createdAt,
        name: user.name,
        email: user.email,
        phone: user.phone,
        image: user.image,
        activeTrips: sql<number>`(select count(*)::int from ${load} where ${load.driverId} = ${user.id} and ${load.carrierOrgId} = ${orgId} and ${load.status} in ('assigned','en_route_to_pickup','in_transit'))`,
      })
      .from(member)
      .innerJoin(user, eq(user.id, member.userId))
      .where(eq(member.organizationId, orgId))
      .orderBy(sql`case ${member.role} when 'owner' then 0 when 'dispatcher' then 1 else 2 end`, asc(user.name)),
    db
      .select({ id: invitation.id, email: invitation.email, role: invitation.role, expiresAt: invitation.expiresAt, createdAt: invitation.createdAt, inviterName: user.name })
      .from(invitation)
      .innerJoin(user, eq(user.id, invitation.inviterId))
      .where(and(eq(invitation.organizationId, orgId), eq(invitation.status, "pending"), gt(invitation.expiresAt, new Date())))
      .orderBy(desc(invitation.createdAt)),
  ]);
  return { members: members.map((m) => ({ ...m, role: m.role as TeamRole })), invitations: invitations.map((i) => ({ ...i, role: (i.role ?? "driver") as InviteRole })) };
}

export type Team = Awaited<ReturnType<typeof teamFor>>;

export async function inviteMember(actor: Actor, email: string, role: InviteRole) {
  const orgId = staffOrg(actor);
  if (!canInvite(actor, role)) throw new ActionError("Dispatchers can invite drivers. Ask the owner to add another dispatcher.");
  const normalized = email.trim().toLowerCase();
  if (normalized === actor.email.toLowerCase()) throw new ActionError("You're already on the team.");
  const [existing] = await db
    .select({ orgId: member.organizationId })
    .from(user)
    .innerJoin(member, eq(member.userId, user.id))
    .where(eq(user.email, normalized))
    .limit(1);
  if (existing && existing.orgId !== orgId) throw new ActionError("That person already belongs to another carrier on AllShip AI.");
  try {
    await auth.api.createInvitation({ body: { email: normalized, role, organizationId: orgId }, headers: await headers() });
  } catch (error) {
    toActionError(error, "We couldn't send the invitation. Try again.");
  }
}

async function pendingInvitation(orgId: string, invitationId: string) {
  const [row] = await db
    .select()
    .from(invitation)
    .where(and(eq(invitation.id, invitationId), eq(invitation.organizationId, orgId), eq(invitation.status, "pending")))
    .limit(1);
  if (!row) throw new ActionError("This invitation was already accepted or cancelled.");
  return row;
}

export async function resendInvitation(actor: Actor, invitationId: string) {
  const orgId = staffOrg(actor);
  const row = await pendingInvitation(orgId, invitationId);
  const role = (row.role ?? "driver") as InviteRole;
  if (!canInvite(actor, role)) throw new ActionError("Only the owner can resend this invitation.");
  try {
    await auth.api.createInvitation({ body: { email: row.email, role, organizationId: orgId, resend: true }, headers: await headers() });
  } catch (error) {
    toActionError(error, "We couldn't resend the invitation. Try again.");
  }
}

export async function cancelInvitation(actor: Actor, invitationId: string) {
  const orgId = staffOrg(actor);
  const row = await pendingInvitation(orgId, invitationId);
  if (!canInvite(actor, (row.role ?? "driver") as InviteRole)) throw new ActionError("Only the owner can cancel this invitation.");
  try {
    await auth.api.cancelInvitation({ body: { invitationId }, headers: await headers() });
  } catch (error) {
    toActionError(error, "We couldn't cancel the invitation. Try again.");
  }
}

async function targetMember(orgId: string, memberId: string) {
  const [row] = await db
    .select({ id: member.id, userId: member.userId, role: member.role, name: user.name })
    .from(member)
    .innerJoin(user, eq(user.id, member.userId))
    .where(and(eq(member.id, memberId), eq(member.organizationId, orgId)))
    .limit(1);
  if (!row) throw new ActionError("That person isn't on your team anymore.");
  return row;
}

export async function removeMember(actor: Actor, memberId: string) {
  const orgId = staffOrg(actor);
  if (!canManageTeam(actor)) throw new ActionError("Only the company owner can remove people.");
  const target = await targetMember(orgId, memberId);
  if (target.role === "owner") throw new ActionError("The company owner can't be removed.");
  const [busy] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(load)
    .where(and(eq(load.driverId, target.userId), eq(load.carrierOrgId, orgId), sql`${load.status} in ('en_route_to_pickup','in_transit')`));
  if ((busy?.n ?? 0) > 0) throw new ActionError(`${target.name} is on an active trip. Reassign or finish it first.`);
  try {
    await auth.api.removeMember({ body: { memberIdOrEmail: memberId, organizationId: orgId }, headers: await headers() });
  } catch (error) {
    toActionError(error, "We couldn't remove this person. Try again.");
  }
  await db
    .update(load)
    .set({ driverId: null })
    .where(and(eq(load.driverId, target.userId), eq(load.carrierOrgId, orgId), eq(load.status, "assigned")));
  return target;
}

export async function updateMemberRole(actor: Actor, memberId: string, role: InviteRole) {
  const orgId = staffOrg(actor);
  if (!canManageTeam(actor)) throw new ActionError("Only the company owner can change roles.");
  const target = await targetMember(orgId, memberId);
  if (target.role === "owner") throw new ActionError("The owner's role can't be changed here.");
  if (target.role === role) return;
  try {
    await auth.api.updateMemberRole({ body: { memberId, role, organizationId: orgId }, headers: await headers() });
  } catch (error) {
    toActionError(error, "We couldn't change the role. Try again.");
  }
}

export async function invitationPreview(invitationId: string) {
  const [row] = await db
    .select({
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
      organizationId: invitation.organizationId,
      companyName: organization.name,
      inviterName: user.name,
    })
    .from(invitation)
    .innerJoin(organization, eq(organization.id, invitation.organizationId))
    .innerJoin(user, eq(user.id, invitation.inviterId))
    .where(eq(invitation.id, invitationId))
    .limit(1);
  if (!row) return null;
  const state = row.status !== "pending" ? (row.status === "accepted" ? "accepted" : "cancelled") : row.expiresAt < new Date() ? "expired" : "pending";
  return { ...row, role: (row.role ?? "driver") as InviteRole, state: state as "pending" | "accepted" | "cancelled" | "expired" };
}

export type InvitationPreview = NonNullable<Awaited<ReturnType<typeof invitationPreview>>>;

export async function acceptInvitation(userId: string, invitationId: string) {
  const preview = await invitationPreview(invitationId);
  if (!preview || preview.state !== "pending") throw new ActionError("This invitation is no longer valid. Ask for a new one.");
  const [account] = await db
    .select({ email: user.email, accountType: user.accountType, orgId: member.organizationId })
    .from(user)
    .leftJoin(member, eq(member.userId, user.id))
    .where(eq(user.id, userId))
    .limit(1);
  if (!account) throw new ActionError("Your account is not available.");
  if (account.email.toLowerCase() !== preview.email.toLowerCase()) throw new ActionError(`This invitation was sent to ${preview.email}. Sign in with that email to accept it.`);
  if (account.orgId === preview.organizationId) return { role: preview.role, alreadyMember: true };
  if (account.orgId) throw new ActionError("You already belong to a carrier team. Leave it before joining another one.");
  if (account.accountType === "shipper") {
    const [posted] = await db.select({ n: sql<number>`count(*)::int` }).from(load).where(eq(load.shipperId, userId));
    if ((posted?.n ?? 0) > 0) throw new ActionError("This account is used for shipping. Create a separate account with a different email to join a carrier team.");
  }
  try {
    await auth.api.acceptInvitation({ body: { invitationId }, headers: await headers() });
  } catch (error) {
    toActionError(error, "We couldn't accept the invitation. Try again.");
  }
  await db
    .update(user)
    .set({ accountType: "carrier", onboardingCompletedAt: sql`coalesce(${user.onboardingCompletedAt}, now())` })
    .where(eq(user.id, userId));
  return { role: preview.role, alreadyMember: false };
}
