import { z } from "zod";
import { policyText } from "@/lib/validation/text-policy";
import { loadCategories } from "@/server/db/schema/enums";
import { isSamePlace, sameAddressCategories } from "./route-rules";

export { US_STATES } from "./states";

const usState = z.string().trim().regex(/^[A-Z]{2}$/, "Choose a state");

export const stopSchema = z.object({
  address: z.string().trim().min(3, "Enter a street address").max(200),
  city: z.string().trim().min(2, "Enter a city").max(80),
  state: usState,
  postalCode: z.string().trim().regex(/^\d{5}(-\d{4})?$/, "Enter a 5-digit ZIP code"),
  windowStart: z.string().trim().min(10, "Choose a date"),
  windowEnd: z.string().trim().optional(),
  notes: policyText({ label: "notes", max: 500, multiline: true }).optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  placeId: z.string().max(300).optional(),
});

export const loadInputSchema = z
  .object({
    category: z.enum(loadCategories),
    title: policyText({ label: "a short title", min: 4, max: 100, required: true, minMessage: "Give the load a short title" }),
    pickup: stopSchema,
    dropoff: stopSchema,
    details: z.record(z.string(), z.unknown()),
    notes: policyText({ label: "notes", max: 2000, multiline: true }).optional(),
    targetPrice: z.coerce.number().min(0).max(1_000_000).optional(),
    biddingDays: z.coerce.number().int().min(1).max(14).default(5),
    publish: z.boolean().default(false),
    leadId: z.uuid().optional(),
  })
  .refine((v) => !v.dropoff.windowStart || v.dropoff.windowStart >= v.pickup.windowStart, {
    path: ["dropoff", "windowStart"],
    message: "Delivery can't be before pickup",
  })
  .refine((v) => sameAddressCategories.has(v.category) || !isSamePlace(v.pickup, v.dropoff), {
    path: ["dropoff", "postalCode"],
    message: "Delivery is the same place as pickup. Check the addresses.",
  });

export type LoadInput = z.input<typeof loadInputSchema>;

export const bidInputSchema = z.object({
  loadId: z.uuid(),
  amount: z.coerce.number().min(25, "Bids start at $25").max(1_000_000),
  estimatedPickupAt: z.string().min(10, "Choose a pickup date"),
  estimatedDeliveryAt: z.string().min(10, "Choose a delivery date"),
  message: policyText({ label: "a message", min: 80, max: 2000, multiline: true, required: true, minMessage: "Write at least 80 characters so the shipper knows what's included" }),
  aiAssisted: z.boolean().default(false),
}).refine((v) => !v.estimatedPickupAt || !v.estimatedDeliveryAt || v.estimatedDeliveryAt >= v.estimatedPickupAt, { path: ["estimatedDeliveryAt"], message: "Delivery can't be before pickup" });

export type BidInput = z.input<typeof bidInputSchema>;
