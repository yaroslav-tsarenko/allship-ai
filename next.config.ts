import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";
import { buildCsp, CSP_REPORT_PATH, reportingEndpointsHeader, STATIC_CSP_SOURCE } from "./src/lib/security/csp";

const isProd = process.env.NODE_ENV === "production";
const httpsOrigin = (process.env.NEXT_PUBLIC_APP_URL ?? "").startsWith("https://");
const previewDeployment = Boolean(process.env.VERCEL_ENV) && process.env.VERCEL_ENV !== "production";

const permissionsPolicy = [
  "accelerometer=()",
  "autoplay=()",
  "browsing-topics=()",
  "camera=(self)",
  "display-capture=()",
  "encrypted-media=()",
  "fullscreen=(self)",
  "geolocation=(self)",
  "gyroscope=()",
  "hid=()",
  "idle-detection=()",
  "magnetometer=()",
  "microphone=()",
  "midi=()",
  'payment=(self "https://js.stripe.com")',
  "picture-in-picture=()",
  "publickey-credentials-get=(self)",
  "screen-wake-lock=()",
  "serial=()",
  "usb=()",
  "xr-spatial-tracking=()",
].join(", ");

const securityHeaders = [
  ...(isProd ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }] : []),
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: permissionsPolicy },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
  ...(previewDeployment ? [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] : []),
];

const staticCsp = buildCsp({
  mode: "static",
  dev: !isProd,
  upgradeInsecure: isProd && httpsOrigin,
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  sentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  reportUri: CSP_REPORT_PATH,
});

const privateSurfaces = ["/app", "/app/:path*", "/admin", "/admin/:path*", "/api/:path*", "/invite/:path*", "/blog/preview/:path*"];
const sameSiteSurfaces = ["/app", "/app/:path*", "/admin", "/admin/:path*", "/api/:path*"];

const legacyRedirects: Array<[string, string]> = [
  ["/services", "/all"],
  ["/carriers", "/partners"],
  ["/carriers/requirements", "/partners#requirements"],
  ["/carriers/dispatch", "/partners#dispatch"],
  ["/contact", "/contact-us"],
  ["/legal/terms", "/terms-and-conditions"],
  ["/legal/privacy", "/privacy-policy"],
  ["/legal/cookies", "/cookie-policy"],
  ["/vehicle-transport", "/vehicle-load"],
  ["/freight", "/freight-load"],
  ["/heavy-equipment", "/heavy-load"],
  ["/truck-rental", "/rent-truck"],
  ["/add-article", "/admin/blog"],
  ["/reset-password/:token", "/reset-password?token=:token"],
];

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR || ".next",
  reactStrictMode: true,
  poweredByHeader: false,
  outputFileTracingIncludes: { "/moving": ["./public/data/zip/*.json"] },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/**" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  experimental: {
    optimizePackageImports: ["@radix-ui/react-dropdown-menu", "@radix-ui/react-dialog"],
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        source: STATIC_CSP_SOURCE,
        headers: [
          { key: "Content-Security-Policy", value: staticCsp },
          { key: "Reporting-Endpoints", value: reportingEndpointsHeader(CSP_REPORT_PATH) },
        ],
      },
      ...privateSurfaces.map((source) => ({ source, headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] })),
      ...sameSiteSurfaces.map((source) => ({ source, headers: [{ key: "Cross-Origin-Resource-Policy", value: "same-site" }] })),
    ];
  },
  async redirects() {
    return [
      { source: "/:path*", has: [{ type: "host", value: "www.allship.ai" }], destination: "https://allship.ai/:path*", permanent: true },
      ...legacyRedirects.map(([source, destination]) => ({ source, destination, permanent: true })),
    ];
  },
};

const sentryEnabled = Boolean(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_AUTH_TOKEN);

export default sentryEnabled
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      silent: !process.env.CI,
      sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN, deleteSourcemapsAfterUpload: true },
      widenClientFileUpload: true,
      telemetry: false,
    })
  : nextConfig;
