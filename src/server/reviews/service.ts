import "server-only";
import { and, avg, count, desc, eq } from "drizzle-orm";
import { ActionError } from "@/server/actions/safe-action";
import type { Actor } from "@/server/actor";
import { db } from "@/server/db/client";
import { load, review, user } from "@/server/db/schema";
import { notifyUsers, orgStaffIds } from "@/server/notifications/notify";
import { safely, setEnrollmentStatus } from "@/server/nurture";
import { loadWithRole } from "@/server/trips/access";

export async function createReview(actor: Actor, loadId: string, input: { rating: number; body?: string }) {
  const { load: row } = await loadWithRole(actor, loadId, ["shipper"]);
  if (row.status !== "completed" || !row.carrierOrgId) throw new ActionError("You can review the carrier after the load is complete.");
  const rating = Math.round(input.rating);
  if (rating < 1 || rating > 5) throw new ActionError("Pick a rating from 1 to 5.");
  const [created] = await db
    .insert(review)
    .values({ loadId: row.id, shipperId: actor.userId, carrierOrgId: row.carrierOrgId, rating, body: input.body?.trim() || null })
    .onConflictDoNothing({ target: review.loadId })
    .returning();
  if (!created) throw new ActionError("You already reviewed this load.");
  await safely("review created", () => setEnrollmentStatus({ loadId: row.id, sequence: "post_delivery" }, "completed", "reviewed"));
  await notifyUsers(await orgStaffIds(row.carrierOrgId), {
    type: "review_received",
    title: `New ${rating}-star review`,
    body: input.body ? `"${input.body.slice(0, 140)}"` : `For ${row.publicId} "${row.title}".`,
    href: "/app/reviews",
  });
  return created;
}

export async function replyToReview(actor: Actor, reviewId: string, reply: string) {
  if (!actor.orgId || (actor.orgRole !== "owner" && actor.orgRole !== "dispatcher")) throw new ActionError("Only carrier owners and dispatchers can reply.");
  const updated = await db
    .update(review)
    .set({ carrierReply: reply.trim().slice(0, 1000), carrierRepliedAt: new Date() })
    .where(and(eq(review.id, reviewId), eq(review.carrierOrgId, actor.orgId)))
    .returning({ id: review.id });
  if (updated.length === 0) throw new ActionError("Review not found.");
}

export async function reviewsForCarrier(orgId: string, limit = 50) {
  const [summary] = await db.select({ average: avg(review.rating), total: count() }).from(review).where(eq(review.carrierOrgId, orgId));
  const rows = await db
    .select({ id: review.id, rating: review.rating, body: review.body, carrierReply: review.carrierReply, carrierRepliedAt: review.carrierRepliedAt, createdAt: review.createdAt, loadPublicId: load.publicId, loadTitle: load.title, shipperFirstName: user.firstName })
    .from(review)
    .innerJoin(load, eq(load.id, review.loadId))
    .innerJoin(user, eq(user.id, review.shipperId))
    .where(eq(review.carrierOrgId, orgId))
    .orderBy(desc(review.createdAt))
    .limit(limit);
  return { average: summary?.average ? Number(summary.average) : null, total: summary?.total ?? 0, reviews: rows };
}
