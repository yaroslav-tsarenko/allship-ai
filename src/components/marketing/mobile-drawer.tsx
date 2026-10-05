"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import type { ReactNode } from "react";
import { enter } from "@/components/motion/enter";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { authLinks, headerLinks, megaNav, site } from "@/content/site";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCloseAutoFocus: (e: Event) => void;
  pathname: string;
  icons: DrawerIcons;
};

export type DrawerIcons = { close: ReactNode; chevron: ReactNode; arrow: ReactNode; call: ReactNode };

const sectionFor = (pathname: string) =>
  megaNav.find((s) => s.groups.some((g) => g.href === pathname || g.links.some((l) => l.href.split(/[?#]/)[0] === pathname)))?.id ?? "ship";

export function MobileDrawer({ open, onOpenChange, onCloseAutoFocus, pathname, icons }: Props) {
  const current = sectionFor(pathname);
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Content
          onCloseAutoFocus={onCloseAutoFocus}
          className="fixed inset-0 z-50 flex flex-col bg-surface outline-none data-[state=closed]:animate-fade-out data-[state=open]:animate-dialog-in"
        >
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-outline-variant px-4">
            <Logo height={24} />
            <Dialog.Close
              aria-label="Close menu"
              title="Close menu"
              className="state-layer inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-[20px] text-on-surface-variant transition-[color,background-color,border-radius] duration-(--duration-short4) ease-standard active:rounded-[12px]"
            >
              {icons.close}
            </Dialog.Close>
          </div>
          <Dialog.Title className="sr-only">Menu</Dialog.Title>
          <Dialog.Description className="sr-only">Site navigation</Dialog.Description>
          <nav aria-label="Mobile" className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pt-2 pb-6">
            {megaNav.map((section, si) => (
              <details key={section.id} name="mobile-nav" open={section.id === current} className="m3-details group border-b border-outline-variant" {...enter(Math.min(si, 4))}>
                <summary className="state-layer flex h-14 cursor-pointer list-none items-center justify-between rounded-md px-3 text-title-md text-on-surface [&::-webkit-details-marker]:hidden">
                  {section.label}
                  <span className="inline-flex text-on-surface-variant transition-transform duration-(--duration-medium2) ease-standard group-open:rotate-180">{icons.chevron}</span>
                </summary>
                <div className="flex flex-col gap-5 px-1 pt-1 pb-5">
                  {section.groups.map((group) => (
                    <div key={group.label}>
                      {section.groups.length > 1 && (
                        <p className="px-3 pb-1 text-label-md font-medium tracking-[0.08em] text-on-surface-variant uppercase">{group.label}</p>
                      )}
                      <ul className="grid grid-cols-1 medium:grid-cols-2">
                        {group.links.map((link) => (
                          <li key={link.href}>
                            <Link
                              href={link.href}
                              aria-current={pathname === link.href ? "page" : undefined}
                              className="state-layer flex flex-col rounded-md px-3 py-2.5 aria-[current=page]:bg-secondary-container"
                            >
                              <span className="text-body-lg text-on-surface">{link.label}</span>
                              {link.description && <span className="text-body-sm text-on-surface-variant">{link.description}</span>}
                            </Link>
                          </li>
                        ))}
                      </ul>
                      {group.more && (
                        <Link href={group.more.href} className="state-layer inline-flex items-center gap-1 rounded-full px-3 py-2 text-label-lg font-medium text-primary">
                          {group.more.label}
                          {icons.arrow}
                        </Link>
                      )}
                    </div>
                  ))}
                  {section.features?.map((f) => (
                    <Link key={f.href} href={f.href} className="state-layer mx-2 flex flex-col gap-0.5 rounded-md border border-outline-variant px-4 py-3">
                      <span className="flex items-center gap-2 text-title-sm text-primary">
                        {f.label}
                        {icons.arrow}
                      </span>
                      <span className="text-body-sm text-on-surface-variant">{f.description}</span>
                    </Link>
                  ))}
                  {section.guides && (
                    <div>
                      <p className="px-3 pb-1 text-label-md font-medium tracking-[0.08em] text-on-surface-variant uppercase">{section.guides.label}</p>
                      <ul className="flex flex-wrap gap-2 px-3 pt-1">
                        {section.guides.links.map((link) => (
                          <li key={link.href}>
                            <Link href={link.href} className="state-layer inline-flex h-8 items-center rounded-sm border border-outline-variant px-3 text-label-lg text-on-surface-variant">
                              {link.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </details>
            ))}
            <ul className="mt-2" {...enter(5)}>
              {headerLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} aria-current={pathname === link.href ? "page" : undefined} className="state-layer flex h-14 items-center rounded-md px-3 text-title-md text-on-surface aria-[current=page]:bg-secondary-container">
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <a href={site.phone.href} data-track="click_to_call" className="state-layer flex h-14 items-center gap-3 rounded-md px-3 text-title-md text-on-surface">
                  <span className="inline-flex text-primary">{icons.call}</span>
                  {site.phone.display}
                </a>
              </li>
            </ul>
          </nav>
          <div className="shrink-0 border-t border-outline-variant bg-surface-container-low px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))]">
            <Button asChild size="lg" className="w-full">
              <Link href="/quote" data-track="drawer_quote">
                Ship something
              </Link>
            </Button>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Button asChild variant="outlined">
                <Link href={authLinks.signIn.href}>{authLinks.signIn.label}</Link>
              </Button>
              <Button asChild variant="tonal">
                <Link href={authLinks.signUp.href}>{authLinks.signUp.label}</Link>
              </Button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
