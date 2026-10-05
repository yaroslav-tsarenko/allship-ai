import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/env", () => ({ env: { ...process.env, NODE_ENV: "test", STRIPE_SECRET_KEY: undefined, PLATFORM_FEE_BPS: 1000 } }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("next/server", () => ({ after: (task: () => unknown) => void task() }));
vi.mock("@/server/notifications/notify", () => ({ notifyUsers: vi.fn(async () => []), orgStaffIds: vi.fn(async () => []) }));
vi.mock("@/server/notify/telegram", () => ({ notifyAdmins: vi.fn(async () => undefined) }));
vi.mock("@/server/realtime/publish", () => ({ publish: vi.fn(async () => undefined) }));
vi.mock("@/server/storage/storage", () => ({
  ALLOWED_UPLOAD_TYPES: ["image/jpeg", "image/png", "image/webp", "image/heic", "application/pdf"],
  MAX_UPLOAD_BYTES: 15 * 1024 * 1024,
  objectExists: vi.fn(async () => true),
  signedReadUrl: vi.fn(async (key: string) => `https://storage.test/${key}`),
}));

const hasDb = Boolean(process.env.DATABASE_URL);

const { db } = await import("@/server/db/client");
const schema = await import("@/server/db/schema");
const { inArray, eq, and } = await import("drizzle-orm");
const { getActor } = await import("@/server/actor");
const { acceptBid, listCarrierBids, placeBid, withdrawBid } = await import("@/server/bids/service");
const { getLoadForCarrier, getShipperLoad } = await import("@/server/loads/service");
const { loadWithRole } = await import("@/server/trips/access");
const { listTrips, recordLocation } = await import("@/server/trips/service");
const { resolveDispute, cancelBookedWithRefund } = await import("@/server/disputes/service");
const { getConversation, listConversations, sendMessage } = await import("@/server/chat/service");
const { getTrip } = await import("@/features/trips/queries");
const { topicsForActor } = await import("@/server/realtime/token");
const { confirmSimulatedPayment } = await import("@/server/payments/escrow");

const tag = randomUUID().slice(0, 8);
const ids = {
  users: [] as string[],
  orgs: [] as string[],
  loads: [] as string[],
};

const stop = (city: string, state: string, address: string) => ({ address, city, state, postalCode: "60601", lat: 41.88, lng: -87.62, windowStart: "2030-01-10", windowEnd: "2030-01-12", notes: "Gate code 4411" });

async function makeUser(label: string, extra: Partial<typeof schema.user.$inferInsert> = {}) {
  const id = `it-${tag}-${label}`;
  await db.insert(schema.user).values({ id, name: `IT ${label}`, email: `${id}@authz.test`, emailVerified: true, phone: "+1 555 010 0000", ...extra });
  ids.users.push(id);
  return id;
}

async function makeOrg(label: string, members: { userId: string; role: "owner" | "dispatcher" | "driver" }[]) {
  const id = `it-${tag}-org-${label}`;
  await db.insert(schema.organization).values({ id, name: `IT Carrier ${label}`, slug: id });
  ids.orgs.push(id);
  await db.insert(schema.carrierProfile).values({ orgId: id, legalName: `IT Carrier ${label} LLC`, usdotNumber: `9${Math.floor(Math.random() * 1e8)}`, fmcsaStatus: "verified", phone: "+1 555 020 0000" });
  for (const m of members) await db.insert(schema.member).values({ id: `${id}-${m.userId}`, organizationId: id, userId: m.userId, role: m.role });
  return id;
}

async function makeLoad(shipperId: string, values: Partial<typeof schema.load.$inferInsert> = {}) {
  const [row] = await db
    .insert(schema.load)
    .values({
      publicId: `AS-T${randomUUID().replace(/-/g, "").slice(0, 7).toUpperCase()}`,
      shipperId,
      category: "car_or_light_truck",
      title: `IT load ${tag}`,
      status: "open",
      pickup: stop("Chicago", "IL", "123 Secret St"),
      dropoff: stop("Denver", "CO", "987 Hidden Ave"),
      publishedAt: new Date(),
      biddingClosesAt: new Date(Date.now() + 3 * 86_400_000),
      ...values,
    })
    .returning();
  ids.loads.push(row!.id);
  return row!;
}

async function makeBid(loadId: string, carrierOrgId: string, createdBy: string, amountCents: number, status: "active" | "withdrawn" | "accepted" | "declined" = "active") {
  const [row] = await db.insert(schema.bid).values({ loadId, carrierOrgId, createdBy, amountCents, message: "Integration test bid with enclosed trailer and two drivers.", status }).returning();
  return row!;
}

const bidInput = (loadId: string, amount: number) => ({
  loadId,
  amount,
  estimatedPickupAt: "2030-01-10",
  estimatedDeliveryAt: "2030-01-14",
  message: "We run an enclosed two-car hauler on this lane every week and can pick up on the first day of your window.",
  aiAssisted: false,
});

let shipper1: string;
let shipper2: string;
let ownerA: string;
let dispatcherA: string;
let driverA: string;
let driverA2: string;
let ownerB: string;
let adminNo2fa: string;
let admin2fa: string;
let orgA: string;
let orgB: string;

describe.skipIf(!hasDb)("authorization (database)", () => {
  beforeAll(async () => {
    shipper1 = await makeUser("shipper1");
    shipper2 = await makeUser("shipper2");
    ownerA = await makeUser("ownerA", { accountType: "carrier" });
    dispatcherA = await makeUser("dispatcherA", { accountType: "carrier" });
    driverA = await makeUser("driverA", { accountType: "carrier" });
    driverA2 = await makeUser("driverA2", { accountType: "carrier" });
    ownerB = await makeUser("ownerB", { accountType: "carrier" });
    adminNo2fa = await makeUser("admin-no2fa", { role: "admin", twoFactorEnabled: false });
    admin2fa = await makeUser("admin-2fa", { role: "admin", twoFactorEnabled: true });
    orgA = await makeOrg("A", [
      { userId: ownerA, role: "owner" },
      { userId: dispatcherA, role: "dispatcher" },
      { userId: driverA, role: "driver" },
      { userId: driverA2, role: "driver" },
    ]);
    orgB = await makeOrg("B", [{ userId: ownerB, role: "owner" }]);
  });

  afterAll(async () => {
    if (ids.loads.length) await db.delete(schema.payment).where(inArray(schema.payment.loadId, ids.loads));
    if (ids.loads.length) await db.delete(schema.load).where(inArray(schema.load.id, ids.loads));
    if (ids.orgs.length) await db.delete(schema.organization).where(inArray(schema.organization.id, ids.orgs));
    if (ids.users.length) {
      await db.delete(schema.rateLimit).where(inArray(schema.rateLimit.key, ids.users.flatMap((u) => [`chat-send:${u}`])));
      await db.delete(schema.user).where(inArray(schema.user.id, ids.users));
    }
  });

  it("does not let carrier B withdraw carrier A's bid", async () => {
    const l = await makeLoad(shipper1);
    const b = await makeBid(l.id, orgA, ownerA, 120_000);
    await expect(withdrawBid(await getActor(ownerB), b.id)).rejects.toThrow("Bid not found.");
    const [after] = await db.select({ status: schema.bid.status }).from(schema.bid).where(eq(schema.bid.id, b.id));
    expect(after?.status).toBe("active");
  });

  it("does not let a driver withdraw their company's bid", async () => {
    const l = await makeLoad(shipper1);
    const b = await makeBid(l.id, orgA, ownerA, 110_000);
    await expect(withdrawBid(await getActor(driverA), b.id)).rejects.toThrow(/owners and dispatchers/);
  });

  it("does not show one shipper's load to another shipper or to carriers by internal id", async () => {
    const l = await makeLoad(shipper1, { status: "booked", carrierOrgId: orgA });
    expect(await getShipperLoad(await getActor(shipper2), l.publicId)).toBeNull();
    await expect(loadWithRole(await getActor(shipper2), l.id)).rejects.toThrow("Load not found.");
    await expect(loadWithRole(await getActor(ownerB), l.publicId)).rejects.toThrow("Load not found.");
    expect(await getLoadForCarrier(await getActor(ownerB), l.publicId)).toBeNull();
    await expect(loadWithRole(await getActor(adminNo2fa), l.id)).rejects.toThrow("Load not found.");
    expect((await loadWithRole(await getActor(admin2fa), l.id)).role).toBe("admin");
  });

  it("only lets the assigned driver share location", async () => {
    const l = await makeLoad(shipper1, { status: "in_transit", carrierOrgId: orgA, driverId: driverA });
    await expect(recordLocation(await getActor(driverA2), l.id, { lat: 40, lng: -100 })).rejects.toThrow();
    await expect(recordLocation(await getActor(ownerB), l.id, { lat: 40, lng: -100 })).rejects.toThrow("Load not found.");
    await expect(recordLocation(await getActor(dispatcherA), l.id, { lat: 40, lng: -100 })).rejects.toThrow("Only the assigned driver can share location.");
    const ok = await recordLocation(await getActor(driverA), l.id, { lat: 40.1, lng: -100.2 });
    expect(ok.stored).toBe(true);
  });

  it("keeps dispute resolution and refunds admin-only, with two-step verification", async () => {
    const l = await makeLoad(shipper1, { status: "disputed", carrierOrgId: orgA });
    const [d] = await db.insert(schema.dispute).values({ loadId: l.id, openedBy: shipper1, openedByRole: "shipper", reason: "damage", details: "Integration test dispute details long enough.", previousStatus: "delivered" }).returning();
    const input = { outcome: "release" as const, resolution: "Carrier provided photos." };
    for (const who of [shipper1, ownerA, dispatcherA, driverA, adminNo2fa]) {
      await expect(resolveDispute(await getActor(who), d!.id, input)).rejects.toThrow(/Admins/);
    }
    await expect(cancelBookedWithRefund(await getActor(shipper1), l.id, "Shipper wants a refund", 0)).rejects.toThrow(/Admins/);
    const [after] = await db.select({ status: schema.dispute.status, resolvedAt: schema.dispute.resolvedAt }).from(schema.dispute).where(eq(schema.dispute.id, d!.id));
    expect(after).toEqual({ status: "open", resolvedAt: null });
  });

  it("never exposes competitor bid amounts or the shipper's address to other carriers", async () => {
    const l = await makeLoad(shipper1);
    await makeBid(l.id, orgA, ownerA, 123_457);
    const view = await getLoadForCarrier(await getActor(ownerB), l.publicId);
    expect(view).not.toBeNull();
    const json = JSON.stringify(view);
    expect(json).not.toContain("123457");
    expect(json).not.toContain("Secret St");
    expect(json).not.toContain("Gate code");
    expect(json).not.toContain(shipper1);
    expect(view!.bidCount).toBe(1);
    expect(view!.myBid).toBeNull();
    expect(view!.shipper).toBeNull();
  });

  it("does not leak full addresses through a carrier's bid list", async () => {
    const l = await makeLoad(shipper1);
    await makeBid(l.id, orgB, ownerB, 99_000);
    const rows = await listCarrierBids(await getActor(ownerB), "active");
    const mine = rows.find((r) => r.loadPublicId === l.publicId);
    expect(mine?.pickup.city).toBe("Chicago");
    expect(JSON.stringify(rows)).not.toContain("Secret St");
  });

  it("hides losing carriers' bid amounts from the winning carrier's trip view", async () => {
    const l = await makeLoad(shipper1, { status: "booked", carrierOrgId: orgA });
    await db.insert(schema.loadEvent).values({ loadId: l.id, type: "bid_placed", actorId: ownerB, payload: { bidId: randomUUID(), amountCents: 87_654 } });
    const trip = await getTrip(await getActor(ownerA), l.publicId);
    expect(JSON.stringify(trip.events)).not.toContain("87654");
  });

  it("does not give an unassigned driver the booked load's contact details", async () => {
    const l = await makeLoad(shipper1, { status: "assigned", carrierOrgId: orgA, driverId: driverA });
    expect(await getLoadForCarrier(await getActor(driverA2), l.publicId)).toBeNull();
    await expect(getTrip(await getActor(driverA2), l.publicId)).rejects.toThrow("Load not found.");
    const assigned = await getLoadForCarrier(await getActor(driverA), l.publicId);
    expect(assigned?.booked).toBe(true);
  });

  it("revokes access as soon as a member is removed from the team", async () => {
    const removed = await makeUser("removed-driver", { accountType: "carrier" });
    const removedDispatcher = await makeUser("removed-dispatcher", { accountType: "carrier" });
    await db.insert(schema.member).values([
      { id: `${orgA}-${removed}`, organizationId: orgA, userId: removed, role: "driver" },
      { id: `${orgA}-${removedDispatcher}`, organizationId: orgA, userId: removedDispatcher, role: "dispatcher" },
    ]);
    const l = await makeLoad(shipper1, { status: "in_transit", carrierOrgId: orgA, driverId: removed });
    const [conv] = await db.insert(schema.conversation).values({ kind: "booking", loadId: l.id, shipperId: shipper1, carrierOrgId: orgA }).returning();
    expect((await getConversation(await getActor(removed), conv!.id)).conversation.role).toBe("driver");

    await db.delete(schema.member).where(and(eq(schema.member.organizationId, orgA), inArray(schema.member.userId, [removed, removedDispatcher])));

    const exDriver = await getActor(removed);
    const exDispatcher = await getActor(removedDispatcher);
    expect(exDriver.orgId).toBeNull();
    await expect(recordLocation(exDriver, l.id, { lat: 41, lng: -101 })).rejects.toThrow("Load not found.");
    await expect(getConversation(exDriver, conv!.id)).rejects.toThrow("Conversation not found.");
    await expect(sendMessage({ ...exDriver }, conv!.id, { body: "still here?" })).rejects.toThrow("Conversation not found.");
    expect((await listConversations(exDriver)).map((c) => c.id)).not.toContain(conv!.id);
    expect(await topicsForActor(exDriver)).not.toContain(`load:${l.id}`);
    await expect(listTrips(exDispatcher, "active")).rejects.toThrow();
    await expect(placeBid(exDispatcher, bidInput(l.id, 900))).rejects.toThrow(/owners and dispatchers/);
  });

  it("blocks banned users at the actor layer", async () => {
    const banned = await makeUser("banned", { banned: true });
    await expect(getActor(banned)).rejects.toThrow("Your account is not available.");
  });

  it("rejects bids on a carrier's own load and on loads that are not open", async () => {
    const own = await makeLoad(ownerB);
    await expect(placeBid(await getActor(ownerB), bidInput(own.id, 900))).rejects.toThrow("You can't bid on your own load.");
    const closed = await makeLoad(shipper1, { status: "booked", carrierOrgId: orgA });
    await expect(placeBid(await getActor(ownerB), bidInput(closed.id, 900))).rejects.toThrow("This load is no longer taking bids.");
    const expired = await makeLoad(shipper1, { biddingClosesAt: new Date(Date.now() - 60_000) });
    await expect(placeBid(await getActor(ownerB), bidInput(expired.id, 900))).rejects.toThrow("Bidding on this load has closed.");
    const open = await makeLoad(shipper1);
    await expect(placeBid(await getActor(shipper1), bidInput(open.id, 900))).rejects.toThrow(/owners and dispatchers/);
  });

  it("does not accept a withdrawn bid or another shipper's bid", async () => {
    const l = await makeLoad(shipper1);
    const withdrawn = await makeBid(l.id, orgA, ownerA, 100_000, "withdrawn");
    await expect(acceptBid(await getActor(shipper1), withdrawn.id)).rejects.toThrow("This bid is no longer available.");
    const active = await makeBid(l.id, orgB, ownerB, 101_000);
    await expect(acceptBid(await getActor(shipper2), active.id)).rejects.toThrow("Bid not found.");
    await expect(acceptBid(await getActor(ownerA), active.id)).rejects.toThrow("Only shipper accounts can do this.");
  });

  it("does not let a shipper confirm someone else's or a cancelled payment", async () => {
    const l = await makeLoad(shipper1);
    const b = await makeBid(l.id, orgB, ownerB, 50_000);
    const accepted = await acceptBid(await getActor(shipper1), b.id);
    expect(accepted.simulated).toBe(true);
    await expect(confirmSimulatedPayment(await getActor(shipper2), accepted.paymentId)).rejects.toThrow("Payment not found.");
    await db.update(schema.payment).set({ status: "canceled" }).where(eq(schema.payment.id, accepted.paymentId));
    await expect(confirmSimulatedPayment(await getActor(shipper1), accepted.paymentId)).rejects.toThrow("This payment is no longer waiting.");
    const [after] = await db.select({ status: schema.load.status }).from(schema.load).where(eq(schema.load.id, l.id));
    expect(after?.status).toBe("awaiting_payment");
    await db.delete(schema.payment).where(eq(schema.payment.loadId, l.id));
  });

  it("does not let the carrier withdraw the bid the shipper is paying for", async () => {
    const l = await makeLoad(shipper1);
    const b = await makeBid(l.id, orgA, ownerA, 77_000);
    const accepted = await acceptBid(await getActor(shipper1), b.id);
    await expect(withdrawBid(await getActor(dispatcherA), b.id)).rejects.toThrow(/paying for this bid/);
    await db.delete(schema.payment).where(eq(schema.payment.id, accepted.paymentId));
  });
});
