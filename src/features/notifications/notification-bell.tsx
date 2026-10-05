"use client";

import * as Dropdown from "@radix-ui/react-dropdown-menu";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { doneAllIcon, notificationsIcon, notificationsOffIcon } from "@/components/ui/icons.generated";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/cn";
import { listNotificationsAction, markAllNotificationsReadAction, markNotificationsReadAction } from "@/server/actions/notifications";
import type { NotificationItem } from "@/server/notifications/queries";
import { useLiveCounts } from "@/features/shell/live-counts";
import { notificationIcon, relativeTime } from "./presentation";

export function NotificationBell() {
  const { notifications: unread, setNotifications, version } = useLiveCounts();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[] | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void listNotificationsAction({ limit: 10 })
      .catch(() => null)
      .then((result) => {
      if (!cancelled && result?.data) setItems(result.data.items);
    });
    return () => {
      cancelled = true;
    };
  }, [open, version]);

  const openItem = (item: NotificationItem) => {
    if (!item.readAt) {
      setItems((list) => list?.map((n) => (n.id === item.id ? { ...n, readAt: new Date().toISOString() } : n)) ?? null);
      setNotifications((n) => Math.max(0, n - 1));
      void markNotificationsReadAction({ ids: [item.id] }).catch(() => {});
    }
    if (item.href) router.push(item.href);
  };

  const markAll = () => {
    setItems((list) => list?.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })) ?? null);
    setNotifications(0);
    void markAllNotificationsReadAction().catch(() => {});
  };

  const label = unread > 0 ? `Notifications, ${unread} unread` : "Notifications";

  return (
    <Dropdown.Root open={open} onOpenChange={setOpen}>
      <Dropdown.Trigger
        aria-label={label}
        title="Notifications"
        className="state-layer relative inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-[20px] text-on-surface-variant transition-[border-radius,background-color] duration-(--duration-short4) data-[state=open]:bg-secondary-container data-[state=open]:text-on-secondary-container active:rounded-[12px]"
      >
        <Icon icon={notificationsIcon} filled={open} size={24} />
        {unread > 0 && (
          <span key={unread} className="absolute top-1 right-1 flex h-4 min-w-4 animate-pop-in items-center justify-center rounded-full bg-error px-1 text-[11px] leading-none font-medium text-on-error">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </Dropdown.Trigger>
      <Dropdown.Portal>
        <Dropdown.Content
          align="end"
          sideOffset={8}
          collisionPadding={8}
          className="z-50 flex max-h-[min(560px,calc(100dvh-88px))] w-[min(380px,calc(100vw-16px))] origin-(--radix-dropdown-menu-content-transform-origin) flex-col overflow-hidden rounded-xl bg-surface-container-high text-on-surface shadow-elevation-2 data-[state=closed]:animate-menu-out data-[state=open]:animate-menu-in"
        >
          <div className="flex items-center justify-between gap-2 py-2 pr-2 pl-4">
            <Dropdown.Label className="text-title-md">Notifications</Dropdown.Label>
            {unread > 0 && (
              <button type="button" onClick={markAll} className="state-layer inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full px-3 text-label-lg font-medium text-primary">
                <Icon icon={doneAllIcon} size={18} />
                Mark all read
              </button>
            )}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {items === null ? (
              <div className="flex justify-center py-10">
                <Spinner size={24} />
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
                <Icon icon={notificationsOffIcon} size={32} className="text-on-surface-variant" />
                <p className="text-body-md text-on-surface-variant">You&apos;re all caught up. Bids, bookings and messages will show up here.</p>
              </div>
            ) : (
              items.map((item) => (
                <Dropdown.Item
                  key={item.id}
                  onSelect={() => openItem(item)}
                  className="state-layer flex cursor-pointer gap-3 px-4 py-3 outline-none data-[highlighted]:bg-on-surface/8"
                >
                  <span className={cn("mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full", item.readAt ? "bg-surface-container-highest text-on-surface-variant" : "bg-secondary-container text-on-secondary-container")}>
                    <Icon icon={notificationIcon(item.type)} size={20} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline gap-2">
                      <span className={cn("min-w-0 flex-1 truncate text-body-lg", !item.readAt && "font-medium")}>{item.title}</span>
                      <span className="shrink-0 text-label-md text-on-surface-variant">{relativeTime(item.createdAt)}</span>
                    </span>
                    {item.body && <span className="line-clamp-2 text-body-md text-on-surface-variant">{item.body}</span>}
                  </span>
                  {!item.readAt && <span aria-label="Unread" className="mt-2 size-2 shrink-0 rounded-full bg-primary" />}
                </Dropdown.Item>
              ))
            )}
          </div>
          <Dropdown.Separator className="h-px bg-outline-variant" />
          <Dropdown.Item asChild className="state-layer flex h-12 cursor-pointer items-center justify-center text-label-lg font-medium text-primary outline-none data-[highlighted]:bg-on-surface/8">
            <Link href="/app/notifications">See all notifications</Link>
          </Dropdown.Item>
        </Dropdown.Content>
      </Dropdown.Portal>
    </Dropdown.Root>
  );
}
