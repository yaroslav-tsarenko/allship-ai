"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { addDriverSchema } from "@/features/fleet/schema";
import { getActor } from "@/server/actor";
import { fleetSnapshot } from "@/server/fleet/queries";
import { addDriver, resendDriverSetup } from "@/server/fleet/service";
import { consumeRateLimit } from "@/server/rate-limit";
import { removeMember } from "@/server/team/service";
import { ActionError, authedAction } from "./safe-action";

const withActor = authedAction.use(async ({ next, ctx }) =>
  next({ ctx: { ...ctx, actor: await getActor(ctx.user.id) } }),
);

function refresh() {
  revalidatePath("/app/team");
  revalidatePath("/app/fleet", "layout");
}

export const addDriverAction = withActor.inputSchema(addDriverSchema).action(async ({ parsedInput, ctx }) => {
  if (!(await consumeRateLimit(`fleet-add:${ctx.actor.userId}`, 20, 3600)))
    throw new ActionError("You've added a lot of drivers in the last hour. Try again later.");
  const result = await addDriver(ctx.actor, parsedInput);
  refresh();
  return result;
});

export const resendDriverSetupAction = withActor
  .inputSchema(z.object({ userId: z.string().min(1).max(100) }))
  .action(async ({ parsedInput, ctx }) => {
    if (!(await consumeRateLimit(`fleet-setup:${ctx.actor.userId}`, 10, 3600)))
      throw new ActionError("Too many setup emails. Try again in an hour.");
    return resendDriverSetup(ctx.actor, parsedInput.userId);
  });

export const removeDriverAction = withActor
  .inputSchema(z.object({ memberId: z.string().min(1).max(100) }))
  .action(async ({ parsedInput, ctx }) => {
    const removed = await removeMember(ctx.actor, parsedInput.memberId);
    refresh();
    revalidatePath("/app/trips", "layout");
    return { name: removed.name };
  });

export const fleetSnapshotAction = withActor.action(async ({ ctx }) => fleetSnapshot(ctx.actor));
