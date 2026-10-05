"use client";

import { useRouter } from "next/navigation";
import { useRef, type FocusEvent, type MouseEvent, type PointerEvent, type ReactNode } from "react";

function internalTarget(target: EventTarget | null) {
  const a = (target as Element | null)?.closest?.("a[href]");
  if (!(a instanceof HTMLAnchorElement)) return null;
  if ((a.target && a.target !== "_self") || a.hasAttribute("download")) return null;
  const url = new URL(a.href);
  if (url.origin !== window.location.origin) return null;
  return url;
}

export function useLinkDelegation() {
  const router = useRouter();
  const prefetched = useRef(new Set<string>());

  const prefetch = (e: PointerEvent | FocusEvent) => {
    const url = internalTarget(e.target);
    if (!url) return;
    const path = url.pathname + url.search;
    if (prefetched.current.has(path)) return;
    prefetched.current.add(path);
    router.prefetch(path);
  };

  const onClick = (e: MouseEvent) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const url = internalTarget(e.target);
    if (!url) return;
    if (url.pathname === window.location.pathname && url.search === window.location.search && url.hash) return;
    e.preventDefault();
    router.push(url.pathname + url.search + url.hash);
  };

  return { onClick, onPointerOver: prefetch, onFocus: prefetch };
}

export function LinkScope({ children }: { children: ReactNode }) {
  return (
    <div className="contents" {...useLinkDelegation()}>
      {children}
    </div>
  );
}
