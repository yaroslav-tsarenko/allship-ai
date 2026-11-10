import { randomBytes, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { hashPassword } from "better-auth/crypto";
import { config } from "dotenv";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/server/db/schema";

config({ path: ".env.local" });
config();

type LegacyCarrier = {
  _id: string;
  name: string;
  secondName: string;
  email: string;
  phone?: string;
  password?: string;
  role: string;
  verificated?: boolean | null;
  companyName?: string;
  companyUrl?: string;
  dotNumber?: string;
  mcNumber?: string;
  carrierMileagePricing?: Array<{ fromMiles: number; toMiles: number; price: number }>;
  carrierServiceCosts?: { packingCost: number; unpackingCost: number; storageCost: number };
  createdAt: string;
};

const dryRun = process.argv.includes("--dry-run");
const url = process.env.DATABASE_URL_MIGRATIONS ?? process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL_MIGRATIONS or DATABASE_URL is required");

const client = postgres(url, { max: 1, prepare: false });
const db = drizzle(client, { schema, casing: "snake_case" });

const MAX_MILES = 6000;
const clean = (v?: string) => (v ?? "").trim();
const digits = (v?: string) => (v ?? "").replace(/\D/g, "").slice(0, 8) || null;
const slugify = (v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
const isBcrypt = (h?: string) => Boolean(h && /^\$2[aby]\$/.test(h));
const cents = (dollars: number) => Math.round(dollars * 100);

async function mapped(collection: string, mongoId: string) {
  const [row] = await db
    .select({ newId: schema.legacyMap.newId })
    .from(schema.legacyMap)
    .where(and(eq(schema.legacyMap.collection, collection), eq(schema.legacyMap.mongoId, mongoId)))
    .limit(1);
  return row?.newId ?? null;
}

async function freeUsdot(value: string | null) {
  if (!value) return null;
  const [taken] = await db.select({ orgId: schema.carrierProfile.orgId }).from(schema.carrierProfile).where(eq(schema.carrierProfile.usdotNumber, value)).limit(1);
  return taken ? null : value;
}

async function ensureUser(legacy: LegacyCarrier) {
  const email = clean(legacy.email).toLowerCase();
  const known = await mapped("users", legacy._id);
  if (known) return known;
  const [existing] = await db.select({ id: schema.user.id }).from(schema.user).where(eq(schema.user.email, email)).limit(1);
  if (existing) {
    if (!dryRun) await db.insert(schema.legacyMap).values({ collection: "users", mongoId: legacy._id, newId: existing.id });
    return existing.id;
  }
  const userId = randomUUID();
  if (dryRun) return userId;
  const createdAt = new Date(legacy.createdAt);
  const firstName = clean(legacy.name) || "AllShip";
  const lastName = clean(legacy.secondName);
  const passwordHash = isBcrypt(legacy.password) ? legacy.password! : await hashPassword(randomBytes(32).toString("hex"));
  await db.transaction(async (tx) => {
    await tx.insert(schema.user).values({
      id: userId,
      name: `${firstName} ${lastName}`.trim(),
      email,
      emailVerified: legacy.verificated === true,
      firstName,
      lastName: lastName || null,
      phone: clean(legacy.phone) || null,
      accountType: "carrier",
      role: "user",
      onboardingCompletedAt: createdAt,
      legacyId: legacy._id,
      createdAt,
      updatedAt: new Date(),
    });
    await tx.insert(schema.account).values({ id: randomUUID(), accountId: userId, providerId: "credential", userId, password: passwordHash, createdAt, updatedAt: new Date() });
    await tx.insert(schema.legacyMap).values({ collection: "users", mongoId: legacy._id, newId: userId });
  });
  return userId;
}

async function main() {
  const all = JSON.parse(readFileSync(".migration/parsed/users.json", "utf8")) as LegacyCarrier[];
  const carriers = all.filter((u) => u.role === "carrier" && (u.carrierMileagePricing ?? []).length > 0);
  const report: Array<Record<string, string | number>> = [];

  for (const legacy of carriers) {
    const legalName = clean(legacy.companyName) || `${clean(legacy.name)} ${clean(legacy.secondName)}`.trim();
    const tiers = [...(legacy.carrierMileagePricing ?? [])]
      .sort((a, b) => a.fromMiles - b.fromMiles)
      .map((t) => ({ fromMiles: Math.round(t.fromMiles), toMiles: Math.min(Math.round(t.toMiles), MAX_MILES), ratePerCuFtCents: cents(t.price) }))
      .filter((t) => t.fromMiles <= t.toMiles && t.ratePerCuFtCents > 0);
    const existingOrg = await mapped("carrier_orgs", legacy._id);
    const userId = await ensureUser(legacy);
    const orgId = existingOrg ?? randomUUID();
    const usdot = existingOrg ? null : await freeUsdot(digits(legacy.dotNumber));

    if (dryRun) {
      report.push({ company: legalName, action: existingOrg ? "update rates" : "create", tiers: tiers.length });
      continue;
    }

    await db.transaction(async (tx) => {
      if (!existingOrg) {
        const createdAt = new Date(legacy.createdAt);
        await tx.insert(schema.organization).values({ id: orgId, name: legalName, slug: `${slugify(legalName) || "carrier"}-${orgId.slice(0, 6)}`, createdAt });
        await tx.insert(schema.member).values({ id: randomUUID(), organizationId: orgId, userId, role: "owner", createdAt });
        await tx.insert(schema.carrierProfile).values({
          orgId,
          legalName,
          usdotNumber: usdot,
          mcNumber: digits(legacy.mcNumber),
          fmcsaStatus: "manual_review",
          website: clean(legacy.companyUrl) || null,
          phone: clean(legacy.phone) || null,
          categories: ["local_moving", "long_distance_moving"],
        });
        await tx.insert(schema.legacyMap).values({ collection: "carrier_orgs", mongoId: legacy._id, newId: orgId });
      }
      await tx.update(schema.carrierProfile).set({ instantQuotes: true, instantQuoteMinMiles: 0, instantQuoteMaxMiles: MAX_MILES }).where(eq(schema.carrierProfile.orgId, orgId));
      await tx.delete(schema.carrierRateTier).where(eq(schema.carrierRateTier.orgId, orgId));
      await tx.insert(schema.carrierRateTier).values(tiers.map((t) => ({ orgId, ...t })));
      const costs = legacy.carrierServiceCosts;
      if (costs) {
        const rates = { packingPerCuFtCents: cents(costs.packingCost), unpackingPerCuFtCents: cents(costs.unpackingCost), storagePerCuFtMonthCents: cents(costs.storageCost) };
        await tx.insert(schema.carrierServiceRates).values({ orgId, ...rates }).onConflictDoUpdate({ target: schema.carrierServiceRates.orgId, set: { ...rates, updatedAt: new Date() } });
      }
    });
    report.push({ company: legalName, action: existingOrg ? "updated rates" : "created", tiers: tiers.length });
  }

  console.table(report);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => client.end());
