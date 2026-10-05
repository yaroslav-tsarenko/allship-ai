import { describeDetail, fieldsOf } from "@/features/loads/spec";
import type { LoadCategory } from "@/server/db/schema/enums";

const dayFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
const dayYearFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

function toDay(value: string | Date | null | undefined) {
  if (!value) return null;
  const d = typeof value === "string" ? new Date(value.length === 10 ? `${value}T12:00:00Z` : value) : value;
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDay(value: string | Date | null | undefined, withYear = false) {
  const d = toDay(value);
  if (!d) return "Flexible";
  return (withYear ? dayYearFmt : dayFmt).format(d);
}

export function formatWindow(start: string | null | undefined, end: string | null | undefined) {
  const a = toDay(start);
  const b = toDay(end);
  if (!a) return "Flexible";
  if (!b || dayFmt.format(a) === dayFmt.format(b)) return dayFmt.format(a);
  return `${dayFmt.format(a)} – ${dayFmt.format(b)}`;
}

export function place(stop: { city?: string | null; state?: string | null }) {
  return [stop.city, stop.state].filter(Boolean).join(", ") || "Location on file";
}

export function timeLeft(closesAt: Date | string | null | undefined, now = new Date()) {
  if (!closesAt) return { label: "Open", urgent: false };
  const ms = new Date(closesAt).getTime() - now.getTime();
  if (ms <= 0) return { label: "Bidding closed", urgent: true };
  const mins = Math.floor(ms / 60_000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days >= 1) return { label: `${days}d ${hours % 24}h left`, urgent: false };
  if (hours >= 1) return { label: `${hours}h ${mins % 60}m left`, urgent: hours < 6 };
  return { label: `${Math.max(mins, 1)}m left`, urgent: true };
}

export function keyDetails(category: LoadCategory, details: Record<string, unknown>, limit = 4) {
  const out: { label: string; value: string }[] = [];
  for (const f of fieldsOf(category)) {
    if (out.length >= limit) break;
    if (f.kind === "switch" || f.kind === "multiselect") continue;
    const value = describeDetail(f, details[f.name]);
    if (value) out.push({ label: f.label, value });
  }
  return out;
}

export function allDetails(category: LoadCategory, details: Record<string, unknown>) {
  return fieldsOf(category)
    .map((f) => ({ label: f.label, value: describeDetail(f, details[f.name]) }))
    .filter((d): d is { label: string; value: string } => d.value !== null);
}
