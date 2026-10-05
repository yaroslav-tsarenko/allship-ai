"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { DrawerIcons } from "./mobile-drawer";

const loadDrawer = () => import("./mobile-drawer");
const MobileDrawer = dynamic(() => loadDrawer().then((m) => m.MobileDrawer), { ssr: false });

export function MobileNav({ menuIcon, icons }: { menuIcon: ReactNode; icons: DrawerIcons }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const mq = window.matchMedia("(min-width: 1200px)");
    const onChange = () => mq.matches && setOpen(false);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label="Open menu"
        title="Open menu"
        aria-haspopup="dialog"
        aria-expanded={open}
        onPointerDown={() => void loadDrawer()}
        onFocus={() => void loadDrawer()}
        onClick={() => {
          setMounted(true);
          setOpen(true);
        }}
        className="state-layer inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-[20px] text-on-surface-variant transition-[color,background-color,border-radius] duration-(--duration-short4) ease-standard active:rounded-[12px] large:hidden"
      >
        {menuIcon}
      </button>
      {mounted && (
        <MobileDrawer
          open={open}
          onOpenChange={setOpen}
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            triggerRef.current?.focus();
          }}
          pathname={pathname}
          icons={icons}
        />
      )}
    </>
  );
}
