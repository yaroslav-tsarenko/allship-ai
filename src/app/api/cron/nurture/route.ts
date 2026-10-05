import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/env";
import { isAuthorizedCron } from "@/lib/security/cron-auth";
import { processDueEnrollments } from "@/server/nurture/process";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function simulatedNow(request: NextRequest) {
  if (env.NODE_ENV === "production") return undefined;
  const raw = request.nextUrl.searchParams.get("now");
  const parsed = raw ? new Date(raw) : null;
  return parsed && !Number.isNaN(parsed.getTime()) ? parsed : undefined;
}

async function run(request: NextRequest) {
  if (!isAuthorizedCron(request.headers.get("authorization"), env.CRON_SECRET)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const totals = await processDueEnrollments({ now: simulatedNow(request) });
  return NextResponse.json(totals);
}

export const GET = run;
export const POST = run;
