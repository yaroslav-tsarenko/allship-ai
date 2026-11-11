import "server-only";
import { and, asc, count, eq, inArray, ne, sql } from "drizzle-orm";
import { env } from "@/env";
import { categories } from "@/content/categories";
import { LOAD_DETAILS_VERSION } from "@/features/loads/spec";
import { moveCategory, packingLevels, priceMove, quoteMiles, rankMatches, type MatchLabel, volumeForBedrooms, type PackingLevel, type QuoteLine, type RateTier } from "@/features/moving/pricing";
import { residenceLabel, type MoveRequestData } from "@/features/moving/schema";
import { feeFor, formatUsd } from "@/lib/money";
import { log } from "@/lib/log";
import { db } from "@/server/db/client";
import { bid, carrierProfile, carrierRateTier, carrierServiceRates, load, loadEvent, member, organization, review } from "@/server/db/schema";
import type { LoadStop } from "@/server/db/schema/loads";
import { newPublicLoadId } from "@/server/loads/ids";
import { notifyUsers, orgStaffIds } from "@/server/notifications/notify";
import { enroll } from "@/server/nurture";
import { getStripe } from "@/server/payments/stripe";
import { resolveRoute, type Place, type ResolvedRoute } from "./geo";

export const MAX_MATCHES = 6;

export type Match = {
  carrierOrgId: string;
  name: string;
  logo: string | null;
  verified: boolean;
  yearsInBusiness: number | null;
  rating: number | null;
  reviewCount: number;
  completedLoads: number;
  lines: QuoteLine[];
  ratePerCuFtCents: number;
  carrierCents: number;
  platformFeeCents: number;
  shipperTotalCents: number;
  labels: MatchLabel[];
};

export type MatchRoute = { from: string; to: string; miles: number; method: ResolvedRoute["method"]; category: "local_moving" | "long_distance_moving" };

export type MatchResult =
  | { ok: true; route: MatchRoute; volumeCuFt: number; matches: Match[]; requirements: string[] }
  | { ok: false; field: "from" | "to"; message: string };

export const TEST_MOVER_SLUG = "allship-test-mover";
export const TEST_LANE = { from: "99501", to: "99503", bedrooms: 8 } as const;
const TEST_MOVER_CENTS = 1000;

export const isTestLane = (req: Pick<MoveRequestData, "bedrooms">, route: Pick<ResolvedRoute, "origin" | "destination">) =>
  req.bedrooms === TEST_LANE.bedrooms && route.origin.postalCode === TEST_LANE.from && route.destination.postalCode === TEST_LANE.to;

const allowUnverified = () => env.NODE_ENV !== "production" && process.env.ALLOW_UNVERIFIED_CARRIERS === "1";

export function requirementsOf(req: Pick<MoveRequestData, "insurance" | "climateControlled" | "longTerm" | "storage">) {
  const out: string[] = [];
  if (req.insurance) out.push("Full value protection (insurance) requested");
  if (req.climateControlled) out.push("Climate-controlled storage or transport requested");
  if (req.longTerm) out.push("Long-term storage requested");
  return out;
}

type Candidate = {
  orgId: string;
  name: string;
  logo: string | null;
  fmcsaStatus: string;
  yearsInBusiness: number | null;
  minMiles: number;
  maxMiles: number;
  serviceStates: string[];
};

async function loadCandidates(route: { originState: string; destinationState: string; miles: number }, testLane: boolean, onlyOrgId?: string) {
  const miles = quoteMiles(route.miles);
  const where = [
    testLane ? eq(organization.slug, TEST_MOVER_SLUG) : ne(organization.slug, TEST_MOVER_SLUG),
    eq(carrierProfile.instantQuotes, true),
    sql`${carrierProfile.instantQuoteMinMiles} <= ${miles}`,
    sql`${carrierProfile.instantQuoteMaxMiles} >= ${miles}`,
    sql`(cardinality(${carrierProfile.serviceStates}) = 0 or ${carrierProfile.serviceStates} && array[${route.originState}, ${route.destinationState}]::text[])`,
    sql`exists (select 1 from ${member} where ${member.organizationId} = ${carrierProfile.orgId} and ${member.role} = 'owner')`,
  ];
  if (!allowUnverified()) where.push(inArray(carrierProfile.fmcsaStatus, ["verified", "manual_review"]));
  if (getStripe()) where.push(sql`(${carrierProfile.payoutsEnabled} or ${carrierProfile.fmcsaStatus} = 'manual_review')`);
  if (onlyOrgId) where.push(eq(carrierProfile.orgId, onlyOrgId));
  const rows: Candidate[] = await db
    .select({
      orgId: carrierProfile.orgId,
      name: sql<string>`coalesce(${carrierProfile.dbaName}, ${organization.name})`,
      logo: organization.logo,
      fmcsaStatus: carrierProfile.fmcsaStatus,
      yearsInBusiness: carrierProfile.yearsInBusiness,
      minMiles: carrierProfile.instantQuoteMinMiles,
      maxMiles: carrierProfile.instantQuoteMaxMiles,
      serviceStates: carrierProfile.serviceStates,
    })
    .from(carrierProfile)
    .innerJoin(organization, eq(organization.id, carrierProfile.orgId))
    .where(and(...where));
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.orgId);
  const [tiers, rates, reviews, completed] = await Promise.all([
    db.select().from(carrierRateTier).where(inArray(carrierRateTier.orgId, ids)).orderBy(asc(carrierRateTier.orgId), asc(carrierRateTier.fromMiles)),
    db.select().from(carrierServiceRates).where(inArray(carrierServiceRates.orgId, ids)),
    db
      .select({ orgId: review.carrierOrgId, avg: sql<number>`avg(${review.rating})::float`, n: count() })
      .from(review)
      .where(inArray(review.carrierOrgId, ids))
      .groupBy(review.carrierOrgId),
    db
      .select({ orgId: load.carrierOrgId, n: count() })
      .from(load)
      .where(and(inArray(load.carrierOrgId, ids), eq(load.status, "completed")))
      .groupBy(load.carrierOrgId),
  ]);
  return rows.map((r) => ({
    ...r,
    tiers: tiers.filter((t) => t.orgId === r.orgId) as RateTier[],
    rates: rates.find((x) => x.orgId === r.orgId) ?? null,
    rating: reviews.find((x) => x.orgId === r.orgId) ?? null,
    completedLoads: completed.find((x) => x.orgId === r.orgId)?.n ?? 0,
  }));
}

function requestOf(req: MoveRequestData, miles: number) {
  return { volumeCuFt: volumeForBedrooms(req.bedrooms), miles, packing: req.packing as PackingLevel, unpacking: req.unpacking, storageMonths: req.storage ? req.storageMonths : 0 };
}

export async function priceCandidates(req: MoveRequestData, route: ResolvedRoute, onlyOrgId?: string) {
  const testLane = isTestLane(req, route);
  const candidates = await loadCandidates({ originState: route.origin.state, destinationState: route.destination.state, miles: route.miles }, testLane, onlyOrgId);
  const priced: Omit<Match, "labels">[] = [];
  for (const c of candidates) {
    const quote = testLane
      ? { tier: { fromMiles: 0, toMiles: 0, ratePerCuFtCents: 0 }, carrierCents: TEST_MOVER_CENTS, lines: [{ key: "transport" as const, label: "Payment test", detail: "not a real move, refund it in Square", cents: TEST_MOVER_CENTS }] }
      : priceMove(c.tiers, c.rates, requestOf(req, route.miles));
    if (!quote) continue;
    const split = feeFor(quote.carrierCents, env.PLATFORM_FEE_BPS);
    priced.push({
      carrierOrgId: c.orgId,
      name: c.name,
      logo: c.logo,
      verified: c.fmcsaStatus === "verified",
      yearsInBusiness: c.yearsInBusiness,
      rating: c.rating ? Math.round(c.rating.avg * 10) / 10 : null,
      reviewCount: c.rating?.n ?? 0,
      completedLoads: c.completedLoads,
      lines: quote.lines,
      ratePerCuFtCents: quote.tier.ratePerCuFtCents,
      carrierCents: split.carrierAmountCents,
      platformFeeCents: split.platformFeeCents,
      shipperTotalCents: split.shipperTotalCents,
    });
  }
  return priced;
}

export async function findMatches(req: MoveRequestData): Promise<MatchResult & { resolved?: ResolvedRoute }> {
  const route = await resolveRoute(req.from, req.to);
  if ("error" in route) {
    return route.error === "origin"
      ? { ok: false, field: "from", message: "We couldn't find that place. Enter a 5-digit ZIP code or a city and state, like Austin, TX." }
      : { ok: false, field: "to", message: "We couldn't find that place. Enter a 5-digit ZIP code or a city and state, like Denver, CO." };
  }
  const matches = rankMatches(await priceCandidates(req, route), MAX_MATCHES);
  return {
    ok: true,
    resolved: route,
    route: { from: route.origin.label, to: route.destination.label, miles: route.miles, method: route.method, category: moveCategory(route.miles) },
    volumeCuFt: volumeForBedrooms(req.bedrooms),
    matches,
    requirements: requirementsOf(req),
  };
}

const bedroomDetail = (bedrooms: number, category: "local_moving" | "long_distance_moving") => {
  if (category === "local_moving") return bedrooms >= 5 ? "5+" : String(bedrooms);
  return bedrooms >= 7 ? "7+" : String(bedrooms);
};

const packingDetail: Record<PackingLevel, string> = { none: "I'll pack", quarter: "Fragile items only", half: "Partial packing", full: "Full packing" };

function stopOf(place: Place, date: string): LoadStop & { windowStart: string } {
  return {
    address: place.precision === "exact" ? place.label : "",
    city: place.city,
    state: place.state,
    postalCode: place.postalCode,
    placeId: place.placeId,
    lat: place.lat,
    lng: place.lng,
    windowStart: date,
  };
}

export type InstantQuoteRecord = {
  carrierOrgId: string;
  carrierName: string;
  carrierCents: number;
  lines: QuoteLine[];
  miles: number;
  distanceMethod: ResolvedRoute["method"];
  volumeCuFt: number;
  quotedAt: string;
  bidId?: string;
};

export function buildMoveLoad(req: MoveRequestData, route: ResolvedRoute, quote: InstantQuoteRecord | null) {
  const category = moveCategory(route.miles);
  const volumeCuFt = quote?.volumeCuFt ?? volumeForBedrooms(req.bedrooms);
  const services: string[] = [];
  if (req.packing !== "none" || req.unpacking) services.push("Packing and unpacking");
  if (req.storage) services.push("Storage");
  const details: Record<string, unknown> = {
    residence: residenceLabel[req.moveType],
    bedrooms: bedroomDetail(req.bedrooms, category),
    services,
  };
  if (category === "long_distance_moving") {
    details.packing = packingDetail[req.packing as PackingLevel];
    if (req.storage && req.storageMonths > 0) details.storageMonths = req.storageMonths;
  }
  const extras = [
    `${volumeCuFt.toLocaleString("en-US")} ft³ estimated from ${req.bedrooms} ${req.bedrooms === 1 ? "bedroom" : "bedrooms"}.`,
    req.packing !== "none" ? `${packingLevels[req.packing as PackingLevel].label}.` : null,
    req.unpacking ? "Unpacking at the new home." : null,
    req.storage ? `Storage for ${req.storageMonths} ${req.storageMonths === 1 ? "month" : "months"}.` : null,
    ...requirementsOf(req).map((r) => `${r}.`),
    quote ? `Booked from ${quote.carrierName}'s instant quote at ${formatUsd(quote.carrierCents)}. Other carriers can still bid.` : "Posted from the moving page for bids from verified movers.",
  ].filter(Boolean);
  details.notes = extras.join("\n");
  if (quote) details.instantQuote = quote;
  details.moveRequest = {
    moveType: req.moveType,
    bedrooms: req.bedrooms,
    packing: req.packing,
    unpacking: req.unpacking,
    storageMonths: req.storage ? req.storageMonths : 0,
    climateControlled: req.climateControlled,
    insurance: req.insurance,
    longTerm: req.longTerm,
  };
  const title = `Moving from ${route.origin.city}, ${route.origin.state} to ${route.destination.city}, ${route.destination.state}`.slice(0, 100);
  return {
    category,
    title,
    pickup: stopOf(route.origin, req.pickupDate),
    dropoff: stopOf(route.destination, req.deliveryDate || req.pickupDate),
    distanceMiles: route.miles,
    estimatedVolumeCuFt: volumeCuFt,
    details,
    detailsVersion: LOAD_DETAILS_VERSION,
    categoryName: categories.find((c) => c.key === category)?.name ?? "Moving",
  };
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function insertMoveLoad(tx: Tx, shipperId: string, built: ReturnType<typeof buildMoveLoad>, opts: { publish: boolean; publishOnVerify: boolean; biddingDays?: number }) {
  const now = new Date();
  const biddingDays = opts.biddingDays ?? 5;
  let publicId = newPublicLoadId();
  for (let i = 0; i < 5; i++) {
    const [exists] = await tx.select({ id: load.id }).from(load).where(eq(load.publicId, publicId)).limit(1);
    if (!exists) break;
    publicId = newPublicLoadId();
  }
  const [row] = await tx
    .insert(load)
    .values({
      publicId,
      shipperId,
      category: built.category,
      title: built.title,
      status: opts.publish ? "open" : "draft",
      pickup: built.pickup,
      dropoff: built.dropoff,
      distanceMiles: built.distanceMiles,
      details: built.details,
      detailsVersion: built.detailsVersion,
      estimatedVolumeCuFt: built.estimatedVolumeCuFt,
      publishedAt: opts.publish ? now : null,
      biddingClosesAt: opts.publish ? new Date(now.getTime() + biddingDays * 86_400_000) : null,
      biddingDays,
      publishOnVerify: opts.publishOnVerify,
      source: "landing_quote",
    })
    .returning({ id: load.id, publicId: load.publicId, status: load.status });
  if (!row) throw new Error("Insert failed");
  await tx.insert(loadEvent).values({ loadId: row.id, type: opts.publish ? "published" : "created", toStatus: row.status, actorId: shipperId, payload: { source: built.details.instantQuote ? "instant_quote" : "moving_bid_request" } });
  return row;
}

export function instantQuoteOf(details: unknown): InstantQuoteRecord | null {
  const q = (details as { instantQuote?: InstantQuoteRecord } | null)?.instantQuote;
  return q && typeof q.carrierOrgId === "string" && typeof q.carrierCents === "number" ? q : null;
}

function bidMessage(q: InstantQuoteRecord, method: ResolvedRoute["method"]) {
  const parts = q.lines.map((l) => `${l.label} ${formatUsd(l.cents)} (${l.detail})`);
  const distance = `${Math.round(q.miles).toLocaleString("en-US")} miles${method === "estimated" ? ", estimated" : ""}`;
  return `Instant quote from your published rates: ${parts.join("; ")}. Total ${formatUsd(q.carrierCents)} for ${q.volumeCuFt.toLocaleString("en-US")} ft³ over ${distance}. Final inventory, access and dates are confirmed with the shipper before pickup.`;
}

export async function createInstantBid(loadId: string) {
  const [target] = await db.select().from(load).where(eq(load.id, loadId)).limit(1);
  if (!target || target.status !== "open") return null;
  const quote = instantQuoteOf(target.details);
  if (!quote) return null;
  if (quote.bidId) return { bidId: quote.bidId, created: false };
  const [owner] = await db
    .select({ userId: member.userId })
    .from(member)
    .where(and(eq(member.organizationId, quote.carrierOrgId), eq(member.role, "owner")))
    .orderBy(asc(member.createdAt))
    .limit(1);
  if (!owner) {
    log.warn("instant quote carrier has no owner", { scope: "matcher", loadId, carrierOrgId: quote.carrierOrgId });
    return null;
  }
  const pickupAt = new Date(`${target.pickup.windowStart ?? new Date().toISOString().slice(0, 10)}T12:00:00Z`);
  const deliveryAt = new Date(`${(target.dropoff.windowStart ?? target.pickup.windowStart ?? new Date().toISOString()).slice(0, 10)}T12:00:00Z`);
  const created = await db.transaction(async (tx) => {
    const [locked] = await tx.select({ status: load.status, details: load.details }).from(load).where(eq(load.id, target.id)).limit(1).for("update");
    if (locked?.status !== "open") return null;
    const current = instantQuoteOf(locked.details);
    if (current?.bidId) return { id: current.bidId, fresh: false };
    const [row] = await tx
      .insert(bid)
      .values({
        loadId: target.id,
        carrierOrgId: quote.carrierOrgId,
        createdBy: owner.userId,
        amountCents: quote.carrierCents,
        estimatedPickupAt: pickupAt,
        estimatedDeliveryAt: deliveryAt < pickupAt ? pickupAt : deliveryAt,
        message: bidMessage(quote, quote.distanceMethod),
        origin: "instant_quote",
      })
      .onConflictDoNothing()
      .returning({ id: bid.id });
    if (!row) return null;
    await tx
      .update(load)
      .set({ details: { ...locked.details, instantQuote: { ...quote, bidId: row.id } } })
      .where(eq(load.id, target.id));
    await tx.insert(loadEvent).values({ loadId: target.id, type: "bid_placed", actorId: owner.userId, payload: { bidId: row.id, amountCents: quote.carrierCents, origin: "instant_quote" } });
    return { id: row.id, fresh: true };
  });
  if (!created) return null;
  if (created.fresh) {
    const staff = await orgStaffIds(quote.carrierOrgId);
    await Promise.allSettled([
      notifyUsers(staff, {
        type: "instant_booking",
        title: "Instant booking request at your rates",
        body: `A shipper chose your instant quote of ${formatUsd(quote.carrierCents)} for "${target.title}". We placed the bid for you. Withdraw it within 24 hours if you can't take this move.`,
        href: `/app/board/${target.publicId}`,
        email: { subject: `Instant booking request: ${target.publicId}`, actionLabel: "Review the move" },
      }),
      notifyUsers([target.shipperId], {
        type: "bid_received",
        title: `${quote.carrierName} is on your move at ${formatUsd(quote.carrierCents)}`,
        body: `Your instant quote from ${quote.carrierName} is now a bid on "${target.title}". Accept and pay to book, or wait for other carriers to bid.`,
        href: `/app/loads/${target.publicId}?bid=${created.id}#bids`,
      }),
    ]);
  }
  return { bidId: created.id, created: created.fresh };
}

export async function enrollFollowup(email: string, userId: string, loadId: string, publicId: string) {
  await enroll("load_followup", { email, userId, loadId, context: { publicId, source: "instant_quote" } });
}
