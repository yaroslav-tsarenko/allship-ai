import type { StatusTone } from "@/components/ui/status-chip";
import {
  agricultureIcon,
  airportShuttleIcon,
  apartmentIcon,
  businessCenterIcon,
  chairIcon,
  checkCircleIcon,
  directionsBoatIcon,
  directionsCarIcon,
  draftIcon,
  errorIcon,
  fireTruckIcon,
  frontLoaderIcon,
  garageIcon,
  houseIcon,
  carRentalIcon,
  deliveryTruckSpeedIcon,
  localShippingIcon,
  lockClockIcon,
  militaryTechIcon,
  palletIcon,
  rvHookupIcon,
  sailingIcon,
  schoolIcon,
  storefrontIcon,
  timerIcon,
  trolleyIcon,
  twoWheelerIcon,
  cancelIcon,
  gavelIcon,
  routeIcon,
  type IconData,
} from "@/components/ui/icons.generated";
import type { LoadCategory, LoadStatus } from "@/server/db/schema/enums";

export const categoryIcons: Record<LoadCategory, IconData> = {
  car_or_light_truck: directionsCarIcon,
  motorcycle: twoWheelerIcon,
  powerboat: directionsBoatIcon,
  sailboat: sailingIcon,
  personal_watercraft: directionsBoatIcon,
  atv_powersports: agricultureIcon,
  commercial_truck: fireTruckIcon,
  vehicle_parts: garageIcon,
  trailer: rvHookupIcon,
  rv: airportShuttleIcon,
  local_moving: houseIcon,
  long_distance_moving: localShippingIcon,
  household_items: chairIcon,
  office_moving: businessCenterIcon,
  business_moving: storefrontIcon,
  corporate_relocation: apartmentIcon,
  student_moving: schoolIcon,
  military_moving: militaryTechIcon,
  heavy_lifting: trolleyIcon,
  freight: palletIcon,
  heavy_equipment: frontLoaderIcon,
  truck_rental: carRentalIcon,
  truck_with_driver: deliveryTruckSpeedIcon,
};

export const statusPresentation: Record<LoadStatus, { tone: StatusTone; icon: IconData }> = {
  draft: { tone: "neutral", icon: draftIcon },
  open: { tone: "primary", icon: gavelIcon },
  awaiting_payment: { tone: "warning", icon: lockClockIcon },
  booked: { tone: "success", icon: checkCircleIcon },
  assigned: { tone: "success", icon: checkCircleIcon },
  en_route_to_pickup: { tone: "tertiary", icon: routeIcon },
  in_transit: { tone: "tertiary", icon: localShippingIcon },
  delivered: { tone: "success", icon: checkCircleIcon },
  completed: { tone: "secondary", icon: checkCircleIcon },
  cancelled: { tone: "neutral", icon: cancelIcon },
  expired: { tone: "neutral", icon: timerIcon },
  disputed: { tone: "error", icon: errorIcon },
};

type StopLike = { city?: string | null; state?: string | null; windowStart?: string | null; windowEnd?: string | null };

export const cityState = (s: StopLike | null | undefined) => (s?.city ? `${s.city}, ${s.state ?? ""}`.replace(/, $/, "") : "Not set");

const dayFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
const dayYearFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
const dateTimeFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

function parseDay(value: string | null | undefined) {
  if (!value) return null;
  const d = new Date(value.length === 10 ? `${value}T12:00:00Z` : value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDay(value: string | Date | null | undefined, withYear = false) {
  const d = value instanceof Date ? value : parseDay(value);
  if (!d) return "Not set";
  return (withYear ? dayYearFmt : dayFmt).format(d);
}

export function formatWindow(s: StopLike | null | undefined) {
  const start = parseDay(s?.windowStart);
  if (!start) return "Date not set";
  const end = parseDay(s?.windowEnd);
  if (!end || end.getTime() === start.getTime()) return dayFmt.format(start);
  return `${dayFmt.format(start)} – ${dayFmt.format(end)}`;
}

export const formatDateTime = (d: Date | string) => dateTimeFmt.format(typeof d === "string" ? new Date(d) : d);

export function timeLeft(until: Date | string | null | undefined, now = Date.now()) {
  if (!until) return null;
  const ms = new Date(until).getTime() - now;
  if (ms <= 0) return "Bidding closed";
  const hours = Math.floor(ms / 3_600_000);
  if (hours >= 48) return `${Math.ceil(ms / 86_400_000)} days left`;
  if (hours >= 1) return `${hours} h left`;
  return `${Math.max(1, Math.floor(ms / 60_000))} min left`;
}

export const eventLabels: Record<string, string> = {
  created: "Draft saved",
  published: "Posted for bids",
  status_changed: "Status changed",
  bid_placed: "New bid",
  bid_updated: "Bid updated",
  bid_withdrawn: "Bid withdrawn",
  payment_failed: "Payment didn't go through",
  payment_after_close: "Payment received after close",
  payout_sent: "Carrier paid",
  payout_failed: "Carrier payout delayed",
  driver_reassigned: "Driver changed",
  dispute_withdrawn: "Dispute withdrawn",
};
