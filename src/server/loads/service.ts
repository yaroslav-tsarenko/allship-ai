import "server-only";
import { and, asc, desc, eq, gt, inArray, lt, sql } from "drizzle-orm";
import { categories } from "@/content/categories";
import { detailsSchema, LOAD_DETAILS_VERSION } from "@/features/loads/spec";
import { addDays, routeIssues, scheduleIssues } from "@/features/loads/route-rules";
import { loadInputSchema, type LoadInput } from "@/features/loads/schema";
import { cleanDetails } from "@/features/loads/wizard-model";
import { zipState } from "@/server/geo/zip";
import { ActionError } from "@/server/actions/safe-action";
import { assertShipper, type Actor } from "@/server/actor";
import { db } from "@/server/db/client";
import { bid, conversation, lead, load, loadEvent, loadMedia, organization, payment, carrierProfile, user, review } from "@/server/db/schema";
import type { LoadStatus } from "@/server/db/schema/enums";
import { safely, setEnrollmentStatus, stopEnrollments } from "@/server/nurture";
import { newPublicLoadId } from "./ids";
import { canTransition, type TransitionActor } from "./transitions";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type LoadRow = typeof load.$inferSelect;

export async function transitionLoad(
  tx: Tx,
  current: Pick<LoadRow, "id" | "status">,
  to: LoadStatus,
  actor: { kind: TransitionActor; userId: string | null },
  patch: Partial<typeof load.$inferInsert> = {},
  payload: Record<string, unknown> = {},
) {
  if (!canTransition(current.status, to, actor.kind)) {
    throw new ActionError(`This load can't move from ${current.status.replace(/_/g, " ")} to ${to.replace(/_/g, " ")}.`);
  }
  const updated = await tx
    .update(load)
    .set({ ...patch, status: to })
    .where(and(eq(load.id, current.id), eq(load.status, current.status)))
    .returning({ id: load.id });
  if (updated.length === 0) throw new ActionError("This load was just updated by someone else. Refresh and try again.");
  await tx.insert(loadEvent).values({ loadId: current.id, type: "status_changed", fromStatus: current.status, toStatus: to, actorId: actor.userId, payload });
}

function parseInput(raw: LoadInput, now = new Date()) {
  const parsed = loadInputSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    throw new ActionError(first ? `${first.path.join(" ") || "Load"}: ${first.message}` : "Check the load and try again.");
  }
  const input = parsed.data;
  const details = detailsSchema(input.category).safeParse(cleanDetails(input.details));
  if (!details.success) {
    const first = details.error.issues[0];
    throw new ActionError(first ? `${String(first.path[0] ?? "Details")}: ${first.message}` : "Check the load details.");
  }
  const issue = [...routeIssues(input.pickup, input.dropoff, input.category, zipState), ...scheduleIssues(input.pickup, input.dropoff, addDays(now.toISOString().slice(0, 10), -1))][0];
  if (issue) throw new ActionError(`${issue.path[0] === "pickup" ? "Pickup" : "Delivery"}: ${issue.message}`);
  return { input, details: details.data };
}

async function uniquePublicId(tx: Tx) {
  for (let i = 0; i < 5; i++) {
    const id = newPublicLoadId();
    const [exists] = await tx.select({ id: load.id }).from(load).where(eq(load.publicId, id)).limit(1);
    if (!exists) return id;
  }
  throw new Error("Could not allocate a load id");
}

export async function createLoad(actor: Actor, raw: LoadInput) {
  assertShipper(actor);
  const { input, details } = parseInput(raw);
  const now = new Date();
  return db.transaction(async (tx) => {
    const publicId = await uniquePublicId(tx);
    const [row] = await tx
      .insert(load)
      .values({
        publicId,
        shipperId: actor.userId,
        category: input.category,
        title: input.title,
        status: input.publish ? "open" : "draft",
        pickup: input.pickup,
        dropoff: input.dropoff,
        details: { ...details, notes: input.notes ?? null },
        detailsVersion: LOAD_DETAILS_VERSION,
        targetPriceCents: input.targetPrice ? Math.round(input.targetPrice * 100) : null,
        publishedAt: input.publish ? now : null,
        biddingClosesAt: input.publish ? new Date(now.getTime() + input.biddingDays * 86_400_000) : null,
        source: input.leadId ? "landing_quote" : "dashboard",
      })
      .returning({ id: load.id, publicId: load.publicId, status: load.status });
    if (!row) throw new Error("Insert failed");
    await tx.insert(loadEvent).values({ loadId: row.id, type: input.publish ? "published" : "created", toStatus: row.status, actorId: actor.userId });
    if (input.leadId) {
      await tx.update(lead).set({ status: "converted", userId: actor.userId }).where(and(eq(lead.id, input.leadId), eq(lead.email, actor.email)));
    }
    return row;
  });
}

export async function updateDraft(actor: Actor, loadId: string, raw: LoadInput) {
  assertShipper(actor);
  const { input, details } = parseInput(raw);
  const [current] = await db.select().from(load).where(and(eq(load.id, loadId), eq(load.shipperId, actor.userId))).limit(1);
  if (!current) throw new ActionError("Load not found.");
  if (current.status !== "draft") throw new ActionError("Only drafts can be edited. Cancel and repost to change a published load.");
  const now = new Date();
  return db.transaction(async (tx) => {
    await tx
      .update(load)
      .set({ category: input.category, title: input.title, pickup: input.pickup, dropoff: input.dropoff, details: { ...details, notes: input.notes ?? null }, targetPriceCents: input.targetPrice ? Math.round(input.targetPrice * 100) : null })
      .where(eq(load.id, loadId));
    if (input.publish) {
      await transitionLoad(tx, current, "open", { kind: "shipper", userId: actor.userId }, { publishedAt: now, biddingClosesAt: new Date(now.getTime() + input.biddingDays * 86_400_000) });
    }
    return { id: current.id, publicId: current.publicId };
  }).then(async (result) => {
    if (input.publish) await safely("load published", () => setEnrollmentStatus({ loadId: current.id, sequence: "verify_publish" }, "completed", "published"));
    return result;
  });
}

export async function cancelLoad(actor: Actor, loadId: string, reason: string) {
  const [current] = await db.select().from(load).where(eq(load.id, loadId)).limit(1);
  if (!current) throw new ActionError("Load not found.");
  const kind: TransitionActor = current.shipperId === actor.userId ? "shipper" : actor.isAdmin ? "admin" : "shipper";
  if (kind === "shipper" && current.shipperId !== actor.userId) throw new ActionError("Load not found.");
  if (!["draft", "open", "awaiting_payment"].includes(current.status)) {
    throw new ActionError(kind === "admin" ? "This load is booked. Use cancel with refund so the payment is settled." : "This load is booked. Contact support to cancel it so the refund follows the cancellation policy.");
  }
  await db.transaction(async (tx) => {
    await transitionLoad(tx, current, "cancelled", { kind, userId: actor.userId }, { cancelledReason: reason.slice(0, 500), acceptedBidId: null }, { reason });
    await tx.update(bid).set({ status: "declined" }).where(and(eq(bid.loadId, loadId), eq(bid.status, "active")));
  });
  await safely("load cancelled", () => stopEnrollments({ loadId }, "cancelled"));
  if (current.status === "awaiting_payment") {
    const { cancelPendingPayments } = await import("@/server/payments/escrow");
    await cancelPendingPayments(loadId);
  }
}

export async function relistLoad(actor: Actor, loadId: string, biddingDays = 5) {
  const [current] = await db.select().from(load).where(and(eq(load.id, loadId), eq(load.shipperId, actor.userId))).limit(1);
  if (!current) throw new ActionError("Load not found.");
  const now = new Date();
  await db.transaction((tx) => transitionLoad(tx, current, "open", { kind: "shipper", userId: actor.userId }, { publishedAt: now, biddingClosesAt: new Date(now.getTime() + biddingDays * 86_400_000) }));
}

export type ShipperLoadFilter = "active" | "drafts" | "past";

export async function listShipperLoads(actor: Actor, filter: ShipperLoadFilter) {
  const statuses: LoadStatus[] =
    filter === "drafts" ? ["draft"] : filter === "past" ? ["completed", "cancelled", "expired"] : ["open", "awaiting_payment", "booked", "assigned", "en_route_to_pickup", "in_transit", "delivered", "disputed"];
  const bidCount = db
    .select({ loadId: bid.loadId, n: sql<number>`count(*)::int`.as("n"), low: sql<number | null>`min(${bid.amountCents})::int`.as("low") })
    .from(bid)
    .where(eq(bid.status, "active"))
    .groupBy(bid.loadId)
    .as("bc");
  return db
    .select({
      id: load.id,
      publicId: load.publicId,
      title: load.title,
      category: load.category,
      status: load.status,
      pickup: load.pickup,
      dropoff: load.dropoff,
      biddingClosesAt: load.biddingClosesAt,
      createdAt: load.createdAt,
      bids: sql<number>`coalesce(${bidCount.n}, 0)`,
      lowestBidCents: bidCount.low,
    })
    .from(load)
    .leftJoin(bidCount, eq(bidCount.loadId, load.id))
    .where(and(eq(load.shipperId, actor.userId), inArray(load.status, statuses)))
    .orderBy(desc(load.updatedAt))
    .limit(100);
}

export async function getShipperLoad(actor: Actor, publicId: string) {
  const [row] = await db.select().from(load).where(and(eq(load.publicId, publicId), eq(load.shipperId, actor.userId))).limit(1);
  if (!row) return null;
  const [bids, events, payments, media, conv, rev, carrier] = await Promise.all([
    db
      .select({
        id: bid.id,
        amountCents: bid.amountCents,
        estimatedPickupAt: bid.estimatedPickupAt,
        estimatedDeliveryAt: bid.estimatedDeliveryAt,
        message: bid.message,
        status: bid.status,
        aiAssisted: bid.aiAssisted,
        origin: bid.origin,
        createdAt: bid.createdAt,
        carrierOrgId: bid.carrierOrgId,
        carrierName: organization.name,
        fmcsaStatus: carrierProfile.fmcsaStatus,
        usdot: carrierProfile.usdotNumber,
        rating: sql<number | null>`(select round(avg(${review.rating})::numeric, 1)::float from ${review} where ${review.carrierOrgId} = ${bid.carrierOrgId})`,
        reviews: sql<number>`(select count(*)::int from ${review} where ${review.carrierOrgId} = ${bid.carrierOrgId})`,
        completedLoads: sql<number>`(select count(*)::int from ${load} l2 where l2.carrier_org_id = ${bid.carrierOrgId} and l2.status = 'completed')`,
      })
      .from(bid)
      .innerJoin(organization, eq(organization.id, bid.carrierOrgId))
      .leftJoin(carrierProfile, eq(carrierProfile.orgId, bid.carrierOrgId))
      .where(eq(bid.loadId, row.id))
      .orderBy(asc(bid.amountCents)),
    db.select({ id: loadEvent.id, type: loadEvent.type, toStatus: loadEvent.toStatus, createdAt: loadEvent.createdAt, payload: loadEvent.payload }).from(loadEvent).where(eq(loadEvent.loadId, row.id)).orderBy(asc(loadEvent.createdAt)),
    db.select().from(payment).where(eq(payment.loadId, row.id)).orderBy(desc(payment.createdAt)),
    db.select().from(loadMedia).where(eq(loadMedia.loadId, row.id)),
    db.select({ id: conversation.id, carrierOrgId: conversation.carrierOrgId, kind: conversation.kind }).from(conversation).where(eq(conversation.loadId, row.id)),
    db.select().from(review).where(eq(review.loadId, row.id)).limit(1),
    row.carrierOrgId ? db.select({ name: organization.name, phone: carrierProfile.phone, usdot: carrierProfile.usdotNumber }).from(organization).leftJoin(carrierProfile, eq(carrierProfile.orgId, organization.id)).where(eq(organization.id, row.carrierOrgId)).limit(1) : Promise.resolve([]),
  ]);
  return { load: row, bids, events, payments, media, conversations: conv, review: rev[0] ?? null, carrier: carrier[0] ?? null };
}

const publicFields = {
  id: load.id,
  publicId: load.publicId,
  title: load.title,
  category: load.category,
  status: load.status,
  pickupCity: sql<string>`${load.pickup}->>'city'`,
  pickupState: sql<string>`${load.pickup}->>'state'`,
  pickupDate: sql<string>`${load.pickup}->>'windowStart'`,
  dropoffCity: sql<string>`${load.dropoff}->>'city'`,
  dropoffState: sql<string>`${load.dropoff}->>'state'`,
  dropoffDate: sql<string>`${load.dropoff}->>'windowStart'`,
  distanceMiles: load.distanceMiles,
  biddingClosesAt: load.biddingClosesAt,
  publishedAt: load.publishedAt,
  bids: sql<number>`(select count(*)::int from ${bid} where ${bid.loadId} = "load"."id" and ${bid.status} = 'active')`,
};

export async function listOpenLoads({ categories, states, limit = 50 }: { categories?: string[]; states?: string[]; limit?: number } = {}) {
  const now = new Date();
  const conditions = [eq(load.status, "open"), gt(load.biddingClosesAt, now)];
  if (categories?.length) conditions.push(inArray(load.category, categories as LoadRow["category"][]));
  if (states?.length) conditions.push(sql`(${load.pickup}->>'state' = any(${states}) or ${load.dropoff}->>'state' = any(${states}))`);
  return db.select(publicFields).from(load).where(and(...conditions)).orderBy(desc(load.publishedAt)).limit(limit);
}

export async function getLoadForCarrier(actor: Actor, publicId: string) {
  const [row] = await db.select().from(load).where(eq(load.publicId, publicId)).limit(1);
  if (!row) return null;
  const sameOrg = row.carrierOrgId !== null && row.carrierOrgId === actor.orgId;
  const booked = sameOrg && (actor.orgRole === "owner" || actor.orgRole === "dispatcher" || row.driverId === actor.userId);
  if (!booked && row.status !== "open") return null;
  const [myBid] = actor.orgId ? await db.select().from(bid).where(and(eq(bid.loadId, row.id), eq(bid.carrierOrgId, actor.orgId))).orderBy(desc(bid.createdAt)).limit(1) : [];
  const [competition] = await db.select({ n: sql<number>`count(*)::int` }).from(bid).where(and(eq(bid.loadId, row.id), eq(bid.status, "active")));
  const [shipper] = booked ? await db.select({ name: user.name, phone: user.phone }).from(user).where(eq(user.id, row.shipperId)).limit(1) : [];
  const redact = (s: LoadRow["pickup"]) => (booked ? s : { city: s.city, state: s.state, postalCode: s.postalCode?.slice(0, 3), windowStart: s.windowStart, windowEnd: s.windowEnd, address: "" });
  const visible = booked ? row : { ...row, shipperId: "", acceptedBidId: null, carrierOrgId: null, driverId: null, cancelledReason: null, podRecipientName: null };
  return {
    load: { ...visible, pickup: redact(row.pickup), dropoff: redact(row.dropoff) },
    booked,
    myBid: myBid ?? null,
    bidCount: competition?.n ?? 0,
    shipper: shipper ?? null,
  };
}

export async function expireStaleLoads() {
  const now = new Date();
  const stale = await db.select({ id: load.id, status: load.status }).from(load).where(and(eq(load.status, "open"), lt(load.biddingClosesAt, now))).limit(200);
  for (const row of stale) {
    await db.transaction(async (tx) => {
      await transitionLoad(tx, row, "expired", { kind: "system", userId: null });
      await tx.update(bid).set({ status: "expired" }).where(and(eq(bid.loadId, row.id), eq(bid.status, "active")));
    });
    await safely("load expired", () => stopEnrollments({ loadId: row.id }, "expired"));
  }
  return stale.length;
}

export const categoryLabel = (key: string) => categories.find((c) => c.key === key)?.name ?? key;

type PublicStop = { address: string; city: string; state: string; postalCode: string; windowStart: string; windowEnd?: string; lat?: number; lng?: number; placeId?: string };

export async function createPublicLoad(input: {
  shipperId: string;
  category: LoadRow["category"];
  title: string;
  pickup: PublicStop;
  dropoff: PublicStop;
  details: Record<string, unknown>;
  notes: string | null;
  publish: boolean;
  biddingDays?: number;
}) {
  const now = new Date();
  const biddingDays = input.biddingDays ?? 5;
  return db.transaction(async (tx) => {
    const publicId = await uniquePublicId(tx);
    const [row] = await tx
      .insert(load)
      .values({
        publicId,
        shipperId: input.shipperId,
        category: input.category,
        title: input.title,
        status: input.publish ? "open" : "draft",
        pickup: input.pickup,
        dropoff: input.dropoff,
        details: { ...input.details, notes: input.notes },
        detailsVersion: LOAD_DETAILS_VERSION,
        publishedAt: input.publish ? now : null,
        biddingClosesAt: input.publish ? new Date(now.getTime() + biddingDays * 86_400_000) : null,
        biddingDays,
        publishOnVerify: !input.publish,
        source: "landing_quote",
      })
      .returning({ id: load.id, publicId: load.publicId, status: load.status, title: load.title });
    if (!row) throw new Error("Insert failed");
    await tx.insert(loadEvent).values({ loadId: row.id, type: input.publish ? "published" : "created", toStatus: row.status, actorId: input.shipperId, payload: { source: "public_form" } });
    return row;
  });
}

export async function publishPendingLoads(userId: string) {
  const pending = await db
    .select({ id: load.id, publicId: load.publicId, status: load.status, title: load.title, biddingDays: load.biddingDays })
    .from(load)
    .where(and(eq(load.shipperId, userId), eq(load.status, "draft"), eq(load.publishOnVerify, true)))
    .orderBy(asc(load.createdAt));
  const published: Array<{ id: string; publicId: string; title: string }> = [];
  for (const row of pending) {
    const now = new Date();
    await db.transaction((tx) =>
      transitionLoad(tx, row, "open", { kind: "shipper", userId }, { publishedAt: now, biddingClosesAt: new Date(now.getTime() + row.biddingDays * 86_400_000), publishOnVerify: false }, { via: "email_confirmation" }),
    );
    published.push({ id: row.id, publicId: row.publicId, title: row.title });
  }
  if (published.length) {
    const { createInstantBid } = await import("@/server/matcher/service");
    await Promise.allSettled(published.map((r) => createInstantBid(r.id)));
  }
  return published;
}

export async function getPublicLoad(publicId: string) {
  const [row] = await db
    .select({ ...publicFields, details: load.details, pickupZip: sql<string | null>`left(${load.pickup}->>'postalCode', 3)`, dropoffZip: sql<string | null>`left(${load.dropoff}->>'postalCode', 3)`, pickupEnd: sql<string | null>`${load.pickup}->>'windowEnd'`, dropoffEnd: sql<string | null>`${load.dropoff}->>'windowEnd'` })
    .from(load)
    .where(eq(load.publicId, publicId))
    .limit(1);
  return row ?? null;
}
