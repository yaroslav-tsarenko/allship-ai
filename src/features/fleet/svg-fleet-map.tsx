"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { IconButton } from "@/components/ui/icon-button";
import { addIcon, removeIcon, zoomOutMapIcon } from "@/components/ui/icons.generated";
import { resolveStop, type LatLng } from "@/features/tracking/geo";
import { cn } from "@/lib/cn";
import type { FleetMapProps, MapDriver } from "./map-types";

const WEST = -125;
const EAST = -66.5;
const SOUTH = 24.3;
const NORTH = 49.5;
const SCALE = 16;
const PAD = 24;
const KX = Math.cos((37 * Math.PI) / 180);
const W = Math.round((EAST - WEST) * KX * SCALE + PAD * 2);
const H = Math.round((NORTH - SOUTH) * SCALE + PAD * 2);
const MAX_ZOOM = 12;

const STATES = [
  "AL",
  "AZ",
  "AR",
  "CA",
  "CO",
  "CT",
  "DE",
  "FL",
  "GA",
  "ID",
  "IL",
  "IN",
  "IA",
  "KS",
  "KY",
  "LA",
  "ME",
  "MD",
  "MA",
  "MI",
  "MN",
  "MS",
  "MO",
  "MT",
  "NE",
  "NV",
  "NH",
  "NJ",
  "NM",
  "NY",
  "NC",
  "ND",
  "OH",
  "OK",
  "OR",
  "PA",
  "RI",
  "SC",
  "SD",
  "TN",
  "TX",
  "UT",
  "VT",
  "VA",
  "WA",
  "WV",
  "WI",
  "WY",
];
const SMALL = new Set(["CT", "DE", "MD", "MA", "NH", "NJ", "RI", "VT"]);

type View = { cx: number; cy: number; k: number };
const HOME: View = { cx: W / 2, cy: H / 2, k: 1 };

function base({ lat, lng }: LatLng) {
  return { x: PAD + (lng - WEST) * KX * SCALE, y: PAD + (NORTH - lat) * SCALE };
}

const stateLabels = STATES.map((code) => {
  const stop = resolveStop({ state: code });
  return stop ? { code, lat: stop.lat, lng: stop.lng } : null;
}).filter((s): s is { code: string; lat: number; lng: number } => s !== null);

type Size = { w: number; h: number };

function fitScale(size: Size) {
  return size.w > 0 && size.h > 0 ? Math.min(size.w / W, size.h / H) : 1;
}

function clampView(v: View): View {
  return {
    k: Math.min(MAX_ZOOM, Math.max(1, v.k)),
    cx: Math.min(W, Math.max(0, v.cx)),
    cy: Math.min(H, Math.max(0, v.cy)),
  };
}

function fitView(points: LatLng[], size: Size, maxZoom = 6): View {
  if (points.length === 0) return HOME;
  const xy = points.map(base);
  const xs = xy.map((p) => p.x);
  const ys = xy.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const s0 = fitScale(size);
  const k = Math.min(
    maxZoom,
    (size.w * 0.7) / (Math.max(maxX - minX, 1) * s0),
    (size.h * 0.6) / (Math.max(maxY - minY, 1) * s0),
  );
  return clampView({ cx: (minX + maxX) / 2, cy: (minY + maxY) / 2, k });
}

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function useAnimatedView() {
  const [view, setView] = useState<View>(HOME);
  const current = useRef(view);
  const frame = useRef<number | null>(null);
  useEffect(() => {
    current.current = view;
  }, [view]);
  useEffect(
    () => () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    },
    [],
  );
  const animateTo = useCallback((target: View) => {
    const to = clampView(target);
    if (frame.current) cancelAnimationFrame(frame.current);
    if (prefersReducedMotion()) {
      setView(to);
      return;
    }
    const from = current.current;
    const start = performance.now();
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / 450);
      const e = 1 - Math.pow(1 - p, 3);
      const k = from.k * Math.pow(to.k / from.k, e);
      setView({ cx: from.cx + (to.cx - from.cx) * e, cy: from.cy + (to.cy - from.cy) * e, k });
      frame.current = p < 1 ? requestAnimationFrame(step) : null;
    };
    frame.current = requestAnimationFrame(step);
  }, []);
  const jumpTo = useCallback((target: View) => {
    if (frame.current) cancelAnimationFrame(frame.current);
    setView(clampView(target));
  }, []);
  return { view, animateTo, jumpTo };
}

const labelText = "[paint-order:stroke] stroke-surface-container-low [stroke-linejoin:round]";

function useSize() {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<Size>({ w: 0, h: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const box = entry?.contentRect;
      if (box) setSize({ w: Math.round(box.width), h: Math.round(box.height) });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return { ref, size };
}

export function SvgFleetMap({
  drivers,
  selectedKey,
  onSelect,
  route,
  trail = [],
  focus,
  emptyLabel,
}: FleetMapProps) {
  const { view, animateTo, jumpTo } = useAnimatedView();
  const { ref: boxRef, size } = useSize();
  const s0 = fitScale(size);
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<{ x: number; y: number; view: View; moved: boolean } | null>(null);
  const [dragging, setDragging] = useState(false);
  const justDragged = useRef(false);
  const selected = drivers.find((d) => d.key === selectedKey) ?? null;
  const latest = useRef({ drivers, route, trail, selected, size });
  useEffect(() => {
    latest.current = { drivers, route, trail, selected, size };
  });

  const fitKey = `${selectedKey ?? ""}|${route?.pickup?.lat ?? ""},${route?.pickup?.lng ?? ""}|${route?.dropoff?.lat ?? ""},${route?.dropoff?.lng ?? ""}|${selected ? "d" : ""}|${trail.length > 0}|${size.w}x${size.h}`;
  useEffect(() => {
    const { route: r, trail: t, selected: s, size: box } = latest.current;
    if (box.w === 0) return;
    const pts: LatLng[] = [
      ...(r?.pickup ? [r.pickup] : []),
      ...(r?.dropoff ? [r.dropoff] : []),
      ...(s ? [s] : []),
      ...t,
    ];
    animateTo(pts.length ? fitView(pts, box) : HOME);
  }, [fitKey, animateTo]);

  useEffect(() => {
    if (!focus) return;
    const target = latest.current.drivers.find((d) => d.key === focus.key);
    if (!target) return;
    const p = base(target);
    animateTo({ cx: p.x, cy: p.y, k: 6 });
  }, [focus, animateTo]);

  const toScreen = useMemo(
    () => (p: LatLng) => {
      const b = base(p);
      return { x: (b.x - view.cx) * view.k * s0 + size.w / 2, y: (b.y - view.cy) * view.k * s0 + size.h / 2 };
    },
    [view, s0, size],
  );

  const grid = useMemo(() => {
    const lines: {
      key: string;
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      label?: string;
      lx?: number;
      ly?: number;
      minor: boolean;
    }[] = [];
    const pxPerDeg = view.k * s0 * SCALE;
    const step = pxPerDeg >= 40 ? 1 : 5;
    const lngEvery = pxPerDeg * KX * 5 < 44 ? 10 : 5;
    const latEvery = pxPerDeg * 5 < 32 ? 10 : 5;
    for (let lng = -150; lng <= -40; lng += step) {
      const a = toScreen({ lat: 70, lng });
      const b = toScreen({ lat: 5, lng });
      const major = lng % lngEvery === 0;
      lines.push({
        key: `x${lng}`,
        x1: a.x,
        y1: a.y,
        x2: b.x,
        y2: b.y,
        label: major && lng >= WEST && lng <= EAST ? `${-lng}°W` : undefined,
        minor: lng % 5 !== 0,
        lx: a.x + 4,
        ly: 14,
      });
    }
    for (let lat = 5; lat <= 70; lat += step) {
      const a = toScreen({ lat, lng: -150 });
      const b = toScreen({ lat, lng: -40 });
      const major = lat % latEvery === 0;
      lines.push({
        key: `y${lat}`,
        x1: a.x,
        y1: a.y,
        x2: b.x,
        y2: b.y,
        label: major && lat >= SOUTH && lat <= NORTH ? `${lat}°N` : undefined,
        minor: lat % 5 !== 0,
        lx: 6,
        ly: a.y - 4,
      });
    }
    return lines;
  }, [toScreen, view.k, s0]);

  const onPointerDown = (e: ReactPointerEvent<SVGSVGElement>) => {
    if (e.button !== 0) return;
    drag.current = { x: e.clientX, y: e.clientY, view, moved: false };
  };
  const onPointerMove = (e: ReactPointerEvent<SVGSVGElement>) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.moved && Math.hypot(dx, dy) < 4) return;
    if (!d.moved) {
      svgRef.current?.setPointerCapture(e.pointerId);
      setDragging(true);
    }
    d.moved = true;
    const u = 1 / (s0 * d.view.k);
    jumpTo({ ...d.view, cx: d.view.cx - dx * u, cy: d.view.cy - dy * u });
  };
  const onPointerUp = () => {
    justDragged.current = Boolean(drag.current?.moved);
    drag.current = null;
    setDragging(false);
  };

  const trailPath = trail.map(toScreen);
  const pickup = route?.pickup ? toScreen(route.pickup) : null;
  const dropoff = route?.dropoff ? toScreen(route.dropoff) : null;
  const pins = [pickup, dropoff].filter((p): p is { x: number; y: number } => p !== null);
  const ordered = [...drivers].sort(
    (a, b) =>
      Number(a.key === selectedKey) - Number(b.key === selectedKey) || Number(b.stale) - Number(a.stale),
  );
  const describe =
    drivers.length === 0
      ? "No drivers are sharing a location right now."
      : `${drivers.length} ${drivers.length === 1 ? "driver" : "drivers"} on the map.`;

  return (
    <div ref={boxRef} className="bg-surface-container-low relative size-full overflow-hidden">
      {size.w > 0 && (
        <svg
          ref={svgRef}
          viewBox={`0 0 ${size.w} ${size.h}`}
          className={cn("size-full touch-none select-none", dragging ? "cursor-grabbing" : "cursor-grab")}
          role="img"
          aria-label={`Fleet map. ${describe}`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onClick={(e) => {
            if (justDragged.current) {
              justDragged.current = false;
              return;
            }
            if (e.target === e.currentTarget) onSelect(null);
          }}
        >
          <g aria-hidden="true" className="pointer-events-none">
            {grid.map((l) => (
              <line
                key={l.key}
                x1={l.x1}
                y1={l.y1}
                x2={l.x2}
                y2={l.y2}
                className={l.minor ? "stroke-outline-variant/40" : "stroke-outline-variant"}
                strokeWidth={l.minor ? 0.5 : 1}
                vectorEffect="non-scaling-stroke"
              />
            ))}
            {grid.map((l) =>
              l.label &&
              l.lx != null &&
              l.ly != null &&
              l.lx > 0 &&
              l.lx < size.w - 30 &&
              l.ly > 8 &&
              l.ly < size.h ? (
                <text
                  key={`t${l.key}`}
                  x={l.lx}
                  y={l.ly}
                  className="fill-on-surface-variant/70 text-[9px] tabular-nums"
                >
                  {l.label}
                </text>
              ) : null,
            )}
            {stateLabels.map((s) => {
              const p = toScreen(s);
              if (SMALL.has(s.code) && s0 * view.k * SCALE < 24) return null;
              if (pins.some((pin) => Math.abs(pin.x - p.x) < 34 && Math.abs(pin.y - p.y) < 26)) return null;
              return (
                <text
                  key={s.code}
                  x={p.x}
                  y={p.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className={cn(
                    "fill-on-surface-variant/55 font-medium tracking-[0.08em]",
                    s0 * view.k * SCALE < 10 ? "text-[9px]" : "text-[11px]",
                  )}
                >
                  {s.code}
                </text>
              );
            })}
          </g>

          {pickup && dropoff && (
            <line
              x1={pickup.x}
              y1={pickup.y}
              x2={dropoff.x}
              y2={dropoff.y}
              className="stroke-outline"
              strokeWidth={1.5}
              strokeDasharray="5 5"
              aria-hidden="true"
            />
          )}
          {trailPath.length > 1 && (
            <polyline
              points={trailPath.map((p) => `${p.x},${p.y}`).join(" ")}
              fill="none"
              className="stroke-primary"
              strokeWidth={4}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            />
          )}
          {pickup && (
            <g aria-label={`Pickup: ${route?.pickup?.label}`} role="img">
              <circle
                cx={pickup.x}
                cy={pickup.y}
                r={7}
                className="fill-surface stroke-primary"
                strokeWidth={3.5}
              />
              <text
                x={pickup.x}
                y={pickup.y + 20}
                textAnchor="middle"
                className={cn("fill-on-surface text-[11px] font-medium", labelText)}
                strokeWidth={4}
              >
                {route?.pickup?.label}
              </text>
            </g>
          )}
          {dropoff && (
            <g aria-label={`Delivery: ${route?.dropoff?.label}`} role="img">
              <path
                d={`M${dropoff.x} ${dropoff.y}c-2-6-10-11-10-18a10 10 0 1 1 20 0c0 7-8 12-10 18z`}
                className="fill-tertiary stroke-surface"
                strokeWidth={2}
              />
              <circle cx={dropoff.x} cy={dropoff.y - 18} r={3.5} className="fill-on-tertiary" />
              <text
                x={dropoff.x}
                y={dropoff.y + 16}
                textAnchor="middle"
                className={cn("fill-on-surface text-[11px] font-medium", labelText)}
                strokeWidth={4}
              >
                {route?.dropoff?.label}
              </text>
            </g>
          )}

          {ordered.map((d) => (
            <DriverMarker
              key={d.key}
              driver={d}
              at={toScreen(d)}
              selected={d.key === selectedKey}
              onSelect={onSelect}
            />
          ))}
        </svg>
      )}

      <div className="bg-surface-container-high shadow-elevation-1 absolute top-3 right-3 flex flex-col overflow-hidden rounded-lg">
        <IconButton
          icon={addIcon}
          label="Zoom in"
          className="rounded-none"
          onClick={() => animateTo({ ...view, k: view.k * 1.8 })}
          disabled={view.k >= MAX_ZOOM}
        />
        <IconButton
          icon={removeIcon}
          label="Zoom out"
          className="rounded-none"
          onClick={() => animateTo({ ...view, k: view.k / 1.8 })}
          disabled={view.k <= 1}
        />
        <IconButton
          icon={zoomOutMapIcon}
          label="Show the whole country"
          className="rounded-none"
          onClick={() => animateTo(HOME)}
          disabled={view.k === 1}
        />
      </div>

      {drivers.length === 0 && emptyLabel && (
        <p className="bg-inverse-surface text-body-md text-inverse-on-surface shadow-elevation-2 pointer-events-none absolute inset-x-0 bottom-4 mx-auto w-fit max-w-[calc(100%-32px)] rounded-sm px-4 py-2.5 text-center">
          {emptyLabel}
        </p>
      )}
    </div>
  );
}

function DriverMarker({
  driver,
  at,
  selected,
  onSelect,
}: {
  driver: MapDriver;
  at: { x: number; y: number };
  selected: boolean;
  onSelect: (key: string) => void;
}) {
  const first = driver.name.split(/\s+/)[0] ?? driver.name;
  const label = `${driver.name}${driver.stale ? ", location is more than 5 minutes old" : ""}`;
  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={label}
      aria-pressed={selected}
      className="[&:focus-visible>circle:first-child]:stroke-primary cursor-pointer outline-none"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(driver.key);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(driver.key);
        }
      }}
    >
      <circle
        cx={at.x}
        cy={at.y}
        r={selected ? 20 : 15}
        className={cn(
          "stroke-transparent",
          selected ? (driver.stale ? "fill-outline/20" : "fill-primary/20") : "fill-transparent",
        )}
        strokeWidth={2}
      />
      {!driver.stale && selected && (
        <circle
          cx={at.x}
          cy={at.y}
          r={20}
          className="fill-primary/25 origin-center [transform-box:fill-box] motion-safe:animate-ping"
        />
      )}
      <circle
        cx={at.x}
        cy={at.y}
        r={selected ? 11 : 9}
        className={cn("stroke-surface", driver.stale ? "fill-outline" : "fill-primary")}
        strokeWidth={3}
      />
      {driver.heading != null && !driver.stale ? (
        <path
          d="M0 -5.5 L4 4.5 L0 2.2 L-4 4.5 Z"
          transform={`translate(${at.x} ${at.y}) rotate(${driver.heading})`}
          className="fill-on-primary"
        />
      ) : (
        <circle cx={at.x} cy={at.y} r={3} className={driver.stale ? "fill-surface" : "fill-on-primary"} />
      )}
      <text
        x={at.x + (selected ? 16 : 14)}
        y={at.y + 4}
        className={cn(
          "text-[12px]",
          selected
            ? "fill-on-surface font-medium"
            : driver.stale
              ? "fill-on-surface-variant"
              : "fill-on-surface",
          labelText,
        )}
        strokeWidth={4}
      >
        {first}
      </text>
    </g>
  );
}
