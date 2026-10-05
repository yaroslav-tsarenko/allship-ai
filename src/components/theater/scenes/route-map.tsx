export type Pt = readonly [number, number];

export function pointAt(points: readonly Pt[], t: number): { x: number; y: number; angle: number } {
  const lens: number[] = [];
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]!;
    const b = points[i]!;
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]);
    lens.push(l);
    total += l;
  }
  let d = Math.max(0, Math.min(1, t)) * total;
  for (let i = 0; i < lens.length; i++) {
    const l = lens[i]!;
    const a = points[i]!;
    const b = points[i + 1]!;
    if (d <= l || i === lens.length - 1) {
      const k = l === 0 ? 0 : Math.min(1, d / l);
      return {
        x: a[0] + (b[0] - a[0]) * k,
        y: a[1] + (b[1] - a[1]) * k,
        angle: (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI + 90,
      };
    }
    d -= l;
  }
  const last = points[points.length - 1]!;
  return { x: last[0], y: last[1], angle: 0 };
}

export const pathOf = (points: readonly Pt[]) =>
  points.map((p, i) => `${i ? "L" : "M"}${p[0]} ${p[1]}`).join(" ");

export const gridStyle = {
  backgroundImage: "radial-gradient(circle, var(--md-outline-variant) 1px, transparent 1.4px)",
  backgroundSize: "24px 24px",
} as const;

export const labelClass =
  "fill-on-surface text-[13px] font-medium [paint-order:stroke] stroke-surface-container-low [stroke-width:4px] [stroke-linejoin:round]";

export function Vehicle({
  x,
  y,
  angle,
  selected = false,
}: {
  x: number;
  y: number;
  angle: number;
  selected?: boolean;
}) {
  return (
    <g transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`}>
      <circle r={selected ? 26 : 18} className="fill-primary" fillOpacity={selected ? 0.18 : 0.14} />
      <circle r="12" className="fill-primary stroke-surface" strokeWidth="3" />
      <path
        d="M0 -6 L4.5 5 L0 2.5 L-4.5 5 Z"
        transform={`rotate(${angle.toFixed(0)})`}
        className="fill-on-primary"
      />
    </g>
  );
}
