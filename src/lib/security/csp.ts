export type CspMode = "static" | "nonce";

export type CspOptions = {
  mode: CspMode;
  nonce?: string;
  scriptHashes?: readonly string[];
  dev?: boolean;
  upgradeInsecure?: boolean;
  supabaseUrl?: string;
  sentryDsn?: string;
  reportUri?: string;
};

export const CSP_REPORT_PATH = "/api/csp-report";

export const NONCE_ROUTE_PREFIXES = [
  "/app",
  "/admin",
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/reset-password",
  "/two-factor",
  "/verify-email",
  "/invite",
  "/blog/preview",
] as const;

export function isNonceRoute(pathname: string) {
  return NONCE_ROUTE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export const STATIC_CSP_SOURCE = `/((?!${NONCE_ROUTE_PREFIXES.map((p) => `${p.slice(1)}(?:/|$)`).join("|")}).*)`;

const google = {
  gtm: "https://www.googletagmanager.com",
  gtmAll: "https://*.googletagmanager.com",
  analytics: "https://*.google-analytics.com",
  analyticsGoogle: "https://*.analytics.google.com",
  adServices: "https://www.googleadservices.com",
  adsDoubleclick: "https://googleads.g.doubleclick.net",
  tdDoubleclick: "https://td.doubleclick.net",
  google: "https://www.google.com",
};

const stripe = {
  js: "https://js.stripe.com",
  jsAll: "https://*.js.stripe.com",
  hooks: "https://hooks.stripe.com",
  api: "https://api.stripe.com",
  assets: "https://*.stripe.com",
};

const turnstile = "https://challenges.cloudflare.com";

const maps = {
  apis: "https://maps.googleapis.com",
  gstatic: "https://maps.gstatic.com",
  fontsCss: "https://fonts.googleapis.com",
  fonts: "https://fonts.gstatic.com",
};

const googleUserContent = "https://lh3.googleusercontent.com";

function sentryOrigin(dsn?: string) {
  if (!dsn) return [];
  try {
    const parsed = new URL(dsn);
    return parsed.protocol === "https:" ? [parsed.origin] : [];
  } catch {
    return [];
  }
}

function supabaseOrigins(url?: string) {
  if (!url) return [];
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return [];
    const ws = `${parsed.protocol === "https:" ? "wss" : "ws"}://${parsed.host}`;
    return [parsed.origin, ws];
  } catch {
    return [];
  }
}

export function serializeCsp(directives: Record<string, readonly string[]>) {
  return Object.entries(directives)
    .map(([name, values]) => (values.length ? `${name} ${values.join(" ")}` : name))
    .join("; ");
}

export function cspDirectives(options: CspOptions): Record<string, string[]> {
  const {
    mode,
    nonce,
    scriptHashes = [],
    dev = false,
    upgradeInsecure = false,
    supabaseUrl,
    sentryDsn,
    reportUri,
  } = options;
  if (mode === "nonce" && !nonce) throw new Error("nonce mode requires a nonce");
  const [supabaseHttp, supabaseWs] = supabaseOrigins(supabaseUrl);
  const supabase = supabaseHttp ? [supabaseHttp] : [];
  const supabaseRealtime = supabaseWs ? [supabaseWs] : [];

  const thirdPartyScripts = [
    google.gtm,
    google.adServices,
    google.adsDoubleclick,
    google.google,
    turnstile,
    stripe.js,
    stripe.jsAll,
    maps.apis,
  ];
  const scriptSrc =
    mode === "nonce"
      ? [
          "'self'",
          `'nonce-${nonce}'`,
          "'strict-dynamic'",
          ...scriptHashes.map((h) => `'${h}'`),
          "'unsafe-inline'",
          "https:",
        ]
      : ["'self'", "'unsafe-inline'", ...thirdPartyScripts];
  if (dev) scriptSrc.push("'unsafe-eval'");

  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": scriptSrc,
    "style-src": ["'self'", "'unsafe-inline'", maps.fontsCss],
    "img-src": [
      "'self'",
      "data:",
      "blob:",
      ...supabase,
      googleUserContent,
      maps.apis,
      maps.gstatic,
      google.gtm,
      google.analytics,
      google.gtmAll,
      google.adsDoubleclick,
      google.google,
      google.adServices,
      stripe.assets,
    ],
    "font-src": ["'self'", "data:", maps.fonts],
    "connect-src": [
      "'self'",
      ...supabase,
      ...supabaseRealtime,
      stripe.api,
      stripe.js,
      maps.apis,
      google.gtm,
      google.gtmAll,
      google.analytics,
      google.analyticsGoogle,
      google.adsDoubleclick,
      google.google,
      turnstile,
      ...sentryOrigin(sentryDsn),
    ],
    "frame-src": [stripe.js, stripe.jsAll, stripe.hooks, turnstile, google.gtm, google.tdDoubleclick],
    "worker-src": ["'self'", "blob:"],
    "media-src": ["'self'", "blob:", ...supabase],
    "manifest-src": ["'self'"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action":
      mode === "nonce" ? ["'self'", "https://accounts.google.com", "https://connect.stripe.com"] : ["'self'"],
    "frame-ancestors": ["'none'"],
  };
  if (dev) directives["connect-src"]!.push("ws:");
  if (upgradeInsecure) directives["upgrade-insecure-requests"] = [];
  if (reportUri) {
    directives["report-uri"] = [reportUri];
    directives["report-to"] = ["csp-endpoint"];
  }
  return directives;
}

export function buildCsp(options: CspOptions) {
  return serializeCsp(cspDirectives(options));
}

export function reportingEndpointsHeader(reportUri: string) {
  return `csp-endpoint="${reportUri}"`;
}
