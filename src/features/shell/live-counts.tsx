"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { useRealtime } from "@/lib/realtime/use-realtime";
import { listNotificationsAction, markNotificationsReadAction, shellCountsAction } from "@/server/actions/notifications";
import { topics } from "@/server/realtime/topics";

export const COUNTS_EVENT = "allship:counts";

type Counts = { notifications: number; conversations: number };
type LiveCounts = Counts & { refresh: () => void; setNotifications: (n: number | ((n: number) => number)) => void; version: number };

const Ctx = createContext<LiveCounts>({ notifications: 0, conversations: 0, refresh: () => {}, setNotifications: () => {}, version: 0 });

export function useLiveCounts() {
  return useContext(Ctx);
}

export function requestCountsRefresh() {
  window.dispatchEvent(new Event(COUNTS_EVENT));
}

export function LiveCountsProvider({ userId, initial, children }: { userId: string; initial: Counts; children: ReactNode }) {
  const [counts, setCounts] = useState(initial);
  const [version, setVersion] = useState(0);
  const pathname = usePathname();
  const router = useRouter();
  const last = useRef(initial.notifications);
  const inflight = useRef(false);
  const path = useRef(pathname);

  useEffect(() => {
    path.current = pathname;
  }, [pathname]);

  const announce = useCallback(
    (id: string, title: string, href: string | null) => {
      if (href && path.current === href) {
        void markNotificationsReadAction({ ids: [id] })
          .then(() => window.dispatchEvent(new Event(COUNTS_EVENT)))
          .catch(() => {});
        return;
      }
      toast(title, href ? { action: { label: "View", onClick: () => router.push(href) } } : undefined);
    },
    [router],
  );

  const refresh = useCallback(
    async (fromPoll = false) => {
      if (inflight.current) return;
      inflight.current = true;
      try {
        const result = await shellCountsAction().catch(() => null);
        const next = result?.data;
        if (!next) return;
        const grew = next.notifications > last.current;
        last.current = next.notifications;
        setCounts(next);
        setVersion((v) => v + 1);
        if (fromPoll && grew) {
          const latest = await listNotificationsAction({ unreadOnly: true, limit: 1 }).catch(() => null);
          const item = latest?.data?.items[0];
          if (item) announce(item.id, item.title, item.href);
        }
      } finally {
        inflight.current = false;
      }
    },
    [announce],
  );

  useRealtime(
    topics.user(userId),
    (event) => {
      if (event.event !== "notification") return;
      announce(event.payload.id, event.payload.title, event.payload.href);
      void refresh();
    },
    { onFallback: () => void refresh(true), fallbackIntervalMs: 30_000 },
  );

  useEffect(() => {
    const handler = () => void refresh();
    window.addEventListener(COUNTS_EVENT, handler);
    return () => window.removeEventListener(COUNTS_EVENT, handler);
  }, [refresh]);

  const setNotifications = useCallback((n: number | ((n: number) => number)) => {
    setCounts((c) => {
      const value = typeof n === "function" ? n(c.notifications) : n;
      last.current = value;
      return { ...c, notifications: value };
    });
  }, []);

  const value = useMemo(() => ({ ...counts, refresh: () => void refresh(), setNotifications, version }), [counts, refresh, setNotifications, version]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
