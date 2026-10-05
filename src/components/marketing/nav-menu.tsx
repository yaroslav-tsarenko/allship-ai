"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import type { NavLink } from "@/content/site";
import { useLinkDelegation } from "./link-scope";

type State = "closed" | "open" | "closing";

export function NavMenu({ label, triggerClassName, panelClassName, chevron, children }: { label: string; triggerClassName: string; panelClassName: string; chevron: ReactNode; children: ReactNode }) {
  const [state, setState] = useState<State>("closed");
  const pathname = usePathname();
  const [lastPath, setLastPath] = useState(pathname);
  const id = useId();
  const rootRef = useRef<HTMLLIElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const timer = useRef(0);
  const hoverOpenedAt = useRef(0);
  const links = useLinkDelegation();

  if (pathname !== lastPath) {
    setLastPath(pathname);
    if (state === "open") setState("closing");
  }

  const open = () => {
    window.clearTimeout(timer.current);
    setState("open");
  };
  const close = () => {
    window.clearTimeout(timer.current);
    setState((s) => (s === "open" ? "closing" : s));
  };

  useEffect(() => {
    if (state !== "open") return;
    const onDown = (e: Event) => {
      if (!rootRef.current?.contains(e.target as Node)) close();
    };
    document.addEventListener("pointerdown", onDown, true);
    return () => document.removeEventListener("pointerdown", onDown, true);
  }, [state]);

  useEffect(() => {
    if (state !== "closing") return;
    const t = window.setTimeout(() => setState("closed"), 400);
    return () => window.clearTimeout(t);
  }, [state]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const onEnter = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      hoverOpenedAt.current = Date.now();
      setState("open");
    }, 150);
  };
  const onLeave = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(close, 200);
  };
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape" && state === "open") {
      e.stopPropagation();
      close();
      triggerRef.current?.focus();
    }
  };

  const isOpen = state === "open";
  return (
    <li
      ref={rootRef}
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
      onKeyDown={onKeyDown}
      onBlur={(e) => {
        if (!rootRef.current?.contains(e.relatedTarget as Node | null)) close();
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={isOpen}
        aria-controls={id}
        data-state={isOpen ? "open" : "closed"}
        className={triggerClassName}
        onClick={() => {
          if (isOpen && Date.now() - hoverOpenedAt.current < 400) return;
          if (isOpen) close();
          else open();
        }}
      >
        {label}
        {chevron}
      </button>
      <div
        id={id}
        hidden={state === "closed"}
        data-state={isOpen ? "open" : "closed"}
        className={panelClassName}
        onClick={(e) => {
          links.onClick(e);
          if ((e.target as Element).closest("a")) close();
        }}
        onPointerOver={links.onPointerOver}
        onFocus={links.onFocus}
        onAnimationEnd={(e) => {
          if (e.target === e.currentTarget && state === "closing") setState("closed");
        }}
      >
        {children}
      </div>
    </li>
  );
}

export function NavLinks({ links, className }: { links: NavLink[]; className: string }) {
  const pathname = usePathname();
  return links.map((link) => {
    const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
    return (
      <li key={link.href}>
        <Link href={link.href} className={className} data-active={active ? "" : undefined} aria-current={active ? "page" : undefined}>
          {link.label}
        </Link>
      </li>
    );
  });
}
