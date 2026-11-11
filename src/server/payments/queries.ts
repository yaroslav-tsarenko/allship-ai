import "server-only";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/server/db/client";
import { bid, load, organization, payment } from "@/server/db/schema";
import type { Actor } from "@/server/actor";
import { squareCheckout, type SquareCheckout } from "@/server/square/oauth";
import { getStripe, simulatedPayments } from "./stripe";

export type PendingPayment = {
  paymentId: string;
  simulated: boolean;
  square: SquareCheckout | null;
  clientSecret: string | null;
  totalCents: number;
  feeCents: number;
  carrierCents: number;
  carrierName: string;
  balanceCents: number;
  bidId: string;
  createdAt: Date;
};

export async function getPendingPayment(actor: Actor, loadId: string): Promise<PendingPayment | null> {
  const [row] = await db
    .select({ payment, carrierName: organization.name, bidCents: bid.amountCents })
    .from(payment)
    .innerJoin(load, eq(load.id, payment.loadId))
    .innerJoin(bid, eq(bid.id, payment.bidId))
    .innerJoin(organization, eq(organization.id, bid.carrierOrgId))
    .where(and(eq(payment.loadId, loadId), eq(load.shipperId, actor.userId), eq(load.status, "awaiting_payment"), inArray(payment.status, ["requires_payment", "processing"])))
    .orderBy(desc(payment.createdAt))
    .limit(1);
  if (!row) return null;
  const p = row.payment;
  const base = {
    paymentId: p.id,
    totalCents: p.amountCents,
    feeCents: p.platformFeeCents,
    carrierCents: p.carrierAmountCents || row.bidCents,
    carrierName: row.carrierName,
    balanceCents: p.carrierAmountCents === 0 ? row.bidCents : 0,
    bidId: p.bidId,
    createdAt: p.createdAt,
  };
  const stripe = getStripe();
  if (!stripe || !p.stripePaymentIntentId) {
    if (stripe) return null;
    const squarePay = await squareCheckout();
    if (squarePay) return { ...base, simulated: false, square: squarePay, clientSecret: null };
    if (simulatedPayments()) return { ...base, simulated: true, square: null, clientSecret: null };
    return null;
  }
  const intent = await stripe.paymentIntents.retrieve(p.stripePaymentIntentId);
  if (intent.status === "canceled" || intent.status === "succeeded") return null;
  return { ...base, simulated: false, square: null, clientSecret: intent.client_secret };
}
