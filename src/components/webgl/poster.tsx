import { fovFor, sceneConfig, type RouteFieldVariant } from "./config";
import { cities, EXTENT, lanes, outline, toXZ } from "./geo";
import { lerp, lerp3, lookAt, multiply, perspective, project, type Vec3 } from "./math";

const W = 1600;
const H = 900;
const GROUND = -0.06;

type Geometry = { coast: string; grid: string; lanes: string[]; cities: Array<[number, number]>; ships: Array<[number, number]> };

const cache = new Map<RouteFieldVariant, Geometry>();

const poseAt: Record<RouteFieldVariant, number> = { hero: 0, section: 0.3, plan: 0.92 };

function build(variant: RouteFieldVariant): Geometry {
  const cfg = sceneConfig(variant);
  const t = poseAt[variant];
  const eye = lerp3(cfg.wide.eye, cfg.plan.eye, t);
  const target = lerp3(cfg.wide.target, cfg.plan.target, t);
  const vp = multiply(perspective(fovFor(W / H), W / H, 0.05, 30), lookAt(eye, target));
  const pt = (p: Vec3) => {
    const s = project(vp, p, W, H);
    return s.w > 0 ? `${Math.round(s.x)} ${Math.round(s.y)}` : null;
  };
  const path = (pts: Vec3[], close = false) => {
    const out = pts.map(pt).filter((v): v is string => v !== null);
    return out.length > 1 ? `M${out.join("L")}${close ? "Z" : ""}` : "";
  };

  const coast = path(outline.map(([lon, lat]) => {
    const [x, z] = toXZ(lon, lat);
    return [x, GROUND, z] as Vec3;
  }), true);

  const rows: string[] = [];
  for (let k = 0; k <= 14; k++) {
    const z = lerp(EXTENT.z0, EXTENT.z1, k / 14);
    rows.push(path([[EXTENT.x0, GROUND - 0.02, z], [EXTENT.x1, GROUND - 0.02, z]]));
  }
  for (let k = 0; k <= 18; k++) {
    const x = lerp(EXTENT.x0, EXTENT.x1, k / 18);
    rows.push(path([[x, GROUND - 0.02, EXTENT.z0], [x, GROUND - 0.02, EXTENT.z1]]));
  }

  const count = cfg.lanes;
  const arcs: string[] = [];
  const ships: Array<[number, number]> = [];
  const used = new Set<keyof typeof cities>();
  lanes.slice(0, count).forEach(([a, b], idx) => {
    used.add(a);
    used.add(b);
    const [ax, az] = toXZ(cities[a][0], cities[a][1]);
    const [bx, bz] = toXZ(cities[b][0], cities[b][1]);
    const lift = 0.05 + Math.hypot(bx - ax, bz - az) * 0.11;
    const pts: Vec3[] = [];
    for (let s = 0; s <= 16; s++) {
      const u = s / 16;
      pts.push([lerp(ax, bx, u), GROUND + 0.03 + Math.sin(Math.PI * u) * lift, lerp(az, bz, u)]);
    }
    arcs.push(path(pts));
    const u = ((idx * 0.618) % 1) * 0.8 + 0.1;
    const s = project(vp, [lerp(ax, bx, u), GROUND + 0.03 + Math.sin(Math.PI * u) * lift, lerp(az, bz, u)], W, H);
    if (s.w > 0) ships.push([Math.round(s.x), Math.round(s.y)]);
  });

  const dots = Array.from(used).flatMap((c) => {
    const [x, z] = toXZ(cities[c][0], cities[c][1]);
    const s = project(vp, [x, GROUND + 0.02, z], W, H);
    return s.w > 0 ? [[Math.round(s.x), Math.round(s.y)] as [number, number]] : [];
  });

  return { coast, grid: rows.join(""), lanes: arcs, cities: dots, ships };
}

function geometry(variant: RouteFieldVariant) {
  let g = cache.get(variant);
  if (!g) {
    g = build(variant);
    cache.set(variant, g);
  }
  return g;
}

export function RouteFieldPoster({ variant }: { variant: RouteFieldVariant }) {
  const g = geometry(variant);
  const id = `rf-fade-${variant}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full" focusable="false">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.35" stopColor="#fff" stopOpacity="0.6" />
          <stop offset="1" stopColor="#fff" stopOpacity="1" />
        </linearGradient>
        <mask id={`${id}-m`}>
          <rect width={W} height={H} fill={`url(#${id})`} />
        </mask>
      </defs>
      <g mask={`url(#${id}-m)`} fill="none" strokeLinecap="round">
        <path d={g.grid} className="stroke-outline-variant" strokeWidth="1" opacity="0.55" />
        <path d={g.coast} className="fill-primary/[0.035] stroke-primary" strokeWidth="1.5" strokeOpacity="0.45" />
        {g.lanes.map((d, i) => (
          <path key={i} d={d} className="stroke-primary" strokeWidth="2" strokeOpacity="0.55" />
        ))}
        {g.cities.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="3.5" className="fill-primary" />
        ))}
        {g.ships.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="5" className="fill-tertiary" />
        ))}
      </g>
    </svg>
  );
}
