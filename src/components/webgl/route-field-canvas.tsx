"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { afterLoadIdle } from "@/lib/idle";
import type { RouteFieldVariant } from "./config";
import type { SceneHandle } from "./engine";

type Connection = { saveData?: boolean; effectiveType?: string };

function blocked(force: boolean) {
  if (force) return false;
  const conn = (navigator as Navigator & { connection?: Connection }).connection;
  if (conn?.saveData || conn?.effectiveType === "2g" || conn?.effectiveType === "slow-2g") return true;
  return /bot|crawler|spider|slurp|google-inspectiontool/i.test(navigator.userAgent);
}

export function RouteFieldCanvas({ variant, intensity, pauseIcon, playIcon }: { variant: RouteFieldVariant; intensity: number; pauseIcon: ReactNode; playIcon: ReactNode }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handle = useRef<SceneHandle | null>(null);
  const [live, setLive] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    if (!canvas || !host) return;
    const params = new URLSearchParams(window.location.search);
    const mode = params.get("webgl");
    if (mode === "off") return;
    const force = mode === "force";
    if (blocked(force)) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const at = params.get("webgl-t");
    const frozenAt = at !== null ? Number(at) || 0 : reduced ? 9 : null;
    const ac = new AbortController();
    const boot = () => {
      void import("./engine")
        .then((m) =>
          m.mountScene(canvas, host, {
            variant,
            intensity,
            frozenAt,
            force,
            signal: ac.signal,
            onReady: () => setLive(frozenAt === null),
            onHalt: () => setLive(false),
          }),
        )
        .then((h) => {
          if (!h) return;
          if (ac.signal.aborted) h.dispose();
          else handle.current = h;
        })
        .catch(() => {});
    };
    let io: IntersectionObserver | null = null;
    const whenNear = (fn: () => void) => {
      if (variant === "hero" || force) return fn();
      io = new IntersectionObserver(
        (entries) => {
          if (!entries.some((e) => e.isIntersecting)) return;
          io?.disconnect();
          io = null;
          fn();
        },
        { rootMargin: "50% 0px" },
      );
      io.observe(host);
    };
    const events = ["pointermove", "pointerdown", "wheel", "scroll", "keydown", "touchstart"] as const;
    let timer = 0;
    let fired = false;
    const once = () => {
      if (fired) return;
      fired = true;
      events.forEach((e) => window.removeEventListener(e, once));
      window.clearTimeout(timer);
      if (!ac.signal.aborted) whenNear(boot);
    };
    const cancel = afterLoadIdle(() => {
      if (force) return once();
      events.forEach((e) => window.addEventListener(e, once, { passive: true, once: true }));
      timer = window.setTimeout(once, 6000);
    }, 2500);
    return () => {
      ac.abort();
      cancel();
      io?.disconnect();
      events.forEach((e) => window.removeEventListener(e, once));
      window.clearTimeout(timer);
      handle.current?.dispose();
      handle.current = null;
      setLive(false);
      setPaused(false);
    };
  }, [variant, intensity]);

  const toggle = () => {
    const next = !paused;
    setPaused(next);
    handle.current?.setPaused(next);
  };

  return (
    <>
      <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 block size-full opacity-0 transition-opacity duration-700 ease-standard data-[ready=true]:opacity-100" />
      {live && (
        <button
          type="button"
          onClick={toggle}
          aria-pressed={paused}
          title={paused ? "Play background animation" : "Pause background animation"}
          className="state-layer pointer-events-auto absolute right-3 bottom-3 z-[2] inline-flex size-9 cursor-pointer items-center justify-center rounded-full border border-outline-variant bg-surface/80 text-on-surface-variant medium:right-6 medium:bottom-6"
        >
          {paused ? playIcon : pauseIcon}
          <span className="sr-only">{paused ? "Play background animation" : "Pause background animation"}</span>
        </button>
      )}
    </>
  );
}
