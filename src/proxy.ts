import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";
import { buildCsp, CSP_REPORT_PATH, isNonceRoute, reportingEndpointsHeader } from "@/lib/security/csp";
import { layoutScriptHashes } from "@/lib/security/inline-scripts";

const isDev = process.env.NODE_ENV === "development";
const upgradeInsecure = !isDev && (process.env.NEXT_PUBLIC_APP_URL ?? "").startsWith("https://");

function createNonce() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}

function requiresSession(pathname: string) {
  return (
    pathname === "/app" ||
    pathname.startsWith("/app/") ||
    pathname === "/admin" ||
    pathname.startsWith("/admin/")
  );
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (requiresSession(pathname) && !getSessionCookie(request, { cookiePrefix: "allship" })) {
    const url = new URL("/sign-in", request.url);
    url.search = "";
    url.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(url);
  }

  if (!isNonceRoute(pathname)) return NextResponse.next();

  const nonce = createNonce();
  const csp = buildCsp({
    mode: "nonce",
    nonce,
    scriptHashes: layoutScriptHashes,
    dev: isDev,
    upgradeInsecure,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    sentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    reportUri: CSP_REPORT_PATH,
  });

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("Reporting-Endpoints", reportingEndpointsHeader(CSP_REPORT_PATH));
  return response;
}

export const config = {
  matcher: [
    "/(app|admin|sign-in|sign-up|forgot-password|reset-password|two-factor|verify-email|invite)",
    "/(app|admin|sign-in|sign-up|forgot-password|reset-password|two-factor|verify-email|invite)/:path*",
    "/blog/preview/:path*",
  ],
};
