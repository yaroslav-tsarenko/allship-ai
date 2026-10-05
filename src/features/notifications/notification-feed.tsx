"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { doneAllIcon, notificationsOffIcon, taskAltIcon } from "@/components/ui/icons.generated";
import { cn } from "@/lib/cn";
import { listNotificationsAction, markAllNotificationsReadAction, markNotificationsReadAction } from "@/server/actions/notifications";
import type { NotificationItem } from "@/server/notifications/queries";
import { useLiveCounts } from "@/features/shell/live-counts";
import { dayLabel, notificationIcon, relativeTime } from "./presentation";

export function NotificationFeed({ initial, nextCursor, unreadOnly }: { initial: NotificationItem[]; nextCursor: string | null; unreadOnly: boolean }) {
  const [items, setItems] = useState(initial);
  const [cursor, setCursor] = useState(nextCursor);
  const [loading, setLoading] = useState(false);
  const { notifications: unread, setNotifications, version } = useLiveCounts();
  const router = useRouter();

  useEffect(() => {
    if (version === 0) return;
    let cancelled = false;
    void listNotificationsAction({ unreadOnly })
      .catch(() => null)
      .then((result) => {
      if (cancelled || !result?.data) return;
      const fresh = result.data.items;
      setItems((list) => {
        const known = new Set(list.map((n) => n.id));
        const added = fresh.filter((n) => !known.has(n.id));
        return added.length ? [...added, ...list] : list;
      });
    });
    return () => {
      cancelled = true;
    };
  }, [version, unreadOnly]);

  const more = async () => {
    if (!cursor) return;
    setLoading(true);
    const result = await listNotificationsAction({ before: cursor, unreadOnly }).catch(() => null);
    setLoading(false);
    if (!result?.data) return;
    setItems((list) => [...list, ...result.data!.items]);
    setCursor(result.data.nextCursor);
  };

  const open = (item: NotificationItem) => {
    if (item.readAt) return;
    setItems((list) => list.map((n) => (n.id === item.id ? { ...n, readAt: new Date().toISOString() } : n)));
    setNotifications((n) => Math.max(0, n - 1));
    void markNotificationsReadAction({ ids: [item.id] }).catch(() => {});
  };

  const markAll = async () => {
    setItems((list) => list.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
    setNotifications(0);
    await markAllNotificationsReadAction().catch(() => null);
    router.refresh();
  };

  const groups: { label: string; items: NotificationItem[] }[] = [];
  for (const item of items) {
    const label = dayLabel(item.createdAt);
    const group = groups.at(-1);
    if (group?.label === label) group.items.push(item);
    else groups.push({ label, items: [item] });
  }

  const hasUnread = unread > 0 || items.some((n) => !n.readAt);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex min-h-10 items-center justify-end">
        {hasUnread && (
          <Button variant="text" leading={<Icon icon={doneAllIcon} size={18} />} onClick={markAll}>
            Mark all as read
          </Button>
        )}
      </div>
      {items.length === 0 ? (
        unreadOnly ? (
          <EmptyState icon={taskAltIcon} title="No unread notifications" description="You've seen everything. New bids, trip updates and messages will appear here." />
        ) : (
          <EmptyState icon={notificationsOffIcon} title="No notifications yet" description="We'll let you know about bids, bookings, trip updates and messages." />
        )
      ) : (
        groups.map((group) => (
          <section key={group.label} aria-label={group.label} className="flex flex-col">
            <h2 className="px-4 pt-4 pb-2 text-title-sm text-on-surface-variant">{group.label}</h2>
            <ul className="flex flex-col overflow-hidden rounded-xl bg-surface-container-low">
              {group.items.map((item, i) => {
                const body = (
                  <>
                    <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-full", item.readAt ? "bg-surface-container-highest text-on-surface-variant" : "bg-secondary-container text-on-secondary-container")}>
                      <Icon icon={notificationIcon(item.type)} size={20} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={cn("block text-body-lg text-on-surface", !item.readAt && "font-medium")}>{item.title}</span>
                      {item.body && <span className="line-clamp-2 block text-body-md text-on-surface-variant">{item.body}</span>}
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-2">
                      <span className="text-label-md text-on-surface-variant">{relativeTime(item.createdAt)}</span>
                      {!item.readAt && <span aria-label="Unread" className="size-2.5 rounded-full bg-primary" />}
                    </span>
                  </>
                );
                const cls = cn("state-layer flex items-start gap-4 px-4 py-4", i > 0 && "border-t border-outline-variant/50");
                return (
                  <li key={item.id}>
                    {item.href ? (
                      <Link href={item.href} onClick={() => open(item)} className={cls}>
                        {body}
                      </Link>
                    ) : (
                      <button type="button" onClick={() => open(item)} className={cn(cls, "w-full cursor-pointer text-left")}>
                        {body}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}
      {cursor && (
        <div className="flex justify-center pt-4">
          <Button variant="outlined" loading={loading} onClick={more}>
            Show older
          </Button>
        </div>
      )}
    </div>
  );
}
