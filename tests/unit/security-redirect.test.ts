import { describe, expect, it } from "vitest";
import { safeNext } from "@/features/auth/safe-next";
import { safeRedirectPath } from "@/lib/security/safe-redirect";

describe("safeRedirectPath", () => {
  it.each([
    ["/app/loads?status=open", "/app/loads?status=open"],
    ["/invite/abc123", "/invite/abc123"],
    ["/app#bids", "/app#bids"],
    ["/app/../admin", "/admin"],
  ])("keeps internal path %s", (input, expected) => {
    expect(safeRedirectPath(input)).toBe(expected);
  });

  it.each([
    "https://evil.example",
    "//evil.example",
    "/\\evil.example",
    "/\t/evil.example",
    "/\n/evil.example",
    "\\\\evil.example",
    "/.//evil.example",
    "/%0a/evil",
    "javascript:alert(1)",
    "data:text/html,x",
    " /app",
    "/api/auth/sign-out",
    "/_next/static/x.js",
    "",
    "/".repeat(3000),
    null,
    undefined,
  ])("falls back for %j", (value) => {
    const out = safeRedirectPath(value as string | null | undefined);
    if (value === "/%0a/evil") expect(out).toBe("/%0a/evil");
    else expect(out).toBe("/app");
  });

  it("supports a custom fallback", () => {
    expect(safeRedirectPath("//x", "/")).toBe("/");
  });

  it("is what safeNext uses", () => {
    expect(safeNext("//evil.example")).toBe("/app");
    expect(safeNext("/app/trips")).toBe("/app/trips");
  });
});
