"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { Icon } from "@/components/ui/icon";
import { checkIcon } from "@/components/ui/icons.generated";
import { cn } from "@/lib/cn";

type SyncValue = { chapter: number; setChapter: (i: number) => void };

const SyncContext = createContext<SyncValue | null>(null);

export function TheaterSync({ children }: { children: ReactNode }) {
  const [chapter, setChapter] = useState(-1);
  const value = useMemo(() => ({ chapter, setChapter }), [chapter]);
  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export function useTheaterSync() {
  return useContext(SyncContext);
}

export function TheaterSteps({
  steps,
  className,
  variant = "bullets",
}: {
  steps: string[];
  className?: string;
  variant?: "bullets" | "compact";
}) {
  const sync = useTheaterSync();
  const active = sync?.chapter ?? -1;
  return (
    <ol className={cn("flex flex-col", variant === "bullets" ? "gap-1" : "gap-0.5", className)}>
      {steps.map((text, i) => {
        const done = active > i;
        const on = active === i;
        return (
          <li
            key={text}
            aria-current={on ? "step" : undefined}
            className={cn(
              "relative flex gap-3 transition-colors duration-300",
              variant === "bullets" ? "text-body-lg py-2.5 pl-4" : "text-body-md py-1 pl-3",
              on ? "text-on-surface" : "text-on-surface-variant",
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                "absolute top-2 bottom-2 left-0 w-[3px] rounded-full transition-colors duration-300",
                on ? "bg-primary" : "bg-outline-variant/70",
              )}
            />
            <span
              aria-hidden="true"
              className={cn(
                "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full font-mono text-[11px] transition-colors duration-300",
                done
                  ? "bg-primary text-on-primary"
                  : on
                    ? "bg-primary-container text-on-primary-container"
                    : "border-outline-variant border",
              )}
            >
              {done ? <Icon icon={checkIcon} size={14} /> : i + 1}
            </span>
            <span className="min-w-0">{text}</span>
          </li>
        );
      })}
    </ol>
  );
}
