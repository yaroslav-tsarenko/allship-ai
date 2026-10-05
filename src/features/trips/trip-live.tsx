"use client";

import { useRouter } from "next/navigation";
import { useRealtime } from "@/lib/realtime/use-realtime";
import { topics } from "@/server/realtime/topics";

export function TripLive({ loadId }: { loadId: string }) {
  const router = useRouter();
  useRealtime(
    topics.load(loadId),
    (event) => {
      if (event.event === "load_status") router.refresh();
    },
    { onFallback: () => router.refresh(), fallbackIntervalMs: 30_000 },
  );
  return null;
}
