import { z } from "zod";

const phone = z
  .string()
  .trim()
  .regex(/^$|^\+?[0-9 ()-]{10,20}$/, "Enter a US phone number, for example (555) 123-4567");

export const shipperOnboardingSchema = z.object({
  firstName: z.string().trim().min(1, "Enter your first name").max(60),
  lastName: z.string().trim().min(1, "Enter your last name").max(60),
  phone: phone.optional(),
});

export const carrierOnboardingSchema = z.object({
  firstName: z.string().trim().min(1, "Enter your first name").max(60),
  lastName: z.string().trim().min(1, "Enter your last name").max(60),
  phone: phone.min(10, "Enter a phone number carriers and shippers can reach you on"),
  legalName: z.string().trim().min(2, "Enter your company's legal name").max(120),
  dbaName: z.string().trim().max(120).optional(),
  usdotNumber: z.string().trim().regex(/^\d{1,8}$/, "USDOT numbers have up to 8 digits"),
  mcNumber: z
    .string()
    .trim()
    .transform((v) => v.replace(/^mc[-\s]?/i, ""))
    .pipe(z.string().regex(/^$|^\d{1,8}$/, "MC numbers have up to 8 digits")),
});
