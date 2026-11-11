import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/env";
import { isAuthorizedCron } from "@/lib/security/cron-auth";
import { refreshExpiringSquareTokens, squareConfigured } from "@/server/square/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function run(request: NextRequest) {
  if (!isAuthorizedCron(request.headers.get("authorization"), env.CRON_SECRET)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!squareConfigured()) return NextResponse.json({ refreshed: 0, configured: false });
  return NextResponse.json(await refreshExpiringSquareTokens());
}

export const GET = run;
export const POST = run;
