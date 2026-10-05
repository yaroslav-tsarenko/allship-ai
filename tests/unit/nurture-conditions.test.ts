import { describe, expect, it } from "vitest";
import { decide, type CarrierSnapshot, type LoadSnapshot, type NurtureState } from "@/server/nurture/conditions";
import { composeNurture, sampleMessages } from "@/emails/nurture/messages";

const now = new Date("2026-10-05T16:00:00Z");
const tz = "America/Chicago";

const load = (patch: Partial<LoadSnapshot> = {}): LoadSnapshot => ({
  publicId: "AS-7K2M9Q",
  title: "2-bedroom apartment move",
  status: "open",
  route: "Austin, TX → Denver, CO",
  biddingClosesAt: new Date("2026-10-09T23:00:00Z"),
  bidCount: 0,
  lowestBidCents: null,
  hasTargetPrice: false,
  hasPhotos: false,
  reviewed: false,
  carrierName: "Lone Star Movers",
  ...patch,
});

const carrier = (patch: Partial<CarrierSnapshot> = {}): CarrierSnapshot => ({ companyName: "Lone Star Movers", fmcsaStatus: "pending", payoutsEnabled: false, hasRates: false, bidCount: 0, ...patch });

const state = (patch: Partial<NurtureState> = {}): NurtureState => ({ now, firstName: "Dana", userVerified: false, load: null, submittedSince: false, carrier: null, context: {}, ...patch });

describe("verify_publish", () => {
  it("sends while the load is a draft and the user is unverified", () => {
    const d = decide("verify_publish", 0, state({ load: load({ status: "draft" }) }), tz);
    expect(d).toMatchObject({ kind: "send", path: "confirm", message: { template: "verify_publish", load: { publicId: "AS-7K2M9Q" } } });
  });
  it("stops once published or verified", () => {
    expect(decide("verify_publish", 1, state({ load: load({ status: "open" }) }), tz)).toEqual({ kind: "stop", reason: "published" });
    expect(decide("verify_publish", 1, state({ load: load({ status: "draft" }), userVerified: true }), tz)).toEqual({ kind: "stop", reason: "verified" });
    expect(decide("verify_publish", 1, state({ load: load({ status: "cancelled" }) }), tz)).toEqual({ kind: "stop", reason: "cancelled" });
  });
  it("puts the load id in the first subject", () => {
    const d = decide("verify_publish", 0, state({ load: load({ status: "draft" }) }), tz);
    if (d.kind !== "send") throw new Error("expected send");
    expect(composeNurture(d.message).subject).toBe("Your load AS-7K2M9Q isn't live yet — confirm your email");
  });
});

describe("abandoned_form", () => {
  it("sends with a form path and maps the form kind to a label", () => {
    const d = decide("abandoned_form", 0, state({ context: { path: "/vehicle-load", form: "vehicle", summary: "Sedan, Miami → Atlanta" } }), tz);
    expect(d).toMatchObject({ kind: "send", path: "resume", message: { formLabel: "vehicle transport", summary: "Sedan, Miami → Atlanta" } });
  });
  it("stops after submit or without a safe path", () => {
    expect(decide("abandoned_form", 1, state({ submittedSince: true, context: { path: "/moving-load" } }), tz)).toEqual({ kind: "stop", reason: "submitted" });
    expect(decide("abandoned_form", 0, state({ context: { path: "//evil.example" } }), tz)).toEqual({ kind: "stop", reason: "no_form_path" });
    expect(decide("abandoned_form", 0, state({ context: {} }), tz)).toEqual({ kind: "stop", reason: "no_form_path" });
  });
});

describe("load_followup", () => {
  it("sends the intro on day 0", () => {
    expect(decide("load_followup", 0, state({ load: load() }), tz)).toMatchObject({ kind: "send", message: { template: "load_intro" } });
  });
  it("branches on bids at +24h", () => {
    expect(decide("load_followup", 1, state({ load: load({ bidCount: 3, lowestBidCents: 184000 }) }), tz)).toMatchObject({ kind: "send", message: { template: "load_bids", bidCount: 3, lowestBid: "$1,840.00" } });
    expect(decide("load_followup", 1, state({ load: load() }), tz)).toMatchObject({ kind: "send", message: { template: "load_no_bids" } });
  });
  it("sends the closing reminder only while bidding is open", () => {
    expect(decide("load_followup", 2, state({ load: load({ bidCount: 2 }) }), tz)).toMatchObject({ kind: "send", message: { template: "load_closing", awaitingPayment: false } });
    expect(decide("load_followup", 2, state({ load: load({ biddingClosesAt: new Date("2026-10-05T15:00:00Z") }) }), tz)).toEqual({ kind: "skip", reason: "bidding_closed" });
    expect(decide("load_followup", 2, state({ load: load({ status: "awaiting_payment" }) }), tz)).toMatchObject({ kind: "send", message: { awaitingPayment: true } });
  });
  it("stops when booked, cancelled or expired", () => {
    expect(decide("load_followup", 1, state({ load: load({ status: "booked" }) }), tz)).toEqual({ kind: "stop", reason: "booked" });
    expect(decide("load_followup", 1, state({ load: load({ status: "cancelled" }) }), tz)).toEqual({ kind: "stop", reason: "cancelled" });
    expect(decide("load_followup", 1, state({ load: load({ status: "expired" }) }), tz)).toEqual({ kind: "stop", reason: "expired" });
  });
  it("waits on a draft, then gives up after a week", () => {
    expect(decide("load_followup", 0, state({ load: load({ status: "draft" }), context: { anchorAt: "2026-10-05T10:00:00Z" } }), tz)).toMatchObject({ kind: "wait" });
    expect(decide("load_followup", 0, state({ load: load({ status: "draft" }), context: { anchorAt: "2026-09-20T10:00:00Z" } }), tz)).toEqual({ kind: "stop", reason: "not_published" });
  });
});

describe("post_delivery", () => {
  it("asks for a review, then suggests the next shipment", () => {
    expect(decide("post_delivery", 0, state({ load: load({ status: "completed" }) }), tz)).toMatchObject({ kind: "send", path: "review", message: { template: "rate_carrier", carrierName: "Lone Star Movers" } });
    expect(decide("post_delivery", 1, state({ load: load({ status: "completed" }) }), tz)).toMatchObject({ kind: "send", path: "quote", message: { template: "next_shipment" } });
  });
  it("stops once reviewed", () => {
    expect(decide("post_delivery", 0, state({ load: load({ status: "completed", reviewed: true }) }), tz)).toEqual({ kind: "stop", reason: "reviewed" });
  });
});

describe("carrier_activation", () => {
  it("reports verification status first", () => {
    expect(decide("carrier_activation", 0, state({ carrier: carrier({ fmcsaStatus: "manual_review" }) }), tz)).toMatchObject({ kind: "send", message: { template: "carrier_verification", status: "pending" } });
    expect(decide("carrier_activation", 0, state({ carrier: carrier({ fmcsaStatus: "verified" }) }), tz)).toMatchObject({ kind: "send", path: "board", message: { status: "verified" } });
  });
  it("skips milestones already done", () => {
    expect(decide("carrier_activation", 1, state({ carrier: carrier({ payoutsEnabled: true }) }), tz)).toEqual({ kind: "skip", reason: "payouts_done" });
    expect(decide("carrier_activation", 2, state({ carrier: carrier({ hasRates: true }) }), tz)).toEqual({ kind: "skip", reason: "rates_done" });
    expect(decide("carrier_activation", 3, state({ carrier: carrier({ bidCount: 1 }) }), tz)).toEqual({ kind: "skip", reason: "first_bid_done" });
    expect(decide("carrier_activation", 2, state({ carrier: carrier() }), tz)).toMatchObject({ kind: "send", path: "pricing" });
  });
  it("stops when verified, paid out and bidding", () => {
    expect(decide("carrier_activation", 1, state({ carrier: carrier({ fmcsaStatus: "verified", payoutsEnabled: true, bidCount: 2 }) }), tz)).toEqual({ kind: "stop", reason: "activated" });
  });
});

describe("copy", () => {
  it("has a subject, heading and one CTA label for every sample, without hype words", () => {
    for (const m of sampleMessages) {
      const c = composeNurture(m);
      expect(c.subject.length).toBeGreaterThan(5);
      expect(c.subject.length).toBeLessThan(90);
      expect(c.actionLabel.length).toBeGreaterThan(2);
      expect(JSON.stringify(c)).not.toMatch(/seamless|effortless|cutting-edge|revolutionary|act now|!!/i);
    }
  });
});
