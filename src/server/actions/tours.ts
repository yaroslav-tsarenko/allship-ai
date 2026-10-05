"use server";

import { z } from "zod";
import { tourIds } from "@/features/tours/ids";
import { getActor } from "@/server/actor";
import { completedTourIds, markTourCompleted, tourTarget } from "@/server/tours/progress";
import { authedAction } from "./safe-action";

const tourInput = z.object({ tourId: z.enum(tourIds) });

export const completeTourAction = authedAction.inputSchema(tourInput).action(async ({ parsedInput, ctx }) => {
  await markTourCompleted(ctx.user.id, parsedInput.tourId);
  return { ok: true };
});

export const completedToursAction = authedAction.action(async ({ ctx }) => completedTourIds(ctx.user.id));

export const tourTargetAction = authedAction.inputSchema(tourInput).action(async ({ parsedInput, ctx }) => {
  const actor = await getActor(ctx.user.id);
  return { path: await tourTarget(actor, parsedInput.tourId) };
});
