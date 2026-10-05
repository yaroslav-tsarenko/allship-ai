"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { useSlidingIndicator } from "@/components/motion/use-sliding-indicator";
import { Icon } from "@/components/ui/icon";
import { moreHorizIcon } from "@/components/ui/icons.generated";
import { cn } from "@/lib/cn";
import { useLiveCounts } from "./live-counts";
import { barItemsFor, type NavItem } from "./nav-items";

function useActive() {
  const pathname = usePathname();
  return (item: NavItem) => (item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`));
}

function useBadge() {
  const { conversations } = useLiveCounts();
  return (item: NavItem) => (item.badge === "messages" ? conversations : 0);
}

function useNavIndicator(items: NavItem[], extraActive?: string | null) {
  const isActive = useActive();
  const navRef = useRef<HTMLElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const activeHref = items.find(isActive)?.href ?? extraActive ?? null;
  useSlidingIndicator(navRef, indicatorRef, activeHref);
  return { isActive, navRef, indicatorRef };
}

function tourKey(item: NavItem) {
  const last = item.href.split("/").filter(Boolean).at(-1);
  return `nav-${last === "app" ? "home" : last}`;
}

function formatBadge(n: number) {
  return n > 99 ? "99+" : String(n);
}

function IconBadge({ count, label }: { count: number; label: string }) {
  if (count <= 0) return null;
  return (
    <span className="absolute -top-0.5 left-[calc(50%+2px)] flex h-4 min-w-4 animate-pop-in items-center justify-center rounded-full bg-error px-1 text-[11px] leading-none font-medium text-on-error">
      {formatBadge(count)}
      <span className="sr-only"> {label}</span>
    </span>
  );
}

const indicatorClass =
  "pointer-events-none absolute top-0 left-0 rounded-full bg-secondary-container opacity-0 transition-[transform,width,height,opacity] duration-(--duration-medium4) ease-(--ease-emphasized)";

const pillClass = "group-data-indicator-ready/nav:bg-transparent";

export function NavigationRail({ items }: { items: NavItem[] }) {
  const { isActive, navRef, indicatorRef } = useNavIndicator(items);
  const badgeFor = useBadge();
  return (
    <nav ref={navRef} aria-label="Main" className="group/nav sticky top-16 hidden h-[calc(100dvh-4rem)] w-20 shrink-0 flex-col items-center gap-3 overflow-y-auto py-4 [scrollbar-width:none] medium:flex large:hidden">
      <span ref={indicatorRef} aria-hidden="true" className={indicatorClass} />
      {items.map((item) => {
        const active = isActive(item);
        return (
          <Link key={item.href} href={item.href} data-tour={tourKey(item)} aria-current={active ? "page" : undefined} className="group flex w-full flex-col items-center gap-1 rounded-md py-1 text-label-md font-medium text-on-surface-variant transition-colors duration-(--duration-short4) aria-[current=page]:text-on-surface">
            <span
              data-indicator-target=""
              data-active={active ? "" : undefined}
              className={cn("state-layer relative flex h-8 w-14 shrink-0 items-center justify-center rounded-full transition-colors duration-(--duration-medium2)", active && cn("bg-secondary-container text-on-secondary-container", pillClass))}
            >
              <Icon icon={item.icon} filled={active} size={24} />
              <IconBadge count={badgeFor(item)} label="unread" />
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function NavigationDrawer({ items }: { items: NavItem[] }) {
  const { isActive, navRef, indicatorRef } = useNavIndicator(items);
  const badgeFor = useBadge();
  return (
    <nav ref={navRef} aria-label="Main" className="group/nav sticky top-16 hidden h-[calc(100dvh-4rem)] w-[280px] shrink-0 flex-col gap-1 overflow-y-auto px-3 py-4 large:flex">
      <span ref={indicatorRef} aria-hidden="true" className={indicatorClass} />
      {items.map((item) => {
        const active = isActive(item);
        const badge = badgeFor(item);
        return (
          <Link
            key={item.href}
            href={item.href}
            data-tour={tourKey(item)}
            aria-current={active ? "page" : undefined}
            data-indicator-target=""
            data-active={active ? "" : undefined}
            className={cn(
              "state-layer flex h-14 shrink-0 items-center gap-3 rounded-full px-4 text-label-lg font-medium text-on-surface-variant transition-colors duration-(--duration-medium2)",
              active && cn("bg-secondary-container text-on-secondary-container", pillClass),
            )}
          >
            <Icon icon={item.icon} filled={active} size={24} />
            <span className="flex-1">{item.label}</span>
            {badge > 0 && (
              <span className="text-label-lg">
                {formatBadge(badge)}
                <span className="sr-only"> unread</span>
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

export function NavigationBar({ items }: { items: NavItem[] }) {
  const { primary, overflow } = barItemsFor(items);
  const isActiveItem = useActive();
  const overflowActive = overflow.some(isActiveItem);
  const { isActive, navRef, indicatorRef } = useNavIndicator(primary, overflowActive ? "more" : null);
  const badgeFor = useBadge();
  const [open, setOpen] = useState(false);
  const inThread = /^\/app\/messages\/[^/]+/.test(usePathname());
  const overflowBadge = overflow.reduce((sum, item) => sum + badgeFor(item), 0);
  return (
    <nav ref={navRef} aria-label="Main" className={cn("group/nav fixed inset-x-0 bottom-0 z-30 flex h-20 items-stretch bg-surface-container pb-[env(safe-area-inset-bottom)] medium:hidden", inThread && "hidden")}>
      <span ref={indicatorRef} aria-hidden="true" className={indicatorClass} />
      {primary.map((item) => {
        const active = isActive(item);
        return (
          <Link key={item.href} href={item.href} data-tour={tourKey(item)} aria-current={active ? "page" : undefined} className="relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 text-label-md font-medium text-on-surface-variant transition-colors duration-(--duration-short4) aria-[current=page]:text-on-surface">
            <span
              data-indicator-target=""
              data-active={active ? "" : undefined}
              className={cn("state-layer relative flex h-8 w-16 items-center justify-center rounded-full transition-colors duration-(--duration-medium2)", active && cn("bg-secondary-container text-on-secondary-container", pillClass))}
            >
              <Icon icon={item.icon} filled={active} size={24} />
              <IconBadge count={badgeFor(item)} label="unread" />
            </span>
            <span className="max-w-full truncate px-1">{item.label}</span>
          </Link>
        );
      })}
      {overflow.length > 0 && (
        <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
          <DialogPrimitive.Trigger data-tour="nav-more" className="relative flex min-w-0 flex-1 cursor-pointer flex-col items-center justify-center gap-1 text-label-md font-medium text-on-surface-variant transition-colors duration-(--duration-short4) data-[active]:text-on-surface" data-active={overflowActive ? "" : undefined}>
            <span
              data-indicator-target=""
              data-active={overflowActive ? "" : undefined}
              className={cn("state-layer relative flex h-8 w-16 items-center justify-center rounded-full transition-colors duration-(--duration-medium2)", overflowActive && cn("bg-secondary-container text-on-secondary-container", pillClass))}
            >
              <Icon icon={moreHorizIcon} size={24} />
              <IconBadge count={overflowBadge} label="unread" />
            </span>
            More
          </DialogPrimitive.Trigger>
          <DialogPrimitive.Portal>
            <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-scrim/32 data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in" />
            <DialogPrimitive.Content className="fixed inset-x-0 bottom-0 z-50 rounded-t-xl bg-surface-container-low pb-[max(env(safe-area-inset-bottom),16px)] text-on-surface shadow-elevation-1 outline-none data-[state=closed]:animate-banner-out data-[state=open]:animate-banner-in">
              <div aria-hidden="true" className="mx-auto mt-4 mb-2 h-1 w-8 rounded-full bg-on-surface-variant/40" />
              <DialogPrimitive.Title className="px-6 pt-2 pb-2 text-title-md">More</DialogPrimitive.Title>
              <DialogPrimitive.Description className="sr-only">Other places in AllShip</DialogPrimitive.Description>
              <ul className="px-3 pb-2">
                {overflow.map((item) => {
                  const active = isActiveItem(item);
                  const badge = badgeFor(item);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setOpen(false)}
                        aria-current={active ? "page" : undefined}
                        className={cn("state-layer flex h-14 items-center gap-4 rounded-full px-4 text-label-lg font-medium text-on-surface-variant", active && "bg-secondary-container text-on-secondary-container")}
                      >
                        <Icon icon={item.icon} filled={active} size={24} />
                        <span className="flex-1">{item.label}</span>
                        {badge > 0 && (
                          <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-error px-1.5 text-label-md text-on-error">
                            {formatBadge(badge)}
                            <span className="sr-only"> unread</span>
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
      )}
    </nav>
  );
}
