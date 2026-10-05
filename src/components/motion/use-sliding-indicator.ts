"use client";

import { useLayoutEffect, useRef, type RefObject } from "react";

export function useSlidingIndicator(
  containerRef: RefObject<HTMLElement | null>,
  indicatorRef: RefObject<HTMLElement | null>,
  activeKey: string | null,
  selector = "[data-indicator-target][data-active]",
) {
  const placed = useRef(false);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const indicator = indicatorRef.current;
    if (!container || !indicator) return;
    const measure = (instant: boolean) => {
      const target = container.querySelector<HTMLElement>(selector);
      const c = container.getBoundingClientRect();
      if (!target || c.width === 0) {
        indicator.style.opacity = "0";
        placed.current = false;
        if (!target) container.setAttribute("data-indicator-ready", "");
        return;
      }
      const t = target.getBoundingClientRect();
      const skip = instant || !placed.current;
      if (skip) indicator.style.transition = "none";
      indicator.style.width = `${t.width}px`;
      indicator.style.height = `${t.height}px`;
      indicator.style.transform = `translate(${t.left - c.left}px, ${t.top - c.top}px)`;
      indicator.style.opacity = "1";
      if (skip) {
        void indicator.offsetWidth;
        indicator.style.transition = "";
      }
      placed.current = true;
      container.setAttribute("data-indicator-ready", "");
    };
    measure(false);
    let initial = true;
    const ro = new ResizeObserver(() => {
      if (initial) {
        initial = false;
        return;
      }
      measure(true);
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, [containerRef, indicatorRef, activeKey, selector]);
}
