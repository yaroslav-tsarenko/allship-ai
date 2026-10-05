import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.local" });
config();

export default defineConfig({
  schema: "./src/server/db/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  casing: "snake_case",
  strict: true,
  verbose: true,
  dbCredentials: {
    url: process.env.DATABASE_URL_MIGRATIONS ?? process.env.DATABASE_URL ?? "",
  },
});
