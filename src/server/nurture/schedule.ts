export const sequenceIds = ["verify_publish", "abandoned_form", "load_followup", "post_delivery", "carrier_activation"] as const;
export type SequenceId = (typeof sequenceIds)[number];
export type EmailCategory = "transactional" | "lifecycle" | "marketing";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export type SequenceDef = {
  label: string;
  description: string;
  category: EmailCategory;
  steps: number[];
  conversions: string[];
  preferenceType: string | null;
};

export const sequences: Record<SequenceId, SequenceDef> = {
  verify_publish: {
    label: "Confirm email to publish",
    description: "Reminders to confirm the email address so a posted load goes live",
    category: "transactional",
    steps: [1 * HOUR, 24 * HOUR, 72 * HOUR],
    conversions: ["published", "verified", "email_confirmed"],
    preferenceType: null,
  },
  abandoned_form: {
    label: "Finish your quote",
    description: "Reminders to finish a quote form that was started but not sent",
    category: "marketing",
    steps: [30 * MINUTE, 24 * HOUR, 4 * DAY],
    conversions: ["submitted", "form_submitted"],
    preferenceType: "product_news",
  },
  load_followup: {
    label: "Load follow-up",
    description: "What happens after posting, how to compare bids and when bidding closes",
    category: "lifecycle",
    steps: [0, 24 * HOUR, 72 * HOUR],
    conversions: ["booked"],
    preferenceType: "bid_received",
  },
  post_delivery: {
    label: "After delivery",
    description: "A request to rate the carrier, then a note about the next shipment",
    category: "lifecycle",
    steps: [1 * DAY, 14 * DAY],
    conversions: ["reviewed"],
    preferenceType: "product_news",
  },
  carrier_activation: {
    label: "Carrier activation",
    description: "Verification status, payouts, rate card and bidding tips for new carriers",
    category: "lifecycle",
    steps: [0, 1 * DAY, 3 * DAY, 6 * DAY],
    conversions: ["activated"],
    preferenceType: "product_news",
  },
};

export const isSequenceId = (value: unknown): value is SequenceId => typeof value === "string" && (sequenceIds as readonly string[]).includes(value);

export const QUIET_START_HOUR = 8;
export const QUIET_END_HOUR = 20;
export const DEFAULT_TIME_ZONE = "America/Chicago";
export const DAILY_CAP = 2;
export const MIN_STEP_GAP_MS = 4 * HOUR;
export const SEND_LEASE_MS = 10 * MINUTE;
export const RETRY_DELAY_MS = 30 * MINUTE;
export const MAX_SEND_ATTEMPTS = 3;

const stateZones: Record<string, string> = {
  AL: "America/Chicago", AK: "America/Anchorage", AZ: "America/Phoenix", AR: "America/Chicago", CA: "America/Los_Angeles",
  CO: "America/Denver", CT: "America/New_York", DE: "America/New_York", DC: "America/New_York", FL: "America/New_York",
  GA: "America/New_York", HI: "Pacific/Honolulu", ID: "America/Boise", IL: "America/Chicago", IN: "America/Indiana/Indianapolis",
  IA: "America/Chicago", KS: "America/Chicago", KY: "America/New_York", LA: "America/Chicago", ME: "America/New_York",
  MD: "America/New_York", MA: "America/New_York", MI: "America/Detroit", MN: "America/Chicago", MS: "America/Chicago",
  MO: "America/Chicago", MT: "America/Denver", NE: "America/Chicago", NV: "America/Los_Angeles", NH: "America/New_York",
  NJ: "America/New_York", NM: "America/Denver", NY: "America/New_York", NC: "America/New_York", ND: "America/Chicago",
  OH: "America/New_York", OK: "America/Chicago", OR: "America/Los_Angeles", PA: "America/New_York", RI: "America/New_York",
  SC: "America/New_York", SD: "America/Chicago", TN: "America/Chicago", TX: "America/Chicago", UT: "America/Denver",
  VT: "America/New_York", VA: "America/New_York", WA: "America/Los_Angeles", WV: "America/New_York", WI: "America/Chicago",
  WY: "America/Denver", PR: "America/Puerto_Rico",
};

export function timeZoneForState(state: string | null | undefined) {
  const key = state?.trim().toUpperCase();
  return (key && stateZones[key]) || DEFAULT_TIME_ZONE;
}

function zonedParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return { year: get("year"), month: get("month"), day: get("day"), hour: get("hour") % 24, minute: get("minute"), second: get("second") };
}

function offsetMs(date: Date, timeZone: string) {
  const p = zonedParts(date, timeZone);
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - (date.getTime() - date.getMilliseconds());
}

function zonedTime(year: number, month: number, day: number, hour: number, timeZone: string) {
  const guess = Date.UTC(year, month - 1, day, hour);
  const first = guess - offsetMs(new Date(guess), timeZone);
  return new Date(guess - offsetMs(new Date(first), timeZone));
}

export function localHour(date: Date, timeZone: string) {
  return zonedParts(date, timeZone).hour;
}

export function isWithinSendWindow(date: Date, timeZone: string) {
  const hour = localHour(date, timeZone);
  return hour >= QUIET_START_HOUR && hour < QUIET_END_HOUR;
}

export function nextSendWindow(date: Date, timeZone: string) {
  if (isWithinSendWindow(date, timeZone)) return date;
  const p = zonedParts(date, timeZone);
  const base = p.hour >= QUIET_END_HOUR ? new Date(Date.UTC(p.year, p.month - 1, p.day + 1)) : new Date(Date.UTC(p.year, p.month - 1, p.day));
  return zonedTime(base.getUTCFullYear(), base.getUTCMonth() + 1, base.getUTCDate(), QUIET_START_HOUR, timeZone);
}

export function firstSendAt(sequence: SequenceId, anchor: Date) {
  return new Date(anchor.getTime() + (sequences[sequence].steps[0] ?? 0));
}

export function nextStepAt(sequence: SequenceId, nextStep: number, anchor: Date, lastSentAt: Date | null, now: Date) {
  const offset = sequences[sequence].steps[nextStep];
  if (offset === undefined) return null;
  const scheduled = anchor.getTime() + offset;
  const gap = lastSentAt ? lastSentAt.getTime() + MIN_STEP_GAP_MS : 0;
  return new Date(Math.max(scheduled, gap, now.getTime()));
}

export function capReleaseAt(sentInWindow: Date[], now: Date, cap = DAILY_CAP) {
  if (sentInWindow.length < cap) return null;
  const sorted = [...sentInWindow].sort((a, b) => a.getTime() - b.getTime());
  const oldestThatMustExpire = sorted[sorted.length - cap];
  if (!oldestThatMustExpire) return null;
  return new Date(Math.max(now.getTime(), oldestThatMustExpire.getTime() + DAY + MINUTE));
}

export function anchorOf(context: Record<string, unknown>, createdAt: Date) {
  const raw = context.anchorAt;
  if (typeof raw === "string") {
    const d = new Date(raw);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return createdAt;
}
