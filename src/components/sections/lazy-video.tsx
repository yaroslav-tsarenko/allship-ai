"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

const playPath = "M320-258v-450q0-14 9-22t21-8q4 0 8 1t8 3l354 226q7 5 10.5 11t3.5 14q0 8-3.5 14T720-458L366-232q-4 2-8 3t-8 1q-12 0-21-8t-9-22Zm60-225Zm0 171 269-171-269-171v342Z";
const pausePath = "M585-200q-24.75 0-42.37-17.63Q525-235.25 525-260v-440q0-24.75 17.63-42.38Q560.25-760 585-760h115q24.75 0 42.38 17.62Q760-724.75 760-700v440q0 24.75-17.62 42.37Q724.75-200 700-200H585Zm-325 0q-24.75 0-42.37-17.63Q200-235.25 200-260v-440q0-24.75 17.63-42.38Q235.25-760 260-760h115q24.75 0 42.38 17.62Q435-724.75 435-700v440q0 24.75-17.62 42.37Q399.75-200 375-200H260Zm325-60h115v-440H585v440Zm-325 0h115v-440H260v440Zm0-440v440-440Zm325 0v440-440Z";

export function LazyVideo({ src, poster, width, height, label, className, loop = true }: { src: string; poster: string; width: number; height: number; label: string; className?: string; loop?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const userPaused = useRef(false);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (entry.isIntersecting && !userPaused.current) void video.play().catch(() => {});
        else if (!entry.isIntersecting) video.pause();
      },
      { threshold: 0.35 },
    );
    io.observe(video);
    return () => io.disconnect();
  }, []);

  const toggle = () => {
    const video = ref.current;
    if (!video) return;
    if (video.paused) {
      userPaused.current = false;
      void video.play().catch(() => {});
    } else {
      userPaused.current = true;
      video.pause();
    }
  };

  return (
    <div className={cn("relative isolate overflow-hidden bg-surface-container", className)}>
      <video
        ref={ref}
        src={src}
        poster={poster}
        width={width}
        height={height}
        muted
        playsInline
        loop={loop}
        preload="none"
        aria-label={label}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        className="block h-full w-full object-cover"
      />
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? `Pause ${label}` : `Play ${label}`}
        title={playing ? "Pause" : "Play"}
        className="state-layer absolute right-3 bottom-3 inline-flex size-10 cursor-pointer items-center justify-center rounded-[20px] bg-inverse-surface/80 text-inverse-on-surface transition-[border-radius] duration-(--duration-short4) active:rounded-[12px]"
      >
        <svg viewBox="0 -960 960 960" width={24} height={24} fill="currentColor" aria-hidden="true" focusable="false">
          <path d={playing ? pausePath : playPath} />
        </svg>
      </button>
    </div>
  );
}
