import { z } from "zod";

export const SHOWCASE_PLACEMENTS = [
  { value: "home", label: "Home" },
  { value: "about", label: "About" },
  { value: "ai", label: "AI" },
  { value: "all", label: "All services" },
  { value: "ship", label: "Ship" },
  { value: "safety", label: "Safety" },
  { value: "partners", label: "Partners" },
  { value: "pricing", label: "Pricing" },
  { value: "why-choose-us", label: "Why choose us" },
  { value: "moving", label: "Moving" },
  { value: "truck-with-driver", label: "Truck with driver" },
  { value: "rent-truck", label: "Rent truck" },
  { value: "vehicle-load", label: "Vehicle load" },
  { value: "moving-load", label: "Moving load" },
  { value: "heavy-load", label: "Heavy load" },
  { value: "freight-load", label: "Freight load" },
] as const;

export type PlacementKey = (typeof SHOWCASE_PLACEMENTS)[number]["value"];

const placementValues = SHOWCASE_PLACEMENTS.map((p) => p.value) as [PlacementKey, ...PlacementKey[]];

const httpsUrl = z
  .string()
  .trim()
  .max(500)
  .refine((v) => /^https?:\/\/[^\s]+\.[^\s]+/.test(v), "Enter a full link starting with https://");

const imageUrl = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v.startsWith("/") || /^https:\/\//.test(v), "Upload a logo image");

export const testimonialInput = z.object({
  id: z.uuid().nullable(),
  quote: z.string().trim().min(20, "The quote should be at least 20 characters").max(1200),
  authorName: z.string().trim().min(2, "Enter the reviewer's name").max(120),
  authorDetail: z.string().trim().max(160).nullable(),
  rating: z.number().int().min(1).max(5).nullable(),
  sourceLabel: z.string().trim().min(3, "Say where this review was published").max(120),
  sourceUrl: httpsUrl.nullable(),
  reviewedAt: z.iso.date().nullable(),
  audience: z.enum(["shipper", "carrier", "any"]),
  placements: z.array(z.enum(placementValues)).max(placementValues.length),
  published: z.boolean(),
  sort: z.number().int().min(-1000).max(1000),
  confirmGenuine: z.boolean(),
}).superRefine((v, ctx) => {
  if (v.published && !v.confirmGenuine) ctx.addIssue({ code: "custom", path: ["confirmGenuine"], message: "Confirm the review is genuine before publishing" });
  if (v.published && !v.placements.length) ctx.addIssue({ code: "custom", path: ["placements"], message: "Pick at least one page to show it on" });
  if (v.published && !v.sourceUrl) ctx.addIssue({ code: "custom", path: ["sourceUrl"], message: "Published reviews need a link to the original review" });
});

export type TestimonialInput = z.infer<typeof testimonialInput>;

export const partnerLogoInput = z.object({
  id: z.uuid().nullable(),
  name: z.string().trim().min(2, "Enter the company name").max(120),
  imageUrl: imageUrl,
  href: httpsUrl.nullable(),
  relationship: z.string().trim().min(3, "Describe the relationship, for example \"Customer since 2025\"").max(120),
  published: z.boolean(),
  sort: z.number().int().min(-1000).max(1000),
  confirmPermission: z.boolean(),
}).superRefine((v, ctx) => {
  if (v.published && !v.confirmPermission) ctx.addIssue({ code: "custom", path: ["confirmPermission"], message: "Confirm you have permission to show this logo" });
});

export type PartnerLogoInput = z.infer<typeof partnerLogoInput>;
