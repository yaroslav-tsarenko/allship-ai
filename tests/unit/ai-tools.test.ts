import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/server/db/client", () => ({ db: {} }));
vi.mock("@/env", () => ({ env: { NODE_ENV: "test" } }));

const loads = vi.hoisted(() => ({
  listShipperLoads: vi.fn(),
  getShipperLoad: vi.fn(),
  getLoadForCarrier: vi.fn(),
}));
const trips = vi.hoisted(() => ({ listTrips: vi.fn(), trackingFor: vi.fn() }));
const board = vi.hoisted(() => ({ listBoardLoads: vi.fn() }));
const bids = vi.hoisted(() => ({ listCarrierBids: vi.fn() }));

vi.mock("@/server/loads/service", () => loads);
vi.mock("@/server/trips/service", () => trips);
vi.mock("@/features/board/queries", () => board);
vi.mock("@/server/bids/service", () => bids);

const { openAiToolSpecs, runTool, toolsFor } = await import("@/server/ai/tools");
const { offlineReply, guessRoute } = await import("@/server/ai/offline");

import type { ToolContext } from "@/server/ai/tools";
import type { AssistantAction, StreamEvent } from "@/server/ai/types";
import type { ViewerRole } from "@/server/viewer/viewer";

const roles: ViewerRole[] = ["shipper", "owner", "dispatcher", "driver"];
const shipperOnly = ["list_my_loads", "get_my_load", "draft_load"];
const carrierOnly = ["search_open_loads", "get_open_load", "draft_bid", "list_my_bids"];

function ctxFor(role: ViewerRole) {
  const actions: AssistantAction[] = [];
  const ctx: ToolContext = {
    role,
    actor: {
      userId: "u1",
      name: "Sam Shipper",
      email: "sam@example.com",
      accountType: role === "shipper" ? "shipper" : "carrier",
      isAdmin: false,
      orgId: role === "shipper" ? null : "org1",
      orgRole: role === "shipper" ? null : role,
      carrierVerified: true,
      payoutsEnabled: true,
    } as unknown as ToolContext["actor"],
    emit: (a) => actions.push(a),
  };
  return { ctx, actions };
}

async function collect(
  role: ViewerRole,
  text: string,
  page: { path: string; publicId?: string } | null = null,
) {
  const { ctx, actions } = ctxFor(role);
  const events: StreamEvent[] = [];
  for await (const e of offlineReply(ctx, text, page)) events.push(e);
  const tools = events.flatMap((e) => (e.type === "tool" ? [e.name] : []));
  const reply = events.flatMap((e) => (e.type === "text" ? [e.delta] : [])).join("");
  return { tools, reply, actions };
}

type Schema = {
  type?: string;
  properties?: Record<string, Schema>;
  additionalProperties?: unknown;
  required?: string[];
  items?: Schema;
  enum?: unknown[];
  anyOf?: Schema[];
};

function assertSchema(schema: Schema, path: string) {
  expect(schema.type ?? schema.anyOf ?? schema.enum, `${path} has a type`).toBeDefined();
  if (schema.type === "object") {
    expect(schema.properties ?? schema.additionalProperties, `${path} properties`).toBeTypeOf("object");
    for (const key of schema.required ?? [])
      expect(schema.properties, `${path} requires ${key}`).toHaveProperty(key);
    for (const [k, v] of Object.entries(schema.properties ?? {})) assertSchema(v, `${path}.${k}`);
  }
  if (schema.type === "array") expect(schema.items, `${path} items`).toBeDefined();
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("openAiToolSpecs", () => {
  it.each(roles)("produces valid function schemas for %s", (role) => {
    const specs = openAiToolSpecs(role);
    expect(specs.length).toBeGreaterThan(3);
    expect(new Set(specs.map((s) => s.name)).size).toBe(specs.length);
    for (const spec of specs) {
      expect(spec.type).toBe("function");
      expect(spec.name).toMatch(/^[a-z_]{3,64}$/);
      expect(spec.description.length).toBeGreaterThan(10);
      const parameters = JSON.parse(JSON.stringify(spec.parameters)) as Schema;
      expect(parameters.type).toBe("object");
      assertSchema(parameters, spec.name);
    }
  });

  it("keeps shipper and carrier tools apart", () => {
    const names = (role: ViewerRole) => openAiToolSpecs(role).map((s) => s.name);
    for (const role of ["owner", "dispatcher", "driver"] as const)
      for (const t of shipperOnly) expect(names(role)).not.toContain(t);
    for (const t of carrierOnly) expect(names("shipper")).not.toContain(t);
    for (const t of carrierOnly) expect(names("driver")).not.toContain(t);
    expect(names("shipper")).toEqual(expect.arrayContaining(shipperOnly));
    expect(names("owner")).toEqual(expect.arrayContaining(carrierOnly));
    expect(names("owner")).toContain("payout_status");
    expect(names("dispatcher")).not.toContain("payout_status");
    expect(names("driver")).toContain("list_trips");
    expect(toolsFor("shipper").every((t) => t.roles.includes("shipper"))).toBe(true);
  });
});

describe("runTool", () => {
  it("rejects bad arguments without running the tool", async () => {
    const { ctx } = ctxFor("shipper");
    const { result } = await runTool(ctx, "get_my_load", { publicId: "12345" });
    expect(result).toMatchObject({ error: "Invalid arguments" });
    expect((result as { issues: string[] }).issues[0]).toMatch(/^publicId:/);
    expect(loads.getShipperLoad).not.toHaveBeenCalled();
  });

  it("refuses unknown tools and tools from another role", async () => {
    const { ctx, actions } = ctxFor("shipper");
    expect((await runTool(ctx, "drop_table", {})).result).toEqual({
      error: "Tool drop_table isn't available.",
    });
    expect(
      (await runTool(ctx, "draft_bid", { publicId: "AS-ABC123", amount: 900, message: "x".repeat(90) }))
        .result,
    ).toEqual({ error: "Tool draft_bid isn't available." });
    expect(actions).toHaveLength(0);
  });

  it("validates draft_bid limits", async () => {
    const { ctx, actions } = ctxFor("owner");
    const short = await runTool(ctx, "draft_bid", {
      publicId: "AS-ABC123",
      amount: 900,
      message: "Too short",
    });
    expect(short.result).toMatchObject({ error: "Invalid arguments" });
    const cheap = await runTool(ctx, "draft_bid", {
      publicId: "AS-ABC123",
      amount: 5,
      message: "x".repeat(90),
    });
    expect(cheap.result).toMatchObject({ error: "Invalid arguments" });
    expect(actions).toHaveLength(0);
  });

  it("strips emails and phone numbers from drafted bids", async () => {
    const { ctx, actions } = ctxFor("dispatcher");
    const message =
      "We run an enclosed two-car trailer and can pick up Monday. Email dispatch@acme-haul.com or call +1 (214) 555-0199 to confirm details.";
    const { result } = await runTool(ctx, "draft_bid", { publicId: "AS-ABC123", amount: 1200, message });
    expect(result).toMatchObject({ offered: true, youReceive: "$1,200.00", shipperPays: "$1,320.00" });
    const action = actions[0];
    expect(action?.type).toBe("prefill_bid");
    const text = action?.type === "prefill_bid" ? action.message : "";
    expect(text).not.toMatch(/@/);
    expect(text).not.toMatch(/555/);
    expect(text).toContain("enclosed two-car trailer");
  });
});

describe("offline replies", () => {
  it("offers the right tour for each role", async () => {
    for (const [role, tourId] of [
      ["shipper", "welcome-shipper"],
      ["owner", "welcome-carrier"],
      ["driver", "welcome-driver"],
    ] as const) {
      const { tools, actions } = await collect(role, "Show me around");
      expect(tools).toEqual(["start_tour"]);
      expect(actions).toEqual([expect.objectContaining({ type: "start_tour", tourId })]);
    }
  });

  it("drafts a load with the route from a shipping request", async () => {
    const { tools, actions, reply } = await collect("shipper", "I need to ship my car from Dallas to Denver");
    expect(tools).toEqual(["draft_load"]);
    expect(reply).toMatch(/load form/);
    const action = actions[0];
    expect(action?.type).toBe("prefill_load");
    if (action?.type !== "prefill_load") return;
    expect(action.prefill).toMatchObject({
      category: "car_or_light_truck",
      pickup: { city: "Dallas" },
      dropoff: { city: "Denver" },
    });
  });

  it("prefers a new shipping request over the load on the current page", async () => {
    const { tools } = await collect("shipper", "I need to ship my car from Dallas to Denver", {
      path: "/app/loads/AS-ABC123",
      publicId: "AS-ABC123",
    });
    expect(tools).toEqual(["draft_load"]);
  });

  it("parses states in routes", () => {
    expect(guessRoute("move a sofa from austin, tx to santa fe nm next week")).toEqual({
      pickupCity: "Austin",
      pickupState: "TX",
      dropoffCity: "Santa Fe",
      dropoffState: "NM",
    });
    expect(guessRoute("what are the fees")).toEqual({});
  });

  it("reads the load on the current page for a shipper", async () => {
    loads.getShipperLoad.mockResolvedValue({
      load: {
        id: "l1",
        publicId: "AS-ABC123",
        title: "2019 Honda Civic",
        category: "car_or_light_truck",
        status: "open",
        pickup: {},
        dropoff: {},
        details: {},
        targetPriceCents: null,
        biddingClosesAt: null,
      },
      bids: [
        {
          carrierName: "Lone Star Haul",
          amountCents: 90000,
          status: "active",
          fmcsaStatus: "verified",
          rating: 4.8,
          reviews: 31,
          completedLoads: 40,
          estimatedPickupAt: null,
          estimatedDeliveryAt: null,
          message: "",
        },
      ],
      carrier: null,
    });
    const { tools, reply } = await collect("shipper", "Which bid should I take?", {
      path: "/app/loads/AS-ABC123",
      publicId: "AS-ABC123",
    });
    expect(tools).toEqual(["get_my_load"]);
    expect(loads.getShipperLoad).toHaveBeenCalledWith(expect.anything(), "AS-ABC123");
    expect(reply).toContain("Lone Star Haul");
    expect(reply).toContain("$990");
  });

  it("lists active loads for a general shipper question", async () => {
    loads.listShipperLoads.mockResolvedValue([
      {
        publicId: "AS-ZZZ999",
        title: "Sofa",
        status: "open",
        pickup: { city: "Austin", state: "TX" },
        dropoff: { city: "Reno", state: "NV" },
        bids: 2,
        lowestBidCents: null,
      },
    ]);
    const { tools, reply } = await collect("shipper", "How are my loads doing?");
    expect(tools).toEqual(["list_my_loads"]);
    expect(reply).toContain("AS-ZZZ999");
  });

  it("drafts a bid for a carrier", async () => {
    loads.getLoadForCarrier.mockResolvedValue({
      load: {
        publicId: "AS-ABC123",
        title: "2019 Honda Civic",
        category: "car_or_light_truck",
        status: "open",
        pickup: { city: "Dallas", state: "TX" },
        dropoff: { city: "Denver", state: "CO" },
        details: {},
        targetPriceCents: 85000,
      },
      bidCount: 3,
      myBid: null,
    });
    const { tools, actions } = await collect("owner", "Draft a bid on AS-ABC123");
    expect(tools).toEqual(["get_open_load", "draft_bid"]);
    expect(actions[0]).toMatchObject({ type: "prefill_bid", publicId: "AS-ABC123", amount: 850 });
  });

  it("searches the board for carriers and trips for drivers", async () => {
    board.listBoardLoads.mockResolvedValue([]);
    expect((await collect("dispatcher", "Find car loads from Texas")).tools).toEqual(["search_open_loads"]);
    trips.listTrips
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          publicId: "AS-TRP111",
          title: "Civic",
          status: "assigned",
          pickup: { city: "Dallas", state: "TX" },
          dropoff: { city: "Denver", state: "CO" },
          driverId: "d1",
        },
      ]);
    const driver = await collect("driver", "What's my next stop?");
    expect(driver.tools).toEqual(["list_trips", "list_trips"]);
    expect(driver.reply).toContain("AS-TRP111");
  });

  it("answers policy questions from the help center", async () => {
    const { tools } = await collect("owner", "When do I get paid after delivery?");
    expect(tools).toEqual(["search_help"]);
  });
});
