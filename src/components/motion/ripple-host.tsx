"use client";

import { useEffect } from "react";

export function RippleHost() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const el = (e.target as Element | null)?.closest<HTMLElement>(".state-layer");
      if (!el || el.matches(":disabled,[aria-disabled='true'],[data-disabled]")) return;
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      const size = Math.hypot(Math.max(x, r.width - x), Math.max(y, r.height - y));
      el.style.setProperty("--ripple-x", `${x}px`);
      el.style.setProperty("--ripple-y", `${y}px`);
      el.style.setProperty("--ripple-size", `${size}px`);
      el.removeAttribute("data-ripple");
      void el.offsetWidth;
      el.setAttribute("data-ripple", "");
    };
    const onEnd = (e: AnimationEvent) => {
      if (e.animationName === "m3-ripple") (e.target as HTMLElement).removeAttribute("data-ripple");
    };
    document.addEventListener("pointerdown", onDown, { passive: true, capture: true });
    document.addEventListener("animationend", onEnd, true);
    return () => {
      document.removeEventListener("pointerdown", onDown, true);
      document.removeEventListener("animationend", onEnd, true);
    };
  }, []);
  return null;
}
