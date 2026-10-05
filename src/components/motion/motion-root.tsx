"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { afterLoadIdle } from "@/lib/idle";
import { sizeDeferredSections } from "./cv-sizing";

const BOT = /bot|crawler|spider|slurp|google-inspectiontool|mediapartners/i;
const GSAP_ONLY = "[data-scrub],[data-pin],[data-progress]";
const CSS_FIRST = "[data-speed],[data-out]";

function motionAllowed() {
  return !window.matchMedia("(prefers-reduced-motion: reduce)").matches && !BOT.test(navigator.userAgent);
}

function desktopPointer() {
  return window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 840px)").matches && navigator.maxTouchPoints === 0;
}

function scrollTimelines() {
  return typeof CSS !== "undefined" && CSS.supports("animation-timeline: view()");
}

export function MotionRoot({ smooth = true }: { smooth?: boolean }) {
  const pathname = usePathname();

  useEffect(() => {
    if (!smooth || !motionAllowed() || !desktopPointer()) return;
    let cancelled = false;
    const cancelIdle = afterLoadIdle(() => {
      void import("./smooth-scroll").then((m) => {
        if (!cancelled) m.startSmoothScroll();
      });
    }, 2000);
    return () => {
      cancelled = true;
      cancelIdle();
      void import("./smooth-scroll").then((m) => m.stopSmoothScroll());
    };
  }, [smooth]);

  useEffect(() => {
    let stop = () => {};
    const cancelIdle = afterLoadIdle(() => {
      stop = sizeDeferredSections();
    }, 2000);
    return () => {
      cancelIdle();
      stop();
    };
  }, [pathname]);

  useEffect(() => {
    if (!motionAllowed()) return;
    const main = document.getElementById("main");
    if (!main) return;
    main.querySelectorAll<HTMLElement>("[data-speed]").forEach((el) => el.style.setProperty("--speed", el.dataset.speed || "0"));
    main.querySelectorAll<HTMLElement>("[data-out]").forEach((el) => el.style.setProperty("--out", el.dataset.out || "0.4"));
    const stops: Array<() => void> = [];
    let cancelled = false;
    const keep = (stop: () => void) => (cancelled ? stop() : stops.push(stop));
    const cancelIdle = afterLoadIdle(() => {
      void import("./motion-runtime").then((m) => keep(m.startMotion(main)));
      const native = scrollTimelines();
      const startFx = () => void import("./scroll-effects").then((m) => keep(m.startScrollEffects(main, native)));
      const targets = main.querySelectorAll(GSAP_ONLY);
      if (!native && main.querySelector(CSS_FIRST)) startFx();
      else if (targets.length) {
        const io = new IntersectionObserver(
          (entries) => {
            if (!entries.some((e) => e.isIntersecting)) return;
            io.disconnect();
            startFx();
          },
          { rootMargin: "100% 0px" },
        );
        targets.forEach((el) => io.observe(el));
        keep(() => io.disconnect());
      }
      if (main.querySelector("[data-magnetic]") && desktopPointer()) void import("./magnetic").then((m) => keep(m.startMagnetic(main)));
    }, 1500);
    return () => {
      cancelled = true;
      cancelIdle();
      stops.forEach((stop) => stop());
    };
  }, [pathname]);

  return null;
}
