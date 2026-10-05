import { copyFile, mkdir, readFile, rm } from "node:fs/promises";
import path from "node:path";
import { config } from "dotenv";
import { and, eq, inArray, like, notInArray, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { generateRandomString, hashPassword, symmetricDecrypt, symmetricEncrypt } from "better-auth/crypto";
import { createOTP } from "@better-auth/utils/otp";
import { v7 as uuidv7 } from "uuid";
import * as schema from "../src/server/db/schema";
import type { LoadCategory, LoadStatus } from "../src/server/db/schema/enums";
import type { LoadStop } from "../src/server/db/schema/loads";
import { detailsSchema, LOAD_DETAILS_VERSION } from "../src/features/loads/spec";
import { loadInputSchema } from "../src/features/loads/schema";
import { priceMove, validateTiers, volumeForBedrooms, type RateTier, type ServiceRates } from "../src/features/moving/pricing";
import { canTransition, type TransitionActor } from "../src/server/loads/transitions";
import { feeFor, formatUsd } from "../src/lib/money";

config({ path: ".env.local" });
config();

const args = new Set(process.argv.slice(2));
const confirmed = args.has("--yes");
const mode: "seed" | "reset" | "refresh" = args.has("--reset") ? "reset" : args.has("--refresh-locations") ? "refresh" : "seed";

const DOMAIN = "allship.test";
const USER_MARK = "demo";
const ORG_MARK = "demo_org";
const PASSWORD = process.env.DEMO_PASSWORD ?? "AllshipDemo2026!";
const FEE_BPS = Number(process.env.PLATFORM_FEE_BPS ?? 1000);
const APP_URL = (process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
const DB_URL = process.env.DATABASE_URL_MIGRATIONS ?? process.env.DATABASE_URL;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const storageMode: "supabase" | "local" | "none" = SUPABASE_URL && SUPABASE_KEY ? "supabase" : process.env.NODE_ENV === "production" ? "none" : "local";

const NOW = Date.now();
const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
const ago = (ms: number) => new Date(NOW - ms);
const ahead = (ms: number) => new Date(NOW + ms);
const plus = (d: Date, ms: number) => new Date(d.getTime() + ms);
const ymd = (d: Date) => d.toISOString().slice(0, 10);
const noon = (d: Date) => new Date(`${ymd(d)}T12:00:00Z`);
const authId = () => generateRandomString(32, "a-z", "A-Z", "0-9");
const idAt = (d: Date) => uuidv7({ msecs: d.getTime() });

type OrgKey = "A" | "B" | "C";
type OrgRole = "owner" | "dispatcher" | "driver";
type PersonKey =
  | "shipper"
  | "shipper2"
  | "carrier"
  | "dispatcher"
  | "driver1"
  | "driver2"
  | "driver3"
  | "carrier2"
  | "driver5"
  | "carrier3"
  | "admin";

type Person = {
  key: PersonKey;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  accountType: "shipper" | "carrier";
  admin?: boolean;
  org?: OrgKey;
  orgRole?: OrgRole;
  joinedDaysAgo: number;
  tryThis: string;
};

const people: Person[] = [
  { key: "shipper", email: `demo.shipper@${DOMAIN}`, firstName: "Emily", lastName: "Carter", phone: "(312) 555-0142", accountType: "shipper", joinedDaysAgo: 40, tryThis: "Loads: compare 3 bids on AS-DEM3BD and accept one (simulated payment), confirm AS-DEM9DL, review, track AS-DEM7ER / AS-DEM8TR live, messages" },
  { key: "shipper2", email: `demo.shipper2@${DOMAIN}`, firstName: "Jordan", lastName: "Alvarez", phone: "(713) 555-0187", accountType: "shipper", joinedDaysAgo: 12, tryThis: "Two open Houston loads; AS-DEMB2A already has a bid from Demo Freight Lines" },
  { key: "carrier", email: `demo.carrier@${DOMAIN}`, firstName: "Marcus", lastName: "Reed", phone: "(312) 555-0110", accountType: "carrier", org: "A", orgRole: "owner", joinedDaysAgo: 60, tryThis: "Board + bid, assign a driver on AS-DEM5BK, trips, team (pending invite), payouts, reviews + reply, pricing" },
  { key: "dispatcher", email: `demo.dispatcher@${DOMAIN}`, firstName: "Priya", lastName: "Shah", phone: "(312) 555-0111", accountType: "carrier", org: "A", orgRole: "dispatcher", joinedDaysAgo: 55, tryThis: "Same as the owner minus team management" },
  { key: "driver1", email: `demo.driver1@${DOMAIN}`, firstName: "Luis", lastName: "Moreno", phone: "(312) 555-0121", accountType: "carrier", org: "A", orgRole: "driver", joinedDaysAgo: 50, tryThis: "Trips: start AS-DEM6AS (pickup tomorrow), share GPS, confirm pickup with photos" },
  { key: "driver2", email: `demo.driver2@${DOMAIN}`, firstName: "Tanya", lastName: "Brooks", phone: "(312) 555-0122", accountType: "carrier", org: "A", orgRole: "driver", joinedDaysAgo: 48, tryThis: "Trips: AS-DEM7ER en route to pickup, confirm pickup with photos" },
  { key: "driver3", email: `demo.driver3@${DOMAIN}`, firstName: "Kevin", lastName: "Walsh", phone: "(312) 555-0123", accountType: "carrier", org: "A", orgRole: "driver", joinedDaysAgo: 45, tryThis: "Trips: AS-DEM8TR in transit, confirm delivery with POD photo + signature" },
  { key: "carrier2", email: `demo.carrier2@${DOMAIN}`, firstName: "Ray", lastName: "Delgado", phone: "(214) 555-0120", accountType: "carrier", org: "B", orgRole: "owner", joinedDaysAgo: 70, tryThis: "Competing carrier: active bid on AS-DEM3BD and AS-DEM4CL, inquiry chat" },
  { key: "driver5", email: `demo.driver5@${DOMAIN}`, firstName: "Cody", lastName: "Hale", phone: "(214) 555-0125", accountType: "carrier", org: "B", orgRole: "driver", joinedDaysAgo: 30, tryThis: "Driver with no trips yet (empty states)" },
  { key: "carrier3", email: `demo.carrier3@${DOMAIN}`, firstName: "Hannah", lastName: "Olsen", phone: "(515) 555-0130", accountType: "carrier", org: "C", orgRole: "owner", joinedDaysAgo: 80, tryThis: "Third bidder on AS-DEM3BD" },
  { key: "admin", email: `demo.admin@${DOMAIN}`, firstName: "Alex", lastName: "Morgan", phone: "(415) 555-0100", accountType: "shipper", admin: true, joinedDaysAgo: 90, tryThis: "Admin console with 2FA: disputes (AS-DEMDSP), payments, carriers, loads, users" },
];

const INVITED_EMAIL = `demo.driver4@${DOMAIN}`;

type OrgSpec = {
  key: OrgKey;
  name: string;
  slug: string;
  createdDaysAgo: number;
  profile: Omit<typeof schema.carrierProfile.$inferInsert, "orgId">;
  tiers: RateTier[];
  rates: ServiceRates | null;
};

const demoSnapshot = JSON.stringify({ demo: true, note: "Demo carrier created by scripts/seed-demo.ts. Not an FMCSA record." });

const orgs: OrgSpec[] = [
  {
    key: "A",
    name: "Demo Freight Lines LLC",
    slug: "demo-freight-lines-demo",
    createdDaysAgo: 60,
    profile: {
      legalName: "Demo Freight Lines LLC",
      dbaName: "Demo Freight",
      usdotNumber: "9900101",
      mcNumber: "990101",
      fmcsaStatus: "verified",
      fmcsaCheckedAt: ago(20 * DAY),
      fmcsaSnapshot: demoSnapshot,
      insuranceExpiresAt: ahead(240 * DAY),
      serviceStates: ["IL", "IN", "WI", "MI", "OH", "MO", "IA", "MN", "KY", "TN", "TX"],
      instantQuotes: true,
      instantQuoteMinMiles: 0,
      instantQuoteMaxMiles: 3000,
      equipment: ["53 ft dry van", "26 ft box truck with liftgate", "Enclosed auto carrier", "48 ft flatbed"],
      categories: ["car_or_light_truck", "motorcycle", "local_moving", "long_distance_moving", "household_items", "office_moving", "freight", "heavy_equipment", "trailer", "rv"],
      about: "Chicago-based moving and freight carrier running the Midwest and the I-35 corridor. Two dedicated crews for household moves, an enclosed car hauler and dry vans for palletized freight. Every move gets a named driver, GPS tracking and photo check-in at pickup and delivery.",
      yearsInBusiness: 12,
      website: `https://demo-freight.${DOMAIN}`,
      phone: "(312) 555-0110",
      stripeAccountId: null,
      chargesEnabled: true,
      payoutsEnabled: true,
    },
    tiers: [
      { fromMiles: 0, toMiles: 500, ratePerCuFtCents: 420 },
      { fromMiles: 501, toMiles: 1500, ratePerCuFtCents: 625 },
      { fromMiles: 1501, toMiles: 3000, ratePerCuFtCents: 810 },
    ],
    rates: { packingPerCuFtCents: 110, unpackingPerCuFtCents: 60, storagePerCuFtMonthCents: 45 },
  },
  {
    key: "B",
    name: "Lone Star Movers Inc",
    slug: "lone-star-movers-demo",
    createdDaysAgo: 70,
    profile: {
      legalName: "Lone Star Movers Inc",
      dbaName: null,
      usdotNumber: "9900202",
      mcNumber: "990202",
      fmcsaStatus: "verified",
      fmcsaCheckedAt: ago(35 * DAY),
      fmcsaSnapshot: demoSnapshot,
      insuranceExpiresAt: ahead(180 * DAY),
      serviceStates: ["TX", "OK", "LA", "AR", "NM", "IL", "MO", "TN"],
      instantQuotes: false,
      equipment: ["26 ft box truck", "53 ft moving van"],
      categories: ["local_moving", "long_distance_moving", "household_items", "office_moving", "freight", "trailer"],
      about: "Dallas household and office movers with weekly runs to Chicago and the Midwest.",
      yearsInBusiness: 8,
      website: `https://lone-star-movers.${DOMAIN}`,
      phone: "(214) 555-0120",
      stripeAccountId: null,
      chargesEnabled: true,
      payoutsEnabled: true,
    },
    tiers: [],
    rates: null,
  },
  {
    key: "C",
    name: "Prairie Line Logistics LLC",
    slug: "prairie-line-logistics-demo",
    createdDaysAgo: 80,
    profile: {
      legalName: "Prairie Line Logistics LLC",
      dbaName: "Prairie Line",
      usdotNumber: "9900303",
      mcNumber: "990303",
      fmcsaStatus: "verified",
      fmcsaCheckedAt: ago(50 * DAY),
      fmcsaSnapshot: demoSnapshot,
      insuranceExpiresAt: ahead(300 * DAY),
      serviceStates: ["IA", "IL", "NE", "KS", "MO", "MN", "WI", "TX"],
      instantQuotes: false,
      equipment: ["Open 7-car hauler", "53 ft dry van", "Step deck"],
      categories: ["car_or_light_truck", "motorcycle", "long_distance_moving", "freight", "heavy_equipment", "household_items"],
      about: "Des Moines carrier hauling vehicles, equipment and freight across the Plains and Midwest.",
      yearsInBusiness: 15,
      website: `https://prairie-line.${DOMAIN}`,
      phone: "(515) 555-0130",
      stripeAccountId: null,
      chargesEnabled: true,
      payoutsEnabled: true,
    },
    tiers: [],
    rates: null,
  },
];

const loadCodes = {
  draft: "AS-DEM2DR",
  bids: "AS-DEM3BD",
  closing: "AS-DEM4CL",
  booked: "AS-DEM5BK",
  assigned: "AS-DEM6AS",
  enRoute: "AS-DEM7ER",
  inTransit: "AS-DEM8TR",
  delivered: "AS-DEM9DL",
  completed: "AS-DEMCMP",
  disputed: "AS-DEMDSP",
  cancelled: "AS-DEMCXL",
  expired: "AS-DEMEXP",
  rv: "AS-DEMB2A",
  truck: "AS-DEMB2B",
} as const;
const allCodes = Object.values(loadCodes) as string[];

if (!DB_URL) throw new Error("DATABASE_URL_MIGRATIONS or DATABASE_URL is required");
if (PASSWORD.length < 10 || PASSWORD.length > 128) throw new Error("DEMO_PASSWORD must be 10-128 characters (the app's password policy)");
if (!Number.isInteger(FEE_BPS) || FEE_BPS < 0 || FEE_BPS > 5000) throw new Error("PLATFORM_FEE_BPS must be an integer between 0 and 5000");

const client = postgres(DB_URL, { max: 1, prepare: false, onnotice: () => {} });
const db = drizzle(client, { schema, casing: "snake_case" });
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

function secretKey(): Parameters<typeof symmetricEncrypt>[0]["key"] {
  const legacy = process.env.BETTER_AUTH_SECRET ?? process.env.AUTH_SECRET ?? "";
  const multi = process.env.BETTER_AUTH_SECRETS;
  if (multi) {
    const entries = multi.split(",").map((entry) => {
      const at = entry.indexOf(":");
      if (at === -1) throw new Error("BETTER_AUTH_SECRETS entries must look like <version>:<secret>");
      return { version: parseInt(entry.slice(0, at).trim(), 10), value: entry.slice(at + 1).trim() };
    });
    const first = entries[0];
    if (!first) throw new Error("BETTER_AUTH_SECRETS is empty");
    return { keys: new Map(entries.map((e) => [e.version, e.value])), currentVersion: first.version, legacySecret: legacy || undefined };
  }
  if (legacy.length < 32) throw new Error("BETTER_AUTH_SECRET (32+ chars) is required to encrypt the admin's 2FA secret, and must match the app's");
  return legacy;
}

function maskUrl(url: string) {
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.hostname}${u.port ? `:${u.port}` : ""}${u.pathname}`;
  } catch {
    return "(unparseable DATABASE_URL)";
  }
}

async function markers() {
  const rows = await db
    .select()
    .from(schema.legacyMap)
    .where(inArray(schema.legacyMap.collection, [USER_MARK, ORG_MARK]));
  const users = new Map(rows.filter((r) => r.collection === USER_MARK).map((r) => [r.mongoId, r.newId]));
  const orgIds = new Map(rows.filter((r) => r.collection === ORG_MARK).map((r) => [r.mongoId, r.newId]));
  return { users, orgIds };
}

async function safetyCheck() {
  const problems: string[] = [];
  const marks = await markers();
  const emails = people.map((p) => p.email);
  const existing = await db.select({ id: schema.user.id, email: schema.user.email }).from(schema.user).where(inArray(schema.user.email, emails));
  for (const row of existing) {
    if (!row.email.endsWith(`@${DOMAIN}`)) problems.push(`${row.email} is not on @${DOMAIN}`);
    if (marks.users.get(row.email) !== row.id) problems.push(`${row.email} exists but was not created by this script (no "${USER_MARK}" marker in legacy_map)`);
  }
  for (const [email, id] of marks.users) {
    if (!email.endsWith(`@${DOMAIN}`)) problems.push(`legacy_map marker ${email} is not on @${DOMAIN}`);
    const [row] = await db.select({ email: schema.user.email }).from(schema.user).where(eq(schema.user.id, id)).limit(1);
    if (row && row.email !== email) problems.push(`marker for ${email} points to a user with email ${row.email}`);
  }
  const demoOrgIds = [...marks.orgIds.values()];
  for (const spec of orgs) {
    const [slugRow] = await db.select({ id: schema.organization.id }).from(schema.organization).where(eq(schema.organization.slug, spec.slug)).limit(1);
    if (slugRow && marks.orgIds.get(spec.key) !== slugRow.id) problems.push(`organization slug ${spec.slug} belongs to a non-demo company`);
    const [dotRow] = await db.select({ orgId: schema.carrierProfile.orgId }).from(schema.carrierProfile).where(eq(schema.carrierProfile.usdotNumber, spec.profile.usdotNumber!)).limit(1);
    if (dotRow && !demoOrgIds.includes(dotRow.orgId)) problems.push(`USDOT ${spec.profile.usdotNumber} is used by a non-demo carrier`);
  }
  const demoUserIds = [...marks.users.values()];
  const clashing = await db
    .select({ publicId: schema.load.publicId, shipperId: schema.load.shipperId })
    .from(schema.load)
    .where(inArray(schema.load.publicId, allCodes));
  for (const row of clashing) if (!demoUserIds.includes(row.shipperId)) problems.push(`load ${row.publicId} exists and belongs to a non-demo shipper`);
  return { problems, marks };
}

async function demoState() {
  const marks = await markers();
  const userIds = [...marks.users.values()];
  const orgIds = [...marks.orgIds.values()];
  const loads = userIds.length ? await db.select({ id: schema.load.id }).from(schema.load).where(inArray(schema.load.shipperId, userIds)) : [];
  return { marks, userIds, orgIds, loadIds: loads.map((l) => l.id) };
}

async function blockersForReset(userIds: string[], orgIds: string[], loadIds: string[]) {
  const out: string[] = [];
  if (orgIds.length) {
    const foreignPayouts = await db
      .select({ publicId: schema.load.publicId })
      .from(schema.payout)
      .innerJoin(schema.load, eq(schema.load.id, schema.payout.loadId))
      .where(and(inArray(schema.payout.carrierOrgId, orgIds), loadIds.length ? notInArray(schema.payout.loadId, loadIds) : sql`true`));
    for (const r of foreignPayouts) out.push(`payout to a demo carrier on non-demo load ${r.publicId}`);
    const foreignPayments = await db
      .select({ publicId: schema.load.publicId })
      .from(schema.payment)
      .innerJoin(schema.bid, eq(schema.bid.id, schema.payment.bidId))
      .innerJoin(schema.load, eq(schema.load.id, schema.payment.loadId))
      .where(and(inArray(schema.bid.carrierOrgId, orgIds), loadIds.length ? notInArray(schema.payment.loadId, loadIds) : sql`true`));
    for (const r of foreignPayments) out.push(`payment for a demo carrier's bid on non-demo load ${r.publicId}`);
  }
  if (userIds.length) {
    const posts = await db.select({ slug: schema.post.slug }).from(schema.post).where(inArray(schema.post.authorId, userIds));
    for (const p of posts) out.push(`blog post "${p.slug}" is authored by a demo user (reassign it first)`);
    const disputes = await db
      .select({ publicId: schema.load.publicId })
      .from(schema.dispute)
      .innerJoin(schema.load, eq(schema.load.id, schema.dispute.loadId))
      .where(and(inArray(schema.dispute.openedBy, userIds), loadIds.length ? notInArray(schema.dispute.loadId, loadIds) : sql`true`));
    for (const d of disputes) out.push(`dispute on non-demo load ${d.publicId} was opened by a demo user`);
  }
  return out;
}

async function deleteMarketplace(tx: Tx, userIds: string[], loadIds: string[]) {
  if (loadIds.length) {
    const payments = await tx.select({ id: schema.payment.id }).from(schema.payment).where(inArray(schema.payment.loadId, loadIds));
    const payouts = await tx.select({ id: schema.payout.id, transferId: schema.payout.stripeTransferId }).from(schema.payout).where(inArray(schema.payout.loadId, loadIds));
    const disputes = await tx.select({ id: schema.dispute.id }).from(schema.dispute).where(inArray(schema.dispute.loadId, loadIds));
    const paymentIds = payments.map((p) => p.id);
    const payoutIds = payouts.map((p) => p.id);
    const transferRefs = [...payoutIds, ...payouts.map((p) => p.transferId).filter((t): t is string => Boolean(t))];
    const refConditions = [
      paymentIds.length ? and(eq(schema.ledgerEntry.refType, "payment"), inArray(schema.ledgerEntry.refId, paymentIds)) : undefined,
      payoutIds.length ? and(eq(schema.ledgerEntry.refType, "payout"), inArray(schema.ledgerEntry.refId, payoutIds)) : undefined,
      transferRefs.length ? and(eq(schema.ledgerEntry.refType, "transfer"), inArray(schema.ledgerEntry.refId, transferRefs)) : undefined,
      ...disputes.map((d) => and(eq(schema.ledgerEntry.refType, "refund"), like(schema.ledgerEntry.memo, `Dispute ${d.id}%`))),
    ].filter((c) => c !== undefined);
    if (refConditions.length) {
      const journals = await tx.selectDistinct({ journalId: schema.ledgerEntry.journalId }).from(schema.ledgerEntry).where(or(...refConditions));
      if (journals.length) await tx.delete(schema.ledgerEntry).where(inArray(schema.ledgerEntry.journalId, journals.map((j) => j.journalId)));
    }
    await tx.delete(schema.payout).where(inArray(schema.payout.loadId, loadIds));
    await tx.delete(schema.payment).where(inArray(schema.payment.loadId, loadIds));
    await tx.delete(schema.load).where(inArray(schema.load.id, loadIds));
  }
  if (userIds.length) await tx.delete(schema.notification).where(inArray(schema.notification.userId, userIds));
}

async function removeLocalMedia(loadIds: string[]) {
  if (storageMode !== "local") return;
  for (const id of loadIds) await rm(path.join(process.cwd(), ".uploads", "loads", id), { recursive: true, force: true });
}

type Ctx = {
  tx: Tx;
  users: Record<PersonKey, string>;
  orgIds: Record<OrgKey, string>;
  staff: Record<OrgKey, string[]>;
  owners: Record<OrgKey, string>;
  orgNames: Record<OrgKey, string>;
  mediaSkipped: number;
};

type LoadRow = typeof schema.load.$inferSelect;

function stop(address: string, city: string, state: string, postalCode: string, lat: number, lng: number, windowStart: Date, extra: Partial<LoadStop> = {}): LoadStop & { windowStart: string } {
  return { address, city, state, postalCode, lat, lng, windowStart: ymd(windowStart), ...extra };
}

async function notify(c: Ctx, userIds: string[], at: Date, notice: { type: string; title: string; body: string; href: string }) {
  const ids = [...new Set(userIds)].filter(Boolean);
  if (ids.length === 0) return;
  const readAt = NOW - at.getTime() > DAY ? plus(at, 40 * MIN) : null;
  await c.tx.insert(schema.notification).values(ids.map((userId) => ({ id: idAt(at), userId, ...notice, readAt, createdAt: at })));
}

async function event(c: Ctx, loadId: string, at: Date, type: string, values: { fromStatus?: LoadStatus; toStatus?: LoadStatus; actorId?: string | null; payload?: Record<string, unknown> } = {}) {
  await c.tx.insert(schema.loadEvent).values({ id: idAt(at), loadId, type, createdAt: at, fromStatus: values.fromStatus ?? null, toStatus: values.toStatus ?? null, actorId: values.actorId ?? null, payload: values.payload ?? {} });
}

async function advance(c: Ctx, row: LoadRow, to: LoadStatus, actor: { kind: TransitionActor; userId: string | null }, at: Date, patch: Partial<typeof schema.load.$inferInsert> = {}, payload: Record<string, unknown> = {}) {
  if (!canTransition(row.status, to, actor.kind)) throw new Error(`${row.publicId}: ${actor.kind} can't move ${row.status} → ${to}`);
  const [updated] = await c.tx
    .update(schema.load)
    .set({ ...patch, status: to, updatedAt: at })
    .where(eq(schema.load.id, row.id))
    .returning();
  await event(c, row.id, at, "status_changed", { fromStatus: row.status, toStatus: to, actorId: actor.userId, payload });
  Object.assign(row, updated);
  return row;
}

type LoadPlan = {
  code: string;
  shipper: PersonKey;
  category: LoadCategory;
  title: string;
  pickup: LoadStop & { windowStart: string };
  dropoff: LoadStop & { windowStart: string };
  details: Record<string, unknown>;
  notes?: string;
  targetPrice?: number;
  distanceMiles: number;
  volumeCuFt?: number;
  createdAt: Date;
  publishedAt?: Date;
  biddingDays?: number;
  biddingClosesAt?: Date;
};

async function createLoad(c: Ctx, plan: LoadPlan) {
  const input = loadInputSchema.safeParse({
    category: plan.category,
    title: plan.title,
    pickup: plan.pickup,
    dropoff: plan.dropoff,
    details: plan.details,
    notes: plan.notes,
    targetPrice: plan.targetPrice,
    biddingDays: plan.biddingDays ?? 5,
    publish: Boolean(plan.publishedAt),
  });
  if (!input.success) throw new Error(`${plan.code} is not a valid load input: ${JSON.stringify(input.error.issues)}`);
  const details = detailsSchema(plan.category).safeParse(plan.details);
  if (!details.success) throw new Error(`${plan.code} details fail src/features/loads/spec.ts: ${JSON.stringify(details.error.issues)}`);
  const extraKeys = Object.keys(plan.details).filter((k) => !(k in details.data));
  if (extraKeys.length) throw new Error(`${plan.code} details have fields the ${plan.category} spec doesn't know: ${extraKeys.join(", ")}`);
  const published = plan.publishedAt ?? null;
  const biddingDays = plan.biddingDays ?? 5;
  const status: LoadStatus = published ? "open" : "draft";
  const shipperId = c.users[plan.shipper];
  const [row] = await c.tx
    .insert(schema.load)
    .values({
      id: idAt(plan.createdAt),
      publicId: plan.code,
      shipperId,
      category: plan.category,
      title: plan.title,
      status,
      pickup: plan.pickup,
      dropoff: plan.dropoff,
      distanceMiles: plan.distanceMiles,
      details: { ...details.data, notes: plan.notes ?? null },
      detailsVersion: LOAD_DETAILS_VERSION,
      targetPriceCents: plan.targetPrice ? Math.round(plan.targetPrice * 100) : null,
      estimatedVolumeCuFt: plan.volumeCuFt ?? null,
      publishedAt: published,
      biddingDays,
      biddingClosesAt: published ? (plan.biddingClosesAt ?? plus(published, biddingDays * DAY)) : null,
      source: "dashboard",
      createdAt: plan.createdAt,
      updatedAt: published ?? plan.createdAt,
    })
    .returning();
  if (published && published.getTime() !== plan.createdAt.getTime()) {
    await event(c, row!.id, plan.createdAt, "created", { toStatus: "draft", actorId: shipperId });
    await event(c, row!.id, published, "status_changed", { fromStatus: "draft", toStatus: "open", actorId: shipperId });
  } else {
    await event(c, row!.id, plan.createdAt, published ? "published" : "created", { toStatus: status, actorId: shipperId });
  }
  return row!;
}

async function placeBid(c: Ctx, row: LoadRow, org: OrgKey, dollars: number, at: Date, message: string, opts: { pickupAt?: Date; deliveryAt?: Date; origin?: "manual" | "instant_quote"; by?: string } = {}) {
  if (message.length < 80) throw new Error(`${row.publicId}: bid message from ${org} is shorter than the app's 80-character minimum`);
  const amountCents = Math.round(dollars * 100);
  const createdBy = opts.by ?? c.owners[org];
  const [created] = await c.tx
    .insert(schema.bid)
    .values({
      id: idAt(at),
      loadId: row.id,
      carrierOrgId: c.orgIds[org],
      createdBy,
      amountCents,
      estimatedPickupAt: noon(opts.pickupAt ?? new Date(`${row.pickup.windowStart}T12:00:00Z`)),
      estimatedDeliveryAt: noon(opts.deliveryAt ?? new Date(`${row.dropoff.windowStart}T12:00:00Z`)),
      message,
      origin: opts.origin ?? "manual",
      createdAt: at,
      updatedAt: at,
    })
    .returning();
  await event(c, row.id, at, "bid_placed", { actorId: createdBy, payload: { bidId: created!.id, amountCents, ...(opts.origin === "instant_quote" ? { origin: "instant_quote" } : {}) } });
  await notify(c, [row.shipperId], at, {
    type: "bid_received",
    title: `New bid: ${formatUsd(amountCents)}`,
    body: `${c.orgNames[org]} bid ${formatUsd(amountCents)} on "${row.title}". Compare bids and accept the one that fits.`,
    href: `/app/loads/${row.publicId}`,
  });
  return created!;
}

async function book(c: Ctx, row: LoadRow, winner: typeof schema.bid.$inferSelect, at: Date) {
  const amounts = feeFor(winner.amountCents, FEE_BPS);
  await advance(c, row, "awaiting_payment", { kind: "shipper", userId: row.shipperId }, at, { acceptedBidId: winner.id }, { bidId: winner.id });
  const paidAt = plus(at, 2 * MIN);
  const [p] = await c.tx
    .insert(schema.payment)
    .values({
      id: idAt(at),
      loadId: row.id,
      bidId: winner.id,
      shipperId: row.shipperId,
      amountCents: amounts.shipperTotalCents,
      carrierAmountCents: amounts.carrierAmountCents,
      platformFeeCents: amounts.platformFeeCents,
      status: "succeeded",
      createdAt: at,
      updatedAt: paidAt,
    })
    .returning();
  const journalId = idAt(paidAt);
  await c.tx.insert(schema.ledgerEntry).values([
    { id: idAt(paidAt), journalId, account: "shipper_cash", amountCents: -p!.amountCents, refType: "payment", refId: p!.id, memo: `Paid ${row.publicId}`, createdAt: paidAt },
    { id: idAt(paidAt), journalId, account: "escrow", amountCents: p!.amountCents, refType: "payment", refId: p!.id, memo: `Held for ${row.publicId}`, createdAt: paidAt },
  ]);
  const carrierOrgId = winner.carrierOrgId;
  await advance(c, row, "booked", { kind: "system", userId: null }, paidAt, { carrierOrgId, acceptedBidId: winner.id }, { paymentId: p!.id });
  await c.tx.update(schema.bid).set({ status: "accepted", updatedAt: paidAt }).where(eq(schema.bid.id, winner.id));
  const declined = await c.tx
    .update(schema.bid)
    .set({ status: "declined", updatedAt: paidAt })
    .where(and(eq(schema.bid.loadId, row.id), eq(schema.bid.status, "active")))
    .returning({ carrierOrgId: schema.bid.carrierOrgId });
  await c.tx
    .insert(schema.conversation)
    .values({ id: idAt(paidAt), kind: "booking", loadId: row.id, shipperId: row.shipperId, carrierOrgId, createdAt: paidAt })
    .onConflictDoUpdate({ target: [schema.conversation.loadId, schema.conversation.carrierOrgId], set: { kind: "booking" } });
  const winnerKey = (Object.keys(c.orgIds) as OrgKey[]).find((k) => c.orgIds[k] === carrierOrgId)!;
  await notify(c, [row.shipperId], paidAt, {
    type: "load_booked",
    title: `${row.publicId} is booked`,
    body: `You booked ${c.orgNames[winnerKey]} for ${formatUsd(p!.carrierAmountCents)}. Your payment of ${formatUsd(p!.amountCents)} is held until delivery.`,
    href: `/app/loads/${row.publicId}`,
  });
  await notify(c, c.staff[winnerKey], paidAt, {
    type: "bid_won",
    title: `You won ${row.publicId}`,
    body: `Your bid of ${formatUsd(p!.carrierAmountCents)} on "${row.title}" was accepted and paid into escrow. Assign a driver and confirm pickup details.`,
    href: `/app/board/${row.publicId}`,
  });
  for (const orgId of new Set(declined.map((d) => d.carrierOrgId))) {
    const key = (Object.keys(c.orgIds) as OrgKey[]).find((k) => c.orgIds[k] === orgId)!;
    await notify(c, c.staff[key], paidAt, { type: "bid_declined", title: `${row.publicId} went to another carrier`, body: `The shipper booked another bid on "${row.title}".`, href: "/app/bids?tab=closed" });
  }
  return p!;
}

async function assign(c: Ctx, row: LoadRow, driver: PersonKey, at: Date, by: PersonKey = "dispatcher") {
  const driverId = c.users[driver];
  const person = people.find((p) => p.key === driver)!;
  await advance(c, row, "assigned", { kind: "carrier", userId: c.users[by] }, at, { driverId, assignedAt: at }, { driverId });
  await notify(c, [driverId], at, {
    type: "trip_assigned",
    title: `New trip: ${row.publicId}`,
    body: `${row.pickup.city}, ${row.pickup.state} → ${row.dropoff.city}, ${row.dropoff.state}. Open the trip for addresses and pickup window.`,
    href: `/app/trips/${row.publicId}`,
  });
  await notify(c, [row.shipperId], at, {
    type: "driver_assigned",
    title: `Driver assigned to ${row.publicId}`,
    body: `${person.firstName} ${person.lastName} will handle "${row.title}". You'll see live location once they head to pickup.`,
    href: `/app/loads/${row.publicId}`,
  });
}

async function startTrip(c: Ctx, row: LoadRow, at: Date) {
  await advance(c, row, "en_route_to_pickup", { kind: "driver", userId: row.driverId }, at);
  await notify(c, [row.shipperId], at, {
    type: "trip_started",
    title: `${row.publicId}: driver is on the way`,
    body: `The driver is heading to pickup in ${row.pickup.city}. Track them live on the load page.`,
    href: `/app/loads/${row.publicId}`,
  });
}

const images = {
  dock: "truck-at-dock.jpg",
  pallets: "pallets-in-trailer.jpg",
  wrapped: "warehouse-wrapped-goods.jpg",
  household: "household-load-strapped.jpg",
  sofa: "sofa-wrapped.jpg",
  blankets: "truck-interior-blankets.jpg",
  cabinet: "wrapped-cabinet-dock.jpg",
  items: "blanket-wrapped-items.jpg",
} as const;

async function storeImage(loadId: string, purpose: "pickup" | "delivery" | "dispute", file: string, at: Date) {
  if (storageMode === "none") return null;
  const key = `loads/${loadId}/${purpose}/${idAt(at)}.jpg`;
  const source = path.join(process.cwd(), "public", "images", file);
  if (storageMode === "local") {
    const target = path.join(process.cwd(), ".uploads", key);
    await mkdir(path.dirname(target), { recursive: true });
    await copyFile(source, target);
    return key;
  }
  const response = await fetch(`${SUPABASE_URL}/storage/v1/object/load-media/${key}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${SUPABASE_KEY}`, apikey: SUPABASE_KEY!, "Content-Type": "image/jpeg", "x-upsert": "true" },
    body: await readFile(source),
  });
  if (!response.ok) {
    console.warn(`  ! Supabase Storage upload failed (${response.status}) for ${key}; skipping that photo`);
    return null;
  }
  return key;
}

async function attach(c: Ctx, row: LoadRow, purpose: "pickup" | "delivery", kind: "pickup_photo" | "pod_photo", files: string[], at: Date) {
  let stored = 0;
  for (const [i, file] of files.entries()) {
    const when = plus(at, i * 1000);
    const key = await storeImage(row.id, purpose, file, when);
    if (!key) {
      c.mediaSkipped++;
      continue;
    }
    await c.tx.insert(schema.loadMedia).values({ id: idAt(when), loadId: row.id, kind, storageKey: key, contentType: "image/*", uploadedBy: row.driverId, createdAt: when });
    stored++;
  }
  return stored;
}

async function confirmPickup(c: Ctx, row: LoadRow, at: Date, files: string[], note: string | null) {
  const photos = await attach(c, row, "pickup", "pickup_photo", files, plus(at, -2 * MIN));
  await advance(c, row, "in_transit", { kind: "driver", userId: row.driverId }, at, { pickedUpAt: at }, { photos: photos || files.length, note });
  await notify(c, [row.shipperId], at, {
    type: "picked_up",
    title: `${row.publicId} picked up`,
    body: `Your shipment is loaded and in transit to ${row.dropoff.city}. Pickup photos are on the load page.`,
    href: `/app/loads/${row.publicId}`,
  });
}

async function confirmDelivery(c: Ctx, row: LoadRow, at: Date, recipientName: string, files: string[], note: string | null) {
  const photos = await attach(c, row, "delivery", "pod_photo", files, plus(at, -3 * MIN));
  await advance(c, row, "delivered", { kind: "driver", userId: row.driverId }, at, { deliveredAt: at, podRecipientName: recipientName }, { recipientName, photos: photos || files.length, note });
  await notify(c, [row.shipperId], at, {
    type: "delivered",
    title: `${row.publicId} delivered — please confirm`,
    body: `Signed for by ${recipientName}. Confirm delivery to release payment to the carrier, or report a problem within 72 hours. After that we release it automatically.`,
    href: `/app/loads/${row.publicId}`,
  });
  const org = (Object.keys(c.orgIds) as OrgKey[]).find((k) => c.orgIds[k] === row.carrierOrgId)!;
  await notify(c, c.staff[org], at, {
    type: "delivered",
    title: `${row.publicId} delivered`,
    body: "Proof of delivery is in. Payment releases when the shipper confirms, or automatically in 72 hours.",
    href: `/app/trips/${row.publicId}`,
  });
}

async function completeAndPay(c: Ctx, row: LoadRow, p: typeof schema.payment.$inferSelect, at: Date) {
  await advance(c, row, "completed", { kind: "shipper", userId: row.shipperId }, at, { completedAt: at });
  const releasedAt = plus(at, 1000);
  const payoutId = idAt(releasedAt);
  const amount = p.carrierAmountCents;
  const fee = p.amountCents - p.carrierAmountCents;
  const transferId = `sim_tr_${payoutId.slice(0, 18)}`;
  const paidAt = plus(at, 3000);
  await c.tx.insert(schema.payout).values({
    id: payoutId,
    loadId: row.id,
    paymentId: p.id,
    carrierOrgId: row.carrierOrgId!,
    amountCents: amount,
    status: "paid",
    stripeTransferId: transferId,
    releaseAfter: releasedAt,
    paidAt,
    createdAt: releasedAt,
    updatedAt: paidAt,
  });
  const releaseJournal = idAt(releasedAt);
  await c.tx.insert(schema.ledgerEntry).values([
    { id: idAt(releasedAt), journalId: releaseJournal, account: "escrow", amountCents: -(amount + fee), refType: "payout", refId: payoutId, memo: `Release ${row.publicId}`, createdAt: releasedAt },
    { id: idAt(releasedAt), journalId: releaseJournal, account: "platform_revenue", amountCents: fee, refType: "payout", refId: payoutId, memo: `Fee ${row.publicId}`, createdAt: releasedAt },
    { id: idAt(releasedAt), journalId: releaseJournal, account: "carrier_payable", amountCents: amount, refType: "payout", refId: payoutId, memo: `Owed for ${row.publicId}`, createdAt: releasedAt },
  ]);
  const transferJournal = idAt(paidAt);
  await c.tx.insert(schema.ledgerEntry).values([
    { id: idAt(paidAt), journalId: transferJournal, account: "carrier_payable", amountCents: -amount, refType: "transfer", refId: transferId, memo: `Paid ${row.publicId}`, createdAt: paidAt },
    { id: idAt(paidAt), journalId: transferJournal, account: "carrier_paid", amountCents: amount, refType: "transfer", refId: transferId, memo: `Paid ${row.publicId}`, createdAt: paidAt },
  ]);
  await event(c, row.id, paidAt, "payout_sent", { payload: { payoutId, amountCents: amount, transferId } });
  await notify(c, [row.shipperId], at, {
    type: "completed",
    title: `${row.publicId} is complete`,
    body: "Thanks for shipping with AllShip AI. How did the carrier do? A quick review helps other shippers.",
    href: `/app/loads/${row.publicId}#review`,
  });
  const org = (Object.keys(c.orgIds) as OrgKey[]).find((k) => c.orgIds[k] === row.carrierOrgId)!;
  await notify(c, c.staff[org], paidAt, {
    type: "payout_sent",
    title: `${formatUsd(amount)} is on its way`,
    body: `We released your payment for ${row.publicId} "${row.title}". Stripe deposits it to your bank on your payout schedule.`,
    href: "/app/payouts",
  });
}

async function chat(c: Ctx, row: LoadRow, org: OrgKey, kind: "inquiry" | "booking", lines: Array<[PersonKey, string, Date]>, reads: Array<[PersonKey, Date]> = []) {
  const first = lines[0]?.[2] ?? ago(0);
  const last = lines[lines.length - 1]?.[2] ?? first;
  const [conv] = await c.tx
    .insert(schema.conversation)
    .values({ id: idAt(first), kind, loadId: row.id, shipperId: row.shipperId, carrierOrgId: c.orgIds[org], createdAt: first, lastMessageAt: last })
    .onConflictDoUpdate({ target: [schema.conversation.loadId, schema.conversation.carrierOrgId], set: { lastMessageAt: last } })
    .returning({ id: schema.conversation.id });
  for (const [sender, body, at] of lines) {
    await c.tx.insert(schema.message).values({ id: idAt(at), conversationId: conv!.id, senderId: c.users[sender], body, createdAt: at });
  }
  const readers = new Map<PersonKey, Date>();
  for (const [sender, , at] of lines) readers.set(sender, at);
  for (const [who, at] of reads) readers.set(who, at);
  for (const [who, at] of readers) {
    await c.tx
      .insert(schema.conversationRead)
      .values({ conversationId: conv!.id, userId: c.users[who], lastReadAt: at })
      .onConflictDoUpdate({ target: [schema.conversationRead.conversationId, schema.conversationRead.userId], set: { lastReadAt: at } });
  }
}

type Point = [number, number];

function haversineMiles(a: Point, b: Point) {
  const rad = Math.PI / 180;
  const dLat = (b[0] - a[0]) * rad;
  const dLng = (b[1] - a[1]) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * rad) * Math.cos(b[0] * rad) * Math.sin(dLng / 2) ** 2;
  return 3958.8 * 2 * Math.asin(Math.sqrt(h));
}

function bearing(a: Point, b: Point) {
  const rad = Math.PI / 180;
  const y = Math.sin((b[1] - a[1]) * rad) * Math.cos(b[0] * rad);
  const x = Math.cos(a[0] * rad) * Math.sin(b[0] * rad) - Math.sin(a[0] * rad) * Math.cos(b[0] * rad) * Math.cos((b[1] - a[1]) * rad);
  return Math.round(((Math.atan2(y, x) / rad) + 360) % 360);
}

function sample(route: Point[], count: number, endFraction: number): Point[] {
  const segments = route.slice(1).map((p, i) => haversineMiles(route[i]!, p));
  const total = segments.reduce((s, d) => s + d, 0);
  const out: Point[] = [];
  for (let i = 0; i < count; i++) {
    let target = (total * endFraction * i) / Math.max(1, count - 1);
    let seg = 0;
    while (seg < segments.length - 1 && target > segments[seg]!) {
      target -= segments[seg]!;
      seg++;
    }
    const a = route[seg]!;
    const b = route[seg + 1]!;
    const t = segments[seg] ? Math.min(1, target / segments[seg]!) : 0;
    out.push([Number((a[0] + (b[0] - a[0]) * t).toFixed(6)), Number((a[1] + (b[1] - a[1]) * t).toFixed(6))]);
  }
  return out;
}

async function track(c: Ctx, row: LoadRow, route: Point[], count: number, endFraction: number, lastAt: Date, intervalMs: number, cruiseMph: number) {
  const points = sample(route, count, endFraction);
  const values = points.map((p, i) => {
    const next = points[i + 1] ?? p;
    const prev = points[i - 1] ?? p;
    const recordedAt = new Date(lastAt.getTime() - (points.length - 1 - i) * intervalMs);
    const wobble = ((i * 7919) % 11) - 5;
    return {
      id: idAt(recordedAt),
      loadId: row.id,
      driverId: row.driverId!,
      lat: p[0],
      lng: p[1],
      accuracyM: 5 + ((i * 31) % 9),
      headingDeg: bearing(i === points.length - 1 ? prev : p, i === points.length - 1 ? p : next),
      speedMph: Math.max(0, cruiseMph + wobble),
      recordedAt,
    };
  });
  await c.tx.insert(schema.driverLocation).values(values);
}

async function seedUsersAndOrgs(tx: Tx, hashes: Map<string, string>, existing: Awaited<ReturnType<typeof markers>>) {
  const users = {} as Record<PersonKey, string>;
  for (const p of people) {
    const id = existing.users.get(p.email) ?? authId();
    const createdAt = ago(p.joinedDaysAgo * DAY);
    const fields = {
      name: `${p.firstName} ${p.lastName}`,
      email: p.email,
      emailVerified: true,
      image: null,
      firstName: p.firstName,
      lastName: p.lastName,
      phone: p.phone,
      accountType: p.accountType,
      onboardingCompletedAt: plus(createdAt, 6 * MIN),
      locale: "en-US",
      role: p.admin ? "admin" : "user",
      twoFactorEnabled: Boolean(p.admin),
      banned: false,
      banReason: null,
      banExpires: null,
    };
    const [found] = await tx.select({ id: schema.user.id }).from(schema.user).where(eq(schema.user.id, id)).limit(1);
    if (found) await tx.update(schema.user).set({ ...fields, updatedAt: new Date() }).where(eq(schema.user.id, id));
    else await tx.insert(schema.user).values({ id, ...fields, createdAt, updatedAt: createdAt });
    await tx.insert(schema.legacyMap).values({ collection: USER_MARK, mongoId: p.email, newId: id }).onConflictDoUpdate({ target: [schema.legacyMap.collection, schema.legacyMap.mongoId], set: { newId: id } });
    const [credential] = await tx
      .select({ id: schema.account.id })
      .from(schema.account)
      .where(and(eq(schema.account.userId, id), eq(schema.account.providerId, "credential")))
      .limit(1);
    const password = hashes.get(p.email)!;
    if (credential) await tx.update(schema.account).set({ password, updatedAt: new Date() }).where(eq(schema.account.id, credential.id));
    else await tx.insert(schema.account).values({ id: authId(), accountId: id, providerId: "credential", userId: id, password, createdAt, updatedAt: createdAt });
    users[p.key] = id;
  }

  const orgIds = {} as Record<OrgKey, string>;
  for (const spec of orgs) {
    const id = existing.orgIds.get(spec.key) ?? authId();
    const createdAt = ago(spec.createdDaysAgo * DAY);
    const [found] = await tx.select({ id: schema.organization.id }).from(schema.organization).where(eq(schema.organization.id, id)).limit(1);
    if (found) await tx.update(schema.organization).set({ name: spec.name, slug: spec.slug, logo: null, metadata: null }).where(eq(schema.organization.id, id));
    else await tx.insert(schema.organization).values({ id, name: spec.name, slug: spec.slug, createdAt });
    await tx.insert(schema.legacyMap).values({ collection: ORG_MARK, mongoId: spec.key, newId: id }).onConflictDoUpdate({ target: [schema.legacyMap.collection, schema.legacyMap.mongoId], set: { newId: id } });
    const profile = { ...spec.profile, updatedAt: new Date() };
    await tx.insert(schema.carrierProfile).values({ orgId: id, ...profile, createdAt }).onConflictDoUpdate({ target: schema.carrierProfile.orgId, set: profile });
    const issues = validateTiers(spec.tiers);
    if (issues.length) throw new Error(`Rate tiers for ${spec.name} are invalid: ${issues.map((i) => i.message).join("; ")}`);
    await tx.delete(schema.carrierRateTier).where(eq(schema.carrierRateTier.orgId, id));
    if (spec.tiers.length) await tx.insert(schema.carrierRateTier).values(spec.tiers.map((t) => ({ orgId: id, ...t, createdAt })));
    if (spec.rates) await tx.insert(schema.carrierServiceRates).values({ orgId: id, ...spec.rates }).onConflictDoUpdate({ target: schema.carrierServiceRates.orgId, set: { ...spec.rates, updatedAt: new Date() } });
    else await tx.delete(schema.carrierServiceRates).where(eq(schema.carrierServiceRates.orgId, id));
    orgIds[spec.key] = id;
  }

  for (const p of people.filter((x) => x.org)) {
    const joined = ago(p.joinedDaysAgo * DAY);
    await tx
      .insert(schema.member)
      .values({ id: authId(), organizationId: orgIds[p.org!], userId: users[p.key], role: p.orgRole!, createdAt: plus(joined, 5 * MIN) })
      .onConflictDoUpdate({ target: [schema.member.organizationId, schema.member.userId], set: { role: p.orgRole! } });
  }
  await tx.delete(schema.invitation).where(and(eq(schema.invitation.organizationId, orgIds.A), eq(schema.invitation.email, INVITED_EMAIL)));
  const invitationId = authId();
  await tx.insert(schema.invitation).values({ id: invitationId, organizationId: orgIds.A, email: INVITED_EMAIL, role: "driver", status: "pending", expiresAt: ahead(5 * DAY), inviterId: users.carrier, createdAt: ago(2 * DAY) });

  if (process.env.RESEND_API_KEY) {
    for (const email of [...people.map((p) => p.email), INVITED_EMAIL]) {
      await tx.insert(schema.emailSuppression).values({ email, reason: "bounced", scope: "all" }).onConflictDoNothing();
    }
  }
  return { users, orgIds, invitationId };
}

async function adminTwoFactor(tx: Tx, adminId: string) {
  const key = secretKey();
  const [row] = await tx.select().from(schema.twoFactor).where(eq(schema.twoFactor.userId, adminId)).limit(1);
  if (row) {
    try {
      const secret = await symmetricDecrypt({ key, data: row.secret });
      const codes = JSON.parse(await symmetricDecrypt({ key, data: row.backupCodes })) as string[];
      if (secret && Array.isArray(codes)) {
        await tx.update(schema.twoFactor).set({ verified: true, failedVerificationCount: 0, lockedUntil: null }).where(eq(schema.twoFactor.id, row.id));
        return { secret, codes, reused: true };
      }
    } catch {
      await tx.delete(schema.twoFactor).where(eq(schema.twoFactor.id, row.id));
    }
  }
  await tx.delete(schema.twoFactor).where(eq(schema.twoFactor.userId, adminId));
  const secret = generateRandomString(32);
  const codes = Array.from({ length: 10 }, () => generateRandomString(10, "a-z", "0-9", "A-Z")).map((code) => `${code.slice(0, 5)}-${code.slice(5)}`);
  await tx.insert(schema.twoFactor).values({
    id: authId(),
    userId: adminId,
    secret: await symmetricEncrypt({ key, data: secret }),
    backupCodes: await symmetricEncrypt({ key, data: JSON.stringify(codes) }),
    verified: true,
    failedVerificationCount: 0,
  });
  return { secret, codes, reused: false };
}

async function seedMarketplace(c: Ctx) {
  const A = c.orgIds.A;

  await createLoad(c, {
    code: loadCodes.draft,
    shipper: "shipper",
    category: "car_or_light_truck",
    title: "2019 Honda CR-V to Denver",
    pickup: stop("1840 N Clybourn Ave", "Chicago", "IL", "60614", 41.9137, -87.6555, ahead(12 * DAY)),
    dropoff: stop("2300 Larimer St", "Denver", "CO", "80205", 39.7569, -104.9872, ahead(16 * DAY)),
    details: { year: 2019, make: "Honda", model: "CR-V EX", condition: "Runs and drives", trailer: "Open trailer", modified: false, convertible: false },
    notes: "Keys stay with the building concierge. Street parking only at pickup.",
    targetPrice: 1100,
    distanceMiles: 1003,
    createdAt: ago(2 * DAY),
  });

  const bidsPublished = ago(30 * HOUR);
  const tierA = orgs.find((o) => o.key === "A")!;
  const volume = volumeForBedrooms(2);
  const miles = 1115;
  const quote = priceMove(tierA.tiers, tierA.rates, { volumeCuFt: volume, miles, packing: "none", unpacking: false, storageMonths: 0 });
  if (!quote) throw new Error("Demo Freight Lines has no rate tier for the instant quote route");
  const bidsLoad = await createLoad(c, {
    code: loadCodes.bids,
    shipper: "shipper",
    category: "long_distance_moving",
    title: "2-bedroom apartment, Chicago to Austin",
    pickup: stop("1520 W Wrightwood Ave", "Chicago", "IL", "60614", 41.9289, -87.6669, ahead(9 * DAY), { floor: 3, hasElevator: true }),
    dropoff: stop("4512 Avenue F", "Austin", "TX", "78751", 30.3109, -97.7266, ahead(13 * DAY)),
    details: { residence: "Apartment", bedrooms: "2", pickupFloor: "3rd floor or higher, elevator", deliveryFloor: "Ground floor", packing: "I'll pack", services: ["Furniture disassembly and reassembly"], storageMonths: 0 },
    notes: "Freight elevator is reserved 9 am to 1 pm on moving day. About 35 boxes plus a sectional sofa, queen bed, dresser and a desk.",
    targetPrice: 4000,
    distanceMiles: miles,
    volumeCuFt: volume,
    createdAt: bidsPublished,
    publishedAt: bidsPublished,
  });
  const instantAt = plus(bidsPublished, 2 * MIN);
  const instantMessage = `Instant quote from your published rates: ${quote.lines.map((l) => `${l.label} ${formatUsd(l.cents)} (${l.detail})`).join("; ")}. Total ${formatUsd(quote.carrierCents)} for ${volume.toLocaleString("en-US")} ft³ over ${miles.toLocaleString("en-US")} miles. Final inventory, access and dates are confirmed with the shipper before pickup.`;
  const instant = await placeBid(c, bidsLoad, "A", quote.carrierCents / 100, instantAt, instantMessage, { origin: "instant_quote" });
  await c.tx
    .update(schema.load)
    .set({
      details: {
        ...bidsLoad.details,
        instantQuote: { carrierOrgId: A, carrierName: c.orgNames.A, carrierCents: quote.carrierCents, lines: quote.lines, miles, distanceMethod: "routed", volumeCuFt: volume, quotedAt: bidsPublished.toISOString(), bidId: instant.id },
      },
    })
    .where(eq(schema.load.id, bidsLoad.id));
  await placeBid(c, bidsLoad, "B", 3980, ago(22 * HOUR), "Dedicated 26 ft truck and a 3-person crew. We disassemble and reassemble the bed and sectional, pad-wrap all furniture and deliver within 4 days of pickup. Weekly Chicago–Texas run, so dates are flexible.", { deliveryAt: ahead(12 * DAY) });
  await placeBid(c, bidsLoad, "C", 4240, ago(6 * HOUR), "Shared 53 ft van with a dedicated section for your household goods. Full pad wrap, two movers at each end, delivery window of 3–5 days. Includes up to 7 days of storage at no charge if Austin isn't ready yet.");
  await chat(c, bidsLoad, "B", "inquiry", [
    ["carrier2", "Hi Emily, quick question before you decide: is the freight elevator padded, and is there a loading dock or street parking for a 26 ft truck?", ago(21 * HOUR)],
    ["shipper", "Hi Ray! The elevator has pads on request and there's a loading zone on Wrightwood, no dock. Building asks for a COI naming the management company.", ago(19 * HOUR)],
    ["carrier2", "No problem, we can send the COI the same day you book. Our bid includes the loading zone permit.", ago(18 * HOUR)],
  ], [["shipper", ago(17 * HOUR)]]);

  const closesAt = ahead(20 * HOUR);
  const closingPublished = plus(closesAt, -5 * DAY);
  const closing = await createLoad(c, {
    code: loadCodes.closing,
    shipper: "shipper",
    category: "freight",
    title: "12 pallets of auto parts to Indianapolis",
    pickup: stop("3601 S Iron St", "Chicago", "IL", "60609", 41.827, -87.6575, ahead(3 * DAY), { windowEnd: ymd(ahead(4 * DAY)), notes: "Dock 4, open 7 am to 3 pm" }),
    dropoff: stop("5250 W 74th St", "Indianapolis", "IN", "46268", 39.881, -86.257, ahead(4 * DAY)),
    details: { description: "Packaged aftermarket auto parts", quantity: 12, weight: 9600, length: 48, width: 40, height: 52, units: ["Pallets"], freightClass: "85", trailerPrefs: ["Dry van"], stackable: false, hazardous: false, liftgate: true },
    notes: "Receiver needs a 30-minute call ahead. Liftgate required at delivery, no dock.",
    targetPrice: 1100,
    distanceMiles: 183,
    createdAt: closingPublished,
    publishedAt: closingPublished,
    biddingClosesAt: closesAt,
  });
  await placeBid(c, closing, "B", 1050, ago(2 * DAY), "53 ft dry van with liftgate, team-loaded at your dock 4 between 7 and 10 am. Direct to Indianapolis with no transfers, same-day delivery and a call 30 minutes before arrival.");

  const bookedPublished = ago(3 * DAY);
  const booked = await createLoad(c, {
    code: loadCodes.booked,
    shipper: "shipper",
    category: "household_items",
    title: "Sofa, dining set and bed to Milwaukee",
    pickup: stop("2436 W Iowa St", "Chicago", "IL", "60622", 41.8973, -87.688, ahead(3 * DAY), { floor: 2, hasElevator: false }),
    dropoff: stop("2215 N Prospect Ave", "Milwaukee", "WI", "53202", 43.0583, -87.887, ahead(3 * DAY)),
    details: { furniture: ["Sofa", "Dining table", "Bed"], appliances: ["Washer or dryer"], itemCount: 14, special: ["Glass"], pickupFloor: "2nd floor", deliveryFloor: "Ground floor", services: ["Furniture disassembly and reassembly"] },
    notes: "Glass dining table top needs a crate or extra padding.",
    distanceMiles: 92,
    createdAt: bookedPublished,
    publishedAt: bookedPublished,
  });
  const bookedWin = await placeBid(c, booked, "A", 640, plus(bookedPublished, 4 * HOUR), "Two movers and a 26 ft box truck. We bring a glass crate for the table top, disassemble the bed and wrap everything in moving blankets. Same-day delivery to Milwaukee.");
  await placeBid(c, booked, "B", 700, plus(bookedPublished, 10 * HOUR), "Two-person crew with a 20 ft truck, padded and strapped. Delivery same day, tools and wardrobe boxes included. We can take the washer and dryer hookups apart for you.");
  await book(c, booked, bookedWin, ago(20 * HOUR));
  await chat(c, booked, "A", "booking", [
    ["carrier", "Thanks for booking, Emily. We'll assign a crew today. Is 8 am on pickup day too early?", ago(19 * HOUR)],
    ["shipper", "8 am works. The side gate code is 4417.", ago(18 * HOUR)],
  ], [["carrier", ago(18 * HOUR)]]);

  const assignedPublished = ago(5 * DAY);
  const assigned = await createLoad(c, {
    code: loadCodes.assigned,
    shipper: "shipper",
    category: "motorcycle",
    title: "Harley-Davidson Street Glide to Nashville",
    pickup: stop("1001 W Fulton Market", "Chicago", "IL", "60607", 41.8867, -87.6527, ahead(1 * DAY), { windowEnd: ymd(ahead(1 * DAY)), notes: "Garage level P2, ask security for the gate" }),
    dropoff: stop("1200 Clinton St", "Nashville", "TN", "37203", 36.169, -86.7956, ahead(3 * DAY)),
    details: { year: 2021, make: "Harley-Davidson", model: "Street Glide Special", condition: "Runs and drives", style: "Standard", modified: false, crated: false },
    distanceMiles: 473,
    createdAt: assignedPublished,
    publishedAt: assignedPublished,
  });
  const assignedWin = await placeBid(c, assigned, "A", 585, plus(assignedPublished, 12 * HOUR), "Enclosed trailer with a wheel chock and soft ties on the frame, never the bars or bags. Pickup tomorrow morning, delivery to Nashville the next day with a call ahead.");
  await placeBid(c, assigned, "C", 640, plus(assignedPublished, 20 * HOUR), "Open car hauler with a dedicated motorcycle deck and soft straps. Pickup within the window you set, delivery in 2 days, door to door with photos at both ends.");
  await book(c, assigned, assignedWin, ago(3 * DAY));
  await assign(c, assigned, "driver1", ago(2 * DAY));
  await chat(c, assigned, "A", "booking", [
    ["carrier", "Luis will pick up the bike tomorrow between 8 and 10 am.", ago(2 * DAY)],
    ["driver1", "Hi Emily, Luis here. I'll text 30 minutes before I get to Fulton Market.", ago(26 * HOUR)],
    ["shipper", "Perfect, see you then. Please leave the saddlebags locked, key is with security.", ago(25 * HOUR)],
  ], [["driver1", ago(24 * HOUR)]]);

  const enRoutePublished = ago(6 * DAY);
  const enRoute = await createLoad(c, {
    code: loadCodes.enRoute,
    shipper: "shipper",
    category: "local_moving",
    title: "3-bedroom house, Evanston to Naperville",
    pickup: stop("1214 Hinman Ave", "Evanston", "IL", "60202", 42.0386, -87.6797, ago(0)),
    dropoff: stop("1015 E Chicago Ave", "Naperville", "IL", "60540", 41.771, -88.131, ago(0)),
    details: { residence: "House", bedrooms: "3", pickupFloor: "Ground floor", deliveryFloor: "2nd floor", services: ["Packing and unpacking", "Furniture disassembly and reassembly"] },
    notes: "Upright piano stays. Kitchen is packed, the rest needs packing.",
    distanceMiles: 38,
    volumeCuFt: 1300,
    createdAt: enRoutePublished,
    publishedAt: enRoutePublished,
  });
  const enRouteWin = await placeBid(c, enRoute, "A", 1450, plus(enRoutePublished, 6 * HOUR), "Four movers, a 26 ft truck and all packing materials. We pack the remaining rooms in the morning, load by early afternoon and set up beds and the dining table in Naperville the same day.");
  await placeBid(c, enRoute, "B", 1600, plus(enRoutePublished, 14 * HOUR), "Three-person crew with packing supplies included. Same-day move with furniture reassembly at the new house. Weekend availability if you need to shift the date.");
  await book(c, enRoute, enRouteWin, ago(4 * DAY));
  await assign(c, enRoute, "driver2", ago(3 * DAY));
  await startTrip(c, enRoute, ago(24 * MIN));
  await track(c, enRoute, [[42.0039, -87.9703], [42.0334, -87.8834], [42.0503, -87.8079], [42.0324, -87.7416], [42.041, -87.7], [42.0386, -87.6797]], 15, 0.86, ago(1 * MIN), 90_000, 34);
  await chat(c, enRoute, "A", "booking", [
    ["driver2", "Good morning! Leaving our Elk Grove yard now, crew of four. ETA about 25 minutes.", ago(24 * MIN)],
    ["shipper", "Great, the driveway is clear for the truck.", ago(20 * MIN)],
  ], [["driver2", ago(19 * MIN)]]);

  const transitPublished = ago(7 * DAY);
  const transit = await createLoad(c, {
    code: loadCodes.inTransit,
    shipper: "shipper",
    category: "freight",
    title: "Crated kitchen equipment to St. Louis",
    pickup: stop("2201 S Halsted St", "Chicago", "IL", "60608", 41.853, -87.6466, ago(0)),
    dropoff: stop("1520 Washington Ave", "St. Louis", "MO", "63103", 38.6327, -90.1985, ago(0)),
    details: { description: "Commercial kitchen equipment, crated", quantity: 6, weight: 4200, length: 60, width: 48, height: 60, units: ["Crates"], freightClass: "100", trailerPrefs: ["Dry van"], stackable: false, hazardous: false, liftgate: true },
    notes: "Restaurant opening. Delivery to the rear door on Lucas Ave, liftgate needed.",
    distanceMiles: 297,
    createdAt: transitPublished,
    publishedAt: transitPublished,
  });
  const transitWin = await placeBid(c, transit, "A", 1180, plus(transitPublished, 5 * HOUR), "53 ft dry van with liftgate and load bars. Crates are blocked and strapped, no stacking. Direct run down I-55, delivery the same afternoon with a call 45 minutes out.");
  await placeBid(c, transit, "C", 1320, plus(transitPublished, 9 * HOUR), "Dry van with liftgate and a two-person delivery team for the rear door. Same-day delivery, driver tracks live and sends photos at pickup and drop.");
  await book(c, transit, transitWin, ago(5 * DAY));
  await assign(c, transit, "driver3", ago(4 * DAY));
  await startTrip(c, transit, ago(4 * HOUR));
  await confirmPickup(c, transit, ago(3 * HOUR + 25 * MIN), [images.pallets, images.wrapped], "6 crates loaded and strapped, no visible damage.");
  await track(c, transit, [[41.853, -87.6466], [41.818, -87.74], [41.6986, -88.0684], [41.56, -88.16], [41.265, -88.212], [41.0945, -88.4256], [40.8809, -88.6298], [40.6417, -88.7837], [40.4842, -88.9937], [40.3145, -89.1723], [40.1484, -89.3648], [39.7817, -89.6501], [39.28, -89.88], [38.89, -90.06], [38.6327, -90.1985]], 40, 0.62, ago(2 * MIN), 5 * MIN, 62);
  await chat(c, transit, "A", "booking", [
    ["driver3", "All 6 crates loaded, photos are on the load page. Heading down I-55 now.", ago(3 * HOUR + 20 * MIN)],
    ["shipper", "Thanks Kevin! The kitchen manager Ana will meet you at the rear door.", ago(3 * HOUR)],
    ["driver3", "Passing Bloomington, on schedule for about 2 pm.", ago(70 * MIN)],
  ]);

  const deliveredPublished = ago(9 * DAY);
  const delivered = await createLoad(c, {
    code: loadCodes.delivered,
    shipper: "shipper",
    category: "car_or_light_truck",
    title: "Tesla Model 3 to Detroit, enclosed",
    pickup: stop("455 E Waterside Dr", "Chicago", "IL", "60601", 41.8869, -87.6156, ago(30 * HOUR)),
    dropoff: stop("1001 Woodward Ave", "Detroit", "MI", "48226", 42.3321, -83.0466, ago(5 * HOUR)),
    details: { year: 2021, make: "Tesla", model: "Model 3 Long Range", condition: "Runs and drives", trailer: "Enclosed trailer", modified: false, convertible: false },
    notes: "Charged to 80%. Please don't use the frunk for tie-downs.",
    distanceMiles: 283,
    createdAt: deliveredPublished,
    publishedAt: deliveredPublished,
  });
  const deliveredWin = await placeBid(c, delivered, "A", 720, plus(deliveredPublished, 8 * HOUR), "Enclosed two-car trailer with soft wheel straps and a liftgate, so the car never climbs a steep ramp. Delivery to Detroit the day after pickup, photos at both ends.");
  await placeBid(c, delivered, "C", 760, plus(deliveredPublished, 15 * HOUR), "Enclosed single-car trailer, wheel-net tie-downs, insured to $150,000. Pickup on your date and delivery within 2 days with a call ahead.");
  await placeBid(c, delivered, "B", 790, plus(deliveredPublished, 20 * HOUR), "Enclosed transport with soft straps and full photo inspection at pickup and delivery. We can hold the car one extra day in Detroit at no cost if needed.");
  await book(c, delivered, deliveredWin, ago(7 * DAY));
  await assign(c, delivered, "driver1", ago(6 * DAY));
  await startTrip(c, delivered, ago(31 * HOUR));
  await confirmPickup(c, delivered, ago(30 * HOUR), [images.dock], "Walk-around done, no scratches. 80% charge.");
  await confirmDelivery(c, delivered, ago(5 * HOUR), "Daniel Carter", [images.blankets], "Delivered to the building garage, level 2.");
  await chat(c, delivered, "A", "booking", [
    ["driver1", "Car is delivered and Daniel signed for it. Photos are uploaded.", ago(5 * HOUR)],
    ["carrier", "Thanks Luis. Emily, please confirm delivery on the load page when you get a chance.", ago(4 * HOUR + 50 * MIN)],
  ]);

  const completedPublished = ago(24 * DAY);
  const completed = await createLoad(c, {
    code: loadCodes.completed,
    shipper: "shipper",
    category: "long_distance_moving",
    title: "1-bedroom condo to Minneapolis",
    pickup: stop("3150 N Lake Shore Dr", "Chicago", "IL", "60657", 41.9399, -87.639, ago(15 * DAY), { floor: 18, hasElevator: true }),
    dropoff: stop("1200 Nicollet Mall", "Minneapolis", "MN", "55403", 44.9705, -93.276, ago(14 * DAY), { floor: 9, hasElevator: true }),
    details: { residence: "Condo", bedrooms: "1", pickupFloor: "3rd floor or higher, elevator", deliveryFloor: "3rd floor or higher, elevator", packing: "Fragile items only", services: ["Furniture disassembly and reassembly"], storageMonths: 0 },
    distanceMiles: 409,
    volumeCuFt: 300,
    createdAt: completedPublished,
    publishedAt: completedPublished,
  });
  const completedWin = await placeBid(c, completed, "A", 2860, plus(completedPublished, 10 * HOUR), "Dedicated truck and a three-person crew. We pack the glassware and artwork, reserve both freight elevators with your buildings and deliver the next morning in Minneapolis.");
  await placeBid(c, completed, "B", 3100, plus(completedPublished, 30 * HOUR), "Two movers and a 20 ft truck. Fragile packing included, delivery within 2 days. COI sent to both buildings ahead of time.");
  const completedPayment = await book(c, completed, completedWin, ago(21 * DAY));
  await assign(c, completed, "driver2", ago(20 * DAY));
  await startTrip(c, completed, ago(15 * DAY + 3 * HOUR));
  await confirmPickup(c, completed, ago(15 * DAY), [images.household, images.sofa], "Loaded 42 boxes, sofa, bed and desk.");
  await confirmDelivery(c, completed, ago(14 * DAY), "Emily Carter", [images.items], "Everything placed in rooms, bed reassembled.");
  await completeAndPay(c, completed, completedPayment, ago(13 * DAY + 20 * HOUR));
  const reviewAt = ago(13 * DAY);
  await c.tx.insert(schema.review).values({
    id: idAt(reviewAt),
    loadId: completed.id,
    shipperId: completed.shipperId,
    carrierOrgId: A,
    rating: 5,
    body: "Tanya and the crew were on time, wrapped every piece and had the bed set up before they left. Nothing broken, and they handled both freight elevators without me having to chase anyone.",
    carrierReply: "Thank you, Emily! It was a smooth move on both ends. Enjoy Minneapolis.",
    carrierRepliedAt: ago(12 * DAY),
    createdAt: reviewAt,
  });
  await notify(c, c.staff.A, reviewAt, { type: "review_received", title: "New 5-star review", body: "\"Tanya and the crew were on time, wrapped every piece and had the bed set up before they left.\"", href: "/app/reviews" });
  await chat(c, completed, "A", "booking", [
    ["carrier", "Crew confirmed for 8 am. Both elevators are reserved.", ago(16 * DAY)],
    ["shipper", "Thank you! I'll have coffee ready.", ago(16 * DAY - 2 * HOUR)],
    ["driver2", "All delivered and set up. Have a great first night in the new place!", ago(14 * DAY)],
  ], [["shipper", ago(14 * DAY - HOUR)]]);

  const disputedPublished = ago(12 * DAY);
  const disputed = await createLoad(c, {
    code: loadCodes.disputed,
    shipper: "shipper",
    category: "household_items",
    title: "Antique dresser and dining set to Columbus",
    pickup: stop("5414 S Blackstone Ave", "Chicago", "IL", "60615", 41.7963, -87.5903, ago(4 * DAY)),
    dropoff: stop("780 S High St", "Columbus", "OH", "43206", 39.9472, -82.9973, ago(2 * DAY), { floor: 2, hasElevator: false }),
    details: { furniture: ["Dresser", "Dining table"], appliances: [], itemCount: 9, special: ["Antiques"], pickupFloor: "Ground floor", deliveryFloor: "2nd floor", services: [] },
    notes: "1920s walnut dresser, please blanket-wrap and keep upright.",
    distanceMiles: 355,
    createdAt: disputedPublished,
    publishedAt: disputedPublished,
  });
  const disputedWin = await placeBid(c, disputed, "A", 1240, plus(disputedPublished, 7 * HOUR), "Two movers, blanket wrap and corner protection on every piece. The dresser rides upright and strapped to the wall of the truck. Delivery to Columbus within 2 days of pickup.");
  await placeBid(c, disputed, "C", 1390, plus(disputedPublished, 16 * HOUR), "Antique-rated crew with custom crating available for the dresser. Delivery within 3 days, upstairs placement included.");
  await book(c, disputed, disputedWin, ago(10 * DAY));
  await assign(c, disputed, "driver3", ago(9 * DAY));
  await startTrip(c, disputed, ago(4 * DAY + 2 * HOUR));
  await confirmPickup(c, disputed, ago(4 * DAY), [images.cabinet], "Dresser wrapped and strapped upright.");
  await confirmDelivery(c, disputed, ago(2 * DAY), "Emily Carter", [images.items], "Carried upstairs, placed in the dining room.");
  const disputeAt = ago(36 * HOUR);
  const evidenceKey = await storeImage(disputed.id, "dispute", images.items, disputeAt);
  if (!evidenceKey) c.mediaSkipped++;
  await advance(c, disputed, "disputed", { kind: "shipper", userId: disputed.shipperId }, disputeAt, {}, { reason: "damage" });
  await c.tx.insert(schema.dispute).values({
    id: idAt(disputeAt),
    loadId: disputed.id,
    openedBy: disputed.shipperId,
    openedByRole: "shipper",
    reason: "damage",
    details: "The walnut dresser arrived with a cracked top panel and a deep gouge on the left side. The pickup photo shows it intact. I'd like a partial refund to cover the restoration quote of $380.",
    previousStatus: "delivered",
    status: "open",
    evidence: evidenceKey ? [evidenceKey] : [],
    createdAt: disputeAt,
  });
  await notify(c, c.staff.A, disputeAt, {
    type: "dispute_opened",
    title: `Problem reported on ${disputed.publicId}`,
    body: "The shipper reported: damage. Payment stays in escrow while our team reviews. Add your side in the load chat.",
    href: `/app/trips/${disputed.publicId}`,
  });
  await chat(c, disputed, "A", "booking", [
    ["shipper", "The dresser top is cracked and there's a gouge on the side. I've opened a dispute with photos.", ago(36 * HOUR)],
    ["carrier", "I'm sorry to hear that, Emily. Kevin's delivery photos show the blankets still on. We'll review with him and reply on the dispute today.", ago(30 * HOUR)],
  ]);

  const cancelledPublished = ago(8 * DAY);
  const cancelled = await createLoad(c, {
    code: loadCodes.cancelled,
    shipper: "shipper",
    category: "trailer",
    title: "12 ft utility trailer to Madison",
    pickup: stop("2601 W Cermak Rd", "Chicago", "IL", "60608", 41.852, -87.6908, ahead(1 * DAY)),
    dropoff: stop("2 E Main St", "Madison", "WI", "53703", 43.0747, -89.3841, ahead(2 * DAY)),
    details: { type: "Utility", length: 12, width: 6, height: 4, weight: 1800, method: "Towed", brakesLights: true },
    distanceMiles: 147,
    createdAt: cancelledPublished,
    publishedAt: cancelledPublished,
  });
  await placeBid(c, cancelled, "B", 380, plus(cancelledPublished, 9 * HOUR), "We tow it behind our pickup with a 2-5/16 in. ball and safety chains, brake and light check before we leave. Same-day delivery to Madison.");
  const reason = "Sold the trailer locally, it no longer needs shipping.";
  await advance(c, cancelled, "cancelled", { kind: "shipper", userId: cancelled.shipperId }, ago(6 * DAY), { cancelledReason: reason, acceptedBidId: null }, { reason });
  await c.tx.update(schema.bid).set({ status: "declined", updatedAt: ago(6 * DAY) }).where(and(eq(schema.bid.loadId, cancelled.id), eq(schema.bid.status, "active")));

  const expiredPublished = ago(14 * DAY);
  const expired = await createLoad(c, {
    code: loadCodes.expired,
    shipper: "shipper",
    category: "heavy_equipment",
    title: "Bobcat S650 skid steer to Kansas City",
    pickup: stop("4800 S Kildare Ave", "Chicago", "IL", "60632", 41.804, -87.7302, ago(5 * DAY)),
    dropoff: stop("1601 Genessee St", "Kansas City", "MO", "64102", 39.0927, -94.6036, ago(3 * DAY)),
    details: { equipmentType: "Skid steer", year: 2018, make: "Bobcat", model: "S650", quantity: 1, weight: 8100, length: 12, width: 6, height: 7, loading: "Drives on and off", trailerPrefs: ["Flatbed"], attachments: true },
    targetPrice: 900,
    distanceMiles: 510,
    createdAt: expiredPublished,
    publishedAt: expiredPublished,
    biddingDays: 7,
  });
  await placeBid(c, expired, "C", 1340, plus(expiredPublished, 2 * DAY), "Step deck with ramps, chained at four points with the bucket on the deck. Pickup on your date and delivery to Kansas City the following day.");
  await advance(c, expired, "expired", { kind: "system", userId: null }, ago(7 * DAY));
  await c.tx.update(schema.bid).set({ status: "expired", updatedAt: ago(7 * DAY) }).where(and(eq(schema.bid.loadId, expired.id), eq(schema.bid.status, "active")));

  const rvPublished = ago(2 * DAY);
  const rv = await createLoad(c, {
    code: loadCodes.rv,
    shipper: "shipper2",
    category: "rv",
    title: "Airstream travel trailer to Phoenix",
    pickup: stop("2700 Post Oak Blvd", "Houston", "TX", "77056", 29.7419, -95.4607, ahead(6 * DAY)),
    dropoff: stop("1 E Washington St", "Phoenix", "AZ", "85004", 33.4484, -112.074, ahead(9 * DAY)),
    details: { rvType: "Travel trailer", make: "Airstream Flying Cloud 25FB", length: 25, width: 8, height: 10, weight: 7300, method: "Towed", condition: "Runs and drives" },
    notes: "Tires replaced this year. Weight distribution hitch included.",
    distanceMiles: 1176,
    createdAt: rvPublished,
    publishedAt: rvPublished,
  });
  await placeBid(c, rv, "A", 2150, ago(1 * DAY), "Towed with a 3/4-ton pickup and your weight distribution hitch. Pre-trip check of tires, brakes and lights, delivery to Phoenix in 3 days with photos at both ends.", { by: c.users.dispatcher });

  const truckPublished = ago(10 * HOUR);
  await createLoad(c, {
    code: loadCodes.truck,
    shipper: "shipper2",
    category: "truck_with_driver",
    title: "Box truck and helper for a store move",
    pickup: stop("2310 Westheimer Rd", "Houston", "TX", "77098", 29.742, -95.414, ahead(4 * DAY)),
    dropoff: stop("23501 Cinco Ranch Blvd", "Katy", "TX", "77494", 29.7366, -95.7678, ahead(4 * DAY)),
    details: { truckType: "Box truck, 20–26 ft", hours: 5, cargo: "Retail shelving and 40 boxes of inventory", stops: 3, helpers: "1", equipment: ["Liftgate", "Dolly"] },
    notes: "One stop at a storage unit on I-10 in between.",
    distanceMiles: 29,
    createdAt: truckPublished,
    publishedAt: truckPublished,
  });
}

async function refreshLocations() {
  const { userIds } = await demoState();
  if (!userIds.length) throw new Error("No demo data found. Run pnpm demo:seed --yes first.");
  const rows = await db
    .select({ id: schema.load.id, publicId: schema.load.publicId, last: sql<string>`max(${schema.driverLocation.recordedAt})` })
    .from(schema.load)
    .innerJoin(schema.driverLocation, eq(schema.driverLocation.loadId, schema.load.id))
    .where(and(inArray(schema.load.shipperId, userIds), inArray(schema.load.status, ["en_route_to_pickup", "in_transit"])))
    .groupBy(schema.load.id, schema.load.publicId);
  for (const row of rows) {
    const shift = Date.now() - 60_000 - new Date(row.last).getTime();
    await db
      .update(schema.driverLocation)
      .set({ recordedAt: sql`${schema.driverLocation.recordedAt} + make_interval(secs => ${shift / 1000})` })
      .where(eq(schema.driverLocation.loadId, row.id));
    console.log(`  ${row.publicId}: moved ${Math.round(shift / 60_000)} min forward, latest point is now 1 min old`);
  }
}

function printPlan() {
  const action = {
    seed: [
      `Create or update ${people.length} demo users on @${DOMAIN} (emailVerified, onboarded, credential password "${process.env.DEMO_PASSWORD ? "$DEMO_PASSWORD" : PASSWORD}") and the admin's TOTP 2FA`,
      `Create or update 3 verified demo carriers (${orgs.map((o) => o.name).join(", ")}), team members and a pending invite for ${INVITED_EMAIL}`,
      `Delete and recreate all loads, bids, payments, ledger, payouts, chats, reviews, disputes, GPS points and notifications that belong to demo users (${allCodes.length} loads)`,
      storageMode === "local" ? "Copy sample photos from public/images into .uploads/loads/<id>/" : storageMode === "supabase" ? "Upload sample photos to the Supabase Storage bucket load-media" : "Skip photos (no Supabase Storage keys and NODE_ENV=production)",
      process.env.RESEND_API_KEY ? `Add demo emails to email_suppression so Resend never sends to @${DOMAIN}` : null,
    ],
    reset: [`Delete every demo user, demo carrier and everything they own (only rows tagged with the "${USER_MARK}"/"${ORG_MARK}" markers in legacy_map), plus local demo photos`],
    refresh: ["Shift the GPS points of the demo trips in progress so the latest one is 1 minute old"],
  }[mode].filter(Boolean);
  console.log(`\nAllShip demo data · ${mode} · database ${maskUrl(DB_URL!)}\n`);
  for (const line of action) console.log(`  • ${line}`);
  console.log("\nNothing outside the demo markers and @allship.test emails is touched. No emails, Stripe or OpenAI calls.");
}

function printAccounts(totp: { secret: string; codes: string[]; reused: boolean }, invitationId: string, mediaSkipped: number) {
  const pass = process.env.DEMO_PASSWORD ? "(your DEMO_PASSWORD)" : PASSWORD;
  const rows = people.map((p) => ({
    role: p.admin ? "Admin" : p.orgRole ? `${orgs.find((o) => o.key === p.org)!.name.replace(/ (LLC|Inc)$/, "")} · ${p.orgRole}` : "Shipper",
    email: p.email,
    password: pass,
    try: p.tryThis,
  }));
  console.log("\nDemo accounts\n");
  console.table(rows);
  const uri = createOTP(totp.secret, { digits: 6 }).url("AllShip AI", `demo.admin@${DOMAIN}`);
  const base32 = new URL(uri).searchParams.get("secret");
  console.log(`\nAdmin two-step verification (${totp.reused ? "unchanged since the last run" : "new secret"}):`);
  console.log(`  otpauth URI : ${uri}`);
  console.log(`  setup key   : ${base32}  (TOTP, SHA-1, 6 digits, 30 s)`);
  console.log(`  backup codes: ${totp.codes.join("  ")}`);
  console.log(`\nPending invitation for ${INVITED_EMAIL}: ${APP_URL}/invite/${invitationId}`);
  console.log("\nNotes:");
  console.log(`  • GPS on ${loadCodes.enRoute} and ${loadCodes.inTransit} was stamped "1–2 min ago" just now and ages from here. Run pnpm demo:seed --refresh-locations --yes to bring it back to now.`);
  console.log("  • Welcome tours are left unfinished on purpose, so each account shows its tour on first visit. Dismiss or finish it to get to the page.");
  console.log("  • Payments are simulated rows (no Stripe). Carriers show payouts enabled without a Stripe account. With real Stripe keys, payouts to demo carriers will be held (no connected account).");
  console.log("  • Demo carriers are verified, and Demo Freight Lines takes instant quotes, so they appear on the public /moving matcher and demo open loads appear on the public /loads board. Run pnpm demo:reset --yes before real customers use this database.");
  if (storageMode === "local") console.log("  • Photos were copied to .uploads/loads/. They only show while the app uses local storage (no Supabase Storage keys).");
  if (storageMode === "none") console.log("  • Photos were skipped: no Supabase Storage keys, and local storage is off in production.");
  if (mediaSkipped) console.log(`  • ${mediaSkipped} photo(s) could not be stored and were left out.`);
  if (process.env.RESEND_API_KEY) console.log(`  • Demo emails are suppressed in email_suppression, so the app never emails @${DOMAIN}. Magic links, OTP and invite emails for them won't send; use the password.`);
}

async function main() {
  if (!confirmed) {
    printPlan();
    console.log(`\nRefusing to run without --yes. Re-run: pnpm ${mode === "reset" ? "demo:reset" : "demo:seed"}${mode === "refresh" ? " --refresh-locations" : ""} --yes\n`);
    process.exitCode = 1;
    return;
  }
  printPlan();
  const { problems } = await safetyCheck();
  if (problems.length) {
    console.error("\nRefusing to continue, these rows don't look like demo data:\n");
    for (const p of problems) console.error(`  ✗ ${p}`);
    process.exitCode = 1;
    return;
  }

  if (mode === "refresh") {
    console.log("");
    await refreshLocations();
    return;
  }

  if (mode === "reset") {
    const state = await demoState();
    const blockers = await blockersForReset(state.userIds, state.orgIds, state.loadIds);
    if (blockers.length) {
      console.error("\nRefusing to reset, demo accounts are linked to real data:\n");
      for (const b of blockers) console.error(`  ✗ ${b}`);
      process.exitCode = 1;
      return;
    }
    await db.transaction(async (tx) => {
      await deleteMarketplace(tx, state.userIds, state.loadIds);
      if (state.orgIds.length) await tx.delete(schema.organization).where(inArray(schema.organization.id, state.orgIds));
      if (state.userIds.length) await tx.delete(schema.user).where(inArray(schema.user.id, state.userIds));
      await tx.delete(schema.emailSuppression).where(inArray(schema.emailSuppression.email, [...people.map((p) => p.email), INVITED_EMAIL]));
      await tx.delete(schema.invitation).where(eq(schema.invitation.email, INVITED_EMAIL));
      await tx.delete(schema.legacyMap).where(inArray(schema.legacyMap.collection, [USER_MARK, ORG_MARK]));
    });
    await removeLocalMedia(state.loadIds);
    console.log(`\nRemoved ${state.userIds.length} demo users, ${state.orgIds.length} demo carriers and ${state.loadIds.length} demo loads.\n`);
    return;
  }

  const hashes = new Map<string, string>();
  for (const p of people) hashes.set(p.email, await hashPassword(PASSWORD));
  const before = await demoState();
  const result = await db.transaction(async (tx) => {
    await deleteMarketplace(tx, before.userIds, before.loadIds);
    const { users, orgIds, invitationId } = await seedUsersAndOrgs(tx, hashes, before.marks);
    const staff = {} as Record<OrgKey, string[]>;
    const owners = {} as Record<OrgKey, string>;
    const orgNames = {} as Record<OrgKey, string>;
    for (const spec of orgs) {
      staff[spec.key] = people.filter((p) => p.org === spec.key && (p.orgRole === "owner" || p.orgRole === "dispatcher")).map((p) => users[p.key]);
      owners[spec.key] = users[people.find((p) => p.org === spec.key && p.orgRole === "owner")!.key];
      orgNames[spec.key] = spec.name;
    }
    const c: Ctx = { tx, users, orgIds, staff, owners, orgNames, mediaSkipped: 0 };
    await seedMarketplace(c);
    const totp = await adminTwoFactor(tx, users.admin);
    const unbalanced = await tx
      .select({ journalId: schema.ledgerEntry.journalId, total: sql<number>`sum(${schema.ledgerEntry.amountCents})::int` })
      .from(schema.ledgerEntry)
      .where(like(schema.ledgerEntry.memo, "%AS-DEM%"))
      .groupBy(schema.ledgerEntry.journalId)
      .having(sql`sum(${schema.ledgerEntry.amountCents}) <> 0`);
    if (unbalanced.length) throw new Error(`Ledger journals don't balance: ${JSON.stringify(unbalanced)}`);
    return { totp, invitationId, mediaSkipped: c.mediaSkipped };
  });
  await removeLocalMedia(before.loadIds);
  printAccounts(result.totp, result.invitationId, result.mediaSkipped);
  console.log("");
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => client.end());
