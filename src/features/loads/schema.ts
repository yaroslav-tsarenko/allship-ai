import { z } from "zod";
import { loadCategories } from "@/server/db/schema/enums";

const usState = z.string().trim().regex(/^[A-Z]{2}$/, "Use the 2-letter state code");

export const stopSchema = z.object({
  address: z.string().trim().min(3, "Enter a street address").max(200),
  city: z.string().trim().min(2, "Enter a city").max(80),
  state: usState,
  postalCode: z.string().trim().regex(/^\d{5}(-\d{4})?$/, "Enter a 5-digit ZIP code"),
  windowStart: z.string().trim().min(10, "Choose a date"),
  windowEnd: z.string().trim().optional(),
  notes: z.string().trim().max(500).optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  placeId: z.string().max(300).optional(),
});

export const loadInputSchema = z
  .object({
    category: z.enum(loadCategories),
    title: z.string().trim().min(4, "Give the load a short title").max(100),
    pickup: stopSchema,
    dropoff: stopSchema,
    details: z.record(z.string(), z.unknown()),
    notes: z.string().trim().max(2000).optional(),
    targetPrice: z.coerce.number().min(0).max(1_000_000).optional(),
    biddingDays: z.coerce.number().int().min(1).max(14).default(5),
    publish: z.boolean().default(false),
    leadId: z.uuid().optional(),
  })
  .refine((v) => !v.dropoff.windowStart || v.dropoff.windowStart >= v.pickup.windowStart, {
    path: ["dropoff", "windowStart"],
    message: "Delivery can't be before pickup",
  });

export type LoadInput = z.input<typeof loadInputSchema>;

export const bidInputSchema = z.object({
  loadId: z.uuid(),
  amount: z.coerce.number().min(25, "Bids start at $25").max(1_000_000),
  estimatedPickupAt: z.string().min(10, "Choose a pickup date"),
  estimatedDeliveryAt: z.string().min(10, "Choose a delivery date"),
  message: z.string().trim().min(80, "Write at least 80 characters so the shipper knows what's included").max(2000),
  aiAssisted: z.boolean().default(false),
});

export type BidInput = z.input<typeof bidInputSchema>;

export const US_STATES = [
  ["AL", "Alabama"], ["AK", "Alaska"], ["AZ", "Arizona"], ["AR", "Arkansas"], ["CA", "California"], ["CO", "Colorado"], ["CT", "Connecticut"], ["DE", "Delaware"], ["DC", "District of Columbia"], ["FL", "Florida"], ["GA", "Georgia"], ["HI", "Hawaii"], ["ID", "Idaho"], ["IL", "Illinois"], ["IN", "Indiana"], ["IA", "Iowa"], ["KS", "Kansas"], ["KY", "Kentucky"], ["LA", "Louisiana"], ["ME", "Maine"], ["MD", "Maryland"], ["MA", "Massachusetts"], ["MI", "Michigan"], ["MN", "Minnesota"], ["MS", "Mississippi"], ["MO", "Missouri"], ["MT", "Montana"], ["NE", "Nebraska"], ["NV", "Nevada"], ["NH", "New Hampshire"], ["NJ", "New Jersey"], ["NM", "New Mexico"], ["NY", "New York"], ["NC", "North Carolina"], ["ND", "North Dakota"], ["OH", "Ohio"], ["OK", "Oklahoma"], ["OR", "Oregon"], ["PA", "Pennsylvania"], ["RI", "Rhode Island"], ["SC", "South Carolina"], ["SD", "South Dakota"], ["TN", "Tennessee"], ["TX", "Texas"], ["UT", "Utah"], ["VT", "Vermont"], ["VA", "Virginia"], ["WA", "Washington"], ["WV", "West Virginia"], ["WI", "Wisconsin"], ["WY", "Wyoming"],
] as const;
