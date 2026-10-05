import { eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { env } from "@/env";
import { declaredLengthExceeds, readLimited } from "@/lib/security/read-limited";
import { db } from "@/server/db/client";
import { load, loadEvent, payment, payout, stripeEvent } from "@/server/db/schema";
import { markPaymentFailed, markPaymentSucceeded, syncConnectedAccount } from "@/server/payments/escrow";
import { getStripe } from "@/server/payments/stripe";
import { notifyAdmins } from "@/server/notify/telegram";
import { log } from "@/lib/log";

export const runtime = "nodejs";

const WEBHOOK_TOLERANCE_SECONDS = 300;
const MAX_WEBHOOK_BYTES = 1024 * 1024;

function verify(stripe: Stripe, body: string, signature: string) {
  const secrets = [env.STRIPE_WEBHOOK_SECRET, env.STRIPE_CONNECT_WEBHOOK_SECRET].filter((s): s is string => Boolean(s));
  for (const secret of secrets) {
    try {
      return stripe.webhooks.constructEvent(body, signature, secret, WEBHOOK_TOLERANCE_SECONDS);
    } catch {}
  }
  return null;
}

async function handle(event: Stripe.Event) {
  switch (event.type) {
    case "payment_intent.succeeded":
      await markPaymentSucceeded({ paymentIntentId: event.data.object.id, chargeId: typeof event.data.object.latest_charge === "string" ? event.data.object.latest_charge : (event.data.object.latest_charge?.id ?? null) });
      break;
    case "payment_intent.processing":
      await db.update(payment).set({ status: "processing" }).where(eq(payment.stripePaymentIntentId, event.data.object.id));
      break;
    case "payment_intent.payment_failed":
      await markPaymentFailed(event.data.object.id, event.data.object.last_payment_error?.message);
      break;
    case "account.updated":
      await syncConnectedAccount(event.data.object);
      break;
    case "charge.refunded": {
      const charge = event.data.object;
      const pi = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
      if (pi) {
        await db
          .update(payment)
          .set({ refundedCents: charge.amount_refunded, status: charge.refunded ? "refunded" : "partially_refunded" })
          .where(eq(payment.stripePaymentIntentId, pi));
      }
      break;
    }
    case "charge.dispute.created": {
      const dispute = event.data.object;
      const pi = typeof dispute.payment_intent === "string" ? dispute.payment_intent : dispute.payment_intent?.id;
      if (!pi) break;
      const [p] = await db.update(payment).set({ status: "disputed" }).where(eq(payment.stripePaymentIntentId, pi)).returning({ loadId: payment.loadId });
      if (p) {
        await db.update(payout).set({ status: "held" }).where(eq(payout.loadId, p.loadId));
        await db.insert(loadEvent).values({ loadId: p.loadId, type: "card_dispute_opened", payload: { disputeId: dispute.id, reason: dispute.reason } });
        const [l] = await db.select({ publicId: load.publicId }).from(load).where(eq(load.id, p.loadId)).limit(1);
        await notifyAdmins(`Card dispute opened on ${l?.publicId ?? p.loadId}. Payout is on hold.`);
      }
      break;
    }
    default:
      break;
  }
}

export async function POST(request: NextRequest) {
  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  if (declaredLengthExceeds(request.headers, MAX_WEBHOOK_BYTES)) return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  let body: string;
  try {
    body = new TextDecoder().decode(await readLimited(request.body, MAX_WEBHOOK_BYTES));
  } catch {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }
  const event = verify(stripe, body, signature);
  if (!event) return NextResponse.json({ error: "Invalid signature" }, { status: 400 });

  const inserted = await db.insert(stripeEvent).values({ id: event.id, type: event.type }).onConflictDoNothing().returning({ id: stripeEvent.id });
  if (inserted.length === 0) return NextResponse.json({ received: true, duplicate: true });

  try {
    await handle(event);
  } catch (error) {
    await db.delete(stripeEvent).where(eq(stripeEvent.id, event.id));
    log.error("stripe webhook handling failed", { scope: "stripe", eventType: event.type, eventId: event.id, err: error });
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }
  revalidateTag("open-loads", "max");
  return NextResponse.json({ received: true });
}
