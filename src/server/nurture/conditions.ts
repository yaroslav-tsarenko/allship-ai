import type { NurtureMessage } from "@/emails/nurture/messages";
import type { SequenceId } from "./schedule";

export type LoadSnapshot = {
  publicId: string;
  title: string;
  status: string;
  route: string | null;
  biddingClosesAt: Date | null;
  bidCount: number;
  lowestBidCents: number | null;
  hasTargetPrice: boolean;
  hasPhotos: boolean;
  reviewed: boolean;
  carrierName: string | null;
};

export type CarrierSnapshot = { companyName: string; fmcsaStatus: string; payoutsEnabled: boolean; hasRates: boolean; bidCount: number };

export type NurtureState = {
  now: Date;
  firstName: string | null;
  userVerified: boolean;
  load: LoadSnapshot | null;
  submittedSince: boolean;
  carrier: CarrierSnapshot | null;
  context: Record<string, unknown>;
};

export type Decision = { kind: "send"; message: NurtureMessage; path: string } | { kind: "skip"; reason: string } | { kind: "stop"; reason: string } | { kind: "wait"; untilMs: number; reason: string };

export const DRAFT_WAIT_MS = 3_600_000;
export const DRAFT_GIVE_UP_MS = 7 * 86_400_000;

const bookedStatuses = ["booked", "assigned", "en_route_to_pickup", "in_transit", "delivered", "completed", "disputed"];
const closedStatuses = ["cancelled", "expired"];

const formLabels: Record<string, string> = { vehicle: "vehicle transport", moving: "moving", heavy: "heavy equipment", freight: "freight", rent: "truck rental" };

const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);

const dayFmt = (timeZone: string) => new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone, timeZoneName: "short" });
const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function formatCloseDate(date: Date, timeZone: string) {
  return dayFmt(timeZone).format(date);
}

export function carrierActivated(c: CarrierSnapshot) {
  return c.fmcsaStatus === "verified" && c.payoutsEnabled && c.bidCount > 0;
}

function loadRef(load: LoadSnapshot | null, context: Record<string, unknown>) {
  return { publicId: load?.publicId ?? str(context.publicId), title: load?.title ?? str(context.title), route: load?.route ?? str(context.route) };
}

export function decide(sequence: SequenceId, step: number, s: NurtureState, timeZone: string): Decision {
  switch (sequence) {
    case "verify_publish": {
      if (s.load && s.load.status !== "draft") return closedStatuses.includes(s.load.status) ? { kind: "stop", reason: s.load.status } : { kind: "stop", reason: "published" };
      if (s.userVerified) return { kind: "stop", reason: "verified" };
      return { kind: "send", message: { template: "verify_publish", step, firstName: s.firstName, load: loadRef(s.load, s.context) }, path: "confirm" };
    }
    case "abandoned_form": {
      if (s.submittedSince) return { kind: "stop", reason: "submitted" };
      const path = str(s.context.path);
      if (!path || !path.startsWith("/") || path.startsWith("//")) return { kind: "stop", reason: "no_form_path" };
      const form = str(s.context.form);
      return {
        kind: "send",
        message: { template: "abandoned_form", step, firstName: s.firstName, formLabel: str(s.context.formLabel) ?? (form && formLabels[form]) ?? "shipping", summary: str(s.context.summary), saved: Boolean(str(s.context.prefillToken)) },
        path: "resume",
      };
    }
    case "load_followup": {
      const load = s.load;
      if (!load) return { kind: "stop", reason: "load_missing" };
      if (bookedStatuses.includes(load.status)) return { kind: "stop", reason: "booked" };
      if (closedStatuses.includes(load.status)) return { kind: "stop", reason: load.status };
      if (load.status === "draft") {
        const anchor = typeof s.context.anchorAt === "string" ? Date.parse(s.context.anchorAt) : NaN;
        if (!Number.isNaN(anchor) && s.now.getTime() - anchor > DRAFT_GIVE_UP_MS) return { kind: "stop", reason: "not_published" };
        return { kind: "wait", untilMs: s.now.getTime() + DRAFT_WAIT_MS, reason: "not_published" };
      }
      const ref = { ...loadRef(load, s.context), publicId: load.publicId };
      if (step === 0) return { kind: "send", message: { template: "load_intro", load: ref, closesAt: load.biddingClosesAt ? formatCloseDate(load.biddingClosesAt, timeZone) : null }, path: "load" };
      if (step === 1) {
        if (load.status === "awaiting_payment") return { kind: "skip", reason: "awaiting_payment" };
        return load.bidCount > 0
          ? { kind: "send", message: { template: "load_bids", load: ref, bidCount: load.bidCount, lowestBid: load.lowestBidCents !== null ? usd.format(load.lowestBidCents / 100) : null }, path: "load" }
          : { kind: "send", message: { template: "load_no_bids", load: ref, hasTargetPrice: load.hasTargetPrice, hasPhotos: load.hasPhotos }, path: "load" };
      }
      const awaitingPayment = load.status === "awaiting_payment";
      if (!awaitingPayment && (!load.biddingClosesAt || load.biddingClosesAt <= s.now)) return { kind: "skip", reason: "bidding_closed" };
      return {
        kind: "send",
        message: { template: "load_closing", load: ref, bidCount: load.bidCount, closesAt: load.biddingClosesAt ? formatCloseDate(load.biddingClosesAt, timeZone) : "soon", awaitingPayment },
        path: "load",
      };
    }
    case "post_delivery": {
      const load = s.load;
      if (!load) return { kind: "stop", reason: "load_missing" };
      if (load.reviewed) return { kind: "stop", reason: "reviewed" };
      if (load.status !== "completed") return { kind: "stop", reason: load.status };
      if (step === 0) return { kind: "send", message: { template: "rate_carrier", load: { ...loadRef(load, s.context), publicId: load.publicId }, carrierName: load.carrierName ?? "your carrier" }, path: "review" };
      return { kind: "send", message: { template: "next_shipment", firstName: s.firstName }, path: "quote" };
    }
    case "carrier_activation": {
      const c = s.carrier;
      if (!c) return { kind: "stop", reason: "carrier_missing" };
      if (carrierActivated(c)) return { kind: "stop", reason: "activated" };
      if (step === 0) {
        const status = c.fmcsaStatus === "verified" ? "verified" : c.fmcsaStatus === "failed" ? "failed" : "pending";
        return { kind: "send", message: { template: "carrier_verification", companyName: c.companyName, status }, path: status === "verified" ? "board" : "settings" };
      }
      if (step === 1) return c.payoutsEnabled ? { kind: "skip", reason: "payouts_done" } : { kind: "send", message: { template: "carrier_payouts", companyName: c.companyName }, path: "payouts" };
      if (step === 2) return c.hasRates ? { kind: "skip", reason: "rates_done" } : { kind: "send", message: { template: "carrier_rates", companyName: c.companyName }, path: "pricing" };
      return c.bidCount > 0 ? { kind: "skip", reason: "first_bid_done" } : { kind: "send", message: { template: "carrier_bidding", companyName: c.companyName, verified: c.fmcsaStatus === "verified" }, path: "board" };
    }
  }
}
