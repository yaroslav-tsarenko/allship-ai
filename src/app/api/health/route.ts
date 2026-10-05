import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { log } from "@/lib/log";
import { db } from "@/server/db/client";

const DB_TIMEOUT_MS = 2500;

async function checkDatabase() {
  const started = performance.now();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      db.execute(sql`select 1`),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(`database check timed out after ${DB_TIMEOUT_MS}ms`)), DB_TIMEOUT_MS);
      }),
    ]);
    return { status: "ok" as const, latencyMs: Math.round(performance.now() - started) };
  } catch (error) {
    log.warn("health check: database unavailable", { scope: "health", err: error });
    return { status: "error" as const, latencyMs: Math.round(performance.now() - started) };
  } finally {
    clearTimeout(timer);
  }
}

async function evaluate() {
  const database = await checkDatabase();
  const healthy = database.status === "ok";
  const body = {
    status: healthy ? "ok" : "degraded",
    version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ?? "dev",
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    time: new Date().toISOString(),
    checks: { database },
  };
  return { body, status: healthy ? 200 : 503 };
}

const headers = { "Cache-Control": "no-store, max-age=0", "X-Robots-Tag": "noindex" };

export async function GET() {
  const { body, status } = await evaluate();
  return NextResponse.json(body, { status, headers });
}

export async function HEAD() {
  const { status } = await evaluate();
  return new Response(null, { status, headers });
}
