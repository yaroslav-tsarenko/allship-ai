import { z } from "zod";
import { categories } from "@/content/categories";
import { US_STATES } from "@/features/loads/schema";
import { detailsSchema, emptyDetails } from "@/features/loads/spec";
import { cleanDetails, suggestTitle, type WizardValues } from "@/features/loads/wizard-model";
import type { LoadCategory } from "@/server/db/schema/enums";

export type FormKind = "vehicle" | "moving" | "heavy" | "freight" | "rent";

export type StepKey = "type" | "location" | "details" | "contact";

export type FormConfig = {
  kind: FormKind;
  path: string;
  heading: string;
  intro: string;
  choices: LoadCategory[];
  steps: StepKey[];
  submitLabel: string;
};

export const vehicleChoices: LoadCategory[] = ["car_or_light_truck", "motorcycle", "powerboat", "sailboat", "personal_watercraft", "atv_powersports", "commercial_truck", "vehicle_parts", "trailer", "rv"];
export const movingChoices: LoadCategory[] = ["local_moving", "long_distance_moving", "business_moving", "heavy_lifting", "household_items", "office_moving", "corporate_relocation", "student_moving", "military_moving"];

export const formConfigs: Record<FormKind, FormConfig> = {
  vehicle: { kind: "vehicle", path: "/vehicle-load", heading: "Vehicle load", intro: "Create a new vehicle load", choices: vehicleChoices, steps: ["type", "location", "details", "contact"], submitLabel: "Create load" },
  moving: { kind: "moving", path: "/moving-load", heading: "Moving load", intro: "Create a new moving load", choices: movingChoices, steps: ["type", "location", "details", "contact"], submitLabel: "Create load" },
  heavy: { kind: "heavy", path: "/heavy-load", heading: "Heavy equipment load", intro: "Create a new heavy equipment load", choices: ["heavy_equipment"], steps: ["location", "details", "contact"], submitLabel: "Create load" },
  freight: { kind: "freight", path: "/freight-load", heading: "Freight load", intro: "Create a new freight load", choices: ["freight"], steps: ["location", "details", "contact"], submitLabel: "Create load" },
  rent: { kind: "rent", path: "/rent-truck", heading: "Rent a truck", intro: "Book a truck with a driver for the day", choices: ["truck_rental"], steps: ["location", "details", "contact"], submitLabel: "Rent truck" },
};

export const stepCopy: Record<StepKey, { label: string; title: string; lead: string }> = {
  type: { label: "Type", title: "What are you moving?", lead: "Pick the closest match. Each type asks only what carriers need to price it." },
  location: { label: "Location & time", title: "Location & time", lead: "Where the load is picked up and delivered, and when. Street addresses stay private until you book a carrier." },
  details: { label: "Details", title: "Load details", lead: "Fill out the form below to create a new load. The more carriers know, the closer their bids are to the final price." },
  contact: { label: "Contact & publish", title: "Contact & publish", lead: "Where we send bids and updates. Posting is free, and you pay only after you accept a bid." },
};

export const SMS_CONSENT_TEXT =
  "Text and call me about this load. I agree to receive calls and text messages from AllShip AI about my shipment at the number above, including by automated means. Consent isn't required to post a load. Message and data rates may apply. Reply STOP to opt out.";

export type StopValues = { postalCode: string; city: string; state: string; address: string; windowStart: string; windowEnd: string; lat?: number; lng?: number; placeId?: string };

export type ContactValues = { firstName: string; lastName: string; email: string; phone: string; smsConsent: boolean };

export type PublicLoadValues = {
  category: LoadCategory | "";
  pickup: StopValues;
  dropoff: StopValues;
  details: Record<string, unknown>;
  title: string;
  notes: string;
  contact: ContactValues;
  website: string;
};

export const emptyStop = (): StopValues => ({ postalCode: "", city: "", state: "", address: "", windowStart: "", windowEnd: "" });

export function emptyValues(category: LoadCategory | "" = ""): PublicLoadValues {
  return {
    category,
    pickup: emptyStop(),
    dropoff: emptyStop(),
    details: category ? emptyDetails(category) : {},
    title: "",
    notes: "",
    contact: { firstName: "", lastName: "", email: "", phone: "", smsConsent: false },
    website: "",
  };
}

const stateCodes = US_STATES.map(([c]) => c) as unknown as [string, ...string[]];
const isoDate = /^\d{4}-\d{2}-\d{2}$/;

export function todayIso(now = new Date()) {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(iso: string, days: number) {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function stopSchema(minDate: string, label: "pickup" | "delivery") {
  return z
    .object({
      postalCode: z.string().trim().regex(/^\d{5}$/, "Enter a 5-digit ZIP code"),
      city: z.string().trim().min(2, "Enter a city").max(80, "Keep the city under 80 characters"),
      state: z.enum(stateCodes, { error: "Choose a state" }),
      address: z.string().trim().max(200, "Keep the address under 200 characters").default(""),
      windowStart: z
        .string()
        .regex(isoDate, `Choose a ${label} date`)
        .refine((v) => v >= minDate, `The ${label} date can't be in the past`),
      windowEnd: z.string().default(""),
      lat: z.number().min(-90).max(90).optional(),
      lng: z.number().min(-180).max(180).optional(),
      placeId: z.string().max(300).optional(),
    })
    .refine((s) => !s.windowEnd || (isoDate.test(s.windowEnd) && s.windowEnd >= s.windowStart), { path: ["windowEnd"], message: "Must be on or after the first date" });
}

export function locationSchema(minDate: string) {
  return z
    .object({ pickup: stopSchema(minDate, "pickup"), dropoff: stopSchema(minDate, "delivery") })
    .refine((v) => v.dropoff.windowStart >= v.pickup.windowStart, { path: ["dropoff", "windowStart"], message: "Delivery can't be before pickup" });
}

export function detailsStepSchema(category: LoadCategory) {
  return z.object({
    details: z.preprocess(cleanDetails, detailsSchema(category)),
    title: z
      .string()
      .trim()
      .max(100, "Keep the title under 100 characters")
      .refine((v) => v === "" || v.length >= 4, "Use at least 4 characters, or leave it empty")
      .default(""),
    notes: z.string().trim().max(2000, "Keep details under 2,000 characters").default(""),
  });
}

export function normalizeUsPhone(raw: string) {
  const digits = raw.replace(/\D/g, "");
  const ten = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  if (ten.length !== 10 || !/^[2-9]\d{2}[2-9]\d{6}$/.test(ten)) return null;
  return `+1${ten}`;
}

export function formatUsPhone(raw: string) {
  const digits = raw.replace(/\D/g, "").replace(/^1(?=\d{10})/, "").slice(0, 10);
  if (digits.length < 4) return digits;
  if (digits.length < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export const emailSchema = z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address").max(254));

export const contactSchema = z.object({
  firstName: z.string().trim().min(1, "Enter your first name").max(60, "Keep it under 60 characters"),
  lastName: z.string().trim().min(1, "Enter your last name").max(60, "Keep it under 60 characters"),
  email: emailSchema,
  phone: z
    .string()
    .trim()
    .refine((v) => normalizeUsPhone(v) !== null, "Enter a US phone number, for example (555) 123-4567")
    .transform((v) => normalizeUsPhone(v)!),
  smsConsent: z.boolean().default(false),
});

export function stepSchema(step: StepKey, category: LoadCategory | "", choices: LoadCategory[], minDate = todayIso()) {
  if (step === "type") return z.object({ category: z.enum(choices as [LoadCategory, ...LoadCategory[]], { error: "Choose what you're moving" }) });
  if (step === "location") return locationSchema(minDate);
  if (step === "details") return category ? detailsStepSchema(category) : z.object({});
  return z.object({ contact: contactSchema });
}

export function publicLoadSchema(choices: LoadCategory[], minDate: string) {
  return z
    .object({
      category: z.enum(choices as [LoadCategory, ...LoadCategory[]], { error: "Choose what you're moving" }),
      pickup: stopSchema(minDate, "pickup"),
      dropoff: stopSchema(minDate, "delivery"),
      details: z.record(z.string(), z.unknown()),
      title: z.string().trim().max(100).default(""),
      notes: z.string().trim().max(2000).default(""),
    })
    .refine((v) => v.dropoff.windowStart >= v.pickup.windowStart, { path: ["dropoff", "windowStart"], message: "Delivery can't be before pickup" });
}

export const formKinds = Object.keys(formConfigs) as FormKind[];

export type PublicLoadPayload = Omit<PublicLoadValues, "contact" | "website">;

export type MappedLoad = {
  category: LoadCategory;
  title: string;
  pickup: { address: string; city: string; state: string; postalCode: string; windowStart: string; windowEnd?: string; lat?: number; lng?: number; placeId?: string };
  dropoff: MappedLoad["pickup"];
  details: Record<string, unknown>;
  notes: string | null;
};

export class PayloadError extends Error {
  constructor(
    message: string,
    public field?: string,
  ) {
    super(message);
  }
}

export function mapPublicLoad(kind: FormKind, raw: unknown, now = new Date()): MappedLoad {
  const config = formConfigs[kind];
  const minDate = addDays(todayIso(now), -1);
  const parsed = publicLoadSchema(config.choices, minDate).safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new PayloadError(issue?.message ?? "Check the form and try again.", issue?.path.join("."));
  }
  const input = parsed.data;
  const details = detailsSchema(input.category).safeParse(cleanDetails(input.details));
  if (!details.success) {
    const issue = details.error.issues[0];
    throw new PayloadError(issue?.message ?? "Check the load details.", `details.${String(issue?.path[0] ?? "")}`);
  }
  const stop = (s: typeof input.pickup) => ({
    address: s.address,
    city: s.city,
    state: s.state,
    postalCode: s.postalCode,
    windowStart: s.windowStart,
    ...(s.windowEnd ? { windowEnd: s.windowEnd } : {}),
    ...(typeof s.lat === "number" && typeof s.lng === "number" ? { lat: s.lat, lng: s.lng } : {}),
    ...(s.placeId ? { placeId: s.placeId } : {}),
  });
  const title = input.title || titleFor({ category: input.category, details: details.data, pickupCity: input.pickup.city, dropoffCity: input.dropoff.city });
  return { category: input.category, title, pickup: stop(input.pickup), dropoff: stop(input.dropoff), details: details.data, notes: input.notes || null };
}

export function titleFor({ category, details, pickupCity, dropoffCity }: { category: LoadCategory; details: Record<string, unknown>; pickupCity: string; dropoffCity: string }) {
  const values = {
    category,
    details,
    pickup: { city: pickupCity },
    dropoff: { city: dropoffCity },
  } as unknown as WizardValues;
  const suggested = suggestTitle(values).trim();
  if (suggested.length >= 4) return suggested;
  return categories.find((c) => c.key === category)?.name ?? "Load";
}

export function summarize(values: Pick<PublicLoadValues, "category" | "pickup" | "dropoff">) {
  const cat = categories.find((c) => c.key === values.category)?.name ?? "Load";
  const place = (s: StopValues) => [s.city, s.state].filter(Boolean).join(", ") || s.postalCode;
  const from = place(values.pickup);
  const to = place(values.dropoff);
  return from && to ? `${cat}, ${from} to ${to}` : cat;
}

const typeAliases: Record<string, LoadCategory> = {
  car: "car_or_light_truck",
  suv: "car_or_light_truck",
  pickup: "car_or_light_truck",
  boat: "powerboat",
  jetski: "personal_watercraft",
  "jet-ski": "personal_watercraft",
  atv: "atv_powersports",
  utv: "atv_powersports",
  parts: "vehicle_parts",
  local: "local_moving",
  "long-distance": "long_distance_moving",
  office: "office_moving",
  business: "business_moving",
  corporate: "corporate_relocation",
  student: "student_moving",
  military: "military_moving",
  household: "household_items",
  labor: "heavy_lifting",
};

export function categoryFromParam(raw: string | null, choices: LoadCategory[]): LoadCategory | "" {
  const v = raw?.trim().toLowerCase();
  if (!v) return "";
  const hit = categories.find((c) => c.key === v.replace(/-/g, "_") || c.slug === v)?.key ?? typeAliases[v];
  return hit && choices.includes(hit) ? hit : "";
}

export function placeFromParam(raw: string | null): Partial<StopValues> | null {
  const v = raw?.trim().slice(0, 120);
  if (!v) return null;
  const zip = v.match(/\b(\d{5})\b/)?.[1];
  const cityState = v.match(/^([A-Za-z .'-]{2,80}),\s*([A-Za-z]{2})\b/);
  const state = cityState?.[2]?.toUpperCase();
  const place: Partial<StopValues> = {};
  if (zip) place.postalCode = zip;
  if (cityState && state && (stateCodes as string[]).includes(state)) {
    place.city = cityState[1]!.trim();
    place.state = state;
  } else if (!zip && /^[A-Za-z .'-]{2,80}$/.test(v)) {
    place.city = v;
  }
  return Object.keys(place).length ? place : null;
}

export function presetFromSearch(search: string, choices: LoadCategory[]) {
  const params = new URLSearchParams(search);
  const category = categoryFromParam(params.get("type") ?? params.get("category"), choices);
  const from = placeFromParam(params.get("from"));
  const to = placeFromParam(params.get("to"));
  return category || from || to ? { category, from, to } : null;
}
