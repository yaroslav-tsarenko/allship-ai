import "server-only";
import { randomUUID } from "node:crypto";
import { and, desc, eq, isNull, inArray } from "drizzle-orm";
import { formatUsd } from "@/lib/money";
import { ActionError } from "@/server/actions/safe-action";
import { assertAdmin, type Actor } from "@/server/actor";
import { db } from "@/server/db/client";
import { auditLog, dispute, ledgerEntry, load, loadEvent, payment, payout } from "@/server/db/schema";
import type { LoadStatus } from "@/server/db/schema/enums";
import { transitionLoad } from "@/server/loads/service";
import { notifyUsers, orgStaffIds } from "@/server/notifications/notify";
import { notifyAdmins } from "@/server/notify/telegram";
import { releasePayout } from "@/server/payments/payouts";
import { getStripe, simulatedPayments } from "@/server/payments/stripe";
import { publish } from "@/server/realtime/publish";
import { topics } from "@/server/realtime/topics";
import { loadWithRole } from "@/server/trips/access";

export type DisputeReason = (typeof dispute.$inferInsert)["reason"];
const disputable: LoadStatus[] = ["booked", "assigned", "en_route_to_pickup", "in_transit", "delivered"];

export async function openDispute(actor: Actor, loadId: string, input: { reason: DisputeReason; details: string; evidence?: string[] }) {
  const { load: row, role } = await loadWithRole(actor, loadId, ["shipper", "carrier"]);
  if (!disputable.includes(row.status)) throw new ActionError("You can report a problem while the load is booked, in progress, or awaiting delivery confirmation.");
  if (row.status === "delivered" && role !== "shipper") throw new ActionError("Only the shipper can dispute a delivered load.");
  const evidence = (input.evidence ?? []).filter((k) => k.startsWith(`loads/${row.id}/`)).slice(0, 10);
  const [created] = await db.transaction(async (tx) => {
    await transitionLoad(tx, row, "disputed", { kind: role as "shipper" | "carrier", userId: actor.userId }, {}, { reason: input.reason });
    await tx.update(payout).set({ status: "held" }).where(and(eq(payout.loadId, row.id), eq(payout.status, "pending")));
    return tx
      .insert(dispute)
      .values({ loadId: row.id, openedBy: actor.userId, openedByRole: role, reason: input.reason, details: input.details.slice(0, 4000), previousStatus: row.status, evidence })
      .returning();
  });
  const other = role === "shipper" ? await orgStaffIds(row.carrierOrgId ?? "") : [row.shipperId];
  await Promise.allSettled([
    publish(topics.load(row.id), { event: "load_status", payload: { loadId: row.id, status: "disputed" } }),
    notifyUsers(other, {
      type: "dispute_opened",
      title: `Problem reported on ${row.publicId}`,
      body: `The ${role} reported: ${input.reason.replace(/_/g, " ")}. Payment stays in escrow while our team reviews. Add your side in the load chat.`,
      href: role === "shipper" ? `/app/trips/${row.publicId}` : `/app/loads/${row.publicId}`,
      email: { subject: `Dispute opened on ${row.publicId}`, actionLabel: "Review" },
    }),
    notifyAdmins(`Dispute on ${row.publicId} by ${role}: ${input.reason}. ${input.details.slice(0, 300)}`),
  ]);
  return created!;
}

export async function withdrawDispute(actor: Actor, disputeId: string) {
  const [d] = await db.select().from(dispute).where(eq(dispute.id, disputeId)).limit(1);
  if (!d || d.openedBy !== actor.userId || d.status !== "open") throw new ActionError("Dispute not found.");
  const { load: row } = await loadWithRole(actor, d.loadId, ["shipper", "carrier"]);
  await db.transaction(async (tx) => {
    await tx.update(dispute).set({ status: "withdrawn", resolvedAt: new Date(), resolvedBy: actor.userId }).where(eq(dispute.id, d.id));
    await tx.update(load).set({ status: d.previousStatus as LoadStatus }).where(and(eq(load.id, row.id), eq(load.status, "disputed")));
    await tx.insert(loadEvent).values({ loadId: row.id, type: "dispute_withdrawn", fromStatus: "disputed", toStatus: d.previousStatus as LoadStatus, actorId: actor.userId });
  });
  await publish(topics.load(row.id), { event: "load_status", payload: { loadId: row.id, status: d.previousStatus } });
}

async function refund(paymentRow: typeof payment.$inferSelect, cents: number, reason: string) {
  if (cents <= 0) return null;
  const stripe = getStripe();
  let refundId: string;
  if (stripe && paymentRow.stripePaymentIntentId) {
    const r = await stripe.refunds.create({ payment_intent: paymentRow.stripePaymentIntentId, amount: cents, reason: "requested_by_customer", metadata: { paymentId: paymentRow.id, reason } }, { idempotencyKey: `rf-${paymentRow.id}-${cents}` });
    refundId = r.id;
  } else if (simulatedPayments()) {
    refundId = `sim_rf_${randomUUID().slice(0, 12)}`;
  } else {
    throw new ActionError("Payments are not configured.");
  }
  const refunded = paymentRow.refundedCents + cents;
  await db.transaction(async (tx) => {
    await tx.update(payment).set({ refundedCents: refunded, status: refunded >= paymentRow.amountCents ? "refunded" : "partially_refunded" }).where(eq(payment.id, paymentRow.id));
    const journalId = randomUUID();
    await tx.insert(ledgerEntry).values([
      { journalId, account: "escrow", amountCents: -cents, refType: "refund", refId: refundId, memo: reason },
      { journalId, account: "refunds", amountCents: cents, refType: "refund", refId: refundId, memo: reason },
    ]);
  });
  return refundId;
}

export async function resolveDispute(actor: Actor, disputeId: string, input: { outcome: "release" | "refund" | "split"; refundCents?: number; resolution: string }) {
  assertAdmin(actor);
  const [d] = await db
    .update(dispute)
    .set({ resolvedBy: actor.userId, resolvedAt: new Date() })
    .where(and(eq(dispute.id, disputeId), eq(dispute.status, "open"), isNull(dispute.resolvedAt)))
    .returning();
  if (!d) throw new ActionError("This dispute is already closed or being resolved.");
  try {
    await settleDispute(actor, d, input);
  } catch (error) {
    await db.update(dispute).set({ resolvedBy: null, resolvedAt: null }).where(and(eq(dispute.id, d.id), eq(dispute.status, "open")));
    throw error;
  }
}

async function settleDispute(actor: Actor, d: typeof dispute.$inferSelect, input: { outcome: "release" | "refund" | "split"; refundCents?: number; resolution: string }) {
  const [row] = await db.select().from(load).where(eq(load.id, d.loadId)).limit(1);
  const [p] = await db.select().from(payment).where(and(eq(payment.loadId, d.loadId), inArray(payment.status, ["succeeded", "partially_refunded"]))).limit(1);
  if (!row) throw new ActionError("Load not found.");
  let refundedCents = 0;
  const admin = { kind: "admin" as const, userId: actor.userId };

  if (input.outcome === "refund") {
    refundedCents = p ? p.amountCents - p.refundedCents : 0;
    if (p) await refund(p, refundedCents, `Dispute ${d.id}`);
    await db.transaction(async (tx) => {
      await transitionLoad(tx, row, "cancelled", admin, { cancelledReason: input.resolution.slice(0, 500) }, { disputeId: d.id });
      await tx.update(payout).set({ status: "reversed" }).where(eq(payout.loadId, row.id));
    });
  } else {
    const refundCents = input.outcome === "split" ? Math.min(Math.max(0, input.refundCents ?? 0), p?.carrierAmountCents ?? 0) : 0;
    if (input.outcome === "split" && refundCents <= 0) throw new ActionError("Enter the amount to refund the shipper.");
    refundedCents = refundCents;
    if (p && refundCents > 0) await refund(p, refundCents, `Dispute ${d.id} partial`);
    await db.transaction((tx) => transitionLoad(tx, row, "completed", admin, { completedAt: new Date() }, { disputeId: d.id, refundCents }));
    await releasePayout(row.id, { reduceByCents: refundCents });
  }

  const status = input.outcome === "release" ? "resolved_release" : input.outcome === "refund" ? "resolved_refund" : "resolved_split";
  await db.update(dispute).set({ status, resolution: input.resolution, refundCents: refundedCents || null, resolvedBy: actor.userId, resolvedAt: new Date() }).where(eq(dispute.id, d.id));
  await db.insert(auditLog).values({ actorId: actor.userId, action: "dispute.resolve", entity: "dispute", entityId: d.id, diff: { outcome: input.outcome, refundCents: refundedCents } });
  const summary =
    input.outcome === "release" ? "Payment was released to the carrier." : input.outcome === "refund" ? "The shipper was refunded in full." : `The shipper was refunded ${formatUsd(refundedCents)}; the rest went to the carrier.`;
  await Promise.allSettled([
    publish(topics.load(row.id), { event: "load_status", payload: { loadId: row.id, status: input.outcome === "refund" ? "cancelled" : "completed" } }),
    notifyUsers([row.shipperId, ...(await orgStaffIds(row.carrierOrgId ?? ""))], {
      type: "dispute_resolved",
      title: `Dispute on ${row.publicId} resolved`,
      body: `${summary} ${input.resolution}`,
      href: `/app/loads/${row.publicId}`,
      email: { subject: `Dispute resolved: ${row.publicId}`, actionLabel: "View details" },
    }),
  ]);
}

export async function cancelBookedWithRefund(actor: Actor, loadId: string, reason: string, keepCents = 0) {
  assertAdmin(actor);
  const [row] = await db.select().from(load).where(eq(load.id, loadId)).limit(1);
  if (!row || !["booked", "assigned"].includes(row.status)) throw new ActionError("Only booked loads can be cancelled this way.");
  const [p] = await db.select().from(payment).where(and(eq(payment.loadId, row.id), eq(payment.status, "succeeded"))).limit(1);
  if (p && keepCents > p.carrierAmountCents) throw new ActionError(`You can keep at most ${formatUsd(p.carrierAmountCents)} for the carrier.`);
  if (p) await refund(p, Math.max(0, p.amountCents - keepCents), `Cancelled: ${reason}`);
  await db.transaction((tx) => transitionLoad(tx, row, "cancelled", { kind: "admin", userId: actor.userId }, { cancelledReason: reason.slice(0, 500) }, { keepCents }));
  if (keepCents > 0) await releasePayout(row.id, { reduceByCents: Math.max(0, (p?.carrierAmountCents ?? 0) - keepCents) });
  await notifyUsers([row.shipperId, ...(await orgStaffIds(row.carrierOrgId ?? ""))], {
    type: "load_cancelled",
    title: `${row.publicId} was cancelled`,
    body: reason,
    href: `/app/loads/${row.publicId}`,
    email: { subject: `Cancelled: ${row.title}`, actionLabel: "View load" },
  });
}

export async function disputesForLoad(loadId: string) {
  return db.select().from(dispute).where(eq(dispute.loadId, loadId)).orderBy(desc(dispute.createdAt));
}
