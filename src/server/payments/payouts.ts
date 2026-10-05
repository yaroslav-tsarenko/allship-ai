import "server-only";
import { randomUUID } from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import { formatUsd } from "@/lib/money";
import { db } from "@/server/db/client";
import { carrierProfile, ledgerEntry, load, loadEvent, payment, payout } from "@/server/db/schema";
import { notifyUsers, orgStaffIds } from "@/server/notifications/notify";
import { notifyAdmins } from "@/server/notify/telegram";
import { getStripe, simulatedPayments } from "./stripe";

export async function releasePayout(loadId: string, options: { reduceByCents?: number } = {}) {
  const prepared = await db.transaction(async (tx) => {
    const [l] = await tx.select().from(load).where(eq(load.id, loadId)).limit(1).for("update");
    if (!l || !l.carrierOrgId) return null;
    const [p] = await tx
      .select()
      .from(payment)
      .where(and(eq(payment.loadId, loadId), inArray(payment.status, ["succeeded", "partially_refunded"])))
      .limit(1);
    if (!p) return null;
    const [existing] = await tx.select().from(payout).where(eq(payout.loadId, loadId)).limit(1);
    if (existing) return existing.status === "pending" || existing.status === "held" ? { payout: existing, load: l, payment: p } : null;
    const held = Math.max(0, p.amountCents - p.refundedCents);
    const amount = Math.min(held, Math.max(0, p.carrierAmountCents - (options.reduceByCents ?? 0)));
    const [created] = await tx
      .insert(payout)
      .values({ loadId, paymentId: p.id, carrierOrgId: l.carrierOrgId, amountCents: amount, status: "pending", releaseAfter: new Date() })
      .returning();
    const journalId = randomUUID();
    const feeCents = Math.min(p.amountCents - p.carrierAmountCents, held - amount);
    await tx.insert(ledgerEntry).values([
      { journalId, account: "escrow", amountCents: -(amount + feeCents), refType: "payout", refId: created!.id, memo: `Release ${l.publicId}` },
      { journalId, account: "platform_revenue", amountCents: feeCents, refType: "payout", refId: created!.id, memo: `Fee ${l.publicId}` },
      { journalId, account: "carrier_payable", amountCents: amount, refType: "payout", refId: created!.id, memo: `Owed for ${l.publicId}` },
    ]);
    return { payout: created!, load: l, payment: p };
  });
  if (!prepared) return null;
  return sendTransfer(prepared.payout.id);
}

export async function sendTransfer(payoutId: string) {
  const [row] = await db
    .select({ payout, publicId: load.publicId, title: load.title, chargeId: payment.stripeChargeId, accountId: carrierProfile.stripeAccountId })
    .from(payout)
    .innerJoin(load, eq(load.id, payout.loadId))
    .innerJoin(payment, eq(payment.id, payout.paymentId))
    .leftJoin(carrierProfile, eq(carrierProfile.orgId, payout.carrierOrgId))
    .where(eq(payout.id, payoutId))
    .limit(1);
  if (!row || row.payout.status === "paid") return row?.payout ?? null;

  const stripe = getStripe();
  let transferId: string | null = null;
  try {
    if (row.payout.amountCents > 0) {
      if (stripe) {
        if (!row.accountId) throw new Error("Carrier has no connected Stripe account");
        const transfer = await stripe.transfers.create(
          {
            amount: row.payout.amountCents,
            currency: row.payout.currency,
            destination: row.accountId,
            transfer_group: row.payout.loadId,
            ...(row.chargeId ? { source_transaction: row.chargeId } : {}),
            description: `AllShip ${row.publicId}`,
            metadata: { loadId: row.payout.loadId, payoutId: row.payout.id, publicId: row.publicId },
          },
          { idempotencyKey: `tr-${row.payout.id}` },
        );
        transferId = transfer.id;
      } else if (!simulatedPayments()) {
        throw new Error("Payments are not configured");
      } else {
        transferId = `sim_tr_${row.payout.id.slice(0, 18)}`;
      }
    }
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Transfer failed";
    await db.update(payout).set({ status: "held", failureReason: reason.slice(0, 500) }).where(eq(payout.id, row.payout.id));
    await db.insert(loadEvent).values({ loadId: row.payout.loadId, type: "payout_failed", payload: { payoutId: row.payout.id, reason } });
    await notifyAdmins(`Payout for ${row.publicId} failed: ${reason}`);
    return null;
  }

  const journalId = randomUUID();
  await db.transaction(async (tx) => {
    await tx.update(payout).set({ status: "paid", stripeTransferId: transferId, paidAt: new Date(), failureReason: null }).where(eq(payout.id, row.payout.id));
    if (row.payout.amountCents > 0) {
      await tx.insert(ledgerEntry).values([
        { journalId, account: "carrier_payable", amountCents: -row.payout.amountCents, refType: "transfer", refId: transferId ?? row.payout.id, memo: `Paid ${row.publicId}` },
        { journalId, account: "carrier_paid", amountCents: row.payout.amountCents, refType: "transfer", refId: transferId ?? row.payout.id, memo: `Paid ${row.publicId}` },
      ]);
    }
    await tx.insert(loadEvent).values({ loadId: row.payout.loadId, type: "payout_sent", payload: { payoutId: row.payout.id, amountCents: row.payout.amountCents, transferId } });
  });
  await notifyUsers(await orgStaffIds(row.payout.carrierOrgId), {
    type: "payout_sent",
    title: `${formatUsd(row.payout.amountCents)} is on its way`,
    body: `We released your payment for ${row.publicId} "${row.title}". Stripe deposits it to your bank on your payout schedule.`,
    href: "/app/payouts",
    email: { subject: `Payout sent for ${row.publicId}`, actionLabel: "View payouts" },
  });
  return { ...row.payout, status: "paid" as const, stripeTransferId: transferId };
}

export async function retryHeldPayouts() {
  const held = await db.select({ id: payout.id }).from(payout).where(eq(payout.status, "pending")).limit(25);
  for (const h of held) await sendTransfer(h.id);
  return held.length;
}
