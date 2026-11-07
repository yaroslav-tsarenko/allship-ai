import type { LoadCategory } from "@/server/db/schema/enums";
import { US_STATES } from "./states";

export type RouteIssue = { path: (string | number)[]; message: string };

type Stop = { address?: string | null; city?: string | null; state?: string | null; postalCode?: string | null; placeId?: string | null; windowStart?: string | null; windowEnd?: string | null };

export const MAX_DAYS_AHEAD = 365;

export const sameAddressCategories: ReadonlySet<LoadCategory> = new Set(["local_moving", "heavy_lifting", "truck_rental", "truck_with_driver"]);

const served = new Set<string>(US_STATES.map(([c]) => c));
const stateNames = new Map<string, string>(US_STATES.map(([c, n]) => [c, n]));

export function addDays(iso: string, days: number) {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function localToday(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function zipStateIssue(zip: string, chosenState: string, zipState: string | null | undefined): string | null {
  if (zipState === undefined) return null;
  if (zipState === null) return `We can't find ZIP ${zip}. Check the number.`;
  if (!served.has(zipState)) return "We only move loads within the 50 states and DC.";
  if (chosenState && chosenState !== zipState) return `ZIP ${zip} is in ${stateNames.get(zipState) ?? zipState}, not ${stateNames.get(chosenState) ?? chosenState}.`;
  return null;
}

const key = (s: string | null | undefined) => (s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");

export function isSamePlace(a: Stop, b: Stop) {
  if (a.placeId && b.placeId) return a.placeId === b.placeId;
  if (!a.postalCode || a.postalCode !== b.postalCode) return false;
  const aa = key(a.address);
  const bb = key(b.address);
  return aa === bb;
}

export function routeIssues(pickup: Stop, dropoff: Stop, category: LoadCategory | "" | undefined, zipLookup?: (zip: string) => string | null | undefined): RouteIssue[] {
  const issues: RouteIssue[] = [];
  if (zipLookup) {
    for (const [name, stop] of [["pickup", pickup], ["dropoff", dropoff]] as const) {
      const zip = stop.postalCode ?? "";
      if (!/^\d{5}$/.test(zip)) continue;
      const message = zipStateIssue(zip, stop.state ?? "", zipLookup(zip));
      if (message) issues.push({ path: [name, "postalCode"], message });
    }
  }
  if (category && !sameAddressCategories.has(category) && isSamePlace(pickup, dropoff)) {
    issues.push({ path: ["dropoff", dropoff.address ? "address" : "postalCode"], message: "Delivery is the same place as pickup. Check the addresses." });
  }
  return issues;
}

export function scheduleIssues(pickup: Stop, dropoff: Stop, today: string): RouteIssue[] {
  const issues: RouteIssue[] = [];
  const latest = addDays(today, MAX_DAYS_AHEAD);
  const start = pickup.windowStart ?? "";
  if (start && start < today) issues.push({ path: ["pickup", "windowStart"], message: "The pickup date can't be in the past" });
  if (start && start > latest) issues.push({ path: ["pickup", "windowStart"], message: "Pick a date within the next 12 months" });
  if (pickup.windowEnd && pickup.windowEnd > latest) issues.push({ path: ["pickup", "windowEnd"], message: "Pick a date within the next 12 months" });
  const end = dropoff.windowStart ?? "";
  if (end && end > addDays(latest, 60)) issues.push({ path: ["dropoff", "windowStart"], message: "Delivery is too far out. Pick a date within 12 months" });
  return issues;
}
