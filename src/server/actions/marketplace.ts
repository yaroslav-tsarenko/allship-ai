"use server";

import { and, desc, eq } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { bidInputSchema, loadInputSchema } from "@/features/loads/schema";
import { assertAdmin, assertCarrierStaff, getActor } from "@/server/actor";
import { acceptBid, placeBid, withdrawBid } from "@/server/bids/service";
import { db } from "@/server/db/client";
import { auditLog, carrierProfile, lead } from "@/server/db/schema";
import { cancelLoad, createLoad, relistLoad, updateDraft } from "@/server/loads/service";
import { notifyUsers, orgStaffIds } from "@/server/notifications/notify";
import { confirmSimulatedPayment, createConnectDashboardLink, createConnectOnboardingLink, refreshConnectedAccount } from "@/server/payments/escrow";
import { consumeRateLimit } from "@/server/rate-limit";
import { chargeSquare } from "@/server/square/payments";
import { refreshCarrierActivation, safely } from "@/server/nurture";
import { ActionError, authedAction } from "./safe-action";

const withActor = authedAction.use(async ({ next, ctx }) => next({ ctx: { ...ctx, actor: await getActor(ctx.user.id) } }));

export const saveLoadAction = withActor
  .inputSchema(z.object({ loadId: z.uuid().optional(), data: z.custom<z.input<typeof loadInputSchema>>() }))
  .action(async ({ parsedInput, ctx }) => {
    if (!(await consumeRateLimit(`load-save:${ctx.actor.userId}`, 60, 3600))) throw new ActionError("You're saving loads too quickly. Wait a few minutes.");
    const result = parsedInput.loadId ? await updateDraft(ctx.actor, parsedInput.loadId, parsedInput.data) : await createLoad(ctx.actor, parsedInput.data);
    revalidatePath("/app/loads");
    revalidatePath("/loads");
    revalidateTag("open-loads", "max");
    return { publicId: result.publicId };
  });

export const cancelLoadAction = withActor
  .inputSchema(z.object({ loadId: z.uuid(), reason: z.string().trim().min(3, "Tell carriers why").max(500) }))
  .action(async ({ parsedInput, ctx }) => {
    await cancelLoad(ctx.actor, parsedInput.loadId, parsedInput.reason);
    revalidatePath("/app/loads", "layout");
  revalidateTag("open-loads", "max");
    return { ok: true };
  });

export const relistLoadAction = withActor
  .inputSchema(z.object({ loadId: z.uuid(), biddingDays: z.number().int().min(1).max(14).default(5) }))
  .action(async ({ parsedInput, ctx }) => {
    await relistLoad(ctx.actor, parsedInput.loadId, parsedInput.biddingDays);
    revalidatePath("/app/loads", "layout");
  revalidateTag("open-loads", "max");
    return { ok: true };
  });

export const placeBidAction = withActor.inputSchema(bidInputSchema).action(async ({ parsedInput, ctx }) => {
  if (!(await consumeRateLimit(`bid:${ctx.actor.userId}`, 30, 3600))) throw new ActionError("Too many bids in a short time. Try again later.");
  const result = await placeBid(ctx.actor, parsedInput);
  revalidatePath("/app/board", "layout");
  revalidatePath("/app/bids");
  return result;
});

export const withdrawBidAction = withActor.inputSchema(z.object({ bidId: z.uuid() })).action(async ({ parsedInput, ctx }) => {
  await withdrawBid(ctx.actor, parsedInput.bidId);
  revalidatePath("/app/bids");
  revalidatePath("/app/board", "layout");
  return { ok: true };
});

export const acceptBidAction = withActor.inputSchema(z.object({ bidId: z.uuid() })).action(async ({ parsedInput, ctx }) => {
  const result = await acceptBid(ctx.actor, parsedInput.bidId);
  revalidatePath("/app/loads", "layout");
  revalidateTag("open-loads", "max");
  return { simulated: result.simulated, square: result.square, paymentId: result.paymentId, clientSecret: result.clientSecret, totalCents: result.amounts.shipperTotalCents, feeCents: result.amounts.platformFeeCents, carrierCents: result.amounts.carrierAmountCents || result.amounts.balanceCents, balanceCents: result.amounts.balanceCents };
});

export const confirmSimulatedPaymentAction = withActor.inputSchema(z.object({ paymentId: z.uuid() })).action(async ({ parsedInput, ctx }) => {
  await confirmSimulatedPayment(ctx.actor, parsedInput.paymentId);
  revalidatePath("/app/loads", "layout");
  revalidateTag("open-loads", "max");
  return { ok: true };
});

export const paySquareAction = withActor.inputSchema(z.object({ paymentId: z.uuid(), sourceId: z.string().min(8).max(512) })).action(async ({ parsedInput, ctx }) => {
  if (!(await consumeRateLimit(`square-pay:${ctx.actor.userId}`, 10, 900))) throw new ActionError("Too many payment attempts. Wait a few minutes and try again.");
  const result = await chargeSquare(ctx.actor, parsedInput.paymentId, parsedInput.sourceId);
  revalidatePath("/app/loads", "layout");
  revalidateTag("open-loads", "max");
  return result;
});

export const startPayoutOnboardingAction = withActor.action(async ({ ctx }) => {
  const orgId = assertCarrierStaff(ctx.actor);
  if (ctx.actor.orgRole !== "owner") throw new ActionError("Only the company owner can set up payouts.");
  return { url: await createConnectOnboardingLink(orgId) };
});

export const openPayoutDashboardAction = withActor.action(async ({ ctx }) => {
  const orgId = assertCarrierStaff(ctx.actor);
  if (ctx.actor.orgRole !== "owner") throw new ActionError("Only the company owner can open the payout dashboard.");
  return { url: await createConnectDashboardLink(orgId) };
});

export const refreshPayoutStatusAction = withActor.action(async ({ ctx }) => {
  const orgId = assertCarrierStaff(ctx.actor);
  await refreshConnectedAccount(orgId);
  revalidatePath("/app/payouts");
  return { ok: true };
});

export const getMyQuoteLeadAction = withActor.action(async ({ ctx }) => {
  const [row] = await db
    .select({ id: lead.id, payload: lead.payload, createdAt: lead.createdAt })
    .from(lead)
    .where(and(eq(lead.email, ctx.actor.email), eq(lead.type, "quote"), eq(lead.status, "new")))
    .orderBy(desc(lead.createdAt))
    .limit(1);
  return row ?? null;
});

export const setCarrierVerificationAction = withActor
  .inputSchema(z.object({ orgId: z.string().min(1).max(100), status: z.enum(["verified", "failed", "manual_review"]), note: z.string().trim().max(500).optional() }))
  .action(async ({ parsedInput, ctx }) => {
    assertAdmin(ctx.actor);
    await db.update(carrierProfile).set({ fmcsaStatus: parsedInput.status, fmcsaCheckedAt: new Date() }).where(eq(carrierProfile.orgId, parsedInput.orgId));
    await db.insert(auditLog).values({ actorId: ctx.actor.userId, action: "carrier.verification", entity: "carrier_profile", entityId: parsedInput.orgId, diff: { status: parsedInput.status, note: parsedInput.note ?? null } });
    if (parsedInput.status === "verified") await safely("carrier verified", () => refreshCarrierActivation(parsedInput.orgId));
    if (parsedInput.status !== "manual_review") {
      await notifyUsers(await orgStaffIds(parsedInput.orgId), {
        type: "carrier_verification",
        title: parsedInput.status === "verified" ? "Your company is verified" : "We couldn't verify your company",
        body: parsedInput.status === "verified" ? "Your USDOT and MC record checked out. You can bid on open loads now." : (parsedInput.note ?? "Check your USDOT number and legal name, then contact support."),
        href: parsedInput.status === "verified" ? "/app/board" : "/app/settings",
        email: { subject: parsedInput.status === "verified" ? "You're verified on AllShip AI" : "Verification needs attention", actionLabel: parsedInput.status === "verified" ? "Find loads" : "Review details" },
      });
    }
    revalidatePath("/admin", "layout");
    return { ok: true };
  });
