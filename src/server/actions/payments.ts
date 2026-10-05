"use server";

import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getActor } from "@/server/actor";
import { db } from "@/server/db/client";
import { load } from "@/server/db/schema";
import { getPendingPayment } from "@/server/payments/queries";
import { ActionError, authedAction } from "./safe-action";

export const resumePaymentAction = authedAction.inputSchema(z.object({ loadId: z.uuid() })).action(async ({ parsedInput, ctx }) => {
  const actor = await getActor(ctx.user.id);
  const [row] = await db.select({ id: load.id }).from(load).where(and(eq(load.id, parsedInput.loadId), eq(load.shipperId, actor.userId))).limit(1);
  if (!row) throw new ActionError("Load not found.");
  const pending = await getPendingPayment(actor, row.id);
  if (!pending) throw new ActionError("There's no payment waiting on this load. Refresh the page.");
  return {
    simulated: pending.simulated,
    paymentId: pending.paymentId,
    clientSecret: pending.clientSecret,
    totalCents: pending.totalCents,
    feeCents: pending.feeCents,
    carrierCents: pending.carrierCents,
    carrierName: pending.carrierName,
  };
});
