import "server-only";
import { and, eq, inArray, isNull, type SQL } from "drizzle-orm";
import { log } from "@/lib/log";
import { db } from "@/server/db/client";
import { emailEnrollment, member, user } from "@/server/db/schema";
import { carrierActivated } from "./conditions";
import { firstSendAt, sequenceIds, type SequenceId } from "./schedule";

export { sequenceIds, sequences, type SequenceId } from "./schedule";

export type EnrollTarget = { email: string; userId?: string | null; leadId?: string | null; loadId?: string | null; context?: Record<string, unknown>; startAt?: Date };

export async function enroll(sequence: SequenceId, target: EnrollTarget) {
  const email = target.email.trim().toLowerCase();
  if (!sequenceIds.includes(sequence) || !email.includes("@")) return;
  const anchor = target.startAt ?? new Date();
  await db
    .insert(emailEnrollment)
    .values({
      sequence,
      email,
      userId: target.userId ?? null,
      leadId: target.leadId ?? null,
      loadId: target.loadId ?? null,
      context: { ...(target.context ?? {}), anchorAt: anchor.toISOString() },
      nextSendAt: firstSendAt(sequence, anchor),
    })
    .onConflictDoNothing();
}

type StopFilter = { email?: string; userId?: string; loadId?: string; sequence?: SequenceId; sequences?: SequenceId[] };

export async function setEnrollmentStatus(filter: StopFilter, status: "stopped" | "unsubscribed" | "completed", reason: string) {
  const where: SQL[] = [eq(emailEnrollment.status, "active")];
  if (filter.email) where.push(eq(emailEnrollment.email, filter.email.trim().toLowerCase()));
  if (filter.userId) where.push(eq(emailEnrollment.userId, filter.userId));
  if (filter.loadId) where.push(eq(emailEnrollment.loadId, filter.loadId));
  if (filter.sequence) where.push(eq(emailEnrollment.sequence, filter.sequence));
  if (filter.sequences) where.push(inArray(emailEnrollment.sequence, filter.sequences));
  if (where.length === 1 || filter.sequences?.length === 0) return 0;
  const rows = await db.update(emailEnrollment).set({ status, stopReason: reason.slice(0, 200), nextSendAt: null }).where(and(...where)).returning({ id: emailEnrollment.id });
  return rows.length;
}

export async function stopEnrollments(filter: { email?: string; userId?: string; loadId?: string; sequence?: SequenceId }, reason: string) {
  await setEnrollmentStatus(filter, "stopped", reason);
}

export async function attachUser(email: string, userId: string) {
  await db.update(emailEnrollment).set({ userId }).where(and(eq(emailEnrollment.email, email.trim().toLowerCase()), isNull(emailEnrollment.userId)));
}

export async function safely(label: string, run: () => Promise<unknown>) {
  try {
    await run();
  } catch (error) {
    log.error("nurture hook failed", { scope: "nurture", label, err: error });
  }
}

export async function enrollUser(sequence: SequenceId, userId: string, target: Omit<EnrollTarget, "email" | "userId"> = {}) {
  const [row] = await db.select({ email: user.email, firstName: user.firstName }).from(user).where(eq(user.id, userId)).limit(1);
  if (!row) return;
  await enroll(sequence, { ...target, email: row.email, userId, context: { firstName: row.firstName, ...(target.context ?? {}) } });
}

export async function refreshCarrierActivation(orgId: string) {
  const { loadNurtureState } = await import("./state");
  const owners = await db.select({ userId: member.userId }).from(member).where(eq(member.organizationId, orgId));
  if (owners.length === 0) return;
  const active = await db
    .select({ sequence: emailEnrollment.sequence, email: emailEnrollment.email, userId: emailEnrollment.userId, loadId: emailEnrollment.loadId, createdAt: emailEnrollment.createdAt, context: emailEnrollment.context })
    .from(emailEnrollment)
    .where(and(eq(emailEnrollment.sequence, "carrier_activation"), eq(emailEnrollment.status, "active"), inArray(emailEnrollment.userId, owners.map((o) => o.userId))))
    .limit(5);
  const mine = active.find((e) => e.context.orgId === orgId);
  if (!mine) return;
  const { state } = await loadNurtureState(mine, new Date());
  if (state.carrier && carrierActivated(state.carrier)) await setEnrollmentStatus({ sequence: "carrier_activation", userId: mine.userId ?? undefined, email: mine.email }, "completed", "activated");
}
