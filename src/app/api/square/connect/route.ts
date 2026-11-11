import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/env";
import { getActor } from "@/server/actor";
import { getSession } from "@/server/auth/session";
import { verifyConnectLink } from "@/server/square/crypto";
import { authorizeUrl, hasSquareConnection, SQUARE_STATE_COOKIE, squareConfigured } from "@/server/square/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const result = (request: NextRequest, status: string) => NextResponse.redirect(new URL(`/square/connected?status=${status}`, request.url));

async function isAdmin() {
  const session = await getSession();
  if (!session) return false;
  const actor = await getActor(session.user.id).catch(() => null);
  return Boolean(actor?.isAdmin);
}

export async function GET(request: NextRequest) {
  if (!squareConfigured()) return result(request, "unavailable");
  const admin = await isAdmin();
  if (!admin) {
    if (!verifyConnectLink(request.nextUrl.searchParams.get("t"))) return result(request, "expired");
    if (await hasSquareConnection()) return result(request, "already");
  }
  const state = randomBytes(24).toString("base64url");
  const response = NextResponse.redirect(authorizeUrl(state));
  response.cookies.set(SQUARE_STATE_COOKIE, state, { httpOnly: true, secure: env.NODE_ENV === "production", sameSite: "lax", path: "/api/square", maxAge: 900 });
  return response;
}
