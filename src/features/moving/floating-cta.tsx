"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

export function FloatingQuoteButton({ targetId }: { targetId: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const target = document.getElementById(targetId);
    if (!target) return;
    const io = new IntersectionObserver(([entry]) => setVisible(entry ? !entry.isIntersecting && entry.boundingClientRect.top < 0 : false), { threshold: 0 });
    io.observe(target);
    return () => io.disconnect();
  }, [targetId]);

  const go = () => {
    const target = document.getElementById(targetId);
    if (!target) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    window.setTimeout(() => target.querySelector<HTMLInputElement>("input")?.focus({ preventScroll: true }), reduce ? 0 : 450);
  };

  return (
    <button
      type="button"
      onClick={go}
      tabIndex={visible ? 0 : -1}
      aria-hidden={!visible}
      className={cn(
        "state-layer fixed right-4 bottom-4 z-40 inline-flex h-14 cursor-pointer items-center rounded-lg bg-primary-container px-6 text-title-md font-medium text-on-primary-container shadow-elevation-3 transition-[opacity,translate,border-radius] duration-(--duration-medium2) ease-standard active:rounded-md medium:right-6 medium:bottom-8",
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0",
      )}
    >
      Get a free quote
    </button>
  );
}
