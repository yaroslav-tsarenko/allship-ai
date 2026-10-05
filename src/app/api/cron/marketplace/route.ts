import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/env";
import { isAuthorizedCron } from "@/lib/security/cron-auth";
import { expireStaleLoads } from "@/server/loads/service";
import { releaseStalePayments } from "@/server/payments/escrow";
import { retryHeldPayouts } from "@/server/payments/payouts";
import { autoCompleteDelivered } from "@/server/trips/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function run(request: NextRequest) {
  if (!isAuthorizedCron(request.headers.get("authorization"), env.CRON_SECRET)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const [released, expired, completed, payouts] = await Promise.all([releaseStalePayments(), expireStaleLoads(), autoCompleteDelivered(), retryHeldPayouts()]);
  revalidateTag("open-loads", "max");
  return NextResponse.json({ released, expired, completed, payouts });
}

export const GET = run;
export const POST = run;
