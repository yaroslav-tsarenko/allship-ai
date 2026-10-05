import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/env";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as { pg?: ReturnType<typeof postgres> };

const client =
  globalForDb.pg ??
  postgres(env.DATABASE_URL, {
    prepare: false,
    max: env.NODE_ENV === "production" ? 5 : 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });

if (env.NODE_ENV !== "production") globalForDb.pg = client;

export const db = drizzle(client, { schema, casing: "snake_case" });
export type Db = typeof db;
