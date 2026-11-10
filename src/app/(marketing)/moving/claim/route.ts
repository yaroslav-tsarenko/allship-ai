import { cookies, headers } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { moveRequestSchema } from "@/features/moving/schema";
import { volumeForBedrooms } from "@/features/moving/pricing";
import { log } from "@/lib/log";
import { getActor } from "@/server/actor";
import { auth } from "@/server/auth/auth";
import { takeStash } from "@/server/funnel/links";
import { MOVING_CLAIM_PATH, MOVING_STASH_COOKIE } from "@/server/matcher/claim";
import { publishForShipper } from "@/server/matcher/funnel";
import { resolveRoute } from "@/server/matcher/geo";
import { buildMoveLoad, priceCandidates, type InstantQuoteRecord } from "@/server/matcher/service";

export const dynamic = "force-dynamic";

type Stash = { request: unknown; carrierOrgId: string | null; phone: string | null };

function to(request: NextRequest, path: string) {
  const response = NextResponse.redirect(new URL(path, request.url), 303);
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("X-Robots-Tag", "noindex");
  response.cookies.set(MOVING_STASH_COOKIE, "", { path: MOVING_CLAIM_PATH, maxAge: 0 });
  return response;
}

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return to(request, "/moving");
  const token = (await cookies()).get(MOVING_STASH_COOKIE)?.value;
  const stash = token ? await takeStash<Stash>(token) : null;
  if (!stash) return to(request, "/app/loads");
  const actor = await getActor(session.user.id);
  if (actor.accountType !== "shipper" || actor.orgId) return to(request, "/moving?notice=carrier-account");
  const parsed = moveRequestSchema.safeParse(stash.request);
  if (!parsed.success) return to(request, "/moving");

  try {
    const req = parsed.data;
    const route = await resolveRoute(req.from, req.to);
    if ("error" in route) return to(request, "/moving");
    let quote: InstantQuoteRecord | null = null;
    if (stash.carrierOrgId) {
      const [priced] = await priceCandidates(req, route, stash.carrierOrgId);
      if (priced) {
        quote = { carrierOrgId: priced.carrierOrgId, carrierName: priced.name, carrierCents: priced.carrierCents, lines: priced.lines, miles: route.miles, distanceMethod: route.method, volumeCuFt: volumeForBedrooms(req.bedrooms), quotedAt: new Date().toISOString() };
      }
    }
    const href = await publishForShipper({ id: actor.userId, email: session.user.email, phone: (session.user as { phone?: string | null }).phone ?? null }, buildMoveLoad(req, route, quote), stash.phone ?? undefined);
    return to(request, href);
  } catch (err) {
    log.error("moving google claim failed", { scope: "matcher", err, userId: session.user.id });
    return to(request, "/moving?notice=claim-failed");
  }
}
