"use client";

import { Children, useCallback, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/cn";

const prevPath = "m406-481 177 177q9 9 8.5 21t-9.5 21q-9 9-21.5 9t-21.5-9L341-460q-5-5-7-10t-2-11q0-6 2-11t7-10l199-199q9-9 21.5-9t21.5 9q9 9 9 21.5t-9 21.5L406-481Z";
const nextPath = "M530-481 353-658q-9-9-8.5-21t9.5-21q9-9 21.5-9t21.5 9l198 198q5 5 7 10t2 11q0 6-2 11t-7 10L396-261q-9 9-21 8.5t-21-9.5q-9-9-9-21.5t9-21.5l176-176Z";

function Arrow({ d }: { d: string }) {
  return (
    <svg viewBox="0 -960 960 960" width={24} height={24} fill="currentColor" aria-hidden="true" focusable="false">
      <path d={d} />
    </svg>
  );
}

export function Carousel({ label, children, slideClassName, className }: { label: string; children: ReactNode; slideClassName?: string; className?: string }) {
  const slides = Children.toArray(children);
  const count = slides.length;
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const items = Array.from(track.children) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setIndex(items.indexOf(visible.target as HTMLElement));
      },
      { root: track, threshold: [0.6] },
    );
    items.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [count]);

  const go = useCallback(
    (i: number) => {
      const track = trackRef.current;
      const target = track?.children[(i + count) % count] as HTMLElement | undefined;
      if (!track || !target) return;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      track.scrollTo({ left: target.offsetLeft - track.offsetLeft, behavior: reduce ? "auto" : "smooth" });
    },
    [count],
  );

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      go(index + 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      go(index - 1);
    }
  };

  const button =
    "state-layer inline-flex size-12 cursor-pointer items-center justify-center rounded-[24px] bg-surface-container-high text-on-surface transition-[border-radius] duration-(--duration-short4) active:rounded-[14px]";

  return (
    <div role="region" aria-roledescription="carousel" aria-label={label} onKeyDown={onKeyDown} className={className}>
      <div ref={trackRef} tabIndex={0} className="relative flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {slides.map((slide, i) => (
          <div key={i} role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${count}`} className={cn("shrink-0 snap-start", slideClassName ?? "w-[88%] medium:w-[70%] large:w-[58%]")}>
            {slide}
          </div>
        ))}
      </div>
      {count > 1 && (
        <div className="mt-6 flex items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Choose slide">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Show slide ${i + 1}`}
                aria-current={i === index ? "true" : undefined}
                onClick={() => go(i)}
                className="relative h-2 w-2 cursor-pointer rounded-full bg-outline-variant transition-[width,background-color] duration-(--duration-medium2) ease-standard before:absolute before:-inset-3 before:content-[''] aria-[current=true]:w-6 aria-[current=true]:bg-primary"
              />
            ))}
          </div>
          <p className="sr-only" aria-live="polite">
            Slide {index + 1} of {count}
          </p>
          <div className="flex gap-2">
            <button type="button" className={button} aria-label="Previous slide" title="Previous" onClick={() => go(index - 1)}>
              <Arrow d={prevPath} />
            </button>
            <button type="button" className={button} aria-label="Next slide" title="Next" onClick={() => go(index + 1)}>
              <Arrow d={nextPath} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
