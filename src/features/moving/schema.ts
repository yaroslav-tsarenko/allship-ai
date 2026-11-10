import { z } from "zod";
import { bedroomVolumes, MAX_STORAGE_MONTHS } from "./pricing";

export const moveTypes = [
  { value: "house", label: "House" },
  { value: "apartment", label: "Apartment" },
  { value: "condo", label: "Condo" },
  { value: "townhouse", label: "Townhouse" },
  { value: "other", label: "Other" },
] as const;

export type MoveType = (typeof moveTypes)[number]["value"];

export const residenceLabel: Record<MoveType, "House" | "Apartment" | "Condo" | "Townhouse" | "Other"> = {
  house: "House",
  apartment: "Apartment",
  condo: "Condo",
  townhouse: "Townhouse",
  other: "Other",
};

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date");

export const moveRequestSchema = z
  .object({
    moveType: z.enum(moveTypes.map((m) => m.value) as [MoveType, ...MoveType[]], { error: "Choose the type of home" }),
    from: z.string().trim().min(3, "Enter a ZIP code or city, state").max(120),
    to: z.string().trim().min(3, "Enter a ZIP code or city, state").max(120),
    bedrooms: z.coerce.number({ error: "Choose the number of bedrooms" }).int().min(1, "Choose the number of bedrooms").max(bedroomVolumes.length),
    pickupDate: isoDate,
    deliveryDate: isoDate.or(z.literal("")).default(""),
    packing: z.enum(["none", "quarter", "half", "full"]).default("none"),
    unpacking: z.boolean().default(false),
    storage: z.boolean().default(false),
    storageMonths: z.coerce.number().int().min(0).max(MAX_STORAGE_MONTHS).default(0),
    climateControlled: z.boolean().default(false),
    insurance: z.boolean().default(false),
    longTerm: z.boolean().default(false),
    turnstileToken: z.string().max(4096).optional(),
  })
  .refine((v) => !v.deliveryDate || v.deliveryDate >= v.pickupDate, { path: ["deliveryDate"], message: "Delivery can't be before pickup" })
  .refine((v) => !v.storage || v.storageMonths >= 1, { path: ["storageMonths"], message: "Enter at least 1 month" });

export type MoveRequestInput = z.input<typeof moveRequestSchema>;
export type MoveRequestData = z.output<typeof moveRequestSchema>;

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(80),
  email: z.email("Enter a valid email").max(200),
  phone: z.string().trim().regex(/^\+?[0-9 ()-]{10,20}$/, "Enter a US phone number, for example (555) 123-4567"),
});

export const bookingSchema = z.object({
  request: moveRequestSchema,
  carrierOrgId: z.string().min(1).max(100),
  quotedCarrierCents: z.number().int().positive(),
  contact: contactSchema,
  marketingOptIn: z.boolean().default(false),
  turnstileToken: z.string().max(4096).optional(),
});

export type BookingInput = z.input<typeof bookingSchema>;

export const bidRequestSchema = z.object({
  request: moveRequestSchema,
  contact: contactSchema,
  marketingOptIn: z.boolean().default(false),
  turnstileToken: z.string().max(4096).optional(),
});
