"use client";

import { APIProvider, Map, Marker, Polyline, useMap } from "@vis.gl/react-google-maps";
import { Fragment, useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import {
  mapStyles,
  readPalette,
  readTheme,
  subscribeTheme,
  type Palette,
} from "@/features/tracking/google-map";
import type { LatLng } from "@/features/tracking/geo";
import type { FleetMapProps } from "./map-types";

const US_CENTER = { lat: 39.5, lng: -98.35 };

function Camera({
  drivers,
  selectedKey,
  route,
  trail = [],
  focus,
}: Pick<FleetMapProps, "drivers" | "selectedKey" | "route" | "trail" | "focus">) {
  const map = useMap();
  const latest = useRef({ drivers, route, trail, selectedKey });
  useEffect(() => {
    latest.current = { drivers, route, trail, selectedKey };
  });
  const selected = drivers.find((d) => d.key === selectedKey);
  const fitKey = `${selectedKey ?? ""}|${route?.pickup?.lat ?? ""}|${route?.dropoff?.lat ?? ""}|${selected ? "d" : ""}|${trail.length > 0}|${drivers.length > 0}`;

  useEffect(() => {
    if (!map) return;
    const { drivers: all, route: r, trail: t, selectedKey: key } = latest.current;
    const chosen = all.find((d) => d.key === key);
    const pts: LatLng[] = key
      ? [
          ...(r?.pickup ? [r.pickup] : []),
          ...(r?.dropoff ? [r.dropoff] : []),
          ...(chosen ? [chosen] : []),
          ...t,
        ]
      : all;
    if (pts.length === 0) {
      map.setCenter(US_CENTER);
      map.setZoom(4);
      return;
    }
    if (pts.length === 1) {
      map.panTo(pts[0]!);
      map.setZoom(9);
      return;
    }
    const bounds = new google.maps.LatLngBounds();
    for (const p of pts) bounds.extend(p);
    map.fitBounds(bounds, 64);
  }, [map, fitKey]);

  useEffect(() => {
    if (!map || !focus) return;
    const target = latest.current.drivers.find((d) => d.key === focus.key);
    if (!target) return;
    map.panTo(target);
    map.setZoom(Math.max(map.getZoom() ?? 0, 10));
  }, [map, focus]);

  return null;
}

function Overlays({
  drivers,
  selectedKey,
  onSelect,
  route,
  trail = [],
  palette,
}: Pick<FleetMapProps, "drivers" | "selectedKey" | "onSelect" | "route" | "trail"> & { palette: Palette }) {
  const circle = google.maps.SymbolPath.CIRCLE;
  const origin = new google.maps.Point(0, 0);
  const path = useMemo(() => trail.map((p) => ({ lat: p.lat, lng: p.lng })), [trail]);
  const pickup = route?.pickup ?? null;
  const dropoff = route?.dropoff ?? null;
  return (
    <>
      {pickup && dropoff && (
        <Polyline
          path={[pickup, dropoff]}
          geodesic
          strokeOpacity={0}
          icons={[
            {
              icon: { path: "M 0,-1 0,1", strokeOpacity: 1, strokeColor: palette.outline, scale: 2 },
              offset: "0",
              repeat: "12px",
            },
          ]}
        />
      )}
      {path.length > 1 && (
        <Polyline path={path} strokeColor={palette.primary} strokeOpacity={1} strokeWeight={5} />
      )}
      {pickup && (
        <Marker
          position={pickup}
          title={`Pickup: ${pickup.label}`}
          icon={{
            path: circle,
            scale: 8,
            fillColor: palette.surface,
            fillOpacity: 1,
            strokeColor: palette.primary,
            strokeWeight: 4,
          }}
        />
      )}
      {dropoff && (
        <Marker
          position={dropoff}
          title={`Delivery: ${dropoff.label}`}
          icon={{
            path: "M0 0c-2-6-10-11-10-18a10 10 0 1 1 20 0c0 7-8 12-10 18z",
            scale: 1.2,
            fillColor: palette.tertiary,
            fillOpacity: 1,
            strokeColor: palette.surface,
            strokeWeight: 2,
            anchor: origin,
          }}
        />
      )}
      {drivers.map((d) => {
        const selected = d.key === selectedKey;
        const fill = d.stale ? palette.outline : palette.primary;
        return (
          <Fragment key={d.key}>
            <Marker
              position={d}
              zIndex={selected ? 20 : 10}
              title={`${d.name}${d.stale ? " (location older than 5 minutes)" : ""}`}
              onClick={() => onSelect(d.key)}
              label={{
                text: d.name.split(/\s+/)[0] ?? d.name,
                color: palette.onSurface,
                fontSize: "12px",
                fontWeight: selected ? "600" : "500",
              }}
              icon={{
                path: circle,
                scale: selected ? 13 : 11,
                fillColor: fill,
                fillOpacity: 1,
                strokeColor: palette.surface,
                strokeWeight: 3,
                labelOrigin: new google.maps.Point(0, 2.6),
              }}
            />
            <Marker
              position={d}
              zIndex={selected ? 21 : 11}
              clickable={false}
              icon={
                d.heading != null && !d.stale
                  ? {
                      path: "M0 -6 L4.5 5 L0 2.5 L-4.5 5 Z",
                      rotation: d.heading,
                      scale: 1,
                      fillColor: palette.onPrimary,
                      fillOpacity: 1,
                      strokeWeight: 0,
                      anchor: origin,
                    }
                  : {
                      path: circle,
                      scale: 3.5,
                      fillColor: d.stale ? palette.surface : palette.onPrimary,
                      fillOpacity: 1,
                      strokeWeight: 0,
                    }
              }
            />
          </Fragment>
        );
      })}
    </>
  );
}

export default function GoogleFleetMap({ apiKey, ...props }: FleetMapProps & { apiKey: string }) {
  const theme = useSyncExternalStore(subscribeTheme, readTheme, () => "light" as const);
  const palette = useMemo(() => (theme ? readPalette() : null), [theme]);
  const styles = useMemo(() => (palette ? mapStyles(palette) : undefined), [palette]);

  if (!palette) return <div className="bg-surface-container-low size-full" />;

  return (
    <div className="relative size-full">
      <APIProvider apiKey={apiKey}>
        <Map
          key={theme}
          className="size-full"
          defaultCenter={US_CENTER}
          defaultZoom={4}
          styles={styles}
          backgroundColor={palette.low}
          disableDefaultUI
          zoomControl
          gestureHandling="greedy"
          clickableIcons={false}
          onClick={() => props.onSelect(null)}
        >
          <Camera
            drivers={props.drivers}
            selectedKey={props.selectedKey}
            route={props.route}
            trail={props.trail}
            focus={props.focus}
          />
          <Overlays
            drivers={props.drivers}
            selectedKey={props.selectedKey}
            onSelect={props.onSelect}
            route={props.route}
            trail={props.trail}
            palette={palette}
          />
        </Map>
      </APIProvider>
      {props.drivers.length === 0 && props.emptyLabel && (
        <p className="bg-inverse-surface text-body-md text-inverse-on-surface shadow-elevation-2 pointer-events-none absolute inset-x-0 bottom-4 mx-auto w-fit max-w-[calc(100%-32px)] rounded-sm px-4 py-2.5 text-center">
          {props.emptyLabel}
        </p>
      )}
    </div>
  );
}
