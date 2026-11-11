import { randomBytes, randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { config } from "dotenv";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/server/db/schema";

config({ path: ".env.local" });
config();

const SLUG = "allship-test-mover";
const EMAIL = "test-mover@allship.ai";
const NAME = "AllShip Test Mover";

const url = process.env.DATABASE_URL_MIGRATIONS ?? process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL_MIGRATIONS or DATABASE_URL is required");
const client = postgres(url, { max: 1, prepare: false });
const db = drizzle(client, { schema, casing: "snake_case" });

async function main() {
  const [org] = await db.select({ id: schema.organization.id }).from(schema.organization).where(eq(schema.organization.slug, SLUG)).limit(1);
  if (org) {
    console.log(`${NAME} already exists (${org.id})`);
    return;
  }
  const [taken] = await db.select({ id: schema.user.id }).from(schema.user).where(eq(schema.user.email, EMAIL)).limit(1);
  if (taken) throw new Error(`${EMAIL} is already used by another account`);
  const userId = randomUUID();
  const orgId = randomUUID();
  const now = new Date();
  const password = await hashPassword(randomBytes(32).toString("hex"));
  await db.transaction(async (tx) => {
    await tx.insert(schema.user).values({ id: userId, name: NAME, email: EMAIL, emailVerified: true, firstName: "Test", lastName: "Mover", accountType: "carrier", role: "user", onboardingCompletedAt: now, createdAt: now, updatedAt: now });
    await tx.insert(schema.account).values({ id: randomUUID(), accountId: userId, providerId: "credential", userId, password, createdAt: now, updatedAt: now });
    await tx.insert(schema.organization).values({ id: orgId, name: NAME, slug: SLUG, createdAt: now });
    await tx.insert(schema.member).values({ id: randomUUID(), organizationId: orgId, userId, role: "owner", createdAt: now });
    await tx.insert(schema.carrierProfile).values({ orgId, legalName: NAME, fmcsaStatus: "manual_review", categories: ["local_moving", "long_distance_moving"], instantQuotes: true, instantQuoteMinMiles: 0, instantQuoteMaxMiles: 6000 });
  });
  console.log(`Created ${NAME} (${orgId})`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => client.end());
