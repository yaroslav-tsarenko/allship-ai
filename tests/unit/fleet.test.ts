import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SQL } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import type { Actor } from "@/server/actor";

const calls: { method: string; args: unknown[] }[] = [];
const results: unknown[][] = [];

function chain(): unknown {
  const target = () => undefined;
  return new Proxy(target, {
    get(_, prop) {
      if (prop === "then") {
        const value = results.shift() ?? [];
        return (resolve: (v: unknown) => void) => resolve(value);
      }
      return (...args: unknown[]) => {
        calls.push({ method: String(prop), args });
        return chain();
      };
    },
  });
}

vi.mock("server-only", () => ({}));
vi.mock("@/env", () => ({ env: { NODE_ENV: "test" } }));
vi.mock("@/server/auth/session", () => ({ getSession: vi.fn() }));
vi.mock("@/server/db/client", () => ({
  db: new Proxy(
    {},
    {
      get:
        (_, prop) =>
        (...args: unknown[]) => {
          calls.push({ method: String(prop), args });
          return chain();
        },
    },
  ),
}));
vi.mock("@/server/auth/auth", () => ({ auth: { $context: Promise.resolve({}), api: {} } }));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("@/server/team/service", () => ({ inviteMember: vi.fn() }));
vi.mock("@/server/fleet/emails", () => ({ sendDriverSetup: vi.fn() }));
vi.mock("@/server/rate-limit", () => ({ clientIp: async () => "127.0.0.1" }));

const status = await import("@/server/fleet/status");
const { fleetSnapshot, driverDetail } = await import("@/server/fleet/queries");
const { addDriver, resendDriverSetup } = await import("@/server/fleet/service");

const owner: Actor = {
  userId: "u1",
  name: "Rita",
  email: "rita@x.test",
  accountType: "carrier",
  isAdmin: false,
  orgId: "org-a",
  orgRole: "owner",
  carrierVerified: true,
  payoutsEnabled: false,
};

beforeEach(() => {
  calls.length = 0;
  results.length = 0;
});

describe("driver status", () => {
  it("puts live trips first, then activation, then assignment", () => {
    expect(status.deriveDriverStatus({ activated: true, tripStatus: "in_transit" })).toBe("in_transit");
    expect(status.deriveDriverStatus({ activated: false, tripStatus: "en_route_to_pickup" })).toBe(
      "to_pickup",
    );
    expect(status.deriveDriverStatus({ activated: false, tripStatus: "assigned" })).toBe("invited");
    expect(status.deriveDriverStatus({ activated: true, tripStatus: "assigned" })).toBe("assigned");
    expect(status.deriveDriverStatus({ activated: true, tripStatus: null })).toBe("idle");
    expect(status.deriveDriverStatus({ activated: true, tripStatus: "completed" })).toBe("idle");
  });

  it("picks the most advanced active trip", () => {
    const trips = [
      { id: "a", status: "assigned" },
      { id: "b", status: "in_transit" },
      { id: "c", status: "en_route_to_pickup" },
    ];
    expect(status.pickActiveTrip(trips)?.id).toBe("b");
    expect(status.pickActiveTrip([{ id: "d", status: "completed" }])).toBeNull();
  });

  it("filters on trip versus idle", () => {
    expect(status.matchesFilter("in_transit", "on_trip")).toBe(true);
    expect(status.matchesFilter("to_pickup", "idle")).toBe(false);
    expect(status.matchesFilter("assigned", "idle")).toBe(true);
    expect(status.matchesFilter("invited", "on_trip")).toBe(false);
    expect(status.matchesFilter("idle", "all")).toBe(true);
  });

  it("greys out positions older than five minutes", () => {
    const now = Date.parse("2026-10-05T12:00:00Z");
    expect(status.isStale("2026-10-05T11:56:00Z", now)).toBe(false);
    expect(status.isStale("2026-10-05T11:54:00Z", now)).toBe(true);
    expect(status.isStale(null, now)).toBe(true);
  });

  it("judges on-time delivery against the window end, or the window day", () => {
    expect(status.wasOnTime(new Date("2026-10-05T10:00:00"), "2026-10-05T12:00:00")).toBe(true);
    expect(status.wasOnTime(new Date("2026-10-05T13:00:00"), "2026-10-05T12:00:00")).toBe(false);
    expect(status.wasOnTime(new Date("2026-10-05T20:00:00"), null, "2026-10-05")).toBe(true);
    expect(status.wasOnTime(new Date("2026-10-06T08:00:00"), null, "2026-10-05")).toBe(false);
    expect(status.wasOnTime(null, "2026-10-05")).toBeNull();
    expect(status.wasOnTime(new Date(), "soon")).toBeNull();
  });
});

describe("fleet authz", () => {
  it("lets only owners and dispatchers of a carrier see the fleet", () => {
    expect(status.canViewFleet(owner)).toBe(true);
    expect(status.canViewFleet({ ...owner, orgRole: "dispatcher" })).toBe(true);
    expect(status.canViewFleet({ ...owner, orgRole: "driver" })).toBe(false);
    expect(status.canViewFleet({ ...owner, orgId: null, orgRole: null })).toBe(false);
  });

  it("refuses drivers and shippers before touching the database", async () => {
    await expect(fleetSnapshot({ ...owner, orgRole: "driver" })).rejects.toThrow(/owners and dispatchers/);
    await expect(
      fleetSnapshot({ ...owner, accountType: "shipper", orgId: null, orgRole: null }),
    ).rejects.toThrow(/owners and dispatchers/);
    await expect(driverDetail({ ...owner, orgRole: "driver" }, "x")).rejects.toThrow(
      /owners and dispatchers/,
    );
    await expect(
      addDriver({ ...owner, orgRole: "driver" }, { name: "Dan", email: "d@x.test", phone: "5551234567" }),
    ).rejects.toThrow(/owners and dispatchers/);
    await expect(resendDriverSetup({ ...owner, orgRole: "driver" }, "x")).rejects.toThrow(
      /owners and dispatchers/,
    );
    expect(calls).toHaveLength(0);
  });

  it("scopes the snapshot to the actor's own organization", async () => {
    const snapshot = await fleetSnapshot(owner);
    expect(snapshot.drivers).toEqual([]);
    const dialect = new PgDialect();
    const wheres = calls.filter((c) => c.method === "where").map((c) => dialect.sqlToQuery(c.args[0] as SQL));
    expect(wheres.length).toBeGreaterThanOrEqual(4);
    for (const q of wheres) {
      expect(q.params).toContain("org-a");
      expect(q.sql).toMatch(/"(organizationId|carrierOrgId|id)" = \$1/);
    }
  });

  it("returns nothing for someone outside the organization", async () => {
    results.push([]);
    expect(await driverDetail(owner, "stranger")).toBeNull();
  });

  it("won't add the actor themselves or someone from another carrier", async () => {
    await expect(
      addDriver(owner, { name: "Rita", email: "RITA@x.test", phone: "5551234567" }),
    ).rejects.toThrow(/your own email/);
    results.push([{ id: "u9", banned: false, accountType: "carrier", orgId: "org-b" }]);
    await expect(addDriver(owner, { name: "Sam", email: "sam@x.test", phone: "5551234567" })).rejects.toThrow(
      /another carrier/,
    );
    results.push([{ id: "u8", banned: false, accountType: "carrier", orgId: "org-a" }]);
    await expect(addDriver(owner, { name: "Dan", email: "dan@x.test", phone: "5551234567" })).rejects.toThrow(
      /already on your team/,
    );
  });

  it("falls back to an invitation for a free existing account and refuses busy shippers", async () => {
    const { inviteMember } = await import("@/server/team/service");
    results.push([{ id: "u7", banned: false, accountType: "shipper", orgId: null }], [{ n: 0 }]);
    await expect(
      addDriver(owner, { name: "Pat", email: "pat@x.test", phone: "5551234567" }),
    ).resolves.toEqual({ kind: "invited", email: "pat@x.test" });
    expect(inviteMember).toHaveBeenCalledWith(owner, "pat@x.test", "driver");
    results.push([{ id: "u6", banned: false, accountType: "shipper", orgId: null }], [{ n: 2 }]);
    await expect(addDriver(owner, { name: "Lee", email: "lee@x.test", phone: "5551234567" })).rejects.toThrow(
      /active shipments/,
    );
  });
});
