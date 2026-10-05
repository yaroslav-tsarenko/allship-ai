"use client";

import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef, type ReactNode } from "react";

export function RouteFade({ children, className }: { children: ReactNode; className?: string }) {
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);
  const previous = useRef(pathname);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || previous.current === pathname) return;
    previous.current = pathname;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const animation = el.animate(
      [
        { opacity: 0, transform: "translateY(8px)" },
        { opacity: 1, transform: "none" },
      ],
      { duration: 300, easing: "cubic-bezier(0.05, 0.7, 0.1, 1)" },
    );
    return () => animation.cancel();
  }, [pathname]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
