import { describe, expect, it } from "vitest";
import { buildCsp, cspDirectives, isNonceRoute, STATIC_CSP_SOURCE } from "@/lib/security/csp";
import { normalizeCspReports } from "@/lib/security/csp-report";
import { layoutInlineScripts, layoutScriptHashes, scriptHash } from "@/lib/security/inline-scripts";

const supabaseUrl = "https://abc123.supabase.co";

describe("static CSP", () => {
  const d = cspDirectives({
    mode: "static",
    supabaseUrl,
    reportUri: "/api/csp-report",
    upgradeInsecure: true,
  });

  it("allows inline scripts without a nonce and lists third-party hosts", () => {
    expect(d["script-src"]).toContain("'unsafe-inline'");
    expect(d["script-src"]!.some((v) => v.startsWith("'nonce-"))).toBe(false);
    expect(d["script-src"]).not.toContain("'strict-dynamic'");
    expect(d["script-src"]).toEqual(
      expect.arrayContaining([
        "https://www.googletagmanager.com",
        "https://challenges.cloudflare.com",
        "https://js.stripe.com",
      ]),
    );
    expect(d["script-src"]).not.toContain("'unsafe-eval'");
  });

  it("locks down framing, objects, base and forms", () => {
    expect(d["default-src"]).toEqual(["'self'"]);
    expect(d["object-src"]).toEqual(["'none'"]);
    expect(d["base-uri"]).toEqual(["'self'"]);
    expect(d["form-action"]).toEqual(["'self'"]);
    expect(d["frame-ancestors"]).toEqual(["'none'"]);
    expect(d["frame-src"]).toEqual(
      expect.arrayContaining(["https://js.stripe.com", "https://challenges.cloudflare.com"]),
    );
  });

  it("derives supabase https and wss origins", () => {
    expect(d["connect-src"]).toEqual(
      expect.arrayContaining([supabaseUrl, "wss://abc123.supabase.co", "https://api.stripe.com"]),
    );
    expect(d["img-src"]).toEqual(
      expect.arrayContaining(["'self'", "data:", "blob:", supabaseUrl, "https://lh3.googleusercontent.com"]),
    );
  });

  it("adds reporting and upgrade directives", () => {
    const header = buildCsp({ mode: "static", reportUri: "/api/csp-report", upgradeInsecure: true });
    expect(header).toContain("report-uri /api/csp-report");
    expect(header).toContain("report-to csp-endpoint");
    expect(header).toMatch(/(^|; )upgrade-insecure-requests(;|$)/);
    expect(buildCsp({ mode: "static" })).not.toContain("upgrade-insecure-requests");
  });

  it("allows eval and websocket HMR only in development", () => {
    const dev = cspDirectives({ mode: "static", dev: true });
    expect(dev["script-src"]).toContain("'unsafe-eval'");
    expect(dev["connect-src"]).toContain("ws:");
    expect(d["connect-src"]).not.toContain("ws:");
  });

  it("ignores malformed supabase urls", () => {
    expect(cspDirectives({ mode: "static", supabaseUrl: "not a url" })["connect-src"]).not.toContain(
      "not a url",
    );
  });
});

describe("nonce CSP", () => {
  const nonce = "dGVzdC1ub25jZS0xMjM0";
  const d = cspDirectives({ mode: "nonce", nonce, scriptHashes: layoutScriptHashes });

  it("uses nonce + strict-dynamic and the layout script hashes", () => {
    expect(d["script-src"]).toEqual(expect.arrayContaining([`'nonce-${nonce}'`, "'strict-dynamic'"]));
    for (const hash of layoutScriptHashes) expect(d["script-src"]).toContain(`'${hash}'`);
  });

  it("does not trust host allowlists for scripts", () => {
    expect(d["script-src"]).not.toContain("https://www.googletagmanager.com");
  });

  it("requires a nonce", () => {
    expect(() => buildCsp({ mode: "nonce" })).toThrow();
  });

  it("allows OAuth and Stripe form targets only on dynamic surfaces", () => {
    expect(d["form-action"]).toEqual(expect.arrayContaining(["'self'", "https://accounts.google.com"]));
  });
});

describe("layout inline scripts", () => {
  it("hashes every inline script deterministically", () => {
    expect(layoutScriptHashes).toHaveLength(layoutInlineScripts.length);
    expect(scriptHash("alert(1)")).toBe("sha256-bhHHL3z2vDgxUt0W3dWQOrprscmda2Y5pLsLg4GF+pI=");
  });
});

describe("route classification", () => {
  it.each(["/app", "/app/loads/1", "/admin", "/sign-in", "/invite/abc", "/blog/preview/x", "/two-factor"])(
    "%s is a nonce route",
    (p) => {
      expect(isNonceRoute(p)).toBe(true);
    },
  );

  it.each([
    "/",
    "/apple-icon.png",
    "/application",
    "/blog",
    "/blog/some-post",
    "/services/freight",
    "/quote",
    "/administrator",
  ])("%s is a static route", (p) => {
    expect(isNonceRoute(p)).toBe(false);
  });

  it("static header source excludes exactly the nonce routes", () => {
    const pattern = new RegExp(`^${STATIC_CSP_SOURCE}$`);
    expect(pattern.test("/")).toBe(true);
    expect(pattern.test("/apple-icon.png")).toBe(true);
    expect(pattern.test("/blog/hello")).toBe(true);
    expect(pattern.test("/app")).toBe(false);
    expect(pattern.test("/app/loads")).toBe(false);
    expect(pattern.test("/blog/preview/1")).toBe(false);
    expect(pattern.test("/sign-in")).toBe(false);
  });
});

describe("CSP report normalization", () => {
  it("reads legacy report-uri bodies and strips query strings", () => {
    const [r] = normalizeCspReports({
      "csp-report": {
        "document-uri": "https://allship.ai/app?token=secret",
        "blocked-uri": "https://evil.example/x.js?a=1",
        "effective-directive": "script-src-elem",
        "line-number": 4,
      },
    });
    expect(r).toEqual(
      expect.objectContaining({
        documentUri: "https://allship.ai/app",
        blockedUri: "https://evil.example/x.js",
        directive: "script-src-elem",
        line: 4,
      }),
    );
  });

  it("reads Reporting API batches and ignores other report types", () => {
    const out = normalizeCspReports([
      {
        type: "csp-violation",
        body: {
          documentURL: "https://allship.ai/",
          effectiveDirective: "img-src",
          blockedURL: "https://x.example/p.gif",
        },
      },
      { type: "deprecation", body: {} },
    ]);
    expect(out).toHaveLength(1);
    expect(out[0]!.directive).toBe("img-src");
  });

  it("returns nothing for garbage", () => {
    expect(normalizeCspReports("x")).toEqual([]);
    expect(normalizeCspReports(null)).toEqual([]);
  });
});
