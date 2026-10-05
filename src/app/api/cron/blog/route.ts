import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/env";
import { isAuthorizedCron } from "@/lib/security/cron-auth";
import { publishDueScheduled } from "@/server/blog/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function run(request: NextRequest) {
  if (!isAuthorizedCron(request.headers.get("authorization"), env.CRON_SECRET)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const published = await publishDueScheduled();
  return NextResponse.json({ published });
}

export const GET = run;
export const POST = run;
