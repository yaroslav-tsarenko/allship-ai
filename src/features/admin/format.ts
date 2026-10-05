import type { LoadStop } from "@/server/db/schema/loads";

const dateFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });
const dateTimeFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });

export function formatDate(d: Date | null | undefined) {
  return d ? dateFmt.format(d) : "—";
}

export function formatDateTime(d: Date | null | undefined) {
  return d ? dateTimeFmt.format(d) : "—";
}

export function formatPlace(stop: LoadStop) {
  const place = [stop.city, stop.state].filter(Boolean).join(", ");
  return place || stop.postalCode || stop.address;
}

export function humanize(value: string) {
  const text = value.replace(/[_.]/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export type SearchParams = Record<string, string | string[] | undefined>;

export function param(sp: SearchParams, key: string) {
  const v = sp[key];
  return (Array.isArray(v) ? v[0] : v)?.trim() || undefined;
}

export function pageParam(sp: SearchParams) {
  const n = Number(param(sp, "page"));
  return Number.isInteger(n) && n > 0 ? n : 1;
}

export function oneOf<T extends string>(value: string | undefined, options: readonly T[], fallback: T): T {
  return options.includes(value as T) ? (value as T) : fallback;
}

export function hrefWith(base: string, current: Record<string, string | undefined>, changes: Record<string, string | undefined>) {
  const next = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...current, ...changes })) if (v) next.set(k, v);
  const qs = next.toString();
  return qs ? `${base}?${qs}` : base;
}
