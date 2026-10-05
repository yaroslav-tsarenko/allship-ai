import type { LatLng, ResolvedStop } from "@/features/tracking/geo";
import type { DriverStatus } from "@/server/fleet/status";

export type MapDriver = LatLng & {
  key: string;
  name: string;
  heading: number | null;
  stale: boolean;
  status: DriverStatus;
};

export type MapRoute = { pickup: ResolvedStop | null; dropoff: ResolvedStop | null };

export type MapFocus = { key: string; nonce: number } | null;

export type FleetMapProps = {
  drivers: MapDriver[];
  selectedKey: string | null;
  onSelect: (key: string | null) => void;
  route: MapRoute | null;
  trail?: LatLng[];
  focus: MapFocus;
  emptyLabel?: string;
};
