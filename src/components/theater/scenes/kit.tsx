import type { ReactNode } from "react";
import { Icon } from "@/components/ui/icon";
import {
  chatIcon,
  gavelIcon,
  groupIcon,
  homeIcon,
  inventory2Icon,
  moreHorizIcon,
  notificationsIcon,
  paymentsIcon,
  personPinCircleIcon,
  routeIcon,
  searchIcon,
  settingsIcon,
  starIcon,
  type IconData,
} from "@/components/ui/icons.generated";
import { cn } from "@/lib/cn";

export type DemoRole = "shipper" | "owner" | "driver";

type NavKey =
  | "home"
  | "loads"
  | "find"
  | "bids"
  | "trips"
  | "fleet"
  | "team"
  | "messages"
  | "payouts"
  | "reviews"
  | "settings";

const nav: Record<NavKey, { label: string; icon: IconData }> = {
  home: { label: "Home", icon: homeIcon },
  loads: { label: "Loads", icon: inventory2Icon },
  find: { label: "Find loads", icon: searchIcon },
  bids: { label: "Bids", icon: gavelIcon },
  trips: { label: "Trips", icon: routeIcon },
  fleet: { label: "Fleet", icon: personPinCircleIcon },
  team: { label: "Team", icon: groupIcon },
  messages: { label: "Messages", icon: chatIcon },
  payouts: { label: "Payouts", icon: paymentsIcon },
  reviews: { label: "Reviews", icon: starIcon },
  settings: { label: "Settings", icon: settingsIcon },
};

const byRole: Record<DemoRole, NavKey[]> = {
  shipper: ["home", "loads", "messages", "settings"],
  owner: ["home", "find", "bids", "trips", "fleet", "team", "messages", "payouts", "reviews", "settings"],
  driver: ["home", "trips", "messages", "settings"],
};

export function SparkGlyph({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 2.5c.32 0 .6.22.68.53.53 2.08 1.39 3.8 2.6 5.03 1.2 1.22 2.93 2.08 5.03 2.62a.7.7 0 0 1 0 1.36c-2.1.54-3.82 1.4-5.03 2.62-1.21 1.22-2.07 2.95-2.6 5.03a.7.7 0 0 1-1.36 0c-.53-2.08-1.39-3.8-2.6-5.03-1.2-1.22-2.93-2.08-5.03-2.62a.7.7 0 0 1 0-1.36c2.1-.54 3.82-1.4 5.03-2.62 1.21-1.22 2.07-2.95 2.6-5.03A.7.7 0 0 1 12 2.5Z" />
    </svg>
  );
}

export function LogoMark({ height = 22 }: { height?: number }) {
  const width = Math.round((704 / 165) * height);
  return (
    <span
      aria-hidden="true"
      className="inline-block shrink-0 bg-[url(/brand/logo.svg)] bg-contain bg-left bg-no-repeat dark:bg-[url(/brand/logo-dark.svg)]"
      style={{ width, height }}
    />
  );
}

const avatarTones = [
  "bg-primary-container text-on-primary-container",
  "bg-tertiary-container text-on-tertiary-container",
  "bg-secondary-container text-on-secondary-container",
];

export function Avatar({ name, size = 32, tone }: { name: string; size?: number; tone?: number }) {
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const t = tone ?? name.length % avatarTones.length;
  return (
    <span
      className={cn(
        "text-label-md flex shrink-0 items-center justify-center rounded-full font-medium",
        avatarTones[t],
      )}
      style={{ width: size, height: size }}
    >
      {initials}
    </span>
  );
}

export function AppShell({
  role,
  active,
  user = "Emily C.",
  unread = 0,
  children,
  aside,
}: {
  role: DemoRole;
  active: NavKey;
  user?: string;
  unread?: number;
  children: ReactNode;
  aside?: ReactNode;
}) {
  const items = byRole[role];
  const bar = items.length > 5 ? [...items.slice(0, 4), null] : items;
  return (
    <div className="bg-surface text-on-surface flex h-full flex-col">
      <div className="flex h-14 shrink-0 items-center gap-1 px-4 @3xl:h-16 @3xl:px-5">
        <LogoMark height={22} />
        <span className="flex-1" />
        <span
          data-demo="assistant-btn"
          className="state-layer text-label-lg text-on-surface-variant inline-flex h-10 items-center gap-2 rounded-full px-3 font-medium"
        >
          <SparkGlyph size={20} className="text-primary" />
          <span className="hidden @3xl:inline">Ask AI</span>
        </span>
        <span className="text-on-surface-variant relative inline-flex size-10 items-center justify-center rounded-full">
          <Icon icon={notificationsIcon} />
          {unread > 0 && (
            <span className="bg-error text-on-error absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[11px] font-medium">
              {unread}
            </span>
          )}
        </span>
        <span className="ml-1">
          <Avatar name={user} />
        </span>
      </div>
      <div className="flex min-h-0 flex-1">
        <div className="hidden w-20 shrink-0 flex-col items-center gap-3 py-3 @3xl:flex">
          {items.map((k) => {
            const on = k === active;
            return (
              <span
                key={k}
                data-demo={`nav-${k}`}
                className={cn(
                  "text-label-md flex w-full flex-col items-center gap-1 font-medium",
                  on ? "text-on-surface" : "text-on-surface-variant",
                )}
              >
                <span
                  className={cn(
                    "state-layer flex h-8 w-14 items-center justify-center rounded-full",
                    on && "bg-secondary-container text-on-secondary-container",
                  )}
                >
                  <Icon icon={nav[k].icon} filled={on} />
                </span>
                {nav[k].label}
              </span>
            );
          })}
        </div>
        <div className="relative min-w-0 flex-1 overflow-hidden">{children}</div>
        {aside}
      </div>
      <div className="bg-surface-container flex h-[72px] shrink-0 items-stretch @3xl:hidden">
        {bar.map((k) => {
          const on = k === active;
          return (
            <span
              key={k ?? "more"}
              className={cn(
                "text-label-md flex min-w-0 flex-1 flex-col items-center justify-center gap-1 font-medium",
                on ? "text-on-surface" : "text-on-surface-variant",
              )}
            >
              <span
                className={cn(
                  "flex h-8 w-16 items-center justify-center rounded-full",
                  on && "bg-secondary-container text-on-secondary-container",
                )}
              >
                <Icon icon={k ? nav[k].icon : moreHorizIcon} filled={on} />
              </span>
              <span className="max-w-full truncate px-1">{k ? nav[k].label : "More"}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

export function Caret() {
  return <span aria-hidden="true" className="th-caret" />;
}

export function Field({
  demo,
  label,
  value,
  focused = false,
  leading,
  trailing,
  placeholder,
  className,
  select,
}: {
  demo?: string;
  label: string;
  value: string;
  focused?: boolean;
  leading?: ReactNode;
  trailing?: ReactNode;
  placeholder?: string;
  className?: string;
  select?: boolean;
}) {
  const floated = focused || value.length > 0;
  return (
    <div
      data-demo={demo}
      className={cn(
        "relative flex h-14 min-w-0 items-center rounded-xs border bg-transparent transition-[border-color,box-shadow] duration-200",
        focused ? "border-primary shadow-[inset_0_0_0_1px_var(--md-primary)]" : "border-outline",
        className,
      )}
    >
      {leading && <span className="text-on-surface-variant flex pl-3">{leading}</span>}
      <span
        className={cn(
          "text-body-lg min-w-0 flex-1 truncate px-4",
          value ? "text-on-surface" : "text-on-surface-variant",
        )}
      >
        {value || (focused && placeholder ? placeholder : "")}
        {focused && <Caret />}
      </span>
      <span
        className={cn(
          "pointer-events-none absolute bg-[var(--field-bg,var(--md-surface))] px-1 transition-all duration-200",
          floated
            ? "text-body-sm top-0 left-3 -translate-y-1/2"
            : cn("text-body-lg top-1/2 -translate-y-1/2", leading ? "left-11" : "left-3"),
          focused ? "text-primary" : "text-on-surface-variant",
        )}
      >
        {label}
      </span>
      {select && (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          className="fill-on-surface-variant mr-3 shrink-0"
          aria-hidden="true"
        >
          <path d="M7 10l5 5 5-5z" />
        </svg>
      )}
      {trailing && <span className="text-on-surface-variant flex items-center pr-3">{trailing}</span>}
    </div>
  );
}

export function Snackbar({ show, children }: { show: boolean; children: ReactNode }) {
  return (
    <div
      className={cn(
        "bg-inverse-surface text-body-md text-inverse-on-surface shadow-elevation-3 absolute bottom-20 left-1/2 z-30 flex min-h-12 w-max max-w-[calc(100%-32px)] -translate-x-1/2 items-center gap-3 rounded-xs px-4 py-3 transition-all duration-300 @3xl:bottom-6",
        show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0",
      )}
    >
      {children}
    </div>
  );
}

export function Sheet({
  open,
  title,
  description,
  children,
  actions,
  demo,
  scroll,
}: {
  open: boolean;
  title: string;
  description?: string;
  children?: ReactNode;
  actions?: ReactNode;
  demo?: string;
  scroll?: string;
}) {
  return (
    <div
      className={cn(
        "absolute inset-0 z-30 transition-opacity duration-300",
        open ? "opacity-100" : "pointer-events-none opacity-0",
      )}
    >
      <div className="bg-scrim/32 absolute inset-0" />
      <div
        data-demo={demo}
        className={cn(
          "bg-surface-container-high shadow-elevation-3 absolute inset-x-0 bottom-0 flex max-h-[88%] flex-col rounded-t-xl p-6 pt-3 transition-transform duration-[400ms] ease-[cubic-bezier(0.05,0.7,0.1,1)]",
          "@3xl:inset-x-auto @3xl:top-1/2 @3xl:bottom-auto @3xl:left-1/2 @3xl:w-[540px] @3xl:rounded-xl @3xl:pt-6",
          open
            ? "translate-y-0 @3xl:-translate-x-1/2 @3xl:-translate-y-1/2 @3xl:scale-100"
            : "translate-y-full @3xl:-translate-x-1/2 @3xl:-translate-y-1/2 @3xl:scale-95",
        )}
        style={{ ["--field-bg" as string]: "var(--md-surface-container-high)" }}
      >
        <span className="bg-on-surface-variant/40 mx-auto mb-4 h-1 w-8 rounded-full @3xl:hidden" />
        <h3 className="text-headline-sm text-on-surface">{title}</h3>
        {description && <p className="text-body-md text-on-surface-variant mt-2">{description}</p>}
        {children && (
          <div data-demo-scroll={scroll} className="mt-5 min-h-0 overflow-hidden">
            {children}
          </div>
        )}
        {actions && <div className="mt-6 flex flex-wrap justify-end gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export function PageTitle({
  title,
  sub,
  trailing,
}: {
  title: string;
  sub?: ReactNode;
  trailing?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 pt-2 pb-5 @3xl:pt-4">
      <div className="min-w-0">
        <h2 className="text-headline-sm text-on-surface @3xl:text-headline-md">{title}</h2>
        {sub && <div className="text-body-md text-on-surface-variant mt-1">{sub}</div>}
      </div>
      {trailing}
    </div>
  );
}
