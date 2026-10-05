export type Vec3 = [number, number, number];

export function perspective(fovY: number, aspect: number, near: number, far: number) {
  const f = 1 / Math.tan(fovY / 2);
  const nf = 1 / (near - far);
  const m = new Float32Array(16);
  m[0] = f / aspect;
  m[5] = f;
  m[10] = (far + near) * nf;
  m[11] = -1;
  m[14] = 2 * far * near * nf;
  return m;
}

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function lerp3(a: Vec3, b: Vec3, t: number): Vec3 {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

function normalize(a: Vec3): Vec3 {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
}

export function basis(eye: Vec3, target: Vec3) {
  const f = normalize([target[0] - eye[0], target[1] - eye[1], target[2] - eye[2]]);
  const r = normalize([-f[2], 0, f[0]]);
  const u: Vec3 = [r[1] * f[2] - r[2] * f[1], r[2] * f[0] - r[0] * f[2], r[0] * f[1] - r[1] * f[0]];
  return { forward: f, right: r, up: u };
}

export function lookAt(eye: Vec3, target: Vec3) {
  const { forward: f, right: r, up: u } = basis(eye, target);
  const m = new Float32Array(16);
  m[0] = r[0];
  m[4] = r[1];
  m[8] = r[2];
  m[1] = u[0];
  m[5] = u[1];
  m[9] = u[2];
  m[2] = -f[0];
  m[6] = -f[1];
  m[10] = -f[2];
  m[12] = -(r[0] * eye[0] + r[1] * eye[1] + r[2] * eye[2]);
  m[13] = -(u[0] * eye[0] + u[1] * eye[1] + u[2] * eye[2]);
  m[14] = f[0] * eye[0] + f[1] * eye[1] + f[2] * eye[2];
  m[15] = 1;
  return m;
}

export function multiply(a: Float32Array, b: Float32Array) {
  const out = new Float32Array(16);
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 4; r++) {
      let s = 0;
      for (let k = 0; k < 4; k++) s += a[k * 4 + r]! * b[c * 4 + k]!;
      out[c * 4 + r] = s;
    }
  }
  return out;
}

export function project(m: Float32Array, p: Vec3, width: number, height: number) {
  const x = m[0]! * p[0] + m[4]! * p[1] + m[8]! * p[2] + m[12]!;
  const y = m[1]! * p[0] + m[5]! * p[1] + m[9]! * p[2] + m[13]!;
  const w = m[3]! * p[0] + m[7]! * p[1] + m[11]! * p[2] + m[15]!;
  return { x: ((x / w) * 0.5 + 0.5) * width, y: (1 - ((y / w) * 0.5 + 0.5)) * height, w };
}

function fract(x: number) {
  return x - Math.floor(x);
}

function hash(x: number, y: number) {
  return fract(Math.sin(x * 127.1 + y * 311.7) * 43758.5453);
}

function noise(x: number, y: number) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  return lerp(lerp(hash(ix, iy), hash(ix + 1, iy), ux), lerp(hash(ix, iy + 1), hash(ix + 1, iy + 1), ux), uy);
}

export function fbm(x: number, y: number) {
  let v = 0;
  let a = 0.5;
  for (let i = 0; i < 4; i++) {
    v += a * noise(x, y);
    const nx = (0.8 * x - 0.6 * y) * 2.02;
    const ny = (0.6 * x + 0.8 * y) * 2.02;
    x = nx;
    y = ny;
    a *= 0.5;
  }
  return v;
}

export function parseColor(value: string, fallback: Vec3): Vec3 {
  const v = value.trim();
  const hex = v.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)?.[1];
  if (hex) {
    const full = hex.length === 3 ? hex.replace(/./g, "$&$&") : hex;
    const n = parseInt(full, 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }
  const rgb = v.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+))?/i);
  if (rgb && rgb[4] !== undefined && Number(rgb[4]) === 0) return fallback;
  if (rgb) return [Number(rgb[1]) / 255, Number(rgb[2]) / 255, Number(rgb[3]) / 255];
  const srgb = v.match(/^color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/i);
  if (srgb) return [Number(srgb[1]), Number(srgb[2]), Number(srgb[3])];
  return fallback;
}
