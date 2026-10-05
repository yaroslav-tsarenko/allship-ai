import "server-only";
import { redirect } from "next/navigation";
import { env } from "@/env";
import { paymentsConfigured } from "@/server/payments/stripe";
import type { Viewer } from "@/server/viewer/viewer";

export type CarrierStanding = {
  verified: boolean;
  fmcsaStatus: NonNullable<NonNullable<Viewer["org"]>["fmcsaStatus"]>;
  canBid: boolean;
  payoutsEnabled: boolean;
  payoutsRequired: boolean;
  isOwner: boolean;
};

export function requireCarrierStaff(viewer: Viewer) {
  if ((viewer.role !== "owner" && viewer.role !== "dispatcher") || !viewer.org) redirect("/app");
  return viewer.org;
}

export function carrierStanding(viewer: Viewer): CarrierStanding {
  const org = requireCarrierStaff(viewer);
  const fmcsaStatus = org.fmcsaStatus ?? "unverified";
  const verified = fmcsaStatus === "verified";
  const bypass = env.NODE_ENV !== "production" && process.env.ALLOW_UNVERIFIED_CARRIERS === "1";
  return {
    verified,
    fmcsaStatus,
    canBid: verified || bypass,
    payoutsEnabled: Boolean(org.payoutsEnabled),
    payoutsRequired: paymentsConfigured(),
    isOwner: viewer.role === "owner",
  };
}
