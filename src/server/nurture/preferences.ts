import "server-only";
import { and, eq, inArray, ne } from "drizzle-orm";
import { db } from "@/server/db/client";
import { emailOptOut, emailSuppression, newsletterSubscriber } from "@/server/db/schema";
import { setEnrollmentStatus } from "./index";
import { sequenceIds, sequences, type SequenceId } from "./schedule";

const nonTransactional = sequenceIds.filter((s) => sequences[s].category !== "transactional");

export type EmailChoice = "sequence" | "marketing" | "resubscribe";

export async function emailStatus(email: string) {
  const normalized = email.trim().toLowerCase();
  const [[suppression], optOuts] = await Promise.all([
    db.select().from(emailSuppression).where(eq(emailSuppression.email, normalized)).limit(1),
    db.select({ sequence: emailOptOut.sequence }).from(emailOptOut).where(eq(emailOptOut.email, normalized)),
  ]);
  return { suppression: suppression ?? null, optOuts: optOuts.map((o) => o.sequence) };
}

export async function optOutOfSequence(email: string, sequence: SequenceId) {
  const normalized = email.trim().toLowerCase();
  await db.insert(emailOptOut).values({ email: normalized, sequence }).onConflictDoNothing();
  await setEnrollmentStatus({ email: normalized, sequence }, "unsubscribed", "unsubscribed");
}

export async function unsubscribeMarketing(email: string) {
  const normalized = email.trim().toLowerCase();
  await db.insert(emailSuppression).values({ email: normalized, reason: "unsubscribed", scope: "marketing" }).onConflictDoNothing();
  await db.update(newsletterSubscriber).set({ unsubscribedAt: new Date() }).where(eq(newsletterSubscriber.email, normalized));
  await setEnrollmentStatus({ email: normalized, sequences: nonTransactional }, "unsubscribed", "unsubscribed");
}

export async function oneClickUnsubscribe(email: string, sequence: SequenceId | undefined) {
  if (sequence) await optOutOfSequence(email, sequence);
  if (!sequence || sequences[sequence].category !== "transactional") await unsubscribeMarketing(email);
}

export async function resubscribe(email: string) {
  const normalized = email.trim().toLowerCase();
  await db.delete(emailSuppression).where(and(eq(emailSuppression.email, normalized), eq(emailSuppression.reason, "unsubscribed")));
  await db.delete(emailOptOut).where(and(eq(emailOptOut.email, normalized), inArray(emailOptOut.sequence, [...sequenceIds])));
}

export async function recordProviderEvent(email: string, kind: "bounced" | "complained") {
  const normalized = email.trim().toLowerCase();
  const scope = kind === "bounced" ? "all" : "marketing";
  await db
    .insert(emailSuppression)
    .values({ email: normalized, reason: kind, scope })
    .onConflictDoUpdate(
      kind === "bounced"
        ? { target: emailSuppression.email, set: { reason: "bounced", scope: "all" } }
        : { target: emailSuppression.email, set: { reason: "complained" }, setWhere: ne(emailSuppression.reason, "bounced") },
    );
  await setEnrollmentStatus(kind === "bounced" ? { email: normalized, sequences: [...sequenceIds] } : { email: normalized, sequences: nonTransactional }, "unsubscribed", kind);
}
