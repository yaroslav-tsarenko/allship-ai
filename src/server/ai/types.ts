import type { TourId } from "@/features/tours/ids";

export type LoadPrefill = {
  category: string;
  title?: string;
  pickup?: { city?: string; state?: string; postalCode?: string; date?: string };
  dropoff?: { city?: string; state?: string; postalCode?: string; date?: string };
  details?: Record<string, unknown>;
  notes?: string;
  targetPrice?: number;
};

export type AssistantAction =
  | { type: "navigate"; href: string; label: string }
  | { type: "start_tour"; tourId: TourId; label: string }
  | { type: "prefill_load"; prefill: LoadPrefill; label: string }
  | { type: "prefill_bid"; publicId: string; amount: number; message: string; label: string };

export type StoredPart =
  | { type: "text"; text: string }
  | { type: "tool"; name: string; summary: string }
  | { type: "action"; action: AssistantAction };

export type StreamEvent =
  | { type: "thread"; threadId: string; title: string }
  | { type: "text"; delta: string }
  | { type: "tool"; name: string; label: string }
  | { type: "action"; action: AssistantAction }
  | { type: "done"; messageId: string; offline: boolean }
  | { type: "error"; message: string };

export type PageContext = { path: string; title?: string; publicId?: string };
