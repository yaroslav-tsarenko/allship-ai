"use client";

import { useCallback, useMemo, useState } from "react";
import { trackingPointsAction } from "@/features/tracking/actions";
import { relativeTime, resolveStop, type TrackPoint } from "@/features/tracking/geo";
import { cn } from "@/lib/cn";
import type { FleetTrip } from "@/server/fleet/queries";
import { isStale } from "@/server/fleet/status";
import { FleetMap } from "./fleet-map";
import { LoadChannel, type LocationPayload } from "./load-channel";
import type { MapDriver } from "./map-types";
import { headingLabel, speedLabel } from "./presentation";
import { useNow } from "./use-now";

function merge(current: TrackPoint[], incoming: TrackPoint[]) {
  const seen = new Set(current.map((p) => p.recordedAt));
  const added = incoming.filter((p) => !seen.has(p.recordedAt));
  if (added.length === 0) return current;
  return [...current, ...added].sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
}

export function DriverTrailMap({
  driverKey,
  name,
  trip,
  initialTrail,
  live,
}: {
  driverKey: string;
  name: string;
  trip: FleetTrip;
  initialTrail: TrackPoint[];
  live: boolean;
}) {
  const [points, setPoints] = useState(initialTrail);
  const now = useNow(15_000);

  const onLocation = useCallback(
    (p: LocationPayload) =>
      setPoints((current) =>
        merge(current, [
          {
            lat: p.lat,
            lng: p.lng,
            recordedAt: p.recordedAt,
            speedMph: p.speedMph,
            headingDeg: p.headingDeg,
          },
        ]),
      ),
    [],
  );
  const poll = useCallback(async () => {
    const res = await trackingPointsAction({ loadId: trip.id });
    if (res?.data) setPoints((current) => merge(current, res.data!.points));
  }, [trip.id]);

  const last = points.at(-1) ?? null;
  const stale = isStale(last?.recordedAt, now);
  const drivers: MapDriver[] = last
    ? [
        {
          key: driverKey,
          name,
          lat: last.lat,
          lng: last.lng,
          heading: last.headingDeg,
          stale,
          status: trip.status === "in_transit" ? "in_transit" : "to_pickup",
        },
      ]
    : [];
  const first = points[0] ?? null;
  const route = useMemo(() => {
    const pickup = resolveStop(trip.pickup);
    return {
      pickup:
        pickup?.approximate && trip.status === "in_transit" && first
          ? { ...pickup, lat: first.lat, lng: first.lng }
          : pickup,
      dropoff: resolveStop(trip.dropoff),
    };
  }, [trip.pickup, trip.dropoff, trip.status, first]);
  const speed = last && !stale ? speedLabel(last.speedMph) : null;
  const heading = speed && speed !== "Stopped" ? headingLabel(last?.headingDeg) : null;

  return (
    <div>
      {live && (
        <LoadChannel
          loadId={trip.id}
          onLocation={onLocation}
          onStatus={() => void poll()}
          onFallback={() => void poll()}
        />
      )}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-5 py-3">
        <span
          className={cn(
            "text-label-lg inline-flex items-center gap-1.5",
            stale ? "text-on-surface-variant" : "text-primary",
          )}
        >
          <span
            aria-hidden="true"
            className={cn("size-2.5 rounded-full", stale ? "bg-outline" : "bg-primary")}
          />
          {!last ? "Waiting for location" : stale ? "Signal lost" : "Live"}
        </span>
        <p className="text-body-md text-on-surface-variant tabular-nums" aria-live="polite">
          {last
            ? `Updated ${relativeTime(last.recordedAt, now)}${speed ? ` · ${speed}${heading ? ` ${heading}` : ""}` : ""} · ${points.length} ${points.length === 1 ? "position" : "positions"} on this trip`
            : "The trail shows up as soon as the driver's phone shares a location."}
        </p>
      </div>
      <div className="border-outline-variant medium:h-[400px] h-[320px] border-t">
        <FleetMap
          drivers={drivers}
          selectedKey={driverKey}
          onSelect={() => undefined}
          route={route}
          trail={points}
          focus={null}
        />
      </div>
    </div>
  );
}
