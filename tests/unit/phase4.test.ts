import { createHmac } from "node:crypto";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/server/db/client", () => ({ db: {} }));
vi.mock("@/env", () => ({ env: { BETTER_AUTH_SECRET: "x".repeat(40), NODE_ENV: "test" } }));
vi.mock("@/server/actions/safe-action", () => ({ ActionError: class ActionError extends Error {} }));

const { signSupabaseJwt } = await import("@/server/realtime/token");
const { signLocal, verifyLocal, buildKey } = await import("@/server/storage/storage");
const { haversineMiles } = await import("@/features/tracking/geo");
const { roleOnLoad } = await import("@/server/trips/access");
const { canTransition } = await import("@/server/loads/transitions");

describe("realtime token", () => {
  it("signs a verifiable HS256 JWT with topics", () => {
    const token = signSupabaseJwt({ sub: "u1", role: "authenticated", topics: ["user:u1"] }, "secret");
    const [header, body, signature] = token.split(".");
    expect(createHmac("sha256", "secret").update(`${header}.${body}`).digest("base64url")).toBe(signature);
    expect(JSON.parse(Buffer.from(body!, "base64url").toString())).toMatchObject({ sub: "u1", topics: ["user:u1"] });
  });
});

describe("local storage signatures", () => {
  it("accepts a valid signature and rejects tampering or expiry", () => {
    const exp = Date.now() + 60_000;
    const sig = signLocal("loads/a/b.jpg", "put", exp);
    expect(verifyLocal("loads/a/b.jpg", "put", exp, sig)).toBe(true);
    expect(verifyLocal("loads/a/c.jpg", "put", exp, sig)).toBe(false);
    expect(verifyLocal("loads/a/b.jpg", "get", exp, sig)).toBe(false);
    expect(verifyLocal("loads/a/b.jpg", "put", Date.now() - 1, signLocal("loads/a/b.jpg", "put", Date.now() - 1))).toBe(false);
  });

  it("builds keys under the prefix with a typed extension", () => {
    expect(buildKey("loads/1/pickup", "image/png")).toMatch(/^loads\/1\/pickup\/[0-9a-f-]{36}\.png$/);
  });
});

describe("trip roles and transitions", () => {
  const actor = { userId: "o1", name: "", email: "", accountType: "carrier" as const, isAdmin: false, orgId: "org", orgRole: "owner" as const, carrierVerified: true, payoutsEnabled: true };
  it("treats a self-driving owner as carrier staff", () => {
    expect(roleOnLoad(actor, { shipperId: "s", carrierOrgId: "org", driverId: "o1" })).toBe("carrier");
  });
  it("hides loads from other companies", () => {
    expect(roleOnLoad(actor, { shipperId: "s", carrierOrgId: "other", driverId: null })).toBeNull();
  });
  it("only lets the shipper or the system complete a delivery", () => {
    expect(canTransition("delivered", "completed", "shipper")).toBe(true);
    expect(canTransition("delivered", "completed", "carrier")).toBe(false);
    expect(canTransition("in_transit", "delivered", "driver")).toBe(true);
  });
});

describe("geo", () => {
  it("measures Chicago to Denver at about 920 miles", () => {
    const miles = haversineMiles({ lat: 41.8781, lng: -87.6298 }, { lat: 39.7392, lng: -104.9903 });
    expect(miles).toBeGreaterThan(900);
    expect(miles).toBeLessThan(940);
  });
});
