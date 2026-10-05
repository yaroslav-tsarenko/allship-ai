import { NextResponse } from "next/server";
import { getActor } from "@/server/actor";
import { getSession } from "@/server/auth/session";
import { createRealtimeToken } from "@/server/realtime/token";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const actor = await getActor(session.user.id).catch(() => null);
  if (!actor) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const token = await createRealtimeToken(actor);
  if (!token) return NextResponse.json({ configured: false }, { headers: { "Cache-Control": "no-store" } });
  return NextResponse.json({ configured: true, ...token }, { headers: { "Cache-Control": "no-store" } });
}
