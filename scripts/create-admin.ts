import { randomBytes, randomUUID } from "node:crypto";
import { parseArgs } from "node:util";
import { hashPassword } from "better-auth/crypto";
import { config } from "dotenv";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/server/db/schema";

config({ path: ".env.local" });
config();

const { values } = parseArgs({
  options: {
    email: { type: "string" },
    name: { type: "string" },
    password: { type: "string" },
  },
});

const email = values.email?.trim().toLowerCase();
if (!email) throw new Error("Usage: pnpm admin:create --email you@example.com [--name \"Full Name\"] [--password ...]");

const password = values.password ?? randomBytes(12).toString("base64url");
if (password.length < 10) throw new Error("Password must be at least 10 characters");

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is required");

const client = postgres(url, { max: 1, prepare: false });
const db = drizzle(client, { schema, casing: "snake_case" });

try {
  const passwordHash = await hashPassword(password);
  const existing = await db.query.user.findFirst({ where: eq(schema.user.email, email) });

  if (existing) {
    await db.transaction(async (tx) => {
      await tx
        .update(schema.user)
        .set({ role: "admin", emailVerified: true, banned: false, banReason: null, banExpires: null })
        .where(eq(schema.user.id, existing.id));
      if (values.password) {
        await tx.update(schema.account).set({ password: passwordHash }).where(eq(schema.account.userId, existing.id));
      }
    });
    console.log(`Promoted existing user to admin: ${email}`);
    if (values.password) console.log("Password reset to the one you supplied.");
  } else {
    const userId = randomUUID();
    const name = values.name?.trim() || email.slice(0, email.indexOf("@"));
    await db.transaction(async (tx) => {
      await tx.insert(schema.user).values({
        id: userId,
        name,
        email,
        emailVerified: true,
        accountType: "shipper",
        role: "admin",
        onboardingCompletedAt: new Date(),
      });
      await tx.insert(schema.account).values({
        id: randomUUID(),
        accountId: userId,
        providerId: "credential",
        userId,
        password: passwordHash,
      });
    });
    console.log(`Created admin: ${email}`);
    if (!values.password) console.log(`Password (shown once): ${password}`);
  }

  console.log("Next: sign in, then turn on two-step verification — /admin requires it.");
} finally {
  await client.end();
}
