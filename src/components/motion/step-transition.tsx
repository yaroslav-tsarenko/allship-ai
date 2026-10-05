"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";

const DECELERATE = "cubic-bezier(0.05, 0.7, 0.1, 1)";

export function StepTransition({ stepKey, direction = 1, children, className }: { stepKey: string | number; direction?: 1 | -1; children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const previous = useRef(stepKey);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || previous.current === stepKey) return;
    previous.current = stepKey;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const animation = el.animate(
      [
        { opacity: 0, transform: `translateX(${24 * direction}px)` },
        { opacity: 1, transform: "none" },
      ],
      { duration: 400, easing: DECELERATE },
    );
    return () => animation.cancel();
  }, [stepKey, direction]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
