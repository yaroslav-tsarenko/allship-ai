import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";

export const ease = {
  emphasized: "m3.emphasized",
  decelerate: "m3.decelerate",
  accelerate: "m3.accelerate",
  standard: "m3.standard",
} as const;

let registered = false;

export function registerEases() {
  if (registered || typeof window === "undefined") return;
  registered = true;
  gsap.registerPlugin(CustomEase);
  CustomEase.create(ease.emphasized, "M0,0 C0.05,0 0.133333,0.06 0.166666,0.4 0.208333,0.82 0.25,1 1,1");
  CustomEase.create(ease.decelerate, "0.05,0.7,0.1,1");
  CustomEase.create(ease.accelerate, "0.3,0,0.8,0.15");
  CustomEase.create(ease.standard, "0.2,0,0,1");
}
