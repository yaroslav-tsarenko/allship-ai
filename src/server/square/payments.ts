import "server-only";
import { createHash } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { log } from "@/lib/log";
import { ActionError } from "@/server/actions/safe-action";
import type { Actor } from "@/server/actor";
import { db } from "@/server/db/client";
import { load, payment } from "@/server/db/schema";
import { notifyAdmins } from "@/server/notify/telegram";
import { markPaymentSucceeded } from "@/server/payments/escrow";
import { square, squareAccess, SquareError } from "./oauth";

type SquarePayment = { payment?: { id: string; status: string; receipt_url?: string } };

const declineCopy: Record<string, string> = {
  INSUFFICIENT_FUNDS: "Your card doesn't have enough funds. Try another card.",
  CVV_FAILURE: "The security code doesn't match. Check it and try again.",
  VERIFY_CVV_FAILURE: "The security code doesn't match. Check it and try again.",
  ADDRESS_VERIFICATION_FAILURE: "The ZIP code doesn't match your card. Check it and try again.",
  VERIFY_AVS_FAILURE: "The ZIP code doesn't match your card. Check it and try again.",
  INVALID_EXPIRATION: "The expiration date is wrong. Check it and try again.",
  EXPIRATION_FAILURE: "This card has expired. Try another card.",
  INVALID_CARD: "This card number isn't valid. Check it and try again.",
  CARD_NOT_SUPPORTED: "This card type isn't supported. Try another card.",
  INVALID_ACCOUNT: "This card can't be charged. Try another card.",
  TRANSACTION_LIMIT: "This charge is over your card's limit. Try another card.",
  CARD_DECLINED_VERIFICATION_REQUIRED: "Your bank needs to verify this payment. Try again and complete the check.",
};

const idempotencyKey = (paymentId: string, sourceId: string) => createHash("sha256").update(`${paymentId}:${sourceId}`).digest("base64url").slice(0, 40);

export async function chargeSquare(actor: Actor, paymentId: string, sourceId: string) {
  const access = await squareAccess();
  if (!access?.locationId) throw new ActionError("Card payments aren't available right now. Try again in a few minutes or contact support.");

  const [claimed] = await db
    .update(payment)
    .set({ status: "processing" })
    .where(and(eq(payment.id, paymentId), eq(payment.shipperId, actor.userId), eq(payment.status, "requires_payment")))
    .returning();
  if (!claimed) throw new ActionError("This payment is already being processed or is no longer waiting. Refresh the page.");

  const release = () => db.update(payment).set({ status: "requires_payment" }).where(and(eq(payment.id, paymentId), eq(payment.status, "processing")));
  const [target] = await db.select({ publicId: load.publicId, title: load.title, status: load.status }).from(load).where(eq(load.id, claimed.loadId)).limit(1);
  if (target?.status !== "awaiting_payment") {
    await release();
    throw new ActionError("This booking is no longer waiting for payment. Refresh the page.");
  }

  let result: SquarePayment;
  try {
    result = await square<SquarePayment>("/v2/payments", {
      method: "POST",
      token: access.accessToken,
      body: JSON.stringify({
        source_id: sourceId,
        idempotency_key: idempotencyKey(paymentId, sourceId),
        amount_money: { amount: claimed.amountCents, currency: "USD" },
        location_id: access.locationId,
        autocomplete: true,
        reference_id: target.publicId,
        note: `AllShip ${target.publicId}: ${target.title}`.slice(0, 500),
        buyer_email_address: actor.email,
      }),
    });
  } catch (err) {
    await release();
    if (err instanceof SquareError && (err.status === 401 || err.status === 403)) {
      log.error("square access rejected", { scope: "payments", paymentId, code: err.code });
      await notifyAdmins(`Square rejected a charge for ${target.publicId} (${err.code}). Reconnect Square: run pnpm square:link.`).catch(() => undefined);
      throw new ActionError("Card payments aren't available right now. Your card was not charged. Try again later or contact support.");
    }
    if (err instanceof SquareError && err.status < 500) {
      log.warn("square charge declined", { scope: "payments", paymentId, code: err.code });
      throw new ActionError(declineCopy[err.code] ?? "Your card was declined. Try another card or contact your bank.");
    }
    log.error("square charge failed", { scope: "payments", paymentId, err });
    throw new ActionError("We couldn't reach the payment processor. Your card was not charged. Try again in a minute.");
  }

  const charged = result.payment;
  if (!charged || charged.status !== "COMPLETED") {
    await release();
    log.warn("square charge not completed", { scope: "payments", paymentId, status: charged?.status });
    throw new ActionError("Your payment didn't go through. Try another card.");
  }
  await markPaymentSucceeded({ paymentId, squarePaymentId: charged.id });
  return { publicId: target.publicId, receiptUrl: charged.receipt_url ?? null };
}
