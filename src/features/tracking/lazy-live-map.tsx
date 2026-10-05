"use client";

import dynamic from "next/dynamic";

export const LazyLiveMap = dynamic(() => import("./live-map").then((m) => m.LiveMap), {
  ssr: false,
  loading: () => (
    <div aria-hidden="true">
      <div className="h-[52px]" />
      <div className="h-[240px] animate-pulse border-y border-outline-variant bg-surface-container-low medium:h-[300px]" />
      <div className="h-[84px]" />
    </div>
  ),
});
