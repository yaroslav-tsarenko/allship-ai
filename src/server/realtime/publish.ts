import "server-only";
import { env } from "@/env";
import type { RealtimeEvent } from "./topics";
import { log } from "@/lib/log";

export function realtimeConfigured() {
  return Boolean(env.NEXT_PUBLIC_SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY && env.SUPABASE_JWT_SECRET);
}

export async function publish(topicList: string | string[], message: RealtimeEvent) {
  if (!realtimeConfigured()) return;
  const list = Array.isArray(topicList) ? topicList : [topicList];
  if (list.length === 0) return;
  try {
    await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/realtime/v1/api/broadcast`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: env.SUPABASE_SERVICE_ROLE_KEY!, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` },
      body: JSON.stringify({ messages: list.map((topic) => ({ topic, event: message.event, payload: message.payload, private: true })) }),
      signal: AbortSignal.timeout(3000),
    });
  } catch (error) {
    log.warn("realtime publish failed", { scope: "realtime", err: error });
  }
}
