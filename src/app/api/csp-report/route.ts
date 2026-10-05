import { NextResponse, type NextRequest } from "next/server";
import { log } from "@/lib/log";
import { BodyTooLargeError, declaredLengthExceeds, readLimited } from "@/lib/security/read-limited";
import { normalizeCspReports } from "@/lib/security/csp-report";
import { clientIp, consumeRateLimit } from "@/server/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY = 16 * 1024;
const accepted = ["application/csp-report", "application/reports+json", "application/json"];

const noContent = () => new NextResponse(null, { status: 204 });

export async function POST(request: NextRequest) {
  const type = (request.headers.get("content-type") ?? "").split(";")[0]!.trim().toLowerCase();
  if (!accepted.includes(type)) return new NextResponse(null, { status: 415 });
  if (declaredLengthExceeds(request.headers, MAX_BODY)) return new NextResponse(null, { status: 413 });
  const ip = await clientIp();
  if (!(await consumeRateLimit(`csp-report:${ip}`, 30, 600).catch(() => false)))
    return new NextResponse(null, { status: 429 });
  let raw: Uint8Array;
  try {
    raw = await readLimited(request.body, MAX_BODY);
  } catch (error) {
    if (error instanceof BodyTooLargeError) return new NextResponse(null, { status: 413 });
    return noContent();
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(new TextDecoder().decode(raw));
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  for (const report of normalizeCspReports(parsed).slice(0, 10)) {
    log.warn("csp violation", { csp: report });
  }
  return noContent();
}
