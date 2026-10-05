"use client";

import { useRealtime } from "@/lib/realtime/use-realtime";
import { topics, type RealtimeEvent } from "@/server/realtime/topics";

export type LocationPayload = Extract<RealtimeEvent, { event: "location" }>["payload"];

export function LoadChannel({
  loadId,
  onLocation,
  onStatus,
  onFallback,
}: {
  loadId: string;
  onLocation: (payload: LocationPayload) => void;
  onStatus: () => void;
  onFallback: () => void;
}) {
  useRealtime(
    topics.load(loadId),
    (event) => {
      if (event.event === "location") onLocation(event.payload);
      else if (event.event === "load_status") onStatus();
    },
    { onFallback, fallbackIntervalMs: 15_000 },
  );
  return null;
}
