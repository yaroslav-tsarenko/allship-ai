import { z } from "zod";
import { categories } from "@/content/categories";
import { loadCategories, type LoadCategory } from "@/server/db/schema/enums";
import { policyText } from "@/lib/validation/text-policy";
import { localToday, routeIssues, scheduleIssues } from "./route-rules";
import { stopSchema, US_STATES, type LoadInput } from "./schema";
import { detailsSchema, emptyDetails, fieldsOf, hasOther, otherKey } from "./spec";

export type StopValues = { address: string; city: string; state: string; postalCode: string; windowStart: string; windowEnd: string; notes: string; lat?: number; lng?: number; placeId?: string };

export type ZipStates = (zips: string[]) => Promise<(zip: string) => string | null | undefined>;

export type WizardValues = {
  category: LoadCategory | "";
  details: Record<string, unknown>;
  pickup: StopValues;
  dropoff: StopValues;
  title: string;
  notes: string;
  targetPrice: string;
  biddingDays: string;
};

export const wizardSteps = [
  { label: "What you're moving", short: "Category" },
  { label: "Details", short: "Details" },
  { label: "Pickup and delivery", short: "Route" },
  { label: "Review and post", short: "Review" },
] as const;

export const biddingDayOptions = ["1", "2", "3", "5", "7", "10", "14"].map((d) => ({ value: d, label: d === "1" ? "1 day" : `${d} days` }));

export const emptyStop = (): StopValues => ({ address: "", city: "", state: "", postalCode: "", windowStart: "", windowEnd: "", notes: "" });

export const emptyWizard = (): WizardValues => ({
  category: "",
  details: {},
  pickup: emptyStop(),
  dropoff: emptyStop(),
  title: "",
  notes: "",
  targetPrice: "",
  biddingDays: "5",
});

export function cleanDetails(details: unknown) {
  const out: Record<string, unknown> = {};
  if (!details || typeof details !== "object") return out;
  for (const [k, v] of Object.entries(details as Record<string, unknown>)) {
    if (v === "" || v === null || v === undefined) continue;
    out[k] = typeof v === "string" ? v.trim() : v;
  }
  return out;
}

const stopWithWindow = stopSchema.refine((s) => !s.windowEnd || s.windowEnd >= s.windowStart, { path: ["windowEnd"], message: "Must be on or after the first date" });

export function stepSchema(step: number, category: LoadCategory | "", options: { today?: string; zipStates?: ZipStates } = {}) {
  if (step === 0) return z.object({ category: z.enum(loadCategories, { error: "Choose what you're moving" }) });
  if (step === 1) {
    if (!category) return z.object({});
    return z.object({ details: z.preprocess(cleanDetails, detailsSchema(category)) });
  }
  if (step === 2) {
    const today = options.today ?? localToday();
    return z
      .object({ pickup: stopWithWindow, dropoff: stopWithWindow })
      .refine((v) => v.dropoff.windowStart >= v.pickup.windowStart, { path: ["dropoff", "windowStart"], message: "Delivery can't be before pickup" })
      .superRefine(async (v, ctx) => {
        const lookup = options.zipStates ? await options.zipStates([v.pickup.postalCode, v.dropoff.postalCode]) : undefined;
        for (const issue of [...scheduleIssues(v.pickup, v.dropoff, today), ...routeIssues(v.pickup, v.dropoff, category, lookup)]) ctx.addIssue({ code: "custom", path: issue.path, message: issue.message });
      });
  }
  return z.object({
    title: policyText({ label: "a short title", min: 4, max: 100, required: true, minMessage: "Give the load a short title" }),
    notes: policyText({ label: "notes", max: 2000, multiline: true }),
    targetPrice: z
      .string()
      .trim()
      .refine((v) => v === "" || (/^\d+(\.\d{1,2})?$/.test(v.replace(/,/g, "")) && Number(v.replace(/,/g, "")) <= 1_000_000), "Enter an amount in dollars, up to $1,000,000"),
    biddingDays: z.string(),
  });
}

const nonEmpty = (v: string) => (v.trim() ? v.trim() : undefined);

export function toPayload(values: WizardValues, publish: boolean, leadId?: string): LoadInput {
  const stop = (s: StopValues) => ({
    address: s.address.trim(),
    city: s.city.trim(),
    state: s.state,
    postalCode: s.postalCode.trim(),
    windowStart: s.windowStart,
    windowEnd: nonEmpty(s.windowEnd),
    notes: nonEmpty(s.notes),
    ...(typeof s.lat === "number" && typeof s.lng === "number" ? { lat: s.lat, lng: s.lng } : {}),
    ...(s.placeId ? { placeId: s.placeId } : {}),
  });
  const price = values.targetPrice.replace(/,/g, "").trim();
  return {
    category: values.category as LoadCategory,
    title: values.title.trim(),
    pickup: stop(values.pickup),
    dropoff: stop(values.dropoff),
    details: cleanDetails(values.details),
    notes: nonEmpty(values.notes),
    targetPrice: price ? Number(price) : undefined,
    biddingDays: Number(values.biddingDays) || 5,
    publish,
    leadId,
  };
}

export function detailsFor(category: LoadCategory, current: Record<string, unknown> = {}) {
  const base = emptyDetails(category);
  for (const f of fieldsOf(category)) {
    const v = current[f.name];
    if (v === undefined || v === null) continue;
    if (f.kind === "select" && !f.options.includes(String(v))) continue;
    if (f.kind === "multiselect") {
      if (Array.isArray(v)) base[f.name] = v.filter((x) => f.options.includes(String(x)));
      continue;
    }
    if (f.kind === "switch") {
      base[f.name] = Boolean(v);
      continue;
    }
    base[f.name] = typeof v === "number" ? String(v) : v;
  }
  for (const f of fieldsOf(category)) {
    const v = current[otherKey(f.name)];
    if (hasOther(f) && typeof v === "string") base[otherKey(f.name)] = v;
  }
  return base;
}

export function suggestTitle(values: WizardValues) {
  if (!values.category) return "";
  const cat = categories.find((c) => c.key === values.category);
  const d = values.details;
  const s = (k: string) => {
    const v = typeof d[k] === "string" || typeof d[k] === "number" ? String(d[k]).trim() : "";
    const other = typeof d[`${k}Other`] === "string" ? String(d[`${k}Other`]).trim() : "";
    return v === "Other" && other ? other : v;
  };
  const vehicle = [s("year"), s("make"), s("model")].filter(Boolean).join(" ");
  const route = values.pickup.city && values.dropoff.city ? ` to ${values.dropoff.city.trim()}` : "";
  let lead = "";
  switch (cat?.group) {
    case "vehicles":
      lead = vehicle || s("make") || s("description") || (s("type") && `${s("type")}`) || (s("rvType") && s("rvType")) || cat.shortName;
      if (values.category === "vehicle_parts" && s("description")) lead = s("description");
      break;
    case "moving":
      lead = s("bedrooms") ? `${s("bedrooms") === "Studio" ? "Studio" : `${s("bedrooms")}-bedroom`} ${cat.shortName.toLowerCase()}` : cat.shortName;
      break;
    case "freight":
      lead = s("description") || [s("equipmentType"), vehicle].filter(Boolean).join(", ") || cat.shortName;
      break;
    case "trucks":
      lead = s("truckType") ? `${s("truckType")}${s("cargo") ? ` for ${s("cargo").toLowerCase()}` : ""}` : cat.shortName;
      break;
    default:
      lead = cat?.shortName ?? "";
  }
  const title = `${lead}${route}`;
  return title.length > 100 ? title.slice(0, 100).trimEnd() : title;
}

const stateCodes = new Set<string>(US_STATES.map(([c]) => c));
const stateByName = new Map<string, string>(US_STATES.map(([c, n]) => [n.toLowerCase(), c]));

export function parsePlace(raw: string | null | undefined): Partial<StopValues> {
  const text = (raw ?? "").trim();
  if (!text) return {};
  const zip = text.match(/\b(\d{5})(?:-\d{4})?\b/)?.[1];
  const withoutZip = text.replace(/\b\d{5}(?:-\d{4})?\b/, "").replace(/\s+,/g, ",").trim().replace(/,$/, "");
  const parts = withoutZip.split(",").map((p) => p.trim()).filter(Boolean);
  const out: Partial<StopValues> = {};
  if (zip) out.postalCode = zip;
  if (parts.length >= 2) {
    const st = parts[parts.length - 1]!;
    const code = stateCodes.has(st.toUpperCase()) ? st.toUpperCase() : stateByName.get(st.toLowerCase());
    if (code) {
      out.state = code;
      out.city = parts.slice(0, -1).join(", ");
    } else {
      out.city = parts[0];
    }
  } else if (parts.length === 1) {
    const tokens = parts[0]!.split(/\s+/);
    const last = tokens[tokens.length - 1]!;
    if (tokens.length > 1 && stateCodes.has(last.toUpperCase())) {
      out.state = last.toUpperCase();
      out.city = tokens.slice(0, -1).join(" ");
    } else {
      out.city = parts[0];
    }
  }
  return out;
}

export type QuoteLead = { id: string; createdAt: Date | string; payload: Record<string, unknown> };

const quoteAliases: Record<string, string[]> = {
  bedrooms: ["homeSize"],
  quantity: ["pieces"],
  description: ["equipment"],
  truckType: ["truckSize"],
};

export function valuesFromLead(lead: QuoteLead): WizardValues | null {
  const p = lead.payload;
  const category = typeof p.category === "string" && (loadCategories as readonly string[]).includes(p.category) ? (p.category as LoadCategory) : null;
  if (!category) return null;
  const raw = (p.details && typeof p.details === "object" ? p.details : {}) as Record<string, string>;
  const mapped: Record<string, unknown> = { ...raw };
  for (const [target, sources] of Object.entries(quoteAliases)) {
    for (const src of sources) if (raw[src] && mapped[target] === undefined) mapped[target] = raw[src]!.replace(/ bedrooms?$/, "");
  }
  if (raw.trailer === "Open") mapped.trailer = "Open trailer";
  if (raw.trailer === "Enclosed") mapped.trailer = "Enclosed trailer";
  if (raw.trailer === "No preference") mapped.trailer = "Either";
  const date = typeof p.date === "string" && /^\d{4}-\d{2}-\d{2}/.test(p.date) ? p.date.slice(0, 10) : "";
  const values: WizardValues = {
    ...emptyWizard(),
    category,
    details: detailsFor(category, mapped),
    pickup: { ...emptyStop(), ...parsePlace(typeof p.from === "string" ? p.from : ""), windowStart: date },
    dropoff: { ...emptyStop(), ...parsePlace(typeof p.to === "string" ? p.to : "") },
    notes: typeof p.notes === "string" ? p.notes : "",
  };
  return values;
}
