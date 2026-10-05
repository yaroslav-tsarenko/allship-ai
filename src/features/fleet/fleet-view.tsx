"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Chip, ChipSet } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import {
  closeIcon,
  groupIcon,
  keyboardArrowDownIcon,
  keyboardArrowUpIcon,
  searchIcon,
} from "@/components/ui/icons.generated";
import { AddDriverButton } from "@/features/team/add-driver-dialog";
import { resolveStop } from "@/features/tracking/geo";
import { cn } from "@/lib/cn";
import { fleetSnapshotAction } from "@/server/actions/fleet";
import type { FleetSnapshot } from "@/server/fleet/queries";
import { isLiveTrip, isOnTrip, isStale, matchesFilter, type FleetFilter } from "@/server/fleet/status";
import { DriverRow } from "./driver-row";
import { DriverSheet } from "./driver-sheet";
import { FleetMap } from "./fleet-map";
import { LoadChannel, type LocationPayload } from "./load-channel";
import type { MapDriver, MapFocus } from "./map-types";
import { filters } from "./presentation";
import { useNow } from "./use-now";

const BASE_REFRESH_MS = 30_000;
const MIN_REFRESH_GAP_MS = 8_000;

export function FleetView({ initial, canRemove }: { initial: FleetSnapshot; canRemove: boolean }) {
  const [seed, setSeed] = useState(initial);
  const [snapshot, setSnapshot] = useState(initial);
  if (seed !== initial) {
    setSeed(initial);
    setSnapshot(initial);
  }
  const [filter, setFilter] = useState<FleetFilter>("all");
  const [query, setQuery] = useState("");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [focus, setFocus] = useState<MapFocus>(null);
  const [mapOpen, setMapOpen] = useState(true);
  const mapRef = useRef<HTMLDivElement>(null);
  const lastRefresh = useRef(0);
  const inflight = useRef(false);
  const now = useNow(15_000);

  const refresh = useCallback(async (force = false) => {
    if (inflight.current || (!force && Date.now() - lastRefresh.current < MIN_REFRESH_GAP_MS)) return;
    inflight.current = true;
    lastRefresh.current = Date.now();
    try {
      const res = await fleetSnapshotAction();
      if (res?.data) setSnapshot(res.data);
    } finally {
      inflight.current = false;
    }
  }, []);

  useEffect(() => {
    lastRefresh.current = Date.now();
    const id = setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, BASE_REFRESH_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  const onLocation = useCallback((p: LocationPayload) => {
    setSnapshot((s) => ({
      ...s,
      drivers: s.drivers.map((d) =>
        d.trip?.id === p.loadId && (!d.position || d.position.recordedAt < p.recordedAt)
          ? {
              ...d,
              position: {
                lat: p.lat,
                lng: p.lng,
                headingDeg: p.headingDeg,
                speedMph: p.speedMph,
                recordedAt: p.recordedAt,
              },
            }
          : d,
      ),
    }));
  }, []);
  const onStatus = useCallback(() => void refresh(true), [refresh]);
  const onFallback = useCallback(() => void refresh(), [refresh]);

  const liveLoadIds = useMemo(
    () => [
      ...new Set(snapshot.drivers.filter((d) => d.trip && isLiveTrip(d.trip.status)).map((d) => d.trip!.id)),
    ],
    [snapshot.drivers],
  );

  const counts = useMemo(() => {
    const onTrip = snapshot.drivers.filter((d) => isOnTrip(d.status)).length;
    return { all: snapshot.drivers.length, on_trip: onTrip, idle: snapshot.drivers.length - onTrip };
  }, [snapshot.drivers]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return snapshot.drivers.filter(
      (d) =>
        matchesFilter(d.status, filter) &&
        (!q ||
          d.name.toLowerCase().includes(q) ||
          d.email.toLowerCase().includes(q) ||
          d.trip?.publicId.toLowerCase().includes(q)),
    );
  }, [snapshot.drivers, filter, query]);

  const mapDrivers: MapDriver[] = useMemo(
    () =>
      snapshot.drivers
        .filter((d) => d.position && isOnTrip(d.status))
        .map((d) => ({
          key: d.key,
          name: d.name,
          lat: d.position!.lat,
          lng: d.position!.lng,
          heading: d.position!.headingDeg,
          stale: isStale(d.position!.recordedAt, now),
          status: d.status,
        })),
    [snapshot.drivers, now],
  );

  const selected = snapshot.drivers.find((d) => d.key === selectedKey) ?? null;
  const selectedTrip = selected?.trip ?? null;
  const route = useMemo(
    () =>
      selectedTrip
        ? { pickup: resolveStop(selectedTrip.pickup), dropoff: resolveStop(selectedTrip.dropoff) }
        : null,
    [selectedTrip],
  );

  const select = useCallback(
    (key: string | null) => setSelectedKey((current) => (key && current === key ? null : key)),
    [],
  );
  const locate = useCallback((key: string) => {
    setSelectedKey(key);
    setMapOpen(true);
    setFocus((f) => ({ key, nonce: (f?.nonce ?? 0) + 1 }));
    if (window.matchMedia("(max-width: 839px)").matches)
      mapRef.current?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        block: "start",
      });
  }, []);
  const closeSheet = useCallback(() => setSelectedKey(null), []);

  const onTripCount = counts.on_trip;
  const emptyLabel =
    onTripCount === 0
      ? "No drivers on the road right now"
      : mapDrivers.length === 0
        ? "Waiting for the first location from drivers on a trip"
        : undefined;

  return (
    <>
      {liveLoadIds.map((id) => (
        <LoadChannel
          key={id}
          loadId={id}
          onLocation={onLocation}
          onStatus={onStatus}
          onFallback={onFallback}
        />
      ))}
      <div className="border-outline-variant bg-surface-container-low expanded:grid expanded:h-[calc(100dvh-196px)] expanded:min-h-[560px] expanded:grid-cols-[minmax(320px,380px)_1fr] overflow-hidden rounded-xl border">
        <div
          ref={mapRef}
          className="border-outline-variant expanded:order-2 expanded:border-b-0 expanded:border-l scroll-mt-20 border-b"
        >
          <div className="expanded:hidden flex items-center justify-between gap-2 px-4 py-2">
            <p className="text-label-lg text-on-surface-variant" aria-live="polite">
              {onTripCount === 0 ? "Nobody on the road" : `${onTripCount} on the road`}
            </p>
            <button
              type="button"
              onClick={() => setMapOpen((o) => !o)}
              aria-expanded={mapOpen}
              aria-controls="fleet-map"
              className="state-layer text-label-lg text-primary focus-visible:outline-primary inline-flex h-9 items-center gap-1 rounded-full px-3 outline-none focus-visible:outline-2"
            >
              {mapOpen ? "Hide map" : "Show map"}
              <Icon icon={mapOpen ? keyboardArrowUpIcon : keyboardArrowDownIcon} size={20} />
            </button>
          </div>
          <div
            id="fleet-map"
            className={cn("medium:h-[380px] expanded:block expanded:h-full h-[300px]", !mapOpen && "hidden")}
          >
            <FleetMap
              drivers={mapDrivers}
              selectedKey={selectedKey}
              onSelect={select}
              route={route}
              focus={focus}
              emptyLabel={emptyLabel}
            />
          </div>
        </div>

        <section aria-label="Drivers" className="expanded:order-1 flex min-h-0 flex-col">
          <div className="flex flex-col gap-3 px-4 pt-4 pb-3">
            <label className="bg-surface-container-high text-on-surface-variant focus-within:outline-primary flex h-12 items-center gap-3 rounded-full px-4 focus-within:outline-2">
              <Icon icon={searchIcon} size={22} />
              <span className="sr-only">Search drivers</span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search drivers or trips"
                className="text-body-lg text-on-surface placeholder:text-on-surface-variant h-full min-w-0 flex-1 bg-transparent outline-none [&::-webkit-search-cancel-button]:hidden"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className="state-layer -mr-2 inline-flex size-9 items-center justify-center rounded-full"
                >
                  <Icon icon={closeIcon} size={20} />
                </button>
              )}
            </label>
            <ChipSet label="Filter drivers">
              {filters.map((f) => (
                <Chip
                  key={f.value}
                  variant="filter"
                  selected={filter === f.value}
                  onClick={() => setFilter(f.value)}
                  label={`${f.label} · ${counts[f.value]}`}
                />
              ))}
            </ChipSet>
          </div>
          <div className="border-outline-variant expanded:overflow-y-auto min-h-0 flex-1 border-t">
            {snapshot.drivers.length === 0 ? (
              <EmptyState
                compact
                icon={groupIcon}
                title="No drivers yet"
                description="Add your first driver. They get a link to sign in on their phone and share their location on trips."
                action={<AddDriverButton variant="tonal" onAdded={() => void refresh(true)} />}
              />
            ) : visible.length === 0 ? (
              <p className="text-body-md text-on-surface-variant px-4 py-8 text-center">
                {query
                  ? `No drivers match “${query.trim()}”.`
                  : filter === "on_trip"
                    ? "Nobody is on a trip right now."
                    : "Every driver is on a trip."}
              </p>
            ) : (
              <ul aria-label={`${visible.length} ${visible.length === 1 ? "driver" : "drivers"}`}>
                {visible.map((d) => (
                  <DriverRow
                    key={d.key}
                    driver={d}
                    now={now}
                    selected={d.key === selectedKey}
                    canRemove={canRemove}
                    onSelect={() => select(d.key)}
                    onLocate={() => locate(d.key)}
                    onChanged={() => void refresh(true)}
                  />
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
      {selected && (
        <DriverSheet driver={selected} now={now} onClose={closeSheet} onLocate={() => locate(selected.key)} />
      )}
    </>
  );
}
