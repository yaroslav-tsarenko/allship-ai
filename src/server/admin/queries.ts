import "server-only";
import { and, asc, count, desc, eq, gte, ilike, inArray, or, sql, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/server/db/client";
import { auditLog, bid, carrierProfile, dispute, driverLocation, lead, ledgerEntry, load, loadEvent, loadMedia, member, organization, payment, payout, user } from "@/server/db/schema";
import type { LoadStatus } from "@/server/db/schema/enums";

export const ADMIN_PAGE_SIZE = 25;

export type Paged<T> = { rows: T[]; total: number; page: number; pageCount: number };

function paging(page: number) {
  const safe = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  return { page: safe, offset: (safe - 1) * ADMIN_PAGE_SIZE };
}

function paged<T>(rows: T[], total: number, page: number): Paged<T> {
  return { rows, total, page, pageCount: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)) };
}

function like(term: string) {
  return `%${term.replace(/[%_\\]/g, (c) => `\\${c}`)}%`;
}

const ownerEmail = sql<string | null>`(select u.email from member m join "user" u on u.id = m.user_id where m.organization_id = "carrier_profile"."org_id" and m.role = 'owner' order by m.created_at limit 1)`;

export async function getOverviewStats() {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const [[users], [carriers], [pending], [loads], [openLoads], [bidsToday], [escrow], [newLeads], [openDisputes]] = await Promise.all([
    db.select({ n: count() }).from(user),
    db.select({ n: count() }).from(carrierProfile),
    db.select({ n: count() }).from(carrierProfile).where(inArray(carrierProfile.fmcsaStatus, ["pending", "manual_review"])),
    db.select({ n: count() }).from(load),
    db.select({ n: count() }).from(load).where(eq(load.status, "open")),
    db.select({ n: count() }).from(bid).where(gte(bid.createdAt, startOfDay)),
    db.select({ cents: sql<number>`coalesce(sum(${ledgerEntry.amountCents}), 0)::int` }).from(ledgerEntry).where(eq(ledgerEntry.account, "escrow")),
    db.select({ n: count() }).from(lead).where(eq(lead.status, "new")),
    db.select({ n: count() }).from(dispute).where(eq(dispute.status, "open")),
  ]);
  return {
    users: users?.n ?? 0,
    carriers: carriers?.n ?? 0,
    pendingVerification: pending?.n ?? 0,
    loads: loads?.n ?? 0,
    openLoads: openLoads?.n ?? 0,
    bidsToday: bidsToday?.n ?? 0,
    escrowCents: escrow?.cents ?? 0,
    newLeads: newLeads?.n ?? 0,
    openDisputes: openDisputes?.n ?? 0,
  };
}

export async function getVerificationQueueCount() {
  const [row] = await db.select({ n: count() }).from(carrierProfile).where(inArray(carrierProfile.fmcsaStatus, ["pending", "manual_review"]));
  return row?.n ?? 0;
}

export async function getNewestUsers(limit = 10) {
  return db
    .select({ id: user.id, name: user.name, email: user.email, accountType: user.accountType, verified: user.emailVerified, createdAt: user.createdAt })
    .from(user)
    .orderBy(desc(user.createdAt))
    .limit(limit);
}

export async function getVerificationQueuePreview(limit = 5) {
  return db
    .select({ orgId: carrierProfile.orgId, legalName: carrierProfile.legalName, usdot: carrierProfile.usdotNumber, status: carrierProfile.fmcsaStatus, createdAt: carrierProfile.createdAt })
    .from(carrierProfile)
    .where(inArray(carrierProfile.fmcsaStatus, ["pending", "manual_review"]))
    .orderBy(asc(carrierProfile.createdAt))
    .limit(limit);
}

export type CarrierFilter = "queue" | "pending" | "manual_review" | "verified" | "failed" | "all";

export async function listCarriers({ filter, q, page }: { filter: CarrierFilter; q?: string; page: number }) {
  const { page: p, offset } = paging(page);
  const conds: SQL[] = [];
  if (filter === "queue") conds.push(inArray(carrierProfile.fmcsaStatus, ["pending", "manual_review"]));
  else if (filter !== "all") conds.push(eq(carrierProfile.fmcsaStatus, filter));
  if (q) {
    const term = like(q);
    const search = or(ilike(carrierProfile.legalName, term), ilike(carrierProfile.dbaName, term), ilike(carrierProfile.usdotNumber, term), ilike(carrierProfile.mcNumber, term), ilike(organization.name, term));
    if (search) conds.push(search);
  }
  const where = conds.length ? and(...conds) : undefined;
  const [rows, [total], counts] = await Promise.all([
    db
      .select({
        orgId: carrierProfile.orgId,
        name: organization.name,
        legalName: carrierProfile.legalName,
        dbaName: carrierProfile.dbaName,
        usdot: carrierProfile.usdotNumber,
        mc: carrierProfile.mcNumber,
        status: carrierProfile.fmcsaStatus,
        ownerEmail,
        stripeAccountId: carrierProfile.stripeAccountId,
        payoutsEnabled: carrierProfile.payoutsEnabled,
        createdAt: carrierProfile.createdAt,
      })
      .from(carrierProfile)
      .innerJoin(organization, eq(organization.id, carrierProfile.orgId))
      .where(where)
      .orderBy(filter === "queue" ? asc(carrierProfile.createdAt) : desc(carrierProfile.createdAt))
      .limit(ADMIN_PAGE_SIZE)
      .offset(offset),
    db.select({ n: count() }).from(carrierProfile).innerJoin(organization, eq(organization.id, carrierProfile.orgId)).where(where),
    db.select({ status: carrierProfile.fmcsaStatus, n: count() }).from(carrierProfile).groupBy(carrierProfile.fmcsaStatus),
  ]);
  const byStatus = Object.fromEntries(counts.map((c) => [c.status, c.n])) as Partial<Record<string, number>>;
  const all = counts.reduce((s, c) => s + c.n, 0);
  return {
    ...paged(rows, total?.n ?? 0, p),
    counts: {
      queue: (byStatus.pending ?? 0) + (byStatus.manual_review ?? 0),
      pending: byStatus.pending ?? 0,
      manual_review: byStatus.manual_review ?? 0,
      verified: byStatus.verified ?? 0,
      failed: byStatus.failed ?? 0,
      all,
    } satisfies Record<CarrierFilter, number>,
  };
}

export async function getCarrierDetail(orgId: string) {
  const [profile] = await db
    .select({ profile: carrierProfile, org: organization })
    .from(carrierProfile)
    .innerJoin(organization, eq(organization.id, carrierProfile.orgId))
    .where(eq(carrierProfile.orgId, orgId))
    .limit(1);
  if (!profile) return null;
  const actor = alias(user, "actor");
  const [members, audit, [bids], [won]] = await Promise.all([
    db
      .select({ id: member.id, role: member.role, joinedAt: member.createdAt, userId: user.id, name: user.name, email: user.email, twoFactor: user.twoFactorEnabled, banned: user.banned })
      .from(member)
      .innerJoin(user, eq(user.id, member.userId))
      .where(eq(member.organizationId, orgId))
      .orderBy(asc(member.createdAt)),
    db
      .select({ id: auditLog.id, action: auditLog.action, entity: auditLog.entity, diff: auditLog.diff, createdAt: auditLog.createdAt, actorName: actor.name, actorEmail: actor.email })
      .from(auditLog)
      .leftJoin(actor, eq(actor.id, auditLog.actorId))
      .where(and(eq(auditLog.entityId, orgId), inArray(auditLog.entity, ["carrier_profile", "organization"])))
      .orderBy(desc(auditLog.createdAt))
      .limit(50),
    db.select({ n: count() }).from(bid).where(eq(bid.carrierOrgId, orgId)),
    db.select({ n: count() }).from(load).where(eq(load.carrierOrgId, orgId)),
  ]);
  return { ...profile, members, audit, bidCount: bids?.n ?? 0, loadsWon: won?.n ?? 0 };
}

export type LoadFilter = "all" | "active" | LoadStatus;

const activeStatuses: LoadStatus[] = ["open", "awaiting_payment", "booked", "assigned", "en_route_to_pickup", "in_transit", "delivered", "disputed"];

const bidCount = sql<number>`(select count(*)::int from bid b where b.load_id = "load"."id")`;

export async function listLoads({ filter, q, page }: { filter: LoadFilter; q?: string; page: number }) {
  const { page: p, offset } = paging(page);
  const shipper = alias(user, "shipper");
  const conds: SQL[] = [];
  if (filter === "active") conds.push(inArray(load.status, activeStatuses));
  else if (filter !== "all") conds.push(eq(load.status, filter));
  if (q) {
    const term = like(q);
    const search = or(ilike(load.publicId, term), ilike(load.title, term));
    if (search) conds.push(search);
  }
  const where = conds.length ? and(...conds) : undefined;
  const [rows, [total], counts] = await Promise.all([
    db
      .select({
        id: load.id,
        publicId: load.publicId,
        title: load.title,
        category: load.category,
        status: load.status,
        pickup: load.pickup,
        dropoff: load.dropoff,
        createdAt: load.createdAt,
        shipperName: shipper.name,
        shipperEmail: shipper.email,
        bids: bidCount,
      })
      .from(load)
      .innerJoin(shipper, eq(shipper.id, load.shipperId))
      .where(where)
      .orderBy(desc(load.createdAt))
      .limit(ADMIN_PAGE_SIZE)
      .offset(offset),
    db.select({ n: count() }).from(load).where(where),
    db.select({ status: load.status, n: count() }).from(load).groupBy(load.status),
  ]);
  const byStatus = Object.fromEntries(counts.map((c) => [c.status, c.n])) as Partial<Record<LoadStatus, number>>;
  return {
    ...paged(rows, total?.n ?? 0, p),
    counts: byStatus,
    activeCount: activeStatuses.reduce((s, k) => s + (byStatus[k] ?? 0), 0),
    allCount: counts.reduce((s, c) => s + c.n, 0),
  };
}

export async function getLoadDetail(publicId: string) {
  const shipper = alias(user, "shipper");
  const [row] = await db
    .select({ load, shipperName: shipper.name, shipperEmail: shipper.email, carrierName: organization.name })
    .from(load)
    .innerJoin(shipper, eq(shipper.id, load.shipperId))
    .leftJoin(organization, eq(organization.id, load.carrierOrgId))
    .where(eq(load.publicId, publicId))
    .limit(1);
  if (!row) return null;
  const actor = alias(user, "actor");
  const [events, bids, payments, payouts] = await Promise.all([
    db
      .select({ id: loadEvent.id, type: loadEvent.type, fromStatus: loadEvent.fromStatus, toStatus: loadEvent.toStatus, payload: loadEvent.payload, createdAt: loadEvent.createdAt, actorName: actor.name })
      .from(loadEvent)
      .leftJoin(actor, eq(actor.id, loadEvent.actorId))
      .where(eq(loadEvent.loadId, row.load.id))
      .orderBy(desc(loadEvent.createdAt)),
    db
      .select({ id: bid.id, amountCents: bid.amountCents, status: bid.status, message: bid.message, aiAssisted: bid.aiAssisted, createdAt: bid.createdAt, orgId: organization.id, orgName: organization.name })
      .from(bid)
      .innerJoin(organization, eq(organization.id, bid.carrierOrgId))
      .where(eq(bid.loadId, row.load.id))
      .orderBy(asc(bid.amountCents)),
    db.select().from(payment).where(eq(payment.loadId, row.load.id)).orderBy(desc(payment.createdAt)),
    db.select().from(payout).where(eq(payout.loadId, row.load.id)),
  ]);
  return { ...row, events, bids, payments, payouts };
}

export type PaymentFilter = "all" | "succeeded" | "processing" | "requires_payment" | "refunded" | "disputed" | "failed";

export async function listPayments({ filter, q, page }: { filter: PaymentFilter; q?: string; page: number }) {
  const { page: p, offset } = paging(page);
  const shipper = alias(user, "shipper");
  const conds: SQL[] = [];
  if (filter === "refunded") conds.push(inArray(payment.status, ["refunded", "partially_refunded"]));
  else if (filter !== "all") conds.push(eq(payment.status, filter));
  if (q) {
    const term = like(q);
    const search = or(ilike(load.publicId, term), ilike(payment.stripePaymentIntentId, term), ilike(shipper.email, term));
    if (search) conds.push(search);
  }
  const where = conds.length ? and(...conds) : undefined;
  const base = () =>
    db
      .select({
        id: payment.id,
        status: payment.status,
        amountCents: payment.amountCents,
        carrierAmountCents: payment.carrierAmountCents,
        platformFeeCents: payment.platformFeeCents,
        refundedCents: payment.refundedCents,
        stripePaymentIntentId: payment.stripePaymentIntentId,
        createdAt: payment.createdAt,
        publicId: load.publicId,
        loadTitle: load.title,
        shipperEmail: shipper.email,
        payoutStatus: payout.status,
        stripeTransferId: payout.stripeTransferId,
      })
      .from(payment)
      .innerJoin(load, eq(load.id, payment.loadId))
      .innerJoin(shipper, eq(shipper.id, payment.shipperId))
      .leftJoin(payout, eq(payout.paymentId, payment.id));
  const [rows, [total], [sums]] = await Promise.all([
    base().where(where).orderBy(desc(payment.createdAt)).limit(ADMIN_PAGE_SIZE).offset(offset),
    db.select({ n: count() }).from(payment).innerJoin(load, eq(load.id, payment.loadId)).innerJoin(shipper, eq(shipper.id, payment.shipperId)).where(where),
    db
      .select({
        captured: sql<number>`coalesce(sum(${payment.amountCents}) filter (where ${payment.status} in ('succeeded','partially_refunded')), 0)::int`,
        fees: sql<number>`(select coalesce(sum(${ledgerEntry.amountCents}), 0) from ${ledgerEntry} where ${ledgerEntry.account} = 'platform_revenue')::int`,
        refunded: sql<number>`coalesce(sum(${payment.refundedCents}), 0)::int`,
      })
      .from(payment),
  ]);
  return { ...paged(rows, total?.n ?? 0, p), totals: { capturedCents: sums?.captured ?? 0, feesCents: sums?.fees ?? 0, refundedCents: sums?.refunded ?? 0 } };
}

export type LeadFilter = "all" | "quote" | "contact" | "carrier" | "partner" | "newsletter";

export async function listLeads({ filter, q, page }: { filter: LeadFilter; q?: string; page: number }) {
  const { page: p, offset } = paging(page);
  const conds: SQL[] = [];
  if (filter !== "all") conds.push(eq(lead.type, filter));
  if (q) {
    const term = like(q);
    const search = or(ilike(lead.email, term), ilike(lead.name, term), ilike(lead.phone, term), ilike(lead.gclid, term));
    if (search) conds.push(search);
  }
  const where = conds.length ? and(...conds) : undefined;
  const [rows, [total], counts] = await Promise.all([
    db.select().from(lead).where(where).orderBy(desc(lead.createdAt)).limit(ADMIN_PAGE_SIZE).offset(offset),
    db.select({ n: count() }).from(lead).where(where),
    db.select({ type: lead.type, n: count() }).from(lead).groupBy(lead.type),
  ]);
  const byType = Object.fromEntries(counts.map((c) => [c.type, c.n])) as Partial<Record<LeadFilter, number>>;
  return { ...paged(rows, total?.n ?? 0, p), counts: { ...byType, all: counts.reduce((s, c) => s + c.n, 0) } };
}

export type UserFilter = "all" | "shipper" | "carrier" | "admin" | "no_2fa" | "banned";

export async function listUsers({ filter, q, page }: { filter: UserFilter; q?: string; page: number }) {
  const { page: p, offset } = paging(page);
  const conds: SQL[] = [];
  if (filter === "shipper" || filter === "carrier") conds.push(eq(user.accountType, filter));
  if (filter === "admin") conds.push(eq(user.role, "admin"));
  if (filter === "banned") conds.push(eq(user.banned, true));
  if (filter === "no_2fa") conds.push(sql`coalesce(${user.twoFactorEnabled}, false) = false`);
  if (q) {
    const term = like(q);
    const search = or(ilike(user.email, term), ilike(user.name, term), ilike(user.phone, term), eq(user.id, q));
    if (search) conds.push(search);
  }
  const where = conds.length ? and(...conds) : undefined;
  const [rows, [total]] = await Promise.all([
    db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        accountType: user.accountType,
        role: user.role,
        twoFactor: user.twoFactorEnabled,
        banned: user.banned,
        banReason: user.banReason,
        createdAt: user.createdAt,
        orgName: sql<string | null>`(select o.name from member m join organization o on o.id = m.organization_id where m.user_id = "user"."id" order by m.created_at limit 1)`,
      })
      .from(user)
      .where(where)
      .orderBy(desc(user.createdAt))
      .limit(ADMIN_PAGE_SIZE)
      .offset(offset),
    db.select({ n: count() }).from(user).where(where),
  ]);
  return paged(rows, total?.n ?? 0, p);
}

export async function getOpenDisputeCount() {
  const [row] = await db.select({ n: count() }).from(dispute).where(eq(dispute.status, "open"));
  return row?.n ?? 0;
}

export type DisputeFilter = "open" | "resolved" | "all";

export async function listDisputes({ filter, q, page }: { filter: DisputeFilter; q?: string; page: number }) {
  const { page: p, offset } = paging(page);
  const opener = alias(user, "opener");
  const conds: SQL[] = [];
  if (filter === "open") conds.push(eq(dispute.status, "open"));
  if (filter === "resolved") conds.push(sql`${dispute.status} <> 'open'`);
  if (q) {
    const term = like(q);
    const search = or(ilike(load.publicId, term), ilike(load.title, term), ilike(opener.email, term));
    if (search) conds.push(search);
  }
  const where = conds.length ? and(...conds) : undefined;
  const [rows, [total], counts] = await Promise.all([
    db
      .select({
        id: dispute.id,
        status: dispute.status,
        reason: dispute.reason,
        details: dispute.details,
        openedByRole: dispute.openedByRole,
        createdAt: dispute.createdAt,
        resolvedAt: dispute.resolvedAt,
        refundCents: dispute.refundCents,
        publicId: load.publicId,
        loadTitle: load.title,
        openerName: opener.name,
        openerEmail: opener.email,
        carrierName: organization.name,
        amountCents: sql<number | null>`(select p.amount_cents from payment p where p.load_id = ${load.id} and p.status in ('succeeded','partially_refunded','refunded') limit 1)`,
      })
      .from(dispute)
      .innerJoin(load, eq(load.id, dispute.loadId))
      .innerJoin(opener, eq(opener.id, dispute.openedBy))
      .leftJoin(organization, eq(organization.id, load.carrierOrgId))
      .where(where)
      .orderBy(sql`case when ${dispute.status} = 'open' then 0 else 1 end`, sql`case when ${dispute.status} = 'open' then ${dispute.createdAt} end asc`, desc(dispute.createdAt))
      .limit(ADMIN_PAGE_SIZE)
      .offset(offset),
    db.select({ n: count() }).from(dispute).innerJoin(load, eq(load.id, dispute.loadId)).innerJoin(opener, eq(opener.id, dispute.openedBy)).where(where),
    db.select({ open: sql<number>`count(*) filter (where ${dispute.status} = 'open')::int`, all: sql<number>`count(*)::int` }).from(dispute),
  ]);
  const c = counts[0];
  return { ...paged(rows, total?.n ?? 0, p), counts: { open: c?.open ?? 0, resolved: (c?.all ?? 0) - (c?.open ?? 0), all: c?.all ?? 0 } satisfies Record<DisputeFilter, number> };
}

export async function getDisputeDetail(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const opener = alias(user, "opener");
  const resolver = alias(user, "resolver");
  const [row] = await db
    .select({ dispute, openerName: opener.name, openerEmail: opener.email, resolverName: resolver.name })
    .from(dispute)
    .innerJoin(opener, eq(opener.id, dispute.openedBy))
    .leftJoin(resolver, eq(resolver.id, dispute.resolvedBy))
    .where(eq(dispute.id, id))
    .limit(1);
  if (!row) return null;
  const loadData = await getLoadDetail((await db.select({ publicId: load.publicId }).from(load).where(eq(load.id, row.dispute.loadId)).limit(1))[0]?.publicId ?? "");
  if (!loadData) return null;
  const [driver, history] = await Promise.all([
    loadData.load.driverId ? db.select({ name: user.name, email: user.email, phone: user.phone }).from(user).where(eq(user.id, loadData.load.driverId)).limit(1) : Promise.resolve([]),
    db.select().from(dispute).where(and(eq(dispute.loadId, row.dispute.loadId), sql`${dispute.id} <> ${row.dispute.id}`)).orderBy(desc(dispute.createdAt)),
  ]);
  return { ...row, ...loadData, driver: driver[0] ?? null, history };
}

export async function getLoadTrackingAndMedia(loadId: string) {
  const [points, media] = await Promise.all([
    db
      .select({ lat: driverLocation.lat, lng: driverLocation.lng, recordedAt: driverLocation.recordedAt, speedMph: driverLocation.speedMph, headingDeg: driverLocation.headingDeg, accuracyM: driverLocation.accuracyM })
      .from(driverLocation)
      .where(eq(driverLocation.loadId, loadId))
      .orderBy(desc(driverLocation.recordedAt))
      .limit(500),
    db.select().from(loadMedia).where(eq(loadMedia.loadId, loadId)).orderBy(asc(loadMedia.createdAt)),
  ]);
  return { points: points.reverse(), media };
}

export type PayoutFilter = "all" | "attention" | "paid";

export async function listPayouts({ filter, page }: { filter: PayoutFilter; page: number }) {
  const { page: p, offset } = paging(page);
  const where = filter === "attention" ? inArray(payout.status, ["pending", "held"]) : filter === "paid" ? eq(payout.status, "paid") : undefined;
  const [rows, [total], [attention]] = await Promise.all([
    db
      .select({
        id: payout.id,
        status: payout.status,
        amountCents: payout.amountCents,
        failureReason: payout.failureReason,
        stripeTransferId: payout.stripeTransferId,
        paidAt: payout.paidAt,
        createdAt: payout.createdAt,
        publicId: load.publicId,
        carrierOrgId: payout.carrierOrgId,
        carrierName: organization.name,
      })
      .from(payout)
      .innerJoin(load, eq(load.id, payout.loadId))
      .innerJoin(organization, eq(organization.id, payout.carrierOrgId))
      .where(where)
      .orderBy(sql`case when ${payout.status} in ('held','pending') then 0 else 1 end`, desc(payout.createdAt))
      .limit(ADMIN_PAGE_SIZE)
      .offset(offset),
    db.select({ n: count() }).from(payout).where(where),
    db.select({ n: count() }).from(payout).where(inArray(payout.status, ["pending", "held"])),
  ]);
  return { ...paged(rows, total?.n ?? 0, p), attention: attention?.n ?? 0 };
}
