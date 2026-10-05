import type { Actor } from "@/server/actor";

export type DriverStatus = "in_transit" | "to_pickup" | "assigned" | "invited" | "idle";
export type FleetFilter = "all" | "on_trip" | "idle";

export const LIVE_TRIP_STATUSES = ["en_route_to_pickup", "in_transit"] as const;
export const ACTIVE_TRIP_STATUSES = ["assigned", "en_route_to_pickup", "in_transit"] as const;
export const STALE_AFTER_MS = 5 * 60_000;

const tripRank: Record<string, number> = { in_transit: 0, en_route_to_pickup: 1, assigned: 2 };

export function canViewFleet(actor: Pick<Actor, "orgId" | "orgRole">) {
  return Boolean(actor.orgId) && (actor.orgRole === "owner" || actor.orgRole === "dispatcher");
}

export function isLiveTrip(status: string | null | undefined) {
  return status === "en_route_to_pickup" || status === "in_transit";
}

export function pickActiveTrip<T extends { status: string }>(trips: T[]): T | null {
  return (
    trips.filter((t) => t.status in tripRank).sort((a, b) => tripRank[a.status]! - tripRank[b.status]!)[0] ??
    null
  );
}

export function deriveDriverStatus({
  activated,
  tripStatus,
}: {
  activated: boolean;
  tripStatus: string | null | undefined;
}): DriverStatus {
  if (tripStatus === "in_transit") return "in_transit";
  if (tripStatus === "en_route_to_pickup") return "to_pickup";
  if (!activated) return "invited";
  if (tripStatus === "assigned") return "assigned";
  return "idle";
}

export function isOnTrip(status: DriverStatus) {
  return status === "in_transit" || status === "to_pickup";
}

export function matchesFilter(status: DriverStatus, filter: FleetFilter) {
  if (filter === "all") return true;
  return filter === "on_trip" ? isOnTrip(status) : !isOnTrip(status);
}

export function isStale(recordedAt: string | Date | null | undefined, now = Date.now()) {
  if (!recordedAt) return true;
  return now - new Date(recordedAt).getTime() > STALE_AFTER_MS;
}

export function wasOnTime(
  deliveredAt: Date | string | null | undefined,
  windowEnd: string | null | undefined,
  windowStart?: string | null,
) {
  const deadline = windowEnd || windowStart;
  if (!deliveredAt || !deadline) return null;
  const limit = new Date(/^\d{4}-\d{2}-\d{2}$/.test(deadline) ? `${deadline}T23:59:59` : deadline).getTime();
  if (Number.isNaN(limit)) return null;
  return new Date(deliveredAt).getTime() <= limit;
}
