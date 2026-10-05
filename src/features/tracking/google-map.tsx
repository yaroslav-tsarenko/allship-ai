"use client";

import { APIProvider, Map, Marker, Polyline, useMap } from "@vis.gl/react-google-maps";
import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import type { ResolvedStop, TrackPoint } from "./geo";

type Props = {
  apiKey: string;
  pickup: ResolvedStop | null;
  dropoff: ResolvedStop | null;
  points: TrackPoint[];
  heading: number | null;
  phase: "to_pickup" | "to_dropoff" | "done";
};

export function subscribeTheme(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", onChange);
  return () => {
    observer.disconnect();
    media.removeEventListener("change", onChange);
  };
}

export function readTheme() {
  const set = document.documentElement.dataset.theme;
  if (set === "dark" || set === "light") return set;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export type Palette = Record<"primary" | "tertiary" | "surface" | "low" | "high" | "highest" | "outline" | "variant" | "onSurface" | "onVariant" | "water" | "onPrimary", string>;

export function readPalette(): Palette {
  const css = getComputedStyle(document.documentElement);
  const v = (name: string) => css.getPropertyValue(`--md-${name}`).trim();
  return {
    primary: v("primary"),
    onPrimary: v("on-primary"),
    tertiary: v("tertiary"),
    surface: v("surface"),
    low: v("surface-container-low"),
    high: v("surface-container-high"),
    highest: v("surface-container-highest"),
    outline: v("outline"),
    variant: v("outline-variant"),
    onSurface: v("on-surface"),
    onVariant: v("on-surface-variant"),
    water: v("secondary-container"),
  };
}

export function mapStyles(c: Palette): google.maps.MapTypeStyle[] {
  return [
    { elementType: "geometry", stylers: [{ color: c.low }] },
    { elementType: "labels.text.fill", stylers: [{ color: c.onVariant }] },
    { elementType: "labels.text.stroke", stylers: [{ color: c.low }] },
    { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: c.variant }] },
    { featureType: "administrative.land_parcel", stylers: [{ visibility: "off" }] },
    { featureType: "poi", stylers: [{ visibility: "off" }] },
    { featureType: "transit", stylers: [{ visibility: "off" }] },
    { featureType: "landscape.natural", elementType: "geometry", stylers: [{ color: c.surface }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: c.highest }] },
    { featureType: "road", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
    { featureType: "road.highway", elementType: "geometry", stylers: [{ color: c.variant }] },
    { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: c.onSurface }] },
    { featureType: "road.local", elementType: "labels", stylers: [{ visibility: "off" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: c.water }] },
    { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: c.onVariant }] },
  ];
}

function FitBounds({ pickup, dropoff, points }: Pick<Props, "pickup" | "dropoff" | "points">) {
  const map = useMap();
  const latest = useRef({ pickup, dropoff, points });
  useEffect(() => {
    latest.current = { pickup, dropoff, points };
  });
  const key = `${pickup?.lat},${pickup?.lng},${dropoff?.lat},${dropoff?.lng},${points.length > 0}`;
  useEffect(() => {
    if (!map) return;
    const current = latest.current;
    const bounds = new google.maps.LatLngBounds();
    for (const p of [current.pickup, current.dropoff, ...current.points]) if (p) bounds.extend({ lat: p.lat, lng: p.lng });
    if (bounds.isEmpty()) return;
    map.fitBounds(bounds, 48);
  }, [map, key]);
  return null;
}

function Overlays({ pickup, dropoff, points, heading, phase, palette }: Omit<Props, "apiKey"> & { palette: Palette }) {
  const path = useMemo(() => points.map((p) => ({ lat: p.lat, lng: p.lng })), [points]);
  const current = points.at(-1);
  const circle = google.maps.SymbolPath.CIRCLE;
  const origin = new google.maps.Point(0, 0);
  return (
    <>
      {pickup && dropoff && (
        <Polyline
          path={[pickup, dropoff]}
          geodesic
          strokeOpacity={0}
          icons={[{ icon: { path: "M 0,-1 0,1", strokeOpacity: 1, strokeColor: palette.outline, scale: 2 }, offset: "0", repeat: "12px" }]}
        />
      )}
      {path.length > 1 && <Polyline path={path} strokeColor={palette.primary} strokeOpacity={1} strokeWeight={5} />}
      {pickup && <Marker position={pickup} title={`Pickup: ${pickup.label}`} icon={{ path: circle, scale: 8, fillColor: palette.surface, fillOpacity: 1, strokeColor: palette.primary, strokeWeight: 4 }} />}
      {dropoff && (
        <Marker
          position={dropoff}
          title={`Delivery: ${dropoff.label}`}
          icon={{ path: "M0 0c-2-6-10-11-10-18a10 10 0 1 1 20 0c0 7-8 12-10 18z", scale: 1.2, fillColor: palette.tertiary, fillOpacity: 1, strokeColor: palette.surface, strokeWeight: 2, anchor: origin }}
        />
      )}
      {current && phase !== "done" && (
        <>
          <Marker position={current} zIndex={10} title="Driver" icon={{ path: circle, scale: 12, fillColor: palette.primary, fillOpacity: 1, strokeColor: palette.surface, strokeWeight: 3 }} />
          <Marker
            position={current}
            zIndex={11}
            clickable={false}
            icon={
              heading != null
                ? { path: "M0 -6 L4.5 5 L0 2.5 L-4.5 5 Z", rotation: heading, scale: 1, fillColor: palette.onPrimary, fillOpacity: 1, strokeWeight: 0, anchor: origin }
                : { path: circle, scale: 3.5, fillColor: palette.onPrimary, fillOpacity: 1, strokeWeight: 0 }
            }
          />
        </>
      )}
      {current && phase === "done" && <Marker position={current} title="Last position" icon={{ path: circle, scale: 5, fillColor: palette.primary, fillOpacity: 1, strokeColor: palette.surface, strokeWeight: 2 }} />}
    </>
  );
}

export default function GoogleTrackingMap({ apiKey, pickup, dropoff, points, heading, phase }: Props) {
  const theme = useSyncExternalStore(subscribeTheme, readTheme, () => "light" as const);
  const palette = useMemo(() => (theme ? readPalette() : null), [theme]);
  const styles = useMemo(() => (palette ? mapStyles(palette) : undefined), [palette]);
  const center = points.at(-1) ?? pickup ?? dropoff ?? { lat: 39.5, lng: -98.35 };

  if (!palette) return <div className="size-full bg-surface-container-low" />;

  return (
    <APIProvider apiKey={apiKey}>
      <Map
        key={theme}
        className="size-full"
        defaultCenter={{ lat: center.lat, lng: center.lng }}
        defaultZoom={6}
        styles={styles}
        backgroundColor={palette.low}
        disableDefaultUI
        zoomControl
        gestureHandling="cooperative"
        clickableIcons={false}
      >
        <FitBounds pickup={pickup} dropoff={dropoff} points={points} />
        <Overlays pickup={pickup} dropoff={dropoff} points={points} heading={heading} phase={phase} palette={palette} />
      </Map>
    </APIProvider>
  );
}
