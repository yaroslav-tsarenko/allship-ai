"use client";

import { useRef, type ComponentPropsWithoutRef, type ElementType } from "react";
import { duration, ease, gsap, inInitialViewport, MOTION_OK, useGSAP } from "./gsap";

type RevealProps<T extends ElementType> = { as?: T; stagger?: number; delay?: number; y?: number } & ComponentPropsWithoutRef<T>;

export function Reveal<T extends ElementType = "div">({ as, stagger, delay = 0, y = 16, children, ...rest }: RevealProps<T>) {
  const Tag = (as ?? "div") as ElementType;
  const ref = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const targets = stagger ? Array.from(el.children) : [el];
        if (!targets.length) return;
        gsap.from(targets, {
          opacity: 0,
          y,
          duration: duration.long2,
          delay,
          stagger: stagger ?? 0,
          ease: ease.decelerate,
          clearProps: "opacity,transform",
          scrollTrigger: inInitialViewport(el) ? undefined : { trigger: el, start: "top 85%", once: true },
        });
      });
      el.setAttribute("data-motion-ready", "");
      return () => mm.revert();
    },
    { scope: ref },
  );
  return (
    <Tag ref={ref} data-motion-reveal="" {...rest}>
      {children}
    </Tag>
  );
}
