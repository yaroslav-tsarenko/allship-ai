"use client";

import { useEffect, useRef, useState } from "react";
import { resolveEnd } from "@/components/theater/define";
import { sceneLoaders } from "@/components/theater/scenes/loaders";
import { Still } from "@/components/theater/still";
import type { AnyScene, SceneId } from "@/components/theater/types";

export function MiniStill({ scene: id }: { scene: SceneId }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scene, setScene] = useState<AnyScene | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let alive = true;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        void sceneLoaders[id]().then((s) => alive && setScene(s));
      },
      { rootMargin: "600px 600px" },
    );
    io.observe(el);
    return () => {
      alive = false;
      io.disconnect();
    };
  }, [id]);

  return (
    <div ref={ref} aria-hidden="true" inert className="th-box pointer-events-none overflow-hidden rounded-[12px] bg-surface-container select-none" data-box="desktop">
      {scene && <Still scene={scene} device="desktop" state={resolveEnd(scene).state} />}
    </div>
  );
}
