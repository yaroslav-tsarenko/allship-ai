import "server-only";
import { and, desc, eq, inArray, ne, sql } from "drizzle-orm";
import { env } from "@/env";
import { bidInputSchema, type BidInput } from "@/features/loads/schema";
import { ActionError } from "@/server/actions/safe-action";
import { assertCarrierStaff, assertShipper, type Actor } from "@/server/actor";
import { db } from "@/server/db/client";
import { bid, load, loadEvent, organization, payment } from "@/server/db/schema";
import type { LoadStop } from "@/server/db/schema/loads";
import { notifyUsers, orgStaffIds } from "@/server/notifications/notify";
import { createPaymentForBid } from "@/server/payments/escrow";
import { formatUsd } from "@/lib/money";
import { refreshCarrierActivation, safely } from "@/server/nurture";

const allowUnverified = () => env.NODE_ENV !== "production" && process.env.ALLOW_UNVERIFIED_CARRIERS === "1";

export async function placeBid(actor: Actor, raw: BidInput) {
  const orgId = assertCarrierStaff(actor);
  if (actor.accountType !== "carrier") throw new ActionError("Only carrier accounts can bid.");
  if (!actor.carrierVerified && !allowUnverified()) throw new ActionError("Your company needs a verified USDOT and MC record before it can bid.");
  const input = bidInputSchema.parse(raw);
  const [target] = await db.select().from(load).where(eq(load.id, input.loadId)).limit(1);
  if (!target || target.status !== "open") throw new ActionError("This load is no longer taking bids.");
  if (target.shipperId === actor.userId) throw new ActionError("You can't bid on your own load.");
  if (target.biddingClosesAt && target.biddingClosesAt < new Date()) throw new ActionError("Bidding on this load has closed.");
  if (input.estimatedDeliveryAt < input.estimatedPickupAt) throw new ActionError("Delivery can't be before pickup.");
  const amountCents = Math.round(input.amount * 100);
  const values = {
    amountCents,
    estimatedPickupAt: new Date(`${input.estimatedPickupAt.slice(0, 10)}T12:00:00Z`),
    estimatedDeliveryAt: new Date(`${input.estimatedDeliveryAt.slice(0, 10)}T12:00:00Z`),
    message: input.message,
    aiAssisted: input.aiAssisted,
  };
  const result = await db.transaction(async (tx) => {
    const [still] = await tx.select({ status: load.status }).from(load).where(eq(load.id, target.id)).limit(1).for("share");
    if (still?.status !== "open") throw new ActionError("This load is no longer taking bids.");
    const [existing] = await tx.select({ id: bid.id }).from(bid).where(and(eq(bid.loadId, target.id), eq(bid.carrierOrgId, orgId), eq(bid.status, "active"))).limit(1);
    if (existing) {
      await tx.update(bid).set(values).where(eq(bid.id, existing.id));
      await tx.insert(loadEvent).values({ loadId: target.id, type: "bid_updated", actorId: actor.userId, payload: { bidId: existing.id, amountCents } });
      return { id: existing.id, updated: true };
    }
    const [created] = await tx.insert(bid).values({ ...values, loadId: target.id, carrierOrgId: orgId, createdBy: actor.userId }).onConflictDoNothing().returning({ id: bid.id });
    if (!created) throw new ActionError("Your company already has an active bid on this load. Refresh and update it.");
    await tx.insert(loadEvent).values({ loadId: target.id, type: "bid_placed", actorId: actor.userId, payload: { bidId: created!.id, amountCents } });
    return { id: created!.id, updated: false };
  });
  const [org] = await db.select({ name: organization.name }).from(organization).where(eq(organization.id, orgId)).limit(1);
  await notifyUsers([target.shipperId], {
    type: "bid_received",
    title: result.updated ? `${org?.name ?? "A carrier"} updated their bid` : `New bid: ${formatUsd(amountCents)}`,
    body: `${org?.name ?? "A carrier"} bid ${formatUsd(amountCents)} on "${target.title}". Compare bids and accept the one that fits.`,
    href: `/app/loads/${target.publicId}`,
    email: result.updated ? undefined : { subject: `New bid on ${target.publicId}`, actionLabel: "Compare bids" },
  });
  if (!result.updated) await safely("carrier first bid", () => refreshCarrierActivation(orgId));
  return result;
}

export async function withdrawBid(actor: Actor, bidId: string) {
  const orgId = assertCarrierStaff(actor);
  const [row] = await db.select({ id: bid.id, status: bid.status, loadId: bid.loadId }).from(bid).where(and(eq(bid.id, bidId), eq(bid.carrierOrgId, orgId))).limit(1);
  if (!row) throw new ActionError("Bid not found.");
  if (row.status !== "active") throw new ActionError("Only active bids can be withdrawn.");
  const withdrawn = await db.transaction(async (tx) => {
    await tx.select({ id: bid.id }).from(bid).where(eq(bid.id, row.id)).limit(1).for("update");
    const [target] = await tx.select({ acceptedBidId: load.acceptedBidId }).from(load).where(eq(load.id, row.loadId)).limit(1).for("update");
    if (target?.acceptedBidId === row.id) throw new ActionError("The shipper is paying for this bid right now. You can't withdraw it.");
    return tx.update(bid).set({ status: "withdrawn" }).where(and(eq(bid.id, row.id), eq(bid.status, "active"))).returning({ id: bid.id });
  });
  if (withdrawn.length === 0) throw new ActionError("Only active bids can be withdrawn.");
  await db.insert(loadEvent).values({ loadId: row.loadId, type: "bid_withdrawn", actorId: actor.userId, payload: { bidId: row.id } });
}

export async function acceptBid(actor: Actor, bidId: string) {
  assertShipper(actor);
  const [row] = await db
    .select({ bid, load })
    .from(bid)
    .innerJoin(load, eq(load.id, bid.loadId))
    .where(and(eq(bid.id, bidId), eq(load.shipperId, actor.userId)))
    .limit(1);
  if (!row) throw new ActionError("Bid not found.");
  if (row.bid.status !== "active") throw new ActionError("This bid is no longer available.");
  if (row.load.status === "awaiting_payment" && row.load.acceptedBidId !== bidId) throw new ActionError("You're already paying for another bid on this load.");
  if (row.load.status !== "open" && row.load.status !== "awaiting_payment") throw new ActionError("This load is not taking bids.");
  return createPaymentForBid(actor, row.load, row.bid);
}

export async function listCarrierBids(actor: Actor, filter: "active" | "won" | "closed") {
  const orgId = assertCarrierStaff(actor);
  const statuses: Array<(typeof bid.$inferSelect)["status"]> = filter === "active" ? ["active"] : filter === "won" ? ["accepted"] : ["withdrawn", "declined", "expired"];
  return db
    .select({
      id: bid.id,
      status: bid.status,
      amountCents: bid.amountCents,
      createdAt: bid.createdAt,
      estimatedPickupAt: bid.estimatedPickupAt,
      loadPublicId: load.publicId,
      loadTitle: load.title,
      loadStatus: load.status,
      category: load.category,
      pickup: sql<LoadStop>`jsonb_build_object('address', '', 'city', ${load.pickup}->>'city', 'state', ${load.pickup}->>'state')`,
      dropoff: sql<LoadStop>`jsonb_build_object('address', '', 'city', ${load.dropoff}->>'city', 'state', ${load.dropoff}->>'state')`,
    })
    .from(bid)
    .innerJoin(load, eq(load.id, bid.loadId))
    .where(and(eq(bid.carrierOrgId, orgId), inArray(bid.status, statuses)))
    .orderBy(desc(bid.createdAt))
    .limit(100);
}

export async function declineOtherBids(tx: Parameters<Parameters<typeof db.transaction>[0]>[0], loadId: string, acceptedBidId: string) {
  return tx.update(bid).set({ status: "declined" }).where(and(eq(bid.loadId, loadId), eq(bid.status, "active"), ne(bid.id, acceptedBidId))).returning({ carrierOrgId: bid.carrierOrgId });
}

export async function paymentForLoad(loadId: string) {
  const [row] = await db.select().from(payment).where(eq(payment.loadId, loadId)).orderBy(desc(payment.createdAt)).limit(1);
  return row ?? null;
}

export { orgStaffIds };
