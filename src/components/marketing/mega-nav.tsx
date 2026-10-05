"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import type { NavLink } from "@/content/site";
import { useLinkDelegation } from "./link-scope";

export type MegaItem = { id: string; label: string; wide?: boolean };

const loadPanels = () => import("./mega-panels");
const MegaPanel = dynamic(() => loadPanels().then((m) => m.MegaPanel), { ssr: false });

type Props = { items: MegaItem[]; links: NavLink[]; chevron: ReactNode; triggerClassName: string; linkClassName: string };

const OPEN_DELAY = 120;
const CLOSE_DELAY = 220;

function focusables(root: Element | null) {
  return root ? Array.from(root.querySelectorAll<HTMLElement>("a[href],button:not([disabled])")) : [];
}

export function MegaNav({ items, links, chevron, triggerClassName, linkClassName }: Props) {
  const [open, setOpen] = useState<string | null>(null);
  const [closing, setClosing] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const navRef = useRef<HTMLElement>(null);
  const timer = useRef(0);
  const hoverAt = useRef(0);
  const pendingFocus = useRef<"first" | "last" | null>(null);
  const pathname = usePathname();
  const [lastPath, setLastPath] = useState(pathname);
  const delegate = useLinkDelegation();

  const place = (id: string) => {
    const item = items.find((i) => i.id === id);
    const trigger = document.getElementById(`mn-${id}-t`);
    const header = navRef.current?.closest("header");
    if (!item || item.wide || !trigger || !header) return;
    const panelWidth = document.getElementById(`mn-${id}`)?.offsetWidth || 560;
    const left = trigger.getBoundingClientRect().left - header.getBoundingClientRect().left - 16;
    setOffset(Math.max(16, Math.min(left, header.clientWidth - panelWidth - 16)));
  };

  const show = (id: string) => {
    window.clearTimeout(timer.current);
    setClosing((c) => (c === id ? null : c));
    setOpen((current) => {
      if (current && current !== id) setClosing(null);
      return id;
    });
    void loadPanels().then(() => window.requestAnimationFrame(() => window.requestAnimationFrame(() => place(id))));
  };

  const hide = () => {
    window.clearTimeout(timer.current);
    setOpen((current) => {
      if (current) setClosing(current);
      return null;
    });
  };

  if (pathname !== lastPath) {
    setLastPath(pathname);
    if (open) {
      setOpen(null);
      setClosing(null);
    }
  }

  useEffect(() => {
    if (!closing) return;
    const t = window.setTimeout(() => setClosing(null), 160);
    return () => window.clearTimeout(t);
  }, [closing]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: Event) => {
      if (!navRef.current?.contains(e.target as Node)) hide();
    };
    const onResize = () => place(open);
    document.addEventListener("pointerdown", onDown, true);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("pointerdown", onDown, true);
      window.removeEventListener("resize", onResize);
    };
  });

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const focusPending = (id: string) => {
    const want = pendingFocus.current;
    if (!want) return;
    const list = focusables(document.getElementById(`mn-${id}`));
    if (!list.length) return;
    pendingFocus.current = null;
    (want === "first" ? list[0] : list[list.length - 1])?.focus();
  };

  useEffect(() => {
    if (open) focusPending(open);
  });

  const onTriggerEnter = (id: string) => (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    window.clearTimeout(timer.current);
    if (open) {
      if (open !== id) show(id);
      return;
    }
    timer.current = window.setTimeout(() => {
      hoverAt.current = Date.now();
      show(id);
    }, OPEN_DELAY);
  };

  const onLeave = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(hide, CLOSE_DELAY);
  };

  const onPanelEnter = (e: PointerEvent) => {
    if (e.pointerType === "mouse") window.clearTimeout(timer.current);
  };

  const topLevel = () => focusables(navRef.current?.querySelector("[data-mn-bar]") ?? null);

  const moveTop = (from: HTMLElement, dir: 1 | -1 | "first" | "last") => {
    const all = topLevel();
    const i = all.indexOf(from);
    const next = dir === "first" ? all[0] : dir === "last" ? all[all.length - 1] : all[(i + dir + all.length) % all.length];
    next?.focus();
  };

  const onBarKey = (e: KeyboardEvent<HTMLUListElement>) => {
    const target = e.target as HTMLElement;
    const id = target.dataset.mnTrigger;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      moveTop(target, 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      moveTop(target, -1);
    } else if (e.key === "Home") {
      e.preventDefault();
      moveTop(target, "first");
    } else if (e.key === "End") {
      e.preventDefault();
      moveTop(target, "last");
    } else if (id && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      e.preventDefault();
      pendingFocus.current = e.key === "ArrowDown" ? "first" : "last";
      if (open === id) focusPending(id);
      else show(id);
    } else if (e.key === "Escape" && open) {
      e.preventDefault();
      hide();
    } else if (id && e.key === "Tab" && !e.shiftKey && open === id) {
      const first = focusables(document.getElementById(`mn-${id}`))[0];
      if (first) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  const onPanelKey = (id: string) => (e: KeyboardEvent<HTMLDivElement>) => {
    const list = focusables(e.currentTarget);
    const i = list.indexOf(e.target as HTMLElement);
    const go = (n: number) => {
      e.preventDefault();
      list[(n + list.length) % list.length]?.focus();
    };
    if (e.key === "ArrowDown") go(i + 1);
    else if (e.key === "ArrowUp") go(i - 1);
    else if (e.key === "Home") go(0);
    else if (e.key === "End") go(list.length - 1);
    else if (e.key === "Escape") {
      e.preventDefault();
      hide();
      document.getElementById(`mn-${id}-t`)?.focus();
    } else if (e.key === "Tab" && ((e.shiftKey && i === 0) || (!e.shiftKey && i === list.length - 1))) {
      const triggerEl = document.getElementById(`mn-${id}-t`);
      if (!triggerEl) return;
      e.preventDefault();
      if (e.shiftKey) triggerEl.focus();
      else {
        hide();
        const all = topLevel();
        const next = all[all.indexOf(triggerEl) + 1];
        if (next) next.focus();
        else triggerEl.focus();
      }
    }
  };

  return (
    <nav
      ref={navRef}
      aria-label="Main"
      className="hidden large:block"
      onPointerEnter={() => void loadPanels()}
      onFocusCapture={() => void loadPanels()}
      onBlur={(e) => {
        if (open && !navRef.current?.contains(e.relatedTarget as Node | null)) hide();
      }}
    >
      <ul data-mn-bar="" className="flex items-center gap-0.5" onKeyDown={onBarKey}>
        {items.map((item) => {
          const isOpen = open === item.id;
          return (
            <li key={item.id} onPointerEnter={onTriggerEnter(item.id)} onPointerLeave={onLeave}>
              <button
                id={`mn-${item.id}-t`}
                type="button"
                data-mn-trigger={item.id}
                aria-expanded={isOpen}
                aria-controls={`mn-${item.id}`}
                data-state={isOpen ? "open" : "closed"}
                className={triggerClassName}
                onClick={() => {
                  if (isOpen && Date.now() - hoverAt.current < 400) return;
                  if (isOpen) hide();
                  else show(item.id);
                }}
              >
                {item.label}
                {chevron}
              </button>
            </li>
          );
        })}
        {links.map((link) => {
          const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <li key={link.href}>
              <Link href={link.href} className={linkClassName} data-active={active ? "" : undefined} aria-current={active ? "page" : undefined}>
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
      {items.map((item) => {
        const isOpen = open === item.id;
        const isClosing = closing === item.id;
        return (
          <div
            key={item.id}
            id={`mn-${item.id}`}
            role="group"
            aria-labelledby={`mn-${item.id}-t`}
            hidden={!isOpen && !isClosing}
            data-state={isOpen ? "open" : "closed"}
            style={item.wide ? undefined : { left: offset }}
            className={
              item.wide
                ? "absolute inset-x-0 top-full z-10 origin-top border-b border-outline-variant bg-surface-container-low shadow-elevation-2 data-[state=closed]:animate-fade-out data-[state=open]:animate-menu-in"
                : "absolute top-full z-10 mt-1 w-max max-w-[calc(100vw-32px)] origin-top rounded-lg border border-outline-variant bg-surface-container-low shadow-elevation-2 data-[state=closed]:animate-fade-out data-[state=open]:animate-menu-in"
            }
            onPointerEnter={onPanelEnter}
            onPointerLeave={onLeave}
            onKeyDown={onPanelKey(item.id)}
            onPointerOver={delegate.onPointerOver}
            onFocus={delegate.onFocus}
            onClick={(e) => {
              delegate.onClick(e);
              if ((e.target as Element).closest("a")) hide();
            }}
          >
            {(isOpen || isClosing) && <MegaPanel id={item.id} />}
          </div>
        );
      })}
      <div
        aria-hidden="true"
        data-state={open ? "open" : "closed"}
        hidden={!open && !closing}
        onPointerDown={hide}
        className="fixed inset-x-0 top-16 bottom-0 -z-10 bg-scrim/16 data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in"
      />
    </nav>
  );
}
