"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import Link from "next/link";
import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "./icon";
import type { IconData } from "./icons.generated";

const listClass = "flex w-full overflow-x-auto border-b border-outline-variant [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";
const tabClass =
  "state-layer group relative flex h-12 min-w-[90px] flex-1 shrink-0 cursor-pointer items-center justify-center gap-2 px-4 text-title-sm whitespace-nowrap text-on-surface-variant outline-none transition-colors duration-150 ease-standard focus-visible:outline-2 focus-visible:-outline-offset-2 medium:flex-none";
const activeClass = "text-primary";
const indicatorClass =
  "pointer-events-none absolute inset-x-4 bottom-0 h-[3px] origin-bottom scale-y-0 rounded-t-[3px] bg-primary transition-transform duration-200 ease-emphasized-decelerate";

function TabContent({ label, icon, count, active }: { label: ReactNode; icon?: IconData; count?: number; active: boolean }) {
  return (
    <>
      {icon && <Icon icon={icon} size={20} filled={active} />}
      <span>{label}</span>
      {count !== undefined && count > 0 && (
        <span
          className={cn(
            "min-w-5 rounded-full px-1.5 text-center text-label-sm leading-5",
            active ? "bg-primary text-on-primary" : "bg-surface-container-highest text-on-surface-variant group-data-[state=active]:bg-primary group-data-[state=active]:text-on-primary",
          )}
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </>
  );
}

export const Tabs = TabsPrimitive.Root;

export const TabList = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<typeof TabsPrimitive.List>>(function TabList({ className, ...rest }, ref) {
  return <TabsPrimitive.List ref={ref} className={cn(listClass, className)} {...rest} />;
});

type TabProps = Omit<ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>, "children"> & { label: ReactNode; icon?: IconData; count?: number };

export const Tab = forwardRef<HTMLButtonElement, TabProps>(function Tab({ label, icon, count, className, ...rest }, ref) {
  return (
    <TabsPrimitive.Trigger ref={ref} className={cn(tabClass, "data-[state=active]:text-primary", className)} {...rest}>
      <TabContent label={label} icon={icon} count={count} active={false} />
      <span aria-hidden="true" className={cn(indicatorClass, "group-data-[state=active]:scale-y-100")} />
    </TabsPrimitive.Trigger>
  );
});

export const TabPanel = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<typeof TabsPrimitive.Content>>(function TabPanel({ className, ...rest }, ref) {
  return <TabsPrimitive.Content ref={ref} className={cn("outline-none", className)} {...rest} />;
});

export type LinkTabItem = { href: string; label: ReactNode; icon?: IconData; count?: number; active: boolean };

export function LinkTabs({ items, label, className }: { items: LinkTabItem[]; label: string; className?: string }) {
  return (
    <nav aria-label={label} className={cn(listClass, className)}>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          scroll={false}
          aria-current={item.active ? "page" : undefined}
          className={cn(tabClass, item.active && activeClass)}
        >
          <TabContent label={item.label} icon={item.icon} count={item.count} active={item.active} />
          <span aria-hidden="true" className={cn(indicatorClass, item.active && "scale-y-100")} />
        </Link>
      ))}
    </nav>
  );
}
