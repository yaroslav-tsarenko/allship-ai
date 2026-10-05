"use client";

import * as Dropdown from "@radix-ui/react-dropdown-menu";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useSyncExternalStore } from "react";
import { Icon } from "@/components/ui/icon";
import { darkModeIcon, lightModeIcon, logoutIcon, settingsIcon, shieldLockIcon, travelExploreIcon } from "@/components/ui/icons.generated";
import { useTours } from "@/features/tours/tour-provider";
import { authClient } from "@/server/auth/client";

type Props = { name: string; email: string; image?: string | null; roleLabel: string; orgName?: string | null };

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function subscribeTheme(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

function readTheme(): "light" | "dark" {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

const itemClass =
  "state-layer flex h-12 cursor-pointer items-center gap-3 px-4 text-body-lg text-on-surface outline-none transition-colors duration-(--duration-short3) data-[highlighted]:bg-on-surface/8";

export function AccountMenu({ name, email, image, roleLabel, orgName }: Props) {
  const router = useRouter();
  const tours = useTours();
  const theme = useSyncExternalStore(subscribeTheme, readTheme, () => "light" as const);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;
    document.documentElement.dataset.themePref = nextTheme;
    try {
      localStorage.setItem("theme", nextTheme);
    } catch {}
  };

  return (
    <Dropdown.Root>
      <Dropdown.Trigger aria-label={`Account: ${name}`} className="state-layer flex size-10 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-tertiary-container transition-shadow duration-(--duration-short4) data-[state=open]:shadow-elevation-1 text-title-sm font-medium text-on-tertiary-container">
        {image ? <Image src={image} alt="" width={40} height={40} className="size-full object-cover" /> : initials(name)}
      </Dropdown.Trigger>
      <Dropdown.Portal>
        <Dropdown.Content align="end" sideOffset={8} className="z-50 w-[320px] origin-(--radix-dropdown-menu-content-transform-origin) overflow-hidden rounded-xl bg-surface-container-high py-2 text-on-surface shadow-elevation-2 data-[state=closed]:animate-menu-out data-[state=open]:animate-menu-in">
          <div className="px-4 pt-2 pb-3">
            <p className="truncate text-title-md">{name}</p>
            <p className="truncate text-body-md text-on-surface-variant">{email}</p>
            <p className="mt-2 text-label-md text-on-surface-variant">
              {roleLabel}
              {orgName ? ` · ${orgName}` : ""}
            </p>
          </div>
          <Dropdown.Separator className="my-1 h-px bg-outline-variant" />
          <Dropdown.Item asChild className={itemClass}>
            <Link href="/app/settings">
              <Icon icon={settingsIcon} size={20} className="text-on-surface-variant" />
              Settings
            </Link>
          </Dropdown.Item>
          <Dropdown.Item asChild className={itemClass}>
            <Link href="/app/settings/security">
              <Icon icon={shieldLockIcon} size={20} className="text-on-surface-variant" />
              Security
            </Link>
          </Dropdown.Item>
          {tours.welcomeTourId && (
            <Dropdown.Item className={itemClass} onSelect={() => tours.start(tours.welcomeTourId!)}>
              <Icon icon={travelExploreIcon} size={20} className="text-on-surface-variant" />
              Take a tour
            </Dropdown.Item>
          )}
          <Dropdown.Item className={itemClass} onSelect={(e) => { e.preventDefault(); toggleTheme(); }}>
            <Icon icon={theme === "dark" ? lightModeIcon : darkModeIcon} size={20} className="text-on-surface-variant" />
            {theme === "dark" ? "Light theme" : "Dark theme"}
          </Dropdown.Item>
          <Dropdown.Separator className="my-1 h-px bg-outline-variant" />
          <Dropdown.Item
            className={itemClass}
            onSelect={async () => {
              await authClient.signOut();
              router.replace("/sign-in");
              router.refresh();
            }}
          >
            <Icon icon={logoutIcon} size={20} className="text-on-surface-variant" />
            Sign out
          </Dropdown.Item>
        </Dropdown.Content>
      </Dropdown.Portal>
    </Dropdown.Root>
  );
}
