import { emptyStop, emptyWizard, detailsFor, type WizardValues } from "@/features/loads/wizard-model";
import { loadCategories, type LoadCategory } from "@/server/db/schema/enums";
import type { LoadPrefill } from "@/server/ai/types";

export const loadPrefillKey = "allship:prefill-load";
export const bidPrefillKey = (publicId: string) => `allship:prefill-bid:${publicId}`;

export type BidPrefill = { amount: number; message: string };

function take(key: string): unknown {
  try {
    const raw = window.sessionStorage.getItem(key);
    if (raw === null) return null;
    window.sessionStorage.removeItem(key);
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function put(key: string, value: unknown) {
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export function isAiPrefillUrl() {
  return typeof window !== "undefined" && new URLSearchParams(window.location.search).get("prefill") === "ai";
}

export function clearPrefillParam() {
  const url = new URL(window.location.href);
  if (!url.searchParams.has("prefill")) return;
  url.searchParams.delete("prefill");
  window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
}

export function storeLoadPrefill(prefill: LoadPrefill) {
  put(loadPrefillKey, prefill);
}

export function storeBidPrefill(publicId: string, value: BidPrefill) {
  put(bidPrefillKey(publicId), value);
}

const str = (v: unknown, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");

type PrefillSignal = { kind: "load" | "bid"; publicId?: string; handled: boolean };
const prefillEvent = "allship:prefill";

export function announcePrefill(kind: PrefillSignal["kind"], publicId?: string) {
  const detail: PrefillSignal = { kind, publicId, handled: false };
  window.dispatchEvent(new CustomEvent(prefillEvent, { detail }));
  return detail.handled;
}

export function onPrefill(kind: PrefillSignal["kind"], handler: (publicId?: string) => boolean) {
  const listener = (event: Event) => {
    const detail = (event as CustomEvent<PrefillSignal>).detail;
    if (detail?.kind === kind && handler(detail.publicId)) detail.handled = true;
  };
  window.addEventListener(prefillEvent, listener);
  return () => window.removeEventListener(prefillEvent, listener);
}

export function takeLoadPrefill(force = false): WizardValues | null {
  if (!force && !isAiPrefillUrl()) return null;
  const raw = take(loadPrefillKey) as LoadPrefill | null;
  if (!raw || typeof raw !== "object") return null;
  const category = (loadCategories as readonly string[]).includes(raw.category)
    ? (raw.category as LoadCategory)
    : "";
  const stop = (s: LoadPrefill["pickup"]) => ({
    ...emptyStop(),
    city: str(s?.city, 80),
    state: /^[A-Z]{2}$/.test(str(s?.state)) ? str(s?.state) : "",
    postalCode: /^\d{5}$/.test(str(s?.postalCode)) ? str(s?.postalCode) : "",
    windowStart: /^\d{4}-\d{2}-\d{2}$/.test(str(s?.date)) ? str(s?.date) : "",
  });
  const price =
    typeof raw.targetPrice === "number" && raw.targetPrice > 0 ? String(Math.round(raw.targetPrice)) : "";
  return {
    ...emptyWizard(),
    category,
    details: category
      ? detailsFor(category, raw.details && typeof raw.details === "object" ? raw.details : {})
      : {},
    pickup: stop(raw.pickup),
    dropoff: stop(raw.dropoff),
    title: str(raw.title, 100),
    notes: str(raw.notes, 2000),
    targetPrice: price,
  };
}

export function takeBidPrefill(publicId: string, force = false): BidPrefill | null {
  if (!force && !isAiPrefillUrl()) return null;
  const raw = take(bidPrefillKey(publicId)) as Partial<BidPrefill> | null;
  if (!raw || typeof raw !== "object") return null;
  const amount =
    typeof raw.amount === "number" && Number.isFinite(raw.amount) && raw.amount > 0
      ? Math.round(raw.amount)
      : 0;
  const message = str(raw.message, 2000);
  if (!amount && !message) return null;
  return { amount, message };
}
