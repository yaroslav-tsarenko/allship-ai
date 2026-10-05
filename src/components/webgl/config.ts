import type { Vec3 } from "./math";

export type RouteFieldVariant = "hero" | "section" | "plan";

export type Pose = { eye: Vec3; target: Vec3 };

export type SceneConfig = {
  lanes: number;
  amp: number;
  levels: number;
  contrast: number;
  laneAlpha: number;
  curve: Vec3;
  wide: Pose;
  tall: Pose;
  plan: Pose;
  fog: [number, number];
  speed: number;
  probe: number;
  scroll: "past" | "through";
  range: [number, number];
};

const FOV = (36 * Math.PI) / 180;

export function fovFor(aspect: number) {
  return aspect >= 1 ? FOV : Math.min((70 * Math.PI) / 180, 2 * Math.atan(Math.tan((24 * Math.PI) / 180) / aspect));
}

const network = {
  wide: { eye: [0, 2.35, 2.2], target: [0, -0.35, -1.35] },
  tall: { eye: [0.7, 3.4, 1.45], target: [0.7, -0.4, -1.15] },
  plan: { eye: [0, 6.2, -0.75], target: [0, 0, -1.35] },
} satisfies Record<"wide" | "tall" | "plan", Pose>;

export function sceneConfig(variant: RouteFieldVariant, intensity = 1): SceneConfig {
  const i = Math.max(0, Math.min(1, intensity));
  const base = {
    amp: 0.7 + 0.3 * i,
    levels: 26,
    curve: [0, 0, -1.2] as Vec3,
    fog: [2.8, 7.4] as [number, number],
    speed: 0.6 + 0.4 * i,
    ...network,
  };
  if (variant === "section") {
    return {
      ...base,
      lanes: Math.round(8 + 6 * i),
      contrast: 0.35 + 0.35 * i,
      laneAlpha: 0.55 + 0.35 * i,
      probe: 0.7,
      scroll: "through",
      range: [0.05, 0.55],
    };
  }
  if (variant === "plan") {
    return {
      ...base,
      lanes: Math.round(12 + 6 * i),
      contrast: 0.4 + 0.4 * i,
      laneAlpha: 0.7 + 0.3 * i,
      probe: 0.8,
      scroll: "through",
      range: [0.82, 1],
    };
  }
  return {
    ...base,
    lanes: Math.round(10 + 8 * i),
    contrast: 0.5 + 0.4 * i,
    laneAlpha: 0.7 + 0.3 * i,
    probe: 1,
    scroll: "past",
    range: [0, 0.85],
  };
}

export function curveFn(curve: Vec3) {
  return (x: number, z: number) => -curve[0] * ((x - curve[1]) ** 2 + (z - curve[2]) ** 2);
}
