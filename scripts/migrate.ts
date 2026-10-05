import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

config({ path: ".env.local" });
config();

const url = process.env.DATABASE_URL_MIGRATIONS ?? process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL_MIGRATIONS or DATABASE_URL is required");

const client = postgres(url, { max: 1, prepare: false });

try {
  await migrate(drizzle(client), { migrationsFolder: "./drizzle" });
  console.log("Migrations applied");
} finally {
  await client.end();
}
