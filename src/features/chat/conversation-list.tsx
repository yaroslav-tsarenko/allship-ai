"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { attachFileIcon, forumIcon } from "@/components/ui/icons.generated";
import { cn } from "@/lib/cn";
import { listConversationsAction } from "@/server/actions/chat";
import type { ConversationSummary } from "@/server/chat/service";
import { useLiveCounts } from "@/features/shell/live-counts";
import { CHAT_READ_EVENT, CHAT_UPDATED_EVENT, avatarTone, initials, listTime } from "./format";

const POLL_MS = 20_000;

export function ConversationList({ initial, viewerId, activeId }: { initial: ConversationSummary[]; viewerId: string; activeId: string | null }) {
  const [items, setItems] = useState(initial);
  const { version } = useLiveCounts();
  const busy = useRef(false);
  const active = useRef(activeId);

  useEffect(() => {
    active.current = activeId;
  }, [activeId]);

  const reload = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    try {
      const result = await listConversationsAction().catch(() => null);
      if (result?.data) setItems(result.data.map((c) => (c.id === active.current ? { ...c, unread: 0 } : c)));
    } finally {
      busy.current = false;
    }
  }, []);

  useEffect(() => {
    if (version > 0) void reload();
  }, [version, reload]);

  useEffect(() => {
    const onRead = (e: Event) => {
      const id = (e as CustomEvent<string>).detail;
      setItems((list) => list.map((c) => (c.id === id ? { ...c, unread: 0 } : c)));
    };
    const onUpdated = () => void reload();
    window.addEventListener(CHAT_READ_EVENT, onRead);
    window.addEventListener(CHAT_UPDATED_EVENT, onUpdated);
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") void reload();
    }, POLL_MS);
    return () => {
      window.removeEventListener(CHAT_READ_EVENT, onRead);
      window.removeEventListener(CHAT_UPDATED_EVENT, onUpdated);
      clearInterval(timer);
    };
  }, [reload]);

  if (items.length === 0) {
    return <EmptyState compact icon={forumIcon} title="No conversations yet" description="Once a load is booked, you can message the other side here. Drivers join when they're assigned." />;
  }

  return (
    <ul aria-label="Conversations" className="flex flex-col gap-0.5 pb-2">
      {items.map((c) => {
        const isActive = c.id === activeId;
        const unread = c.unread > 0 && !isActive;
        const last = c.lastMessage;
        const who = last ? (last.senderId === viewerId ? "You" : last.senderName.split(" ")[0]) : null;
        const text = last ? last.body || (last.attachments === 1 ? "Attachment" : `${last.attachments} attachments`) : "No messages yet. Say hello.";
        return (
          <li key={c.id}>
            <Link
              href={`/app/messages/${c.id}`}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "state-layer flex items-center gap-4 rounded-xl px-4 py-3 transition-colors duration-(--duration-short4)",
                isActive ? "bg-secondary-container text-on-secondary-container" : "text-on-surface",
              )}
            >
              <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-full text-title-sm font-medium", avatarTone(c.counterpart))} aria-hidden="true">
                {initials(c.counterpart)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline gap-2">
                  <span className={cn("min-w-0 flex-1 truncate text-body-lg", unread && "font-semibold")}>{c.counterpart}</span>
                  <span className={cn("shrink-0 text-label-md", unread ? "font-semibold text-primary" : "text-on-surface-variant")}>{listTime(c.lastActivityAt)}</span>
                </span>
                <span className="block truncate text-label-md text-on-surface-variant">
                  {c.loadPublicId} · {c.loadTitle}
                </span>
                <span className="mt-0.5 flex items-center gap-2">
                  <span className={cn("flex min-w-0 flex-1 items-center gap-1 truncate text-body-md", unread ? "font-medium text-on-surface" : "text-on-surface-variant")}>
                    {last && !last.body && <Icon icon={attachFileIcon} size={16} className="shrink-0" />}
                    <span className="truncate">{who ? `${who}: ${text}` : text}</span>
                  </span>
                  {unread && (
                    <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-label-sm font-medium text-on-primary">
                      {c.unread > 99 ? "99+" : c.unread}
                      <span className="sr-only"> unread</span>
                    </span>
                  )}
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
