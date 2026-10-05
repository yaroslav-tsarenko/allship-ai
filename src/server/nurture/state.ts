import "server-only";
import { and, count, eq, gt, min, ne } from "drizzle-orm";
import { db } from "@/server/db/client";
import { bid, carrierProfile, carrierRateTier, lead, load, loadMedia, organization, review, user } from "@/server/db/schema";
import type { CarrierSnapshot, LoadSnapshot, NurtureState } from "./conditions";
import type { SequenceId } from "./schedule";

type EnrollmentRow = { sequence: string; email: string; userId: string | null; leadId?: string | null; loadId: string | null; createdAt: Date; context: Record<string, unknown> };

const place = (s: { city?: string; state?: string; postalCode?: string } | null | undefined) => (s ? [s.city, s.state].filter(Boolean).join(", ") || s.postalCode || "" : "");

async function loadSnapshot(loadId: string): Promise<{ snapshot: LoadSnapshot; pickupState: string | null } | null> {
  const [row] = await db
    .select({
      publicId: load.publicId,
      title: load.title,
      status: load.status,
      pickup: load.pickup,
      dropoff: load.dropoff,
      biddingClosesAt: load.biddingClosesAt,
      targetPriceCents: load.targetPriceCents,
      carrierName: organization.name,
    })
    .from(load)
    .leftJoin(organization, eq(organization.id, load.carrierOrgId))
    .where(eq(load.id, loadId))
    .limit(1);
  if (!row) return null;
  const [[bids], [photos], [reviewed]] = await Promise.all([
    db.select({ n: count(), low: min(bid.amountCents) }).from(bid).where(and(eq(bid.loadId, loadId), eq(bid.status, "active"))),
    db.select({ n: count() }).from(loadMedia).where(and(eq(loadMedia.loadId, loadId), eq(loadMedia.kind, "photo"))),
    db.select({ n: count() }).from(review).where(eq(review.loadId, loadId)),
  ]);
  const from = place(row.pickup);
  const to = place(row.dropoff);
  return {
    pickupState: row.pickup?.state ?? null,
    snapshot: {
      publicId: row.publicId,
      title: row.title,
      status: row.status,
      route: from && to ? `${from} → ${to}` : null,
      biddingClosesAt: row.biddingClosesAt,
      bidCount: Number(bids?.n ?? 0),
      lowestBidCents: bids?.low ?? null,
      hasTargetPrice: row.targetPriceCents !== null,
      hasPhotos: Number(photos?.n ?? 0) > 0,
      reviewed: Number(reviewed?.n ?? 0) > 0,
      carrierName: row.carrierName ?? null,
    },
  };
}

async function carrierSnapshot(orgId: string): Promise<CarrierSnapshot | null> {
  const [row] = await db
    .select({ name: organization.name, fmcsaStatus: carrierProfile.fmcsaStatus, payoutsEnabled: carrierProfile.payoutsEnabled, instantQuotes: carrierProfile.instantQuotes })
    .from(carrierProfile)
    .innerJoin(organization, eq(organization.id, carrierProfile.orgId))
    .where(eq(carrierProfile.orgId, orgId))
    .limit(1);
  if (!row) return null;
  const [[tiers], [bids]] = await Promise.all([
    db.select({ n: count() }).from(carrierRateTier).where(eq(carrierRateTier.orgId, orgId)),
    db.select({ n: count() }).from(bid).where(eq(bid.carrierOrgId, orgId)),
  ]);
  return { companyName: row.name, fmcsaStatus: row.fmcsaStatus, payoutsEnabled: row.payoutsEnabled, hasRates: row.instantQuotes || Number(tiers?.n ?? 0) > 0, bidCount: Number(bids?.n ?? 0) };
}

async function submittedSince(e: EnrollmentRow) {
  if (e.leadId) {
    const [own] = await db.select({ status: lead.status }).from(lead).where(eq(lead.id, e.leadId)).limit(1);
    if (own && own.status !== "partial") return true;
  }
  const [leadRow] = await db
    .select({ id: lead.id })
    .from(lead)
    .where(and(eq(lead.email, e.email), eq(lead.type, "quote"), ne(lead.status, "partial"), gt(lead.createdAt, e.createdAt)))
    .limit(1);
  if (leadRow) return true;
  if (!e.userId) return false;
  const [loadRow] = await db
    .select({ id: load.id })
    .from(load)
    .where(and(eq(load.shipperId, e.userId), gt(load.createdAt, e.createdAt)))
    .limit(1);
  return Boolean(loadRow);
}

export async function loadNurtureState(e: EnrollmentRow, now: Date): Promise<{ state: NurtureState; recipientState: string | null }> {
  const sequence = e.sequence as SequenceId;
  const [account] = e.userId
    ? await db.select({ firstName: user.firstName, emailVerified: user.emailVerified }).from(user).where(eq(user.id, e.userId)).limit(1)
    : await db.select({ firstName: user.firstName, emailVerified: user.emailVerified }).from(user).where(eq(user.email, e.email)).limit(1);
  const loaded = e.loadId ? await loadSnapshot(e.loadId) : null;
  const orgId = typeof e.context.orgId === "string" ? e.context.orgId : null;
  const carrier = sequence === "carrier_activation" && orgId ? await carrierSnapshot(orgId) : null;
  const submitted = sequence === "abandoned_form" ? await submittedSince(e) : false;
  const contextName = typeof e.context.firstName === "string" ? e.context.firstName : null;
  const contextState = typeof e.context.state === "string" ? e.context.state : null;
  return {
    recipientState: loaded?.pickupState ?? contextState,
    state: {
      now,
      firstName: account?.firstName ?? contextName,
      userVerified: Boolean(account?.emailVerified),
      load: loaded?.snapshot ?? null,
      submittedSince: submitted,
      carrier,
      context: e.context,
    },
  };
}
