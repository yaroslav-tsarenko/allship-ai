import { z } from "zod";

export const quoteSchema = z.object({
  category: z.string().min(1),
  from: z.string().trim().min(2, "Enter a pickup city or ZIP").max(120),
  to: z.string().trim().min(2, "Enter a delivery city or ZIP").max(120),
  date: z.string().trim().max(20).optional(),
  flexible: z.boolean().default(true),
  details: z.record(z.string(), z.string().max(200)).default({}),
  notes: z.string().trim().max(2000).optional(),
  name: z.string().trim().min(1, "Enter your name").max(120),
  email: z.email("Enter a valid email address"),
  phone: z.string().trim().regex(/^$|^\+?[0-9 ()-]{10,20}$/, "Enter a US phone number").optional(),
  marketingOptIn: z.boolean().default(false),
  source: z.string().max(60).optional(),
  turnstileToken: z.string().max(4000).optional(),
});

export type QuoteInput = z.input<typeof quoteSchema>;
