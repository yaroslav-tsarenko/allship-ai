"use client";

import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { TheaterStage } from "./stage";
import type { BoxKind } from "./still";
import type { SceneId, TheaterDevice } from "./types";

export type TabMeta = {
  scene: SceneId;
  label: string;
  title: string;
  captions: string[];
  box: BoxKind;
  device: TheaterDevice;
};

export function TheaterTabsClient({
  tabs,
  poster,
  caption,
  label,
  className,
}: {
  tabs: TabMeta[];
  poster: ReactNode;
  caption?: string;
  label: string;
  className?: string;
}) {
  const [active, setActive] = useState(0);
  const [touched, setTouched] = useState(false);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const tab = tabs[active]!;

  const go = (i: number, focus = false) => {
    const next = (i + tabs.length) % tabs.length;
    setActive(next);
    setTouched(true);
    if (focus) refs.current[next]?.focus();
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowRight") go(active + 1, true);
    else if (e.key === "ArrowLeft") go(active - 1, true);
    else if (e.key === "Home") go(0, true);
    else if (e.key === "End") go(tabs.length - 1, true);
    else return;
    e.preventDefault();
  };

  return (
    <div className={className}>
      <div
        role="tablist"
        aria-label={label}
        onKeyDown={onKey}
        className="border-outline-variant mb-5 flex [scrollbar-width:none] gap-1 overflow-x-auto border-b"
      >
        {tabs.map((t, i) => {
          const on = i === active;
          return (
            <button
              key={t.scene}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`th-tab-${t.scene}`}
              aria-selected={on}
              aria-controls={`th-panel-${t.scene}`}
              tabIndex={on ? 0 : -1}
              onClick={() => go(i)}
              className={cn(
                "state-layer text-title-sm relative flex h-12 shrink-0 cursor-pointer items-center gap-2 rounded-t-sm px-4 transition-colors duration-200",
                on ? "text-primary" : "text-on-surface-variant",
              )}
            >
              <span className="text-label-md font-mono tabular-nums opacity-70">
                {String(i + 1).padStart(2, "0")}
              </span>
              {t.label}
              <span
                aria-hidden="true"
                className={cn(
                  "bg-primary absolute inset-x-2 bottom-0 h-[3px] rounded-t-full transition-transform duration-300 ease-[cubic-bezier(0.2,0,0,1)]",
                  on ? "scale-x-100" : "scale-x-0",
                )}
              />
            </button>
          );
        })}
      </div>
      <div role="tabpanel" id={`th-panel-${tab.scene}`} aria-labelledby={`th-tab-${tab.scene}`}>
        <TheaterStage
          key={tab.scene}
          sceneId={tab.scene}
          device={tab.device}
          box={tab.box}
          title={tab.title}
          captions={tab.captions}
          caption={caption}
          poster={active === 0 ? poster : undefined}
          eager={touched}
          loop={false}
          onFinish={() => window.setTimeout(() => setActive((a) => (a + 1) % tabs.length), 900)}
        />
      </div>
    </div>
  );
}
