"use client";

import { useEffect, type ReactNode } from "react";

type Pref = "system" | "light" | "dark";

const order: Pref[] = ["system", "light", "dark"];
const labels: Record<Pref, string> = { system: "System theme", light: "Light theme", dark: "Dark theme" };

function readPref(): Pref {
  const p = document.documentElement.dataset.themePref;
  return p === "light" || p === "dark" ? p : "system";
}

function apply(pref: Pref) {
  const root = document.documentElement;
  const dark = pref === "dark" || (pref === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  root.dataset.theme = dark ? "dark" : "light";
  root.dataset.themePref = pref;
}

export function ThemeToggle({ icons, className }: { icons: Record<Pref, ReactNode>; className?: string }) {
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (readPref() === "system") apply("system");
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const cycle = () => {
    const next = order[(order.indexOf(readPref()) + 1) % order.length]!;
    apply(next);
    try {
      if (next === "system") localStorage.removeItem("theme");
      else localStorage.setItem("theme", next);
    } catch {}
  };

  return (
    <button
      type="button"
      onClick={cycle}
      title="Change theme"
      className={`state-layer inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-[20px] text-on-surface-variant transition-[color,background-color,border-radius] duration-(--duration-short4) ease-standard active:rounded-[12px] ${className ?? ""}`}
    >
      <span className="hidden [[data-theme-pref=system]_&]:inline-flex [html:not([data-theme-pref])_&]:inline-flex">{icons.system}<span className="sr-only">{labels.system}, change theme</span></span>
      <span className="hidden [[data-theme-pref=light]_&]:inline-flex">{icons.light}<span className="sr-only">{labels.light}, change theme</span></span>
      <span className="hidden [[data-theme-pref=dark]_&]:inline-flex">{icons.dark}<span className="sr-only">{labels.dark}, change theme</span></span>
    </button>
  );
}
