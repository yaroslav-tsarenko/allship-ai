import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { log } from "@/lib/log";
import { notifyAdmins } from "@/server/notify/telegram";
import { connectWithCode, SQUARE_STATE_COOKIE, squareConfigured } from "@/server/square/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const digest = (v: string) => createHash("sha256").update(v).digest();
const sameState = (a: string | undefined, b: string | null) => Boolean(a && b && timingSafeEqual(digest(a), digest(b)));

function result(request: NextRequest, status: string) {
  const response = NextResponse.redirect(new URL(`/square/connected?status=${status}`, request.url));
  response.cookies.set(SQUARE_STATE_COOKIE, "", { path: "/api/square", maxAge: 0 });
  return response;
}

export async function GET(request: NextRequest) {
  if (!squareConfigured()) return result(request, "unavailable");
  const params = request.nextUrl.searchParams;
  if (!sameState(request.cookies.get(SQUARE_STATE_COOKIE)?.value, params.get("state"))) return result(request, "expired");
  if (params.get("error")) return result(request, "denied");
  const code = params.get("code");
  if (!code) return result(request, "failed");
  try {
    const connected = await connectWithCode(code);
    await notifyAdmins(`Square connected: ${connected.businessName ?? "merchant"} (${connected.merchantId}), location ${connected.locationId ?? "none"}.`).catch(() => undefined);
    return result(request, "connected");
  } catch (err) {
    log.error("square oauth failed", { scope: "payments", err });
    return result(request, "failed");
  }
}
