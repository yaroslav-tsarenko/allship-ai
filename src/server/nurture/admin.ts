import "server-only";
import { and, count, countDistinct, desc, eq, ilike, inArray, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/server/db/client";
import { emailEnrollment, emailOptOut, emailSend, emailSuppression, load } from "@/server/db/schema";
import { ADMIN_PAGE_SIZE } from "@/server/admin/queries";
import { sequenceIds, sequences, type SequenceId } from "./schedule";

export const enrollmentStatuses = ["active", "completed", "stopped", "unsubscribed"] as const;
export type EnrollmentStatus = (typeof enrollmentStatuses)[number];

export async function listEnrollments({ sequence, status, q, page }: { sequence?: SequenceId; status?: EnrollmentStatus; q?: string; page: number }) {
  const base: SQL[] = [];
  if (sequence) base.push(eq(emailEnrollment.sequence, sequence));
  if (q) base.push(or(ilike(emailEnrollment.email, `%${q.replace(/[%_\\]/g, "\\$&")}%`), ilike(load.publicId, `%${q.replace(/[%_\\]/g, "\\$&")}%`))!);
  const where = [...base, ...(status ? [eq(emailEnrollment.status, status)] : [])];
  const offset = (page - 1) * ADMIN_PAGE_SIZE;
  const [rows, [total], byStatus] = await Promise.all([
    db
      .select({
        id: emailEnrollment.id,
        sequence: emailEnrollment.sequence,
        email: emailEnrollment.email,
        step: emailEnrollment.step,
        status: emailEnrollment.status,
        nextSendAt: emailEnrollment.nextSendAt,
        lastSentAt: emailEnrollment.lastSentAt,
        stopReason: emailEnrollment.stopReason,
        createdAt: emailEnrollment.createdAt,
        publicId: load.publicId,
      })
      .from(emailEnrollment)
      .leftJoin(load, eq(load.id, emailEnrollment.loadId))
      .where(where.length ? and(...where) : undefined)
      .orderBy(desc(emailEnrollment.createdAt))
      .limit(ADMIN_PAGE_SIZE)
      .offset(offset),
    db.select({ n: count() }).from(emailEnrollment).leftJoin(load, eq(load.id, emailEnrollment.loadId)).where(where.length ? and(...where) : undefined),
    db
      .select({ status: emailEnrollment.status, n: count() })
      .from(emailEnrollment)
      .leftJoin(load, eq(load.id, emailEnrollment.loadId))
      .where(base.length ? and(...base) : undefined)
      .groupBy(emailEnrollment.status),
  ]);
  const totalCount = Number(total?.n ?? 0);
  const counts: Record<string, number> = { all: 0 };
  for (const r of byStatus) {
    counts[r.status] = Number(r.n);
    counts.all! += Number(r.n);
  }
  return { rows, total: totalCount, page, pageCount: Math.max(1, Math.ceil(totalCount / ADMIN_PAGE_SIZE)), counts };
}

export async function recentSends(limit = 30) {
  return db
    .select({ id: emailSend.id, sequence: emailSend.sequence, step: emailSend.step, email: emailSend.email, subject: emailSend.subject, template: emailSend.template, status: emailSend.status, error: emailSend.error, createdAt: emailSend.createdAt })
    .from(emailSend)
    .orderBy(desc(emailSend.createdAt))
    .limit(limit);
}

export async function listSuppressions(limit = 50) {
  const [suppressed, optOuts] = await Promise.all([
    db.select().from(emailSuppression).orderBy(desc(emailSuppression.createdAt)).limit(limit),
    db.select().from(emailOptOut).orderBy(desc(emailOptOut.createdAt)).limit(limit),
  ]);
  return { suppressed, optOuts };
}

export type FunnelRow = { sequence: SequenceId; label: string; enrolled: number; active: number; steps: number[]; converted: number; unsubscribed: number };

export async function sequenceFunnels(): Promise<FunnelRow[]> {
  const [statusRows, stepRows, convertedRows] = await Promise.all([
    db.select({ sequence: emailEnrollment.sequence, status: emailEnrollment.status, n: count() }).from(emailEnrollment).groupBy(emailEnrollment.sequence, emailEnrollment.status),
    db
      .select({ sequence: emailSend.sequence, step: emailSend.step, n: countDistinct(emailSend.enrollmentId) })
      .from(emailSend)
      .where(eq(emailSend.status, "sent"))
      .groupBy(emailSend.sequence, emailSend.step),
    db
      .select({ sequence: emailEnrollment.sequence, reason: emailEnrollment.stopReason, n: count() })
      .from(emailEnrollment)
      .where(inArray(emailEnrollment.stopReason, [...new Set(sequenceIds.flatMap((s) => sequences[s].conversions))]))
      .groupBy(emailEnrollment.sequence, emailEnrollment.stopReason),
  ]);
  return sequenceIds.map((sequence) => {
    const def = sequences[sequence];
    const statuses = statusRows.filter((r) => r.sequence === sequence);
    return {
      sequence,
      label: def.label,
      enrolled: statuses.reduce((sum, r) => sum + Number(r.n), 0),
      active: Number(statuses.find((r) => r.status === "active")?.n ?? 0),
      unsubscribed: Number(statuses.find((r) => r.status === "unsubscribed")?.n ?? 0),
      steps: def.steps.map((_, i) => Number(stepRows.find((r) => r.sequence === sequence && r.step === i)?.n ?? 0)),
      converted: convertedRows.filter((r) => r.sequence === sequence && r.reason && def.conversions.includes(r.reason)).reduce((sum, r) => sum + Number(r.n), 0),
    };
  });
}

export async function adminStopEnrollment(id: string) {
  const rows = await db
    .update(emailEnrollment)
    .set({ status: "stopped", stopReason: "admin", nextSendAt: null })
    .where(and(eq(emailEnrollment.id, id), eq(emailEnrollment.status, "active")))
    .returning({ id: emailEnrollment.id });
  return rows.length > 0;
}

export async function adminResumeEnrollment(id: string) {
  const [row] = await db.select({ email: emailEnrollment.email, sequence: emailEnrollment.sequence, step: emailEnrollment.step, status: emailEnrollment.status }).from(emailEnrollment).where(eq(emailEnrollment.id, id)).limit(1);
  if (!row || row.status === "active") return { ok: false as const, reason: "This enrollment is already active." };
  if (row.status === "unsubscribed") return { ok: false as const, reason: "The recipient unsubscribed. Only they can opt back in." };
  const def = sequences[row.sequence as SequenceId];
  if (!def || row.step >= def.steps.length) return { ok: false as const, reason: "Every step in this sequence was already handled." };
  await db
    .update(emailEnrollment)
    .set({ status: "active", stopReason: null, nextSendAt: new Date(), context: sql`${emailEnrollment.context} || '{"attempts":0}'::jsonb` })
    .where(eq(emailEnrollment.id, id));
  return { ok: true as const };
}
