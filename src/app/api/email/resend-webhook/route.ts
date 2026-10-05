import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/env";
import { BodyTooLargeError, readLimited } from "@/lib/security/read-limited";
import { recordProviderEvent } from "@/server/nurture/preferences";
import { suppressionFromEvent, verifySvixSignature } from "@/server/nurture/webhook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!env.RESEND_WEBHOOK_SECRET) return NextResponse.json({ error: "Not configured" }, { status: 404 });
  let body: string;
  try {
    body = new TextDecoder().decode(await readLimited(request.body, 256 * 1024));
  } catch (error) {
    if (error instanceof BodyTooLargeError) return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    throw error;
  }
  const valid = verifySvixSignature({
    secret: env.RESEND_WEBHOOK_SECRET,
    id: request.headers.get("svix-id"),
    timestamp: request.headers.get("svix-timestamp"),
    signature: request.headers.get("svix-signature"),
    body,
  });
  if (!valid) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  let event: unknown;
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const action = suppressionFromEvent(event as Parameters<typeof suppressionFromEvent>[0]);
  if (action) for (const email of action.emails) await recordProviderEvent(email, action.kind);
  return NextResponse.json({ ok: true });
}
