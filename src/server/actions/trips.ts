"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertAdmin, getActor } from "@/server/actor";
import { cancelBookedWithRefund, openDispute, resolveDispute, withdrawDispute } from "@/server/disputes/service";
import { sendTransfer } from "@/server/payments/payouts";
import { consumeRateLimit } from "@/server/rate-limit";
import { createReview, replyToReview } from "@/server/reviews/service";
import { ALLOWED_UPLOAD_TYPES, MAX_UPLOAD_BYTES, createUploadTarget } from "@/server/storage/storage";
import { loadWithRole } from "@/server/trips/access";
import { assignDriver, confirmCompletion, confirmDelivery, confirmPickup, recordLocation, startTrip } from "@/server/trips/service";
import { ActionError, authedAction } from "./safe-action";

const withActor = authedAction.use(async ({ next, ctx }) => next({ ctx: { ...ctx, actor: await getActor(ctx.user.id) } }));

function refresh() {
  revalidatePath("/app", "layout");
  revalidatePath("/admin", "layout");
}

const loadRef = z.object({ loadId: z.uuid() });
const keys = z.array(z.string().min(1).max(300)).max(12);

export const requestUploadAction = withActor
  .inputSchema(
    z.object({
      loadId: z.uuid(),
      purpose: z.enum(["pickup", "delivery", "signature", "dispute", "chat"]),
      contentType: z.enum(ALLOWED_UPLOAD_TYPES),
      size: z.number().int().positive().max(MAX_UPLOAD_BYTES, "Files must be 15 MB or smaller."),
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    if (!(await consumeRateLimit(`upload:${ctx.actor.userId}`, 120, 3600))) throw new ActionError("Too many uploads. Try again later.");
    const { load } = await loadWithRole(ctx.actor, parsedInput.loadId);
    try {
      return await createUploadTarget(`loads/${load.id}/${parsedInput.purpose}`, parsedInput.contentType);
    } catch {
      throw new ActionError("Uploads aren't available right now.");
    }
  });

export const assignDriverAction = withActor.inputSchema(z.object({ loadId: z.uuid(), driverId: z.string().min(1).max(100) })).action(async ({ parsedInput, ctx }) => {
  await assignDriver(ctx.actor, parsedInput.loadId, parsedInput.driverId);
  refresh();
  return { ok: true };
});

export const startTripAction = withActor.inputSchema(loadRef).action(async ({ parsedInput, ctx }) => {
  await startTrip(ctx.actor, parsedInput.loadId);
  refresh();
  return { ok: true };
});

export const confirmPickupAction = withActor.inputSchema(z.object({ loadId: z.uuid(), photoKeys: keys, note: z.string().trim().max(1000).optional() })).action(async ({ parsedInput, ctx }) => {
  await confirmPickup(ctx.actor, parsedInput.loadId, parsedInput.photoKeys, parsedInput.note);
  refresh();
  return { ok: true };
});

export const confirmDeliveryAction = withActor
  .inputSchema(
    z.object({
      loadId: z.uuid(),
      recipientName: z.string().trim().min(2, "Who received the shipment?").max(120),
      photoKeys: keys,
      signatureKey: z.string().max(300).optional(),
      note: z.string().trim().max(1000).optional(),
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    await confirmDelivery(ctx.actor, parsedInput.loadId, parsedInput);
    refresh();
    return { ok: true };
  });

export const recordLocationAction = withActor
  .inputSchema(
    z.object({
      loadId: z.uuid(),
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
      accuracyM: z.number().min(0).max(100_000).optional(),
      headingDeg: z.number().min(0).max(360).nullable().optional(),
      speedMph: z.number().min(0).max(200).nullable().optional(),
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    if (!(await consumeRateLimit(`loc:${ctx.actor.userId}`, 240, 3600))) return { stored: false as const, reason: "rate_limited" };
    return recordLocation(ctx.actor, parsedInput.loadId, parsedInput);
  });

export const confirmCompletionAction = withActor.inputSchema(loadRef).action(async ({ parsedInput, ctx }) => {
  await confirmCompletion(ctx.actor, parsedInput.loadId);
  refresh();
  return { ok: true };
});

export const openDisputeAction = withActor
  .inputSchema(
    z.object({
      loadId: z.uuid(),
      reason: z.enum(["damage", "not_delivered", "late", "missing_items", "overcharge", "no_show", "other"]),
      details: z.string().trim().min(30, "Describe what happened in at least 30 characters.").max(4000),
      evidence: keys.optional(),
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    const created = await openDispute(ctx.actor, parsedInput.loadId, parsedInput);
    refresh();
    return { id: created.id };
  });

export const withdrawDisputeAction = withActor.inputSchema(z.object({ disputeId: z.uuid() })).action(async ({ parsedInput, ctx }) => {
  await withdrawDispute(ctx.actor, parsedInput.disputeId);
  refresh();
  return { ok: true };
});

export const resolveDisputeAction = withActor
  .inputSchema(z.object({ disputeId: z.uuid(), outcome: z.enum(["release", "refund", "split"]), refundCents: z.number().int().min(0).max(100_000_000).optional(), resolution: z.string().trim().min(10).max(2000) }))
  .action(async ({ parsedInput, ctx }) => {
    await resolveDispute(ctx.actor, parsedInput.disputeId, parsedInput);
    refresh();
    return { ok: true };
  });

export const cancelBookedAction = withActor
  .inputSchema(z.object({ loadId: z.uuid(), reason: z.string().trim().min(10).max(500), keepCents: z.number().int().min(0).max(100_000_000).default(0) }))
  .action(async ({ parsedInput, ctx }) => {
    await cancelBookedWithRefund(ctx.actor, parsedInput.loadId, parsedInput.reason, parsedInput.keepCents);
    refresh();
    return { ok: true };
  });

export const retryPayoutAction = withActor.inputSchema(z.object({ payoutId: z.uuid() })).action(async ({ parsedInput, ctx }) => {
  assertAdmin(ctx.actor);
  const result = await sendTransfer(parsedInput.payoutId);
  refresh();
  return { paid: result?.status === "paid" };
});

export const createReviewAction = withActor.inputSchema(z.object({ loadId: z.uuid(), rating: z.number().int().min(1).max(5), body: z.string().trim().max(2000).optional() })).action(async ({ parsedInput, ctx }) => {
  await createReview(ctx.actor, parsedInput.loadId, parsedInput);
  refresh();
  return { ok: true };
});

export const replyToReviewAction = withActor.inputSchema(z.object({ reviewId: z.uuid(), reply: z.string().trim().min(2).max(1000) })).action(async ({ parsedInput, ctx }) => {
  await replyToReview(ctx.actor, parsedInput.reviewId, parsedInput.reply);
  refresh();
  return { ok: true };
});
