"use client";

import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";
import { useEffect, useRef } from "react";
import { publicEnv as env } from "@/lib/public-env";
import type { RealtimeEvent } from "@/server/realtime/topics";

type TokenState = { configured: boolean; token?: string; expiresAt?: number };

let client: Promise<SupabaseClient> | null = null;
let tokenPromise: Promise<TokenState> | null = null;
let tokenState: TokenState | null = null;

async function ensureToken(): Promise<TokenState> {
  if (tokenState && (!tokenState.configured || (tokenState.expiresAt ?? 0) - Date.now() > 60_000)) return tokenState;
  tokenPromise ??= fetch("/api/realtime/token", { cache: "no-store" })
    .then((r) => (r.ok ? (r.json() as Promise<TokenState>) : { configured: false }))
    .catch(() => ({ configured: false }))
    .finally(() => {
      tokenPromise = null;
    });
  tokenState = await tokenPromise;
  return tokenState;
}

function getClient() {
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  client ??= import("@supabase/supabase-js").then(({ createClient }) =>
    createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      realtime: { params: { eventsPerSecond: 10 } },
    }),
  ).catch((error: unknown) => {
    client = null;
    throw error;
  });
  return client;
}

export function invalidateRealtimeToken() {
  tokenState = null;
}

type Options = { fallbackIntervalMs?: number; onFallback?: () => void; enabled?: boolean };

export function useRealtime(topic: string | null, onEvent: (event: RealtimeEvent) => void, { fallbackIntervalMs = 15_000, onFallback, enabled = true }: Options = {}) {
  const handler = useRef(onEvent);
  const fallback = useRef(onFallback);

  useEffect(() => {
    handler.current = onEvent;
    fallback.current = onFallback;
  });

  useEffect(() => {
    if (!topic || !enabled) return;
    let channel: RealtimeChannel | null = null;
    let poll: ReturnType<typeof setInterval> | null = null;
    let cancelled = false;

    const startPolling = () => {
      if (poll || !fallback.current) return;
      poll = setInterval(() => {
        if (document.visibilityState === "visible") fallback.current?.();
      }, fallbackIntervalMs);
    };

    void (async () => {
      const pending = getClient();
      const [supabase, state] = pending ? await Promise.all([pending.catch(() => null), ensureToken()]) : [null, { configured: false } as TokenState];
      if (cancelled) return;
      if (!supabase || !state.configured || !state.token) {
        startPolling();
        return;
      }
      await supabase.realtime.setAuth(state.token);
      channel = supabase.channel(topic, { config: { private: true } });
      channel.on("broadcast", { event: "*" }, (message) => {
        handler.current({ event: message.event, payload: message.payload } as RealtimeEvent);
      });
      channel.subscribe((status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          invalidateRealtimeToken();
          startPolling();
        }
      });
    })();

    return () => {
      cancelled = true;
      if (poll) clearInterval(poll);
      if (channel) void channel.unsubscribe();
    };
  }, [topic, enabled, fallbackIntervalMs]);
}
