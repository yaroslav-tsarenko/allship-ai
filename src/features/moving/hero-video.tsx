"use client";

import { useEffect, useRef, useState } from "react";

const playPath = "M320-258v-450q0-14 9-22t21-8q4 0 8 1t8 3l354 226q7 5 10.5 11t3.5 14q0 8-3.5 14T720-458L366-232q-4 2-8 3t-8 1q-12 0-21-8t-9-22Z";
const pausePath = "M585-200q-25 0-42-18t-18-42v-440q0-25 18-42t42-18h115q25 0 42 18t18 42v440q0 24-18 42t-42 18H585Zm-325 0q-25 0-42-18t-18-42v-440q0-25 18-42t42-18h115q25 0 42 18t18 42v440q0 24-18 42t-42 18H260Z";

export function HeroVideo({ src, poster }: { src: string; poster: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const userPaused = useRef(false);

  useEffect(() => {
    const video = ref.current;
    if (!video || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting && !userPaused.current) void video.play().catch(() => {});
      else if (!entry?.isIntersecting) video.pause();
    });
    io.observe(video);
    return () => io.disconnect();
  }, []);

  const toggle = () => {
    const video = ref.current;
    if (!video) return;
    userPaused.current = !video.paused;
    if (video.paused) void video.play().catch(() => {});
    else video.pause();
  };

  return (
    <>
      <video
        ref={ref}
        src={src}
        poster={poster}
        muted
        loop
        playsInline
        preload="none"
        aria-hidden="true"
        tabIndex={-1}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Pause background video" : "Play background video"}
        className="state-layer absolute top-4 right-4 z-10 inline-flex size-10 cursor-pointer items-center justify-center rounded-[20px] bg-scrim/50 text-white transition-[border-radius] duration-(--duration-short4) active:rounded-[12px] medium:right-8"
      >
        <svg viewBox="0 -960 960 960" width={22} height={22} fill="currentColor" aria-hidden="true" focusable="false">
          <path d={playing ? pausePath : playPath} />
        </svg>
      </button>
    </>
  );
}
