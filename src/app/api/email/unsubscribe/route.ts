import { NextResponse, type NextRequest } from "next/server";
import { readEmailToken } from "@/server/nurture/links";
import { oneClickUnsubscribe } from "@/server/nurture/preferences";
import { isSequenceId } from "@/server/nurture/schedule";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const token = readEmailToken(request.nextUrl.searchParams.get("t"), "unsubscribe");
  if (!token) return NextResponse.json({ error: "Invalid unsubscribe link" }, { status: 400 });
  await oneClickUnsubscribe(token.e, isSequenceId(token.s) ? token.s : undefined);
  return NextResponse.json({ ok: true });
}

export function GET(request: NextRequest) {
  const url = new URL("/unsubscribe", request.url);
  const t = request.nextUrl.searchParams.get("t");
  if (t) url.searchParams.set("t", t);
  return NextResponse.redirect(url, 303);
}
