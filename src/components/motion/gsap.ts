"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ease, registerEases } from "./eases";

export const duration = {
  short2: 0.1,
  short3: 0.15,
  short4: 0.2,
  medium2: 0.3,
  medium3: 0.35,
  medium4: 0.4,
  long2: 0.5,
  long4: 0.6,
} as const;

export const MOTION_OK = "(prefers-reduced-motion: no-preference)";

let registered = false;

export function registerMotion() {
  if (registered || typeof window === "undefined") return;
  registered = true;
  gsap.registerPlugin(useGSAP, ScrollTrigger);
  registerEases();
  gsap.defaults({ ease: ease.decelerate, duration: duration.long2 });
}

registerMotion();

export function inInitialViewport(el: Element) {
  const r = el.getBoundingClientRect();
  return r.top < window.innerHeight && r.bottom > 0;
}

export { ease, gsap, ScrollTrigger, useGSAP };
