import "server-only";
import { randomUUID } from "node:crypto";
import { and, eq, inArray, lt } from "drizzle-orm";
import type Stripe from "stripe";
import { env } from "@/env";
import { formatUsd } from "@/lib/money";
import { ActionError } from "@/server/actions/safe-action";
import type { Actor } from "@/server/actor";
import { db } from "@/server/db/client";
import { bid, carrierProfile, conversation, ledgerEntry, load, loadEvent, organization, payment } from "@/server/db/schema";
import { transitionLoad } from "@/server/loads/service";
import { notifyUsers, orgStaffIds } from "@/server/notifications/notify";
import { notifyAdmins } from "@/server/notify/telegram";
import { sendInvoice } from "./invoice";
import { bookingAmounts } from "@/lib/deposit";
import { getStripe, simulatedPayments } from "./stripe";
import { refreshCarrierActivation, safely, setEnrollmentStatus } from "@/server/nurture";

type LoadRow = typeof load.$inferSelect;
type BidRow = typeof bid.$inferSelect;

export const PAYMENT_WINDOW_MINUTES = 30;

export async function createPaymentForBid(actor: Actor, target: LoadRow, chosen: BidRow) {
  const stripe = getStripe();
  if (!stripe && !simulatedPayments()) throw new ActionError("Payments are not available right now. Try again later or contact support.");

  const [carrier] = await db.select({ payoutsEnabled: carrierProfile.payoutsEnabled }).from(carrierProfile).where(eq(carrierProfile.orgId, chosen.carrierOrgId)).limit(1);
  if (stripe && !carrier?.payoutsEnabled) throw new ActionError("This carrier hasn't finished setting up payouts yet. Choose another bid or message them.");

  const [existing] = await db
    .select()
    .from(payment)
    .where(and(eq(payment.loadId, target.id), eq(payment.bidId, chosen.id), inArray(payment.status, ["requires_payment", "processing"])))
    .limit(1);

  const booking = bookingAmounts(target.category, chosen.amountCents, env.PLATFORM_FEE_BPS);
  const amounts = { shipperTotalCents: booking.dueNowCents, platformFeeCents: booking.feeCents, carrierAmountCents: booking.escrowCarrierCents, balanceCents: booking.onDeliveryCents };

  const paymentRow =
    existing ??
    (await db.transaction(async (tx) => {
      const [fresh] = await tx.select({ status: bid.status }).from(bid).where(eq(bid.id, chosen.id)).limit(1).for("update");
      if (fresh?.status !== "active") throw new ActionError("This bid is no longer available.");
      if (target.status === "open") {
        await transitionLoad(tx, target, "awaiting_payment", { kind: "shipper", userId: actor.userId }, { acceptedBidId: chosen.id }, { bidId: chosen.id });
      }
      const [created] = await tx
        .insert(payment)
        .values({
          loadId: target.id,
          bidId: chosen.id,
          shipperId: actor.userId,
          amountCents: amounts.shipperTotalCents,
          carrierAmountCents: amounts.carrierAmountCents,
          platformFeeCents: amounts.platformFeeCents,
        })
        .returning();
      return created!;
    }));

  if (!stripe) return { simulated: true as const, paymentId: paymentRow.id, clientSecret: null, amounts };

  let intent: Stripe.PaymentIntent;
  if (paymentRow.stripePaymentIntentId) {
    intent = await stripe.paymentIntents.retrieve(paymentRow.stripePaymentIntentId);
  } else {
    intent = await stripe.paymentIntents.create(
      {
        amount: amounts.shipperTotalCents,
        currency: "usd",
        automatic_payment_methods: { enabled: true },
        transfer_group: target.id,
        receipt_email: actor.email,
        description: `AllShip ${target.publicId}: ${target.title}`,
        statement_descriptor_suffix: target.publicId.replace("AS-", "AS"),
        metadata: { loadId: target.id, bidId: chosen.id, paymentId: paymentRow.id, publicId: target.publicId },
      },
      { idempotencyKey: `pi-${paymentRow.id}` },
    );
    await db.update(payment).set({ stripePaymentIntentId: intent.id }).where(eq(payment.id, paymentRow.id));
  }
  return { simulated: false as const, paymentId: paymentRow.id, clientSecret: intent.client_secret, amounts };
}

export async function markPaymentSucceeded(ref: { paymentIntentId?: string; paymentId?: string; chargeId?: string | null }) {
  const where = ref.paymentIntentId ? eq(payment.stripePaymentIntentId, ref.paymentIntentId) : eq(payment.id, ref.paymentId ?? "");
  const outcome = await db.transaction(async (tx) => {
    const [p] = await tx.select().from(payment).where(where).limit(1).for("update");
    if (!p) return null;
    if (p.status === "succeeded") return null;
    const [l] = await tx.select().from(load).where(eq(load.id, p.loadId)).limit(1).for("update");
    const [b] = await tx.select().from(bid).where(eq(bid.id, p.bidId)).limit(1);
    if (!l || !b) return null;
    await tx.update(payment).set({ status: "succeeded", stripeChargeId: ref.chargeId ?? p.stripeChargeId }).where(eq(payment.id, p.id));
    const journalId = randomUUID();
    await tx.insert(ledgerEntry).values([
      { journalId, account: "shipper_cash", amountCents: -p.amountCents, refType: "payment", refId: p.id, memo: `Paid ${l.publicId}` },
      { journalId, account: "escrow", amountCents: p.amountCents, refType: "payment", refId: p.id, memo: `Held for ${l.publicId}` },
    ]);
    const supersededBid = l.status === "awaiting_payment" && l.acceptedBidId !== null && l.acceptedBidId !== b.id;
    if (supersededBid || (b.status !== "active" && b.status !== "accepted")) {
      await tx.insert(loadEvent).values({ loadId: l.id, type: "payment_after_close", payload: { paymentId: p.id, status: l.status, bidStatus: b.status } });
      return { load: l, bid: b, payment: p, declined: [], conversationId: null, orphaned: true };
    }
    if (l.status === "awaiting_payment" || l.status === "open") {
      const current = l.status === "open" ? await (async () => {
        await transitionLoad(tx, l, "awaiting_payment", { kind: "system", userId: null }, { acceptedBidId: b.id });
        return { ...l, status: "awaiting_payment" as const };
      })() : l;
      await transitionLoad(tx, current, "booked", { kind: "system", userId: null }, { carrierOrgId: b.carrierOrgId, acceptedBidId: b.id }, { paymentId: p.id });
    } else {
      await tx.insert(loadEvent).values({ loadId: l.id, type: "payment_after_close", payload: { paymentId: p.id, status: l.status } });
    }
    await tx.update(bid).set({ status: "accepted" }).where(eq(bid.id, b.id));
    const declined = await tx
      .update(bid)
      .set({ status: "declined" })
      .where(and(eq(bid.loadId, l.id), eq(bid.status, "active")))
      .returning({ carrierOrgId: bid.carrierOrgId });
    const [conv] = await tx
      .insert(conversation)
      .values({ kind: "booking", loadId: l.id, shipperId: l.shipperId, carrierOrgId: b.carrierOrgId })
      .onConflictDoUpdate({ target: [conversation.loadId, conversation.carrierOrgId], set: { kind: "booking" } })
      .returning({ id: conversation.id });
    return { load: l, bid: b, payment: p, declined: declined.map((d) => d.carrierOrgId), conversationId: conv?.id ?? null, orphaned: false };
  });
  if (!outcome) return;
  if (outcome.orphaned) {
    await notifyAdmins(`Payment ${outcome.payment.id} for ${outcome.load.publicId} succeeded after the bid was superseded or withdrawn. Refund it from the admin console.`);
    return;
  }
  await safely("load booked", () => setEnrollmentStatus({ loadId: outcome.load.id, sequences: ["load_followup", "verify_publish"] }, "completed", "booked"));
  await safely("invoice email", () => sendInvoice(outcome.load.publicId));
  const [org] = await db.select({ name: organization.name }).from(organization).where(eq(organization.id, outcome.bid.carrierOrgId)).limit(1);
  const carrierStaff = await orgStaffIds(outcome.bid.carrierOrgId);
  await Promise.allSettled([
    notifyUsers([outcome.load.shipperId], {
      type: "load_booked",
      title: `${outcome.load.publicId} is booked`,
      body:
        outcome.payment.carrierAmountCents === 0
          ? `You reserved ${org?.name ?? "the mover"} for ${outcome.load.publicId}. Your ${formatUsd(outcome.payment.amountCents)} booking fee is paid; pay the mover ${formatUsd(outcome.bid.amountCents)} on delivery.`
          : `You booked ${org?.name ?? "the carrier"} for ${formatUsd(outcome.payment.carrierAmountCents)}. Your payment of ${formatUsd(outcome.payment.amountCents)} is held until delivery.`,
      href: `/app/loads/${outcome.load.publicId}`,
      email: { subject: `Booked: ${outcome.load.title}`, actionLabel: "View load" },
    }),
    notifyUsers(carrierStaff, {
      type: "bid_won",
      title: `You won ${outcome.load.publicId}`,
      body:
        outcome.payment.carrierAmountCents === 0
          ? `The customer reserved you for "${outcome.load.title}" at ${formatUsd(outcome.bid.amountCents)}. They pay you on delivery. Call them to confirm inventory and pickup details.`
          : `Your bid of ${formatUsd(outcome.payment.carrierAmountCents)} on "${outcome.load.title}" was accepted and paid into escrow. Assign a driver and confirm pickup details.`,
      href: `/app/board/${outcome.load.publicId}`,
      email: { subject: `Bid accepted: ${outcome.load.title}`, actionLabel: "Open the load" },
    }),
    ...[...new Set(outcome.declined)].map(async (orgId) =>
      notifyUsers(await orgStaffIds(orgId), {
        type: "bid_declined",
        title: `${outcome.load.publicId} went to another carrier`,
        body: `The shipper booked another bid on "${outcome.load.title}".`,
        href: "/app/bids?tab=closed",
      }),
    ),
    notifyAdmins(`Load booked: ${outcome.load.publicId}, ${formatUsd(outcome.payment.amountCents)} held in escrow.`),
  ]);
}

export async function markPaymentFailed(paymentIntentId: string, reason?: string) {
  const [p] = await db.select().from(payment).where(eq(payment.stripePaymentIntentId, paymentIntentId)).limit(1);
  if (!p || p.status === "succeeded") return;
  await db.insert(loadEvent).values({ loadId: p.loadId, type: "payment_failed", payload: { paymentId: p.id, reason: reason ?? null } });
}

export async function confirmSimulatedPayment(actor: Actor, paymentId: string) {
  if (!simulatedPayments()) throw new ActionError("Not available.");
  const [p] = await db.select().from(payment).where(and(eq(payment.id, paymentId), eq(payment.shipperId, actor.userId))).limit(1);
  if (!p) throw new ActionError("Payment not found.");
  if (p.status !== "requires_payment" && p.status !== "processing") throw new ActionError("This payment is no longer waiting. Refresh the page.");
  await markPaymentSucceeded({ paymentId });
}

export async function releaseStalePayments() {
  const cutoff = new Date(Date.now() - PAYMENT_WINDOW_MINUTES * 60_000);
  const stale = await db
    .select({ payment, load })
    .from(payment)
    .innerJoin(load, eq(load.id, payment.loadId))
    .where(and(inArray(payment.status, ["requires_payment", "processing"]), lt(payment.createdAt, cutoff), eq(load.status, "awaiting_payment")))
    .limit(100);
  const stripe = getStripe();
  for (const row of stale) {
    if (stripe && row.payment.stripePaymentIntentId) {
      const intent = await stripe.paymentIntents.retrieve(row.payment.stripePaymentIntentId);
      if (intent.status === "succeeded") {
        await markPaymentSucceeded({ paymentIntentId: intent.id });
        continue;
      }
      if (intent.status === "processing") continue;
      if (intent.status !== "canceled") await stripe.paymentIntents.cancel(intent.id).catch(() => null);
    }
    await db.transaction(async (tx) => {
      await tx.update(payment).set({ status: "canceled" }).where(eq(payment.id, row.payment.id));
      await transitionLoad(tx, row.load, "open", { kind: "system", userId: null }, { acceptedBidId: null }, { reason: "payment_window_expired" });
    });
  }
  return stale.length;
}

export async function createConnectOnboardingLink(orgId: string, returnPath = "/app/payouts") {
  const stripe = getStripe();
  if (!stripe) throw new ActionError("Payouts are not configured yet.");
  const [profile] = await db.select().from(carrierProfile).where(eq(carrierProfile.orgId, orgId)).limit(1);
  if (!profile) throw new ActionError("Add your company first.");
  let accountId = profile.stripeAccountId;
  if (!accountId) {
    const account = await stripe.accounts.create(
      {
        type: "express",
        country: "US",
        business_type: "company",
        capabilities: { transfers: { requested: true } },
        business_profile: { name: profile.dbaName ?? profile.legalName, mcc: "4214", product_description: "Freight and moving transport booked through AllShip AI" },
        metadata: { orgId, usdot: profile.usdotNumber ?? "" },
      },
      { idempotencyKey: `acct-${orgId}` },
    );
    accountId = account.id;
    await db.update(carrierProfile).set({ stripeAccountId: accountId }).where(eq(carrierProfile.orgId, orgId));
  }
  const base = env.NEXT_PUBLIC_APP_URL;
  const link = await stripe.accountLinks.create({ account: accountId, type: "account_onboarding", refresh_url: `${base}${returnPath}?refresh=1`, return_url: `${base}${returnPath}?return=1` });
  return link.url;
}

export async function createConnectDashboardLink(orgId: string) {
  const stripe = getStripe();
  if (!stripe) throw new ActionError("Payouts are not configured yet.");
  const [profile] = await db.select({ accountId: carrierProfile.stripeAccountId }).from(carrierProfile).where(eq(carrierProfile.orgId, orgId)).limit(1);
  if (!profile?.accountId) throw new ActionError("Set up payouts first.");
  const link = await stripe.accounts.createLoginLink(profile.accountId);
  return link.url;
}

export async function syncConnectedAccount(account: Stripe.Account) {
  const updated = await db
    .update(carrierProfile)
    .set({ chargesEnabled: Boolean(account.charges_enabled), payoutsEnabled: Boolean(account.payouts_enabled && account.capabilities?.transfers === "active") })
    .where(eq(carrierProfile.stripeAccountId, account.id))
    .returning({ orgId: carrierProfile.orgId, payoutsEnabled: carrierProfile.payoutsEnabled });
  for (const row of updated) if (row.payoutsEnabled) await safely("carrier payouts", () => refreshCarrierActivation(row.orgId));
}

export async function refreshConnectedAccount(orgId: string) {
  const stripe = getStripe();
  if (!stripe) return;
  const [profile] = await db.select({ accountId: carrierProfile.stripeAccountId }).from(carrierProfile).where(eq(carrierProfile.orgId, orgId)).limit(1);
  if (!profile?.accountId) return;
  await syncConnectedAccount(await stripe.accounts.retrieve(profile.accountId));
}

export async function cancelPendingPayments(loadId: string) {
  const pending = await db.select().from(payment).where(and(eq(payment.loadId, loadId), inArray(payment.status, ["requires_payment", "processing"])));
  const stripe = getStripe();
  for (const p of pending) {
    if (stripe && p.stripePaymentIntentId) {
      const intent = await stripe.paymentIntents.retrieve(p.stripePaymentIntentId).catch(() => null);
      if (intent?.status === "succeeded" || intent?.status === "processing") continue;
      if (intent && intent.status !== "canceled") await stripe.paymentIntents.cancel(intent.id).catch(() => null);
    }
    await db.update(payment).set({ status: "canceled" }).where(and(eq(payment.id, p.id), inArray(payment.status, ["requires_payment", "processing"])));
  }
}
