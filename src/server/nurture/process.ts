import "server-only";
import { and, asc, eq, gt, inArray, lte, ne } from "drizzle-orm";
import { createElement } from "react";
import { site } from "@/content/site";
import { NurtureMessageEmail, composeNurture } from "@/emails/nurture/messages";
import type { NurtureFooter } from "@/emails/nurture/nurture-email";
import { log } from "@/lib/log";
import { db } from "@/server/db/client";
import { emailEnrollment, emailOptOut, emailSend, notificationPreference } from "@/server/db/schema";
import { blocksCategory, sendEmail, suppressionFor } from "@/server/email/send";
import { decide, type Decision } from "./conditions";
import { createPublishLink } from "@/server/funnel/links";
import { absoluteUrl, oneClickUnsubscribeUrl, unsubscribePageUrl, withCampaign } from "./links";
import {
  anchorOf,
  capReleaseAt,
  isSequenceId,
  isWithinSendWindow,
  MAX_SEND_ATTEMPTS,
  nextSendWindow,
  nextStepAt,
  RETRY_DELAY_MS,
  SEND_LEASE_MS,
  sequences,
  timeZoneForState,
  type SequenceId,
} from "./schedule";
import { loadNurtureState } from "./state";

type Enrollment = typeof emailEnrollment.$inferSelect;
export type Outcome = "sent" | "skipped" | "stopped" | "deferred" | "failed";

async function claimBatch(now: Date, size: number) {
  return db.transaction(async (tx) => {
    const rows = await tx
      .select()
      .from(emailEnrollment)
      .where(and(eq(emailEnrollment.status, "active"), lte(emailEnrollment.nextSendAt, now)))
      .orderBy(asc(emailEnrollment.nextSendAt))
      .limit(size)
      .for("update", { skipLocked: true });
    if (rows.length > 0) {
      await tx
        .update(emailEnrollment)
        .set({ nextSendAt: new Date(now.getTime() + SEND_LEASE_MS) })
        .where(inArray(emailEnrollment.id, rows.map((r) => r.id)));
    }
    return rows;
  });
}

async function finish(row: Enrollment, status: "stopped" | "unsubscribed" | "completed", reason: string) {
  await db.update(emailEnrollment).set({ status, stopReason: reason.slice(0, 200), nextSendAt: null }).where(and(eq(emailEnrollment.id, row.id), eq(emailEnrollment.status, "active")));
}

async function advance(row: Enrollment, now: Date, sentAt: Date | null) {
  const sequence = row.sequence as SequenceId;
  const nextStep = row.step + 1;
  const lastSentAt = sentAt ?? row.lastSentAt;
  const next = nextStepAt(sequence, nextStep, anchorOf(row.context, row.createdAt), lastSentAt, now);
  const context = { ...row.context, attempts: 0 };
  if (!next) {
    await db.update(emailEnrollment).set({ step: nextStep, lastSentAt, context, status: "completed", stopReason: "finished", nextSendAt: null }).where(eq(emailEnrollment.id, row.id));
    return;
  }
  await db.update(emailEnrollment).set({ step: nextStep, lastSentAt, context, nextSendAt: next }).where(eq(emailEnrollment.id, row.id));
}

async function defer(row: Enrollment, until: Date) {
  await db.update(emailEnrollment).set({ nextSendAt: until }).where(eq(emailEnrollment.id, row.id));
}

async function actionUrl(row: Enrollment, decision: Extract<Decision, { kind: "send" }>) {
  const sequence = row.sequence as SequenceId;
  const publicId = "load" in decision.message ? decision.message.load.publicId : null;
  const ctx = row.context;
  switch (decision.path) {
    case "confirm":
      return createPublishLink(row.email);
    case "resume": {
      const resume = typeof ctx.resumePath === "string" && ctx.resumePath.startsWith("/") && !ctx.resumePath.startsWith("//") ? ctx.resumePath : (ctx.path as string);
      const token = typeof ctx.prefillToken === "string" && resume === ctx.path ? ctx.prefillToken : null;
      return withCampaign(resume, sequence, { resume: token });
    }
    case "load":
      return absoluteUrl(`/app/loads/${publicId}`);
    case "review":
      return absoluteUrl(`/app/loads/${publicId}#review`);
    case "quote":
      return withCampaign("/quote", sequence);
    case "payouts":
      return absoluteUrl("/app/payouts");
    case "pricing":
      return absoluteUrl("/app/settings/pricing");
    case "settings":
      return absoluteUrl("/app/settings");
    default:
      return absoluteUrl("/app/board");
  }
}

function footerFor(row: Enrollment, publicId: string | null): NurtureFooter {
  const sequence = row.sequence as SequenceId;
  const load = publicId ? `load ${publicId}` : "a load";
  const reasons: Record<SequenceId, [string, string]> = {
    verify_publish: [`You're getting this because ${load} was posted on AllShip AI with this email address.`, "Stop these reminders"],
    abandoned_form: ["You're getting this because you started a quote on allship.ai.", "Unsubscribe"],
    load_followup: [`You're getting this because you posted ${load} on AllShip AI.`, "Unsubscribe from load tips"],
    post_delivery: [`You're getting this because you shipped ${load} with AllShip AI.`, "Unsubscribe"],
    carrier_activation: ["You're getting this because you signed up as a carrier on AllShip AI.", "Unsubscribe"],
  };
  const [reason, label] = reasons[sequence];
  return { reason, unsubscribeLabel: label, unsubscribeUrl: unsubscribePageUrl(row.email, sequence), settingsUrl: row.userId ? absoluteUrl("/app/settings/notifications") : undefined };
}

async function audienceBlock(row: Enrollment, sequence: SequenceId) {
  const def = sequences[sequence];
  const suppression = await suppressionFor(row.email);
  if (blocksCategory(suppression, def.category)) return suppression?.reason ?? "suppressed";
  const [optOut] = await db.select({ email: emailOptOut.email }).from(emailOptOut).where(and(eq(emailOptOut.email, row.email), eq(emailOptOut.sequence, sequence))).limit(1);
  if (optOut) return "unsubscribed";
  if (def.preferenceType && row.userId) {
    const [muted] = await db
      .select({ enabled: notificationPreference.enabled })
      .from(notificationPreference)
      .where(and(eq(notificationPreference.userId, row.userId), eq(notificationPreference.channel, "email"), eq(notificationPreference.type, def.preferenceType), eq(notificationPreference.enabled, false)))
      .limit(1);
    if (muted) return "preference";
  }
  return null;
}

async function capRelease(email: string, now: Date) {
  const recent = await db
    .select({ createdAt: emailSend.createdAt })
    .from(emailSend)
    .where(and(eq(emailSend.email, email), eq(emailSend.status, "sent"), ne(emailSend.category, "transactional"), gt(emailSend.createdAt, new Date(now.getTime() - 86_400_000))));
  return capReleaseAt(recent.map((r) => r.createdAt), now);
}

export async function processEnrollment(row: Enrollment, now: Date): Promise<Outcome> {
  if (!isSequenceId(row.sequence)) {
    await finish(row, "stopped", "unknown_sequence");
    return "stopped";
  }
  const sequence = row.sequence;
  const def = sequences[sequence];
  if (row.step >= def.steps.length) {
    await finish(row, "completed", "finished");
    return "stopped";
  }

  const blocked = await audienceBlock(row, sequence);
  if (blocked) {
    await finish(row, blocked === "preference" ? "stopped" : "unsubscribed", blocked);
    return "stopped";
  }

  const { state, recipientState } = await loadNurtureState(row, now);
  const timeZone = timeZoneForState(recipientState);
  const decision = decide(sequence, row.step, state, timeZone);

  if (decision.kind === "stop") {
    await finish(row, def.conversions.includes(decision.reason) ? "completed" : "stopped", decision.reason);
    return "stopped";
  }
  if (decision.kind === "wait") {
    await defer(row, new Date(decision.untilMs));
    return "deferred";
  }
  if (decision.kind === "skip") {
    await db
      .insert(emailSend)
      .values({ enrollmentId: row.id, sequence, step: row.step, email: row.email, userId: row.userId, template: "skipped", subject: decision.reason, category: def.category, status: "skipped", createdAt: now })
      .onConflictDoNothing();
    await advance(row, now, null);
    return "skipped";
  }

  if (!isWithinSendWindow(now, timeZone)) {
    await defer(row, nextSendWindow(now, timeZone));
    return "deferred";
  }
  if (def.category !== "transactional") {
    const release = await capRelease(row.email, now);
    if (release) {
      await defer(row, nextSendWindow(release, timeZone));
      return "deferred";
    }
  }

  const composed = composeNurture(decision.message);
  const [claim] = await db
    .insert(emailSend)
    .values({ enrollmentId: row.id, sequence, step: row.step, email: row.email, userId: row.userId, template: decision.message.template, subject: composed.subject, category: def.category, status: "sending", createdAt: now })
    .onConflictDoNothing()
    .returning({ id: emailSend.id });
  if (!claim) {
    await advance(row, now, null);
    return "skipped";
  }

  const publicId = "load" in decision.message ? (decision.message.load.publicId ?? null) : null;
  try {
    const result = await sendEmail({
      to: row.email,
      subject: composed.subject,
      tag: `nurture-${sequence}-${row.step + 1}`,
      category: def.category,
      replyTo: site.email,
      unsubscribeUrl: oneClickUnsubscribeUrl(row.email, sequence),
      react: createElement(NurtureMessageEmail, { message: decision.message, url: await actionUrl(row, decision), footer: footerFor(row, publicId) }),
    });
    if (result.status === "suppressed") {
      await db.update(emailSend).set({ status: "skipped", error: "suppressed" }).where(eq(emailSend.id, claim.id));
      await finish(row, "unsubscribed", "suppressed");
      return "stopped";
    }
    await db.update(emailSend).set({ status: "sent" }).where(eq(emailSend.id, claim.id));
    await advance(row, now, now);
    return "sent";
  } catch (error) {
    const attempts = Number(row.context.attempts ?? 0) + 1;
    log.error("nurture send failed", { scope: "nurture", enrollmentId: row.id, sequence, step: row.step, attempts, err: error });
    if (attempts < MAX_SEND_ATTEMPTS) {
      await db.delete(emailSend).where(eq(emailSend.id, claim.id));
      await db
        .update(emailEnrollment)
        .set({ context: { ...row.context, attempts }, nextSendAt: new Date(now.getTime() + RETRY_DELAY_MS) })
        .where(eq(emailEnrollment.id, row.id));
    } else {
      await db.update(emailSend).set({ status: "failed", error: error instanceof Error ? error.message.slice(0, 500) : "send failed" }).where(eq(emailSend.id, claim.id));
      await advance(row, now, null);
    }
    return "failed";
  }
}

export async function processDueEnrollments({ now = new Date(), batchSize = 25, maxBatches = 8, budgetMs = 45_000 }: { now?: Date; batchSize?: number; maxBatches?: number; budgetMs?: number } = {}) {
  const started = Date.now();
  const totals: Record<Outcome, number> & { claimed: number } = { claimed: 0, sent: 0, skipped: 0, stopped: 0, deferred: 0, failed: 0 };
  for (let batch = 0; batch < maxBatches && Date.now() - started < budgetMs; batch++) {
    const rows = await claimBatch(now, batchSize);
    if (rows.length === 0) break;
    totals.claimed += rows.length;
    for (const row of rows) {
      try {
        totals[await processEnrollment(row, now)]++;
      } catch (error) {
        totals.failed++;
        log.error("nurture enrollment failed", { scope: "nurture", enrollmentId: row.id, err: error });
        await defer(row, new Date(now.getTime() + RETRY_DELAY_MS)).catch(() => undefined);
      }
    }
    if (rows.length < batchSize) break;
  }
  return totals;
}
