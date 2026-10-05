"use server";

import { z } from "zod";
import { partnerLogoInput, testimonialInput } from "@/features/admin/showcase/schema";
import { getActor } from "@/server/actor";
import { deletePartnerLogo, deleteTestimonial, savePartnerLogo, saveTestimonial } from "@/server/showcase/admin";
import { ActionError, authedAction } from "./safe-action";

const adminAction = authedAction.use(async ({ next, ctx }) => {
  const actor = await getActor(ctx.user.id);
  if (!actor.isAdmin) throw new ActionError(ctx.user.role === "admin" ? "Turn on two-step verification to edit the showcase." : "Admins only.");
  return next({ ctx: { ...ctx, actor } });
});

export const saveTestimonialAction = adminAction.inputSchema(testimonialInput).action(async ({ parsedInput, ctx }) => {
  const row = await saveTestimonial(ctx.actor.userId, parsedInput);
  if (!row) throw new ActionError("This review no longer exists.");
  return row;
});

export const deleteTestimonialAction = adminAction.inputSchema(z.object({ id: z.uuid() })).action(async ({ parsedInput, ctx }) => {
  await deleteTestimonial(ctx.actor.userId, parsedInput.id);
  return { ok: true };
});

export const savePartnerLogoAction = adminAction.inputSchema(partnerLogoInput).action(async ({ parsedInput, ctx }) => {
  const row = await savePartnerLogo(ctx.actor.userId, parsedInput);
  if (!row) throw new ActionError("This logo no longer exists.");
  return row;
});

export const deletePartnerLogoAction = adminAction.inputSchema(z.object({ id: z.uuid() })).action(async ({ parsedInput, ctx }) => {
  await deletePartnerLogo(ctx.actor.userId, parsedInput.id);
  return { ok: true };
});
