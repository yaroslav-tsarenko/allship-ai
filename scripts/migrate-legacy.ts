import { randomBytes, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { config } from "dotenv";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { hashPassword } from "better-auth/crypto";
import * as schema from "../src/server/db/schema";

config({ path: ".env.local" });
config();

type LegacyUser = {
  _id: string;
  name: string;
  secondName: string;
  email: string;
  phone?: string;
  password?: string;
  role: "customer" | "carrier" | "driver" | "admin";
  verificated?: boolean | null;
  companyName?: string;
  companyUrl?: string;
  dotNumber?: string;
  mcNumber?: string;
  about?: string;
  carrierId?: string;
  avatar?: string;
  carrierMileagePricing?: Array<{ fromMiles: number; toMiles: number; price: number }>;
  carrierServiceCosts?: { packingCost: number; unpackingCost: number; storageCost: number };
  createdAt: string;
};

const dryRun = process.argv.includes("--dry-run");
const url = process.env.DATABASE_URL_MIGRATIONS ?? process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL_MIGRATIONS or DATABASE_URL is required");

const client = postgres(url, { max: 1, prepare: false });
const db = drizzle(client, { schema, casing: "snake_case" });

const isBot = (u: LegacyUser) => u.createdAt.startsWith("2026-02") && u.role === "customer" && !u.verificated;
const isBcrypt = (h?: string) => Boolean(h && /^\$2[aby]\$/.test(h));
const digits = (v?: string) => (v ?? "").replace(/\D/g, "").slice(0, 8) || null;
const slugify = (v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
const clean = (v?: string) => (v ?? "").trim();

const report = { users: 0, skippedExisting: 0, skippedBots: 0, carriers: 0, drivers: 0, admins: 0, plainPasswordsReset: 0, rateTiers: 0 };

async function mapped(collection: string, mongoId: string) {
  const [row] = await db
    .select({ newId: schema.legacyMap.newId })
    .from(schema.legacyMap)
    .where(and(eq(schema.legacyMap.collection, collection), eq(schema.legacyMap.mongoId, mongoId)))
    .limit(1);
  return row?.newId ?? null;
}

async function main() {
  const all: LegacyUser[] = JSON.parse(readFileSync(".migration/parsed/users.json", "utf8"));
  const real = all.filter((u) => !isBot(u));
  report.skippedBots = all.length - real.length;
  const ordered = [...real.filter((u) => u.role !== "driver"), ...real.filter((u) => u.role === "driver")];
  const orgByLegacyCarrier = new Map<string, string>();

  for (const legacy of ordered) {
    const email = clean(legacy.email).toLowerCase();
    const existingId = await mapped("users", legacy._id);
    if (existingId) {
      report.skippedExisting++;
      if (legacy.role === "carrier") {
        const orgId = await mapped("carrier_orgs", legacy._id);
        if (orgId) orgByLegacyCarrier.set(legacy._id, orgId);
      }
      continue;
    }
    const [emailTaken] = await db.select({ id: schema.user.id }).from(schema.user).where(eq(schema.user.email, email)).limit(1);
    if (emailTaken) {
      report.skippedExisting++;
      continue;
    }

    const userId = randomUUID();
    const createdAt = new Date(legacy.createdAt);
    const firstName = clean(legacy.name) || "AllShip";
    const lastName = clean(legacy.secondName);
    const passwordHash = isBcrypt(legacy.password) ? legacy.password! : await hashPassword(randomBytes(32).toString("hex"));
    if (!isBcrypt(legacy.password)) report.plainPasswordsReset++;
    const accountType = legacy.role === "carrier" || legacy.role === "driver" ? "carrier" : "shipper";

    if (dryRun) {
      console.log(`[dry-run] ${legacy.role} ${email}`);
      report.users++;
      continue;
    }

    await db.transaction(async (tx) => {
      await tx.insert(schema.user).values({
        id: userId,
        name: `${firstName} ${lastName}`.trim(),
        email,
        emailVerified: legacy.verificated === true,
        image: legacy.avatar?.startsWith("https://lh3.googleusercontent.com/") ? legacy.avatar : null,
        firstName,
        lastName: lastName || null,
        phone: clean(legacy.phone) || null,
        accountType,
        role: legacy.role === "admin" ? "admin" : "user",
        onboardingCompletedAt: createdAt,
        legacyId: legacy._id,
        createdAt,
        updatedAt: new Date(),
      });
      await tx.insert(schema.account).values({
        id: randomUUID(),
        accountId: userId,
        providerId: "credential",
        userId,
        password: passwordHash,
        createdAt,
        updatedAt: new Date(),
      });
      await tx.insert(schema.legacyMap).values({ collection: "users", mongoId: legacy._id, newId: userId });

      if (legacy.role === "carrier") {
        const orgId = randomUUID();
        const legalName = clean(legacy.companyName) || `${firstName} ${lastName}`.trim();
        await tx.insert(schema.organization).values({
          id: orgId,
          name: legalName,
          slug: `${slugify(legalName) || "carrier"}-${orgId.slice(0, 6)}`,
          createdAt,
        });
        await tx.insert(schema.member).values({ id: randomUUID(), organizationId: orgId, userId, role: "owner", createdAt });
        await tx.insert(schema.carrierProfile).values({
          orgId,
          legalName,
          usdotNumber: digits(legacy.dotNumber),
          mcNumber: digits(legacy.mcNumber),
          fmcsaStatus: "unverified",
          website: clean(legacy.companyUrl) || null,
          phone: clean(legacy.phone) || null,
          about: null,
        });
        const tiers = (legacy.carrierMileagePricing ?? []).slice(0, 5);
        for (const t of tiers) {
          await tx.insert(schema.carrierRateTier).values({ orgId, fromMiles: Math.round(t.fromMiles), toMiles: Math.round(t.toMiles), ratePerCuFtCents: Math.round(t.price * 100) });
          report.rateTiers++;
        }
        if (legacy.carrierServiceCosts) {
          await tx.insert(schema.carrierServiceRates).values({
            orgId,
            packingPerCuFtCents: Math.round(legacy.carrierServiceCosts.packingCost * 100),
            unpackingPerCuFtCents: Math.round(legacy.carrierServiceCosts.unpackingCost * 100),
            storagePerCuFtMonthCents: Math.round(legacy.carrierServiceCosts.storageCost * 100),
          });
        }
        await tx.insert(schema.legacyMap).values({ collection: "carrier_orgs", mongoId: legacy._id, newId: orgId });
        orgByLegacyCarrier.set(legacy._id, orgId);
        report.carriers++;
      }

      if (legacy.role === "driver") {
        const orgId = legacy.carrierId ? orgByLegacyCarrier.get(legacy.carrierId) : undefined;
        if (orgId) {
          await tx.insert(schema.member).values({ id: randomUUID(), organizationId: orgId, userId, role: "driver", createdAt });
        }
        report.drivers++;
      }

      if (legacy.role === "admin") report.admins++;
    });
    report.users++;
  }

  console.table(report);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => client.end());
