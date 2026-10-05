import { fbm, type Vec3 } from "./math";

export const EXTENT = { x0: -4.6, x1: 4.6, z0: -5.0, z1: 2.2 } as const;
export const FIELD_W = 224;
export const FIELD_H = 176;

export function toXZ(lon: number, lat: number): [number, number] {
  return [(lon + 96) * 0.119, -1.2 - (lat - 37.5) * 0.151];
}

export const outline: Array<[number, number]> = [
  [-124.7, 48.4], [-124.0, 46.3], [-124.1, 43.0], [-124.4, 40.4], [-123.4, 38.6], [-122.4, 37.2], [-121.9, 36.3], [-120.6, 34.6],
  [-118.5, 34.0], [-117.1, 32.5], [-114.7, 32.7], [-111.0, 31.3], [-108.2, 31.3], [-106.5, 31.8], [-104.5, 29.6], [-103.0, 29.0],
  [-101.4, 29.8], [-99.5, 27.5], [-97.4, 25.9], [-97.2, 27.6], [-96.0, 28.6], [-94.0, 29.6], [-91.5, 29.4], [-89.4, 29.0],
  [-89.6, 30.2], [-88.0, 30.4], [-86.0, 30.4], [-84.3, 29.9], [-83.0, 29.1], [-82.6, 27.5], [-81.7, 25.9], [-80.4, 25.2],
  [-80.1, 26.7], [-80.6, 28.4], [-81.4, 30.7], [-81.1, 32.0], [-79.2, 33.2], [-77.9, 34.0], [-75.5, 35.3], [-76.0, 36.9],
  [-75.1, 38.8], [-74.0, 40.6], [-71.9, 41.3], [-70.0, 41.7], [-70.7, 42.6], [-70.2, 43.7], [-68.0, 44.4], [-67.0, 44.8],
  [-67.8, 47.1], [-69.2, 47.4], [-70.9, 45.3], [-74.7, 45.0], [-76.4, 44.2], [-79.0, 43.3], [-82.5, 42.0], [-82.4, 45.4],
  [-84.5, 46.5], [-88.0, 48.0], [-89.6, 48.0], [-95.2, 49.0], [-123.0, 49.0], [-123.3, 48.3],
];

const lakes: Array<Array<[number, number]>> = [
  [[-87.8, 41.7], [-87.0, 41.7], [-86.2, 42.5], [-86.4, 44.0], [-85.6, 45.5], [-86.7, 45.9], [-87.6, 44.8], [-87.9, 43.0]],
  [[-92.1, 46.7], [-90.0, 46.6], [-87.0, 46.5], [-84.6, 46.5], [-84.9, 47.0], [-86.5, 47.6], [-89.5, 48.0], [-91.0, 47.5]],
];

const ranges: Array<{ pts: Array<[number, number]>; width: number; strength: number }> = [
  { pts: [[-114, 48.8], [-112.5, 46], [-110.5, 44.5], [-107, 40.5], [-106, 38.5], [-105.5, 36], [-106, 33.5]], width: 0.32, strength: 1 },
  { pts: [[-121.5, 48.5], [-121.8, 46], [-122, 43], [-121.5, 41], [-119.5, 38], [-118.2, 36]], width: 0.17, strength: 0.78 },
  { pts: [[-116.5, 44.8], [-114.5, 42.5], [-112, 39.5], [-111.5, 37]], width: 0.22, strength: 0.5 },
  { pts: [[-84.5, 34], [-82, 36], [-79.5, 38.5], [-77.5, 40.5], [-74.5, 42], [-72.5, 44], [-70, 45.5]], width: 0.2, strength: 0.46 },
  { pts: [[-94.5, 36.2], [-92, 36.8]], width: 0.18, strength: 0.16 },
];

export const cities = {
  la: [-118.24, 34.05], sf: [-122.27, 37.8], sea: [-122.33, 47.61], pdx: [-122.68, 45.52], phx: [-112.07, 33.45],
  slc: [-111.89, 40.76], den: [-104.99, 39.74], dal: [-96.8, 32.78], hou: [-95.37, 29.76], kc: [-94.58, 39.1],
  chi: [-87.63, 41.88], mem: [-90.05, 35.15], atl: [-84.39, 33.75], mia: [-80.19, 25.76], clt: [-80.84, 35.23],
  nyc: [-74.0, 40.71], cmh: [-82.99, 39.96], elp: [-106.44, 31.76], msp: [-93.27, 44.98], jax: [-81.66, 30.33],
} as const satisfies Record<string, readonly [number, number]>;

type City = keyof typeof cities;

export const lanes: Array<[City, City]> = [
  ["la", "phx"], ["chi", "nyc"], ["dal", "atl"], ["sea", "slc"], ["den", "kc"], ["hou", "mem"], ["atl", "nyc"], ["la", "slc"],
  ["kc", "chi"], ["phx", "dal"], ["sf", "la"], ["mia", "jax"], ["msp", "chi"], ["slc", "den"], ["mem", "cmh"], ["elp", "dal"],
  ["sea", "pdx"], ["jax", "clt"],
];

function pointInPolygon(x: number, z: number, poly: Array<[number, number]>) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i]!;
    const [xj, zj] = poly[j]!;
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
}

function segDist(px: number, pz: number, a: [number, number], b: [number, number]) {
  const dx = b[0] - a[0];
  const dz = b[1] - a[1];
  const t = Math.max(0, Math.min(1, ((px - a[0]) * dx + (pz - a[1]) * dz) / (dx * dx + dz * dz || 1)));
  return Math.hypot(px - (a[0] + dx * t), pz - (a[1] + dz * t));
}

function blur(src: Float32Array, w: number, h: number, r: number) {
  const tmp = new Float32Array(src.length);
  const out = new Float32Array(src.length);
  const n = r * 2 + 1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let s = 0;
      for (let k = -r; k <= r; k++) s += src[y * w + Math.min(w - 1, Math.max(0, x + k))]!;
      tmp[y * w + x] = s / n;
    }
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let s = 0;
      for (let k = -r; k <= r; k++) s += tmp[Math.min(h - 1, Math.max(0, y + k)) * w + x]!;
      out[y * w + x] = s / n;
    }
  }
  return out;
}

const smooth = (e0: number, e1: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

export type Field = { data: Uint8Array; w: number; h: number };

const yieldToMain = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

export async function buildField(alive: () => boolean): Promise<Field | null> {
  const w = FIELD_W;
  const h = FIELD_H;
  const poly = outline.map(([lon, lat]) => toXZ(lon, lat));
  const lakePolys = lakes.map((l) => l.map(([lon, lat]) => toXZ(lon, lat)));
  const rangePolys = ranges.map((r) => ({ ...r, pts: r.pts.map(([lon, lat]) => toXZ(lon, lat)) }));
  const land = new Float32Array(w * h);
  const elev = new Float32Array(w * h);
  const westX = toXZ(-105, 0)[0];
  const plainsX = toXZ(-97, 0)[0];
  const coastX = toXZ(-121, 0)[0];
  const valleyX = toXZ(-118, 0)[0];
  for (let j = 0; j < h; j++) {
    if (j % 22 === 21) {
      await yieldToMain();
      if (!alive()) return null;
    }
    const z = EXTENT.z0 + ((j + 0.5) / h) * (EXTENT.z1 - EXTENT.z0);
    for (let i = 0; i < w; i++) {
      const x = EXTENT.x0 + ((i + 0.5) / w) * (EXTENT.x1 - EXTENT.x0);
      const k = j * w + i;
      const on = pointInPolygon(x, z, poly) && !lakePolys.some((p) => pointInPolygon(x, z, p));
      land[k] = on ? 1 : 0;
      let e = 0;
      for (const r of rangePolys) {
        let d = Infinity;
        for (let s = 0; s < r.pts.length - 1; s++) d = Math.min(d, segDist(x, z, r.pts[s]!, r.pts[s + 1]!));
        e = Math.max(e, r.strength * Math.exp(-(d * d) / (r.width * r.width)));
      }
      const west = smooth(plainsX, westX, x) * (1 - smooth(valleyX, coastX, x));
      elev[k] = Math.min(1, e + west * 0.3);
    }
  }
  await yieldToMain();
  if (!alive()) return null;
  const softLand = blur(blur(land, w, h, 2), w, h, 1);
  const softElev = blur(elev, w, h, 1);
  const data = new Uint8Array(w * h * 2);
  for (let k = 0; k < w * h; k++) {
    data[k * 2] = Math.round(softLand[k]! * 255);
    data[k * 2 + 1] = Math.round(Math.min(1, softElev[k]! * softLand[k]!) * 255);
  }
  return { data, w, h };
}

export function sampleField(f: Field, x: number, z: number): [number, number] {
  const u = ((x - EXTENT.x0) / (EXTENT.x1 - EXTENT.x0)) * f.w - 0.5;
  const v = ((z - EXTENT.z0) / (EXTENT.z1 - EXTENT.z0)) * f.h - 0.5;
  const i0 = Math.max(0, Math.min(f.w - 1, Math.floor(u)));
  const j0 = Math.max(0, Math.min(f.h - 1, Math.floor(v)));
  const i1 = Math.min(f.w - 1, i0 + 1);
  const j1 = Math.min(f.h - 1, j0 + 1);
  const tu = Math.max(0, Math.min(1, u - i0));
  const tv = Math.max(0, Math.min(1, v - j0));
  const at = (i: number, j: number, c: number) => f.data[(j * f.w + i) * 2 + c]! / 255;
  const mix = (c: number) => (at(i0, j0, c) * (1 - tu) + at(i1, j0, c) * tu) * (1 - tv) + (at(i0, j1, c) * (1 - tu) + at(i1, j1, c) * tu) * tv;
  return [mix(0), mix(1)];
}

export function heightAt(f: Field, x: number, z: number, t: number) {
  const [land, elev] = sampleField(f, x, z);
  const n = fbm(x * 0.9, z * 0.9 + t * 0.02);
  const rough = fbm(x * 2.07 + 7.1, z * 2.07 + 7.1);
  return land * (0.1 + elev * (0.55 + 0.45 * rough) + n * 0.16) + (1 - land) * (n * 0.05 - 0.02);
}

export const HEIGHT_BIAS = 0.2;

export type Lane = { points: Vec3[]; tangents: Vec3[]; speed: number; phase: number; length: number };

export function buildLanes(f: Field, count: number, amp: number, curve: (x: number, z: number) => number, samples = 48): Lane[] {
  return lanes.slice(0, count).map(([a, b], idx) => {
    const [ax, az] = toXZ(cities[a][0], cities[a][1]);
    const [bx, bz] = toXZ(cities[b][0], cities[b][1]);
    const dist = Math.hypot(bx - ax, bz - az);
    const lift = 0.05 + dist * 0.11;
    const points: Vec3[] = [];
    for (let s = 0; s <= samples; s++) {
      const t = s / samples;
      const x = ax + (bx - ax) * t;
      const z = az + (bz - az) * t;
      const ground = (heightAt(f, x, z, 0) - HEIGHT_BIAS) * amp + curve(x, z);
      const ends = (1 - t) * ((heightAt(f, ax, az, 0) - HEIGHT_BIAS) * amp) + t * ((heightAt(f, bx, bz, 0) - HEIGHT_BIAS) * amp) + curve(x, z);
      const y = Math.max(ground + 0.025, ends + 0.02 + Math.sin(Math.PI * t) * lift);
      points.push([x, y, z]);
    }
    const tangents = points.map((p, i) => {
      const prev = points[Math.max(0, i - 1)]!;
      const next = points[Math.min(points.length - 1, i + 1)]!;
      return [next[0] - prev[0], next[1] - prev[1], next[2] - prev[2]] as Vec3;
    });
    let length = 0;
    for (let i = 1; i < points.length; i++) length += Math.hypot(points[i]![0] - points[i - 1]![0], points[i]![1] - points[i - 1]![1], points[i]![2] - points[i - 1]![2]);
    const speed = 0.11 / Math.max(0.6, length) * (0.8 + ((idx * 37) % 10) / 25);
    return { points, tangents, speed, phase: ((idx * 0.618) % 1 + 1) % 1, length };
  });
}

export function laneHead(lane: Lane, time: number, k: number, speed = 1) {
  return (((time * lane.speed * speed + lane.phase + k * 0.5) % 1) + 1) % 1;
}

export function pointOnLane(lane: Lane, t: number): Vec3 {
  const f = t * (lane.points.length - 1);
  const i = Math.min(lane.points.length - 2, Math.floor(f));
  const u = f - i;
  const a = lane.points[i]!;
  const b = lane.points[i + 1]!;
  return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];
}

export function cityPoints(f: Field, amp: number, curve: (x: number, z: number) => number, used: City[]): Vec3[] {
  return used.map((c) => {
    const [x, z] = toXZ(cities[c][0], cities[c][1]);
    return [x, (heightAt(f, x, z, 0) - HEIGHT_BIAS) * amp + curve(x, z) + 0.02, z];
  });
}

export function citiesForLanes(count: number): City[] {
  return Array.from(new Set(lanes.slice(0, count).flat()));
}
