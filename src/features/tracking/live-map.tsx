"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import { publicEnv as env } from "@/lib/public-env";
import { cn } from "@/lib/cn";
import { useRealtime } from "@/lib/realtime/use-realtime";
import { topics } from "@/server/realtime/topics";
import { trackingPointsAction } from "./actions";
import { haversineMiles, headingOf, relativeTime, resolveStop, tripProgress, type StopInput, type TrackPoint } from "./geo";
import { RouteSchematic } from "./route-schematic";

const GoogleTrackingMap = dynamic(() => import("./google-map"), { ssr: false, loading: () => <div className="size-full animate-pulse bg-surface-container-low" /> });

export type LiveMapProps = {
  loadId: string;
  status: string;
  pickup: StopInput;
  dropoff: StopInput;
  initialPoints: TrackPoint[];
  driverName?: string | null;
  className?: string;
};

const liveStatuses = ["en_route_to_pickup", "in_transit"];
const STALE_MS = 5 * 60_000;

const timeFmt = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" });
const dayTimeFmt = new Intl.DateTimeFormat("en-US", { weekday: "short", hour: "numeric", minute: "2-digit" });

function formatEta(ms: number) {
  const date = new Date(ms);
  return date.toDateString() === new Date().toDateString() ? timeFmt.format(date) : dayTimeFmt.format(date);
}

function formatMiles(miles: number) {
  if (miles < 0.5) return "Arriving";
  return `${miles < 10 ? miles.toFixed(1) : Math.round(miles).toLocaleString("en-US")} mi`;
}

function merge(current: TrackPoint[], incoming: TrackPoint[]) {
  const seen = new Set(current.map((p) => p.recordedAt));
  const added = incoming.filter((p) => !seen.has(p.recordedAt));
  if (added.length === 0) return current;
  return [...current, ...added].sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
}

function useNow(intervalMs: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

export function LiveMap({ loadId, status, pickup, dropoff, initialPoints, driverName, className }: LiveMapProps) {
  const [seed, setSeed] = useState(initialPoints);
  const [points, setPoints] = useState(initialPoints);
  if (seed !== initialPoints) {
    setSeed(initialPoints);
    setPoints((p) => merge(initialPoints, p.filter((x) => x.recordedAt > (initialPoints.at(-1)?.recordedAt ?? ""))));
  }
  const live = liveStatuses.includes(status);
  const now = useNow(20_000);

  const poll = useCallback(async () => {
    const res = await trackingPointsAction({ loadId });
    if (res?.data) setPoints((p) => merge(p, res.data!.points));
  }, [loadId]);

  useRealtime(
    live ? topics.load(loadId) : null,
    (event) => {
      if (event.event !== "location") return;
      const { lat, lng, recordedAt, speedMph, headingDeg } = event.payload;
      setPoints((p) => merge(p, [{ lat, lng, recordedAt, speedMph, headingDeg }]));
    },
    { onFallback: poll, fallbackIntervalMs: 15_000 },
  );

  const phase = status === "en_route_to_pickup" ? "to_pickup" : status === "in_transit" ? "to_dropoff" : live ? "to_dropoff" : "done";
  const firstPoint = points[0] ?? null;
  const lastPoint = points.at(-1) ?? null;
  const resolvedPickup = useMemo(() => {
    const stop = resolveStop(pickup);
    if (stop?.approximate && phase !== "to_pickup" && firstPoint) return { ...stop, lat: firstPoint.lat, lng: firstPoint.lng };
    return stop;
  }, [pickup, phase, firstPoint]);
  const resolvedDropoff = useMemo(() => {
    const stop = resolveStop(dropoff);
    if (stop?.approximate && phase === "done" && lastPoint) return { ...stop, lat: lastPoint.lat, lng: lastPoint.lng };
    if (stop?.approximate && pickup.state === dropoff.state) return null;
    return stop;
  }, [dropoff, pickup.state, phase, lastPoint]);
  const heading = headingOf(points);
  const last = points.at(-1) ?? null;
  const progress = tripProgress(phase, resolvedPickup, resolvedDropoff, points);
  const stale = last ? now - new Date(last.recordedAt).getTime() > STALE_MS : true;
  const approximate = Boolean(resolvedPickup?.approximate || resolvedDropoff?.approximate);
  const tracked = useMemo(() => points.slice(1).reduce((s, p, i) => s + haversineMiles(points[i]!, p), 0), [points]);
  const key = env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;

  const speed = progress.speedMph;
  const stats: { label: string; value: string }[] =
    phase === "done"
      ? [
          { label: "Tracked distance", value: tracked > 0 ? `${Math.round(tracked).toLocaleString("en-US")} mi` : "—" },
          { label: "Positions", value: points.length.toLocaleString("en-US") },
          { label: "Last position", value: last ? relativeTime(last.recordedAt, now) : "—" },
        ]
      : [
          { label: phase === "to_pickup" ? "To pickup" : "To delivery", value: progress.milesLeft != null ? formatMiles(progress.milesLeft) : "—" },
          { label: "ETA", value: progress.etaMs && !stale ? formatEta(progress.etaMs) : last && speed != null && speed < 5 ? "Stopped" : "—" },
          { label: "Speed", value: speed != null && !stale ? (speed < 3 ? "Stopped" : `${Math.round(speed)} mph`) : "—" },
        ];

  return (
    <div className={cn("overflow-hidden", className)}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-5 pt-4 pb-3">
        {live && (
          <span className={cn("inline-flex items-center gap-1.5 text-label-lg", stale ? "text-on-surface-variant" : "text-primary")}>
            <span aria-hidden="true" className="relative flex size-2.5">
              {!stale && <span className="absolute inline-flex size-full rounded-full bg-primary opacity-60 motion-safe:animate-ping" />}
              <span className={cn("relative inline-flex size-2.5 rounded-full", stale ? "bg-outline" : "bg-primary")} />
            </span>
            {stale ? "Signal lost" : "Live"}
          </span>
        )}
        <p className="text-body-md text-on-surface-variant" aria-live="polite">
          {last ? (
            <>
              {driverName ? `${driverName} · ` : ""}Updated {relativeTime(last.recordedAt, now)}
              {last.accuracyM ? ` · ±${last.accuracyM < 1000 ? `${last.accuracyM} m` : `${(last.accuracyM / 1000).toFixed(1)} km`}` : ""}
            </>
          ) : live ? (
            "Waiting for the driver's first location. It shows up as soon as their phone shares it."
          ) : (
            "No location was shared for this trip."
          )}
        </p>
      </div>
      <div className="relative h-[240px] border-y border-outline-variant medium:h-[300px]">
        {key ? (
          <GoogleTrackingMap apiKey={key} pickup={resolvedPickup} dropoff={resolvedDropoff} points={points} heading={heading} phase={phase} />
        ) : (
          <RouteSchematic pickup={resolvedPickup} dropoff={resolvedDropoff} points={points} heading={heading} live={live && !stale} phase={phase} />
        )}
      </div>
      {phase === "to_dropoff" && progress.fraction != null && (
        <div
          className="h-1 bg-secondary-container"
          role="progressbar"
          aria-label="Trip progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress.fraction * 100)}
        >
          <div className="h-full bg-primary transition-[width] duration-700 ease-emphasized-decelerate" style={{ width: `${Math.max(2, progress.fraction * 100)}%` }} />
        </div>
      )}
      <dl className="grid grid-cols-3 gap-4 px-5 py-4">
        {stats.map((s) => (
          <div key={s.label} className="min-w-0">
            <dt className="truncate text-label-md text-on-surface-variant">{s.label}</dt>
            <dd className="mt-0.5 truncate text-title-md text-on-surface tabular-nums">{s.value}</dd>
          </div>
        ))}
      </dl>
      {(approximate || phase !== "done") && (
        <p className="px-5 pb-4 text-body-sm text-on-surface-variant">
          {phase !== "done" ? "Distance and ETA are estimates from the driver's position and current speed." : ""}
          {approximate ? `${phase !== "done" ? " " : ""}Stop pins are approximate.` : ""}
        </p>
      )}
    </div>
  );
}
