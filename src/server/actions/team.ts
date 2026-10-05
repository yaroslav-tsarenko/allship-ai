"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getActor } from "@/server/actor";
import { consumeRateLimit } from "@/server/rate-limit";
import { acceptInvitation, cancelInvitation, inviteMember, removeMember, resendInvitation, updateMemberRole } from "@/server/team/service";
import { ActionError, authedAction } from "./safe-action";

const withActor = authedAction.use(async ({ next, ctx }) => next({ ctx: { ...ctx, actor: await getActor(ctx.user.id) } }));
const inviteRole = z.enum(["dispatcher", "driver"]);

function refresh() {
  revalidatePath("/app/team");
}

export const inviteMemberAction = withActor
  .inputSchema(z.object({ email: z.email("Enter a valid email address").max(254), role: inviteRole }))
  .action(async ({ parsedInput, ctx }) => {
    if (!(await consumeRateLimit(`invite:${ctx.actor.userId}`, 30, 3600))) throw new ActionError("Too many invitations. Try again in an hour.");
    await inviteMember(ctx.actor, parsedInput.email, parsedInput.role);
    refresh();
    return { ok: true };
  });

export const resendInvitationAction = withActor.inputSchema(z.object({ invitationId: z.string().min(1).max(100) })).action(async ({ parsedInput, ctx }) => {
  if (!(await consumeRateLimit(`invite:${ctx.actor.userId}`, 30, 3600))) throw new ActionError("Too many invitations. Try again in an hour.");
  await resendInvitation(ctx.actor, parsedInput.invitationId);
  refresh();
  return { ok: true };
});

export const cancelInvitationAction = withActor.inputSchema(z.object({ invitationId: z.string().min(1).max(100) })).action(async ({ parsedInput, ctx }) => {
  await cancelInvitation(ctx.actor, parsedInput.invitationId);
  refresh();
  return { ok: true };
});

export const removeMemberAction = withActor.inputSchema(z.object({ memberId: z.string().min(1).max(100) })).action(async ({ parsedInput, ctx }) => {
  const removed = await removeMember(ctx.actor, parsedInput.memberId);
  refresh();
  revalidatePath("/app/trips", "layout");
  return { name: removed.name };
});

export const updateMemberRoleAction = withActor.inputSchema(z.object({ memberId: z.string().min(1).max(100), role: inviteRole })).action(async ({ parsedInput, ctx }) => {
  await updateMemberRole(ctx.actor, parsedInput.memberId, parsedInput.role);
  refresh();
  return { ok: true };
});

export const acceptInvitationAction = authedAction.inputSchema(z.object({ invitationId: z.string().min(1).max(100) })).action(async ({ parsedInput, ctx }) => {
  const result = await acceptInvitation(ctx.user.id, parsedInput.invitationId);
  revalidatePath("/app", "layout");
  return { redirectTo: result.role === "driver" ? "/app/trips" : "/app/board" };
});
