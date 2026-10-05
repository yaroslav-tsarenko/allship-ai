"use client";

import { useEffect, useRef, useState } from "react";
import { project, type LatLng, type ResolvedStop, type TrackPoint } from "./geo";

type Props = {
  pickup: ResolvedStop | null;
  dropoff: ResolvedStop | null;
  points: TrackPoint[];
  heading: number | null;
  live: boolean;
  phase: "to_pickup" | "to_dropoff" | "done";
};

function useWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.round(entry?.contentRect.width ?? 0)));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return { ref, width };
}

function metersToPx(at: LatLng, meters: number, toXY: (p: LatLng) => { x: number; y: number }) {
  const a = toXY(at);
  const b = toXY({ lat: at.lat + meters / 111_320, lng: at.lng });
  return Math.abs(a.y - b.y);
}

const labelClass = "fill-on-surface text-label-md [paint-order:stroke] stroke-surface-container-low [stroke-width:4px] [stroke-linejoin:round]";

export function RouteSchematic({ pickup, dropoff, points, heading, live, phase }: Props) {
  const { ref, width } = useWidth();
  const height = width < 520 ? 240 : 300;
  const current = points.at(-1) ?? null;
  const all: LatLng[] = [...(pickup ? [pickup] : []), ...(dropoff ? [dropoff] : []), ...points];

  const summary = [
    pickup ? `Pickup ${pickup.label}` : null,
    dropoff ? `delivery ${dropoff.label}` : null,
    current ? (phase === "done" ? `${points.length} tracked positions` : "driver's current position shown") : "no driver position yet",
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div ref={ref} className="relative w-full overflow-hidden bg-surface-container-low" style={{ height }}>
      {width > 0 && all.length > 0 && (
        <Drawing width={width} height={height} all={all} pickup={pickup} dropoff={dropoff} points={points} current={current} heading={heading} live={live} phase={phase} summary={summary} />
      )}
      {all.length === 0 && <p className="absolute inset-0 flex items-center justify-center px-6 text-center text-body-md text-on-surface-variant">We&rsquo;ll draw the route once the stops have a location.</p>}
    </div>
  );
}

function Drawing({
  width,
  height,
  all,
  pickup,
  dropoff,
  points,
  current,
  heading,
  live,
  phase,
  summary,
}: Props & { width: number; height: number; all: LatLng[]; current: TrackPoint | null; summary: string }) {
  const padding = width < 520 ? 36 : 56;
  const toXY = project(all, width, height, padding);
  const p = pickup ? toXY(pickup) : null;
  const d = dropoff ? toXY(dropoff) : null;
  const trail = points.map(toXY);
  const c = current ? toXY(current) : null;
  const halo = current?.accuracyM ? Math.min(60, Math.max(16, metersToPx(current, current.accuracyM, toXY))) : 16;
  const labelBelow = (pt: { y: number }) => pt.y < height - 40;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Route schematic: ${summary}`} className="block">
      <defs>
        <pattern id="route-grid" width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" className="fill-outline-variant" />
        </pattern>
      </defs>
      <rect width={width} height={height} fill="url(#route-grid)" opacity="0.7" />
      {p && d && <line x1={p.x} y1={p.y} x2={d.x} y2={d.y} className="stroke-outline" strokeWidth={2} strokeDasharray="2 8" strokeLinecap="round" />}
      {c && p && phase === "to_pickup" && <line x1={c.x} y1={c.y} x2={p.x} y2={p.y} className="stroke-primary" strokeOpacity={0.5} strokeWidth={2} strokeDasharray="2 8" strokeLinecap="round" />}
      {trail.length > 1 && (
        <polyline points={trail.map((t) => `${t.x.toFixed(1)},${t.y.toFixed(1)}`).join(" ")} fill="none" className="stroke-primary" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
      )}
      {p && (
        <g>
          <circle cx={p.x} cy={p.y} r={8} className="fill-surface stroke-primary" strokeWidth={4} />
          <text x={p.x} y={labelBelow(p) ? p.y + 26 : p.y - 16} textAnchor="middle" className={labelClass}>
            {pickup?.label || "Pickup"}
          </text>
        </g>
      )}
      {d && (
        <g>
          <path d={`M${d.x} ${d.y} c-2-6-10-11-10-18a10 10 0 1 1 20 0c0 7-8 12-10 18z`} className="fill-tertiary stroke-surface" strokeWidth={2} />
          <circle cx={d.x} cy={d.y - 18} r={3.5} className="fill-on-tertiary" />
          <text x={d.x} y={labelBelow(d) ? d.y + 18 : d.y - 34} textAnchor="middle" className={labelClass}>
            {dropoff?.label || "Delivery"}
          </text>
        </g>
      )}
      {c && phase !== "done" && (
        <g>
          <circle cx={c.x} cy={c.y} r={halo} className="fill-primary" fillOpacity={0.14} />
          {live && <circle cx={c.x} cy={c.y} r={14} className="origin-center fill-primary motion-safe:animate-ping [transform-box:fill-box]" fillOpacity={0.25} />}
          <circle cx={c.x} cy={c.y} r={12} className="fill-primary stroke-surface" strokeWidth={3} />
          {heading != null ? (
            <path d="M0 -6 L4.5 5 L0 2.5 L-4.5 5 Z" transform={`translate(${c.x} ${c.y}) rotate(${heading})`} className="fill-on-primary" />
          ) : (
            <circle cx={c.x} cy={c.y} r={3.5} className="fill-on-primary" />
          )}
        </g>
      )}
      {c && phase === "done" && <circle cx={c.x} cy={c.y} r={5} className="fill-primary stroke-surface" strokeWidth={2} />}
    </svg>
  );
}
