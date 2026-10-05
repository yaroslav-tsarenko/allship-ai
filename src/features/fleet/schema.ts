import { z } from "zod";

export const addDriverSchema = z.object({
  name: z.string().trim().min(2, "Enter the driver's full name").max(120, "Use a shorter name"),
  email: z.email("Enter a valid email address").max(254),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9 ()-]{10,20}$/, "Enter a US phone number, for example (555) 123-4567"),
  cdl: z.string().trim().max(40, "Use 40 characters or fewer").optional(),
  notes: z.string().trim().max(500, "Keep notes under 500 characters").optional(),
});

export type AddDriverValues = z.infer<typeof addDriverSchema>;
