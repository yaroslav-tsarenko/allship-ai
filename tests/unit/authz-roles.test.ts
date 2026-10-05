import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/server/db/client", () => ({ db: {} }));
vi.mock("@/env", () => ({ env: { NODE_ENV: "test" } }));
vi.mock("@/server/auth/session", () => ({ getSession: vi.fn() }));

const { roleOnLoad } = await import("@/server/trips/access");
const { assertAdmin } = await import("@/server/actor");
import type { Actor } from "@/server/actor";

const base: Actor = { userId: "u1", name: "U", email: "u@x.test", accountType: "carrier", isAdmin: false, orgId: "org-a", orgRole: "driver", carrierVerified: true, payoutsEnabled: false };
const row = { shipperId: "s1", carrierOrgId: "org-a", driverId: "u1" };

describe("roleOnLoad", () => {
  it("treats the assigned driver as driver only while on the carrier's team", () => {
    expect(roleOnLoad(base, row)).toBe("driver");
    expect(roleOnLoad({ ...base, orgId: null, orgRole: null }, row)).toBeNull();
    expect(roleOnLoad({ ...base, orgId: "org-b" }, row)).toBeNull();
  });

  it("gives carrier powers to owners and dispatchers of the booked company only", () => {
    expect(roleOnLoad({ ...base, userId: "u2", orgRole: "dispatcher" }, row)).toBe("carrier");
    expect(roleOnLoad({ ...base, userId: "u2", orgRole: "driver" }, row)).toBeNull();
    expect(roleOnLoad({ ...base, userId: "u2", orgId: "org-b", orgRole: "owner" }, row)).toBeNull();
  });

  it("falls back to admin only for admins", () => {
    expect(roleOnLoad({ ...base, userId: "x", orgId: null, orgRole: null, isAdmin: true }, row)).toBe("admin");
    expect(() => assertAdmin(base)).toThrow(/Admins/);
    expect(() => assertAdmin({ ...base, isAdmin: true })).not.toThrow();
  });
});
