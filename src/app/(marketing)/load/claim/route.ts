import { cookies, headers } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { log } from "@/lib/log";
import { auth } from "@/server/auth/auth";
import { CONFIRM_PATH, takeStash } from "@/server/funnel/links";
import { claimForUser, type StashedLoad } from "@/server/funnel/service";
import { STASH_COOKIE } from "@/server/funnel/stash-cookie";

export const dynamic = "force-dynamic";

function to(request: NextRequest, path: string) {
  const response = NextResponse.redirect(new URL(path, request.url), 303);
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("X-Robots-Tag", "noindex");
  return response;
}

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return to(request, `/sign-in?next=${encodeURIComponent("/load/claim")}`);

  const jar = await cookies();
  const token = jar.get(STASH_COOKIE)?.value;
  const stash = token ? await takeStash<StashedLoad>(token) : null;

  try {
    const result = await claimForUser(session.user.id, stash);
    const response = result.error
      ? to(request, `${CONFIRM_PATH}?error=${result.error}`)
      : result.publicIds.length
        ? to(request, `/app/loads/${result.publicIds[result.publicIds.length - 1]}?welcome=${result.publicIds.length}`)
        : to(request, "/app/loads");
    if (token) response.cookies.set(STASH_COOKIE, "", { path: "/load/claim", maxAge: 0 });
    return response;
  } catch (error) {
    log.error("load claim failed", { scope: "funnel", err: error, userId: session.user.id });
    return to(request, `${CONFIRM_PATH}?error=claim_failed`);
  }
}
