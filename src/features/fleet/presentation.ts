import type { StatusTone } from "@/components/ui/status-chip";
import type { FleetStop } from "@/server/fleet/queries";
import type { DriverStatus, FleetFilter } from "@/server/fleet/status";

export const statusMeta: Record<DriverStatus, { label: string; tone: StatusTone }> = {
  in_transit: { label: "On trip · In transit", tone: "primary" },
  to_pickup: { label: "Heading to pickup", tone: "secondary" },
  assigned: { label: "Assigned", tone: "tertiary" },
  idle: { label: "Idle", tone: "neutral" },
  invited: { label: "Invited · not activated yet", tone: "warning" },
};

export const filters: { value: FleetFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "on_trip", label: "On trip" },
  { value: "idle", label: "Idle" },
];

export function stopLabel(stop: Pick<FleetStop, "city" | "state">) {
  return [stop.city, stop.state].filter(Boolean).join(", ") || "Location on file";
}

export function speedLabel(speedMph: number | null | undefined) {
  if (speedMph == null) return null;
  return speedMph < 3 ? "Stopped" : `${Math.round(speedMph)} mph`;
}

const compass = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

export function headingLabel(deg: number | null | undefined) {
  if (deg == null) return null;
  return compass[Math.round((((deg % 360) + 360) % 360) / 45) % 8];
}
