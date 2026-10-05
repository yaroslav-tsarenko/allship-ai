"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

export function StickyFunnelCta({
  href,
  label,
  note,
  hideWhileVisible,
  track,
}: {
  href: string;
  label: string;
  note?: string;
  hideWhileVisible?: string;
  track?: string;
}) {
  const [visible, setVisible] = useState(!hideWhileVisible);

  useEffect(() => {
    if (!hideWhileVisible) return;
    const target = document.getElementById(hideWhileVisible);
    if (!target) return;
    const io = new IntersectionObserver(([entry]) => setVisible(entry ? !entry.isIntersecting && entry.boundingClientRect.top < 0 : false), {
      threshold: 0,
    });
    io.observe(target);
    return () => io.disconnect();
  }, [hideWhileVisible]);

  const go = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!href.startsWith("#")) return;
    const target = document.getElementById(href.slice(1));
    if (!target) return;
    e.preventDefault();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    window.setTimeout(
      () => target.querySelector<HTMLElement>("input, select, button")?.focus({ preventScroll: true }),
      reduce ? 0 : 450,
    );
  };

  return (
    <>
      <div aria-hidden="true" className="expanded:hidden h-20" />
      <div
        aria-hidden={!visible}
        className={cn(
          "border-outline-variant bg-surface shadow-elevation-2 ease-standard expanded:hidden fixed inset-x-0 bottom-0 z-40 border-t px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] transition-[translate,opacity] duration-(--duration-medium2)",
          visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-full opacity-0",
        )}
      >
        <div className="flex items-center gap-3">
          {note && <p className="text-body-sm text-on-surface-variant min-w-0 flex-1 text-pretty">{note}</p>}
          <a
            href={href}
            onClick={go}
            tabIndex={visible ? 0 : -1}
            data-track={track}
            className={cn(
              "state-layer bg-primary text-label-lg text-on-primary ease-standard inline-flex h-12 items-center justify-center rounded-[24px] px-6 font-medium transition-[border-radius] duration-(--duration-short4) active:rounded-[12px]",
              note ? "shrink-0" : "w-full",
            )}
          >
            {label}
          </a>
        </div>
      </div>
    </>
  );
}
