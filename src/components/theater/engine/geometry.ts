import type { DeviceKind, EaseName } from "../types";

export type Point = { x: number; y: number };
export type Rect = { left: number; top: number; width: number; height: number };

export type FrameVars = {
  fw: number;
  fh: number;
  fc: number;
  fb: number;
  fr: number;
  sr: number;
  pm: number;
  isl: number;
  sb: number;
};

export const devicePresets: Record<DeviceKind, FrameVars> = {
  desktop: { fw: 1200, fh: 720, fc: 44, fb: 0, fr: 12, sr: 0, pm: 0, isl: 0, sb: 0 },
  tablet: { fw: 820, fh: 1080, fc: 0, fb: 14, fr: 34, sr: 22, pm: 1, isl: 0, sb: 28 },
  phone: { fw: 390, fh: 800, fc: 0, fb: 12, fr: 54, sr: 42, pm: 1, isl: 1, sb: 44 },
};

export const barePresets: Record<"desktop" | "phone", FrameVars> = {
  desktop: { fw: 1200, fh: 600, fc: 0, fb: 0, fr: 0, sr: 0, pm: 0, isl: 0, sb: 0 },
  phone: { fw: 390, fh: 720, fc: 0, fb: 0, fr: 0, sr: 0, pm: 0, isl: 0, sb: 0 },
};

export function presetFor(device: DeviceKind, bare: boolean): FrameVars {
  return bare ? barePresets[device === "phone" ? "phone" : "desktop"] : devicePresets[device];
}

export function frameStyle(v: FrameVars): Record<string, string> {
  return {
    "--fw": String(v.fw),
    "--fh": String(v.fh),
    "--fc": String(v.fc),
    "--fb": String(v.fb),
    "--fr": String(v.fr),
    "--sr": String(v.sr),
    "--pm": String(v.pm),
    "--isl": String(v.isl),
    "--sb": String(v.sb),
  };
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function mixVars(a: FrameVars, b: FrameVars, t: number): FrameVars {
  const out = { ...a };
  for (const k of Object.keys(a) as (keyof FrameVars)[]) out[k] = lerp(a[k], b[k], t);
  return out;
}

export const eases: Record<EaseName, (t: number) => number> = {
  linear: (t) => t,
  in: (t) => t * t * t,
  out: (t) => 1 - Math.pow(1 - t, 3),
  inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
};

export function cursorEase(p: number) {
  if (p <= 0) return 0;
  if (p >= 1) return 1;
  const split = 0.84;
  const peak = 1.025;
  if (p < split) return eases.inOut(p / split) * peak;
  const t = (p - split) / (1 - split);
  return peak - (peak - 1) * (1 - Math.pow(1 - t, 2));
}

export function arcControls(a: Point, b: Point, bend: number): [Point, Point] {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dist = Math.hypot(dx, dy) || 1;
  const nx = -dy / dist;
  const ny = dx / dist;
  const off = Math.min(110, dist * 0.16) * bend;
  return [
    { x: a.x + dx * 0.28 + nx * off, y: a.y + dy * 0.28 + ny * off },
    { x: a.x + dx * 0.74 + nx * off * 0.55, y: a.y + dy * 0.74 + ny * off * 0.55 },
  ];
}

export function bezierPoint(a: Point, c1: Point, c2: Point, b: Point, t: number): Point {
  const u = 1 - t;
  return {
    x: u * u * u * a.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * b.x,
    y: u * u * u * a.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * b.y,
  };
}

export function aimPoint(rect: Rect): Point {
  const fx = rect.width > 220 ? Math.min(0.5, 110 / rect.width) : 0.5;
  return { x: rect.left + rect.width * fx, y: rect.top + rect.height * 0.55 };
}

export function travelMs(from: Point, to: Point) {
  const d = Math.hypot(to.x - from.x, to.y - from.y);
  if (d < 2) return 0;
  return Math.round(Math.min(950, Math.max(420, 340 + d * 0.55)));
}

export function charDelay(ch: string, i: number, base: number) {
  const jitter = (((Math.sin(i * 12.9898) * 43758.5453) % 1) + 1) % 1;
  const pause = ch === " " ? 1.7 : ch === "," || ch === "." ? 2.6 : 1;
  return base * (0.7 + jitter * 0.6) * pause;
}

export const timing = {
  lead: 450,
  press: 120,
  release: 240,
  char: 55,
  stream: 16,
  scroll: 560,
  highlight: 1700,
  highlightGap: 260,
  device: 1250,
  tail: 2200,
  fade: 380,
} as const;
