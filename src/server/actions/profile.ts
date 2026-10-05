"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/server/db/client";
import { user } from "@/server/db/schema";
import { authedAction } from "./safe-action";

const profileSchema = z.object({
  firstName: z.string().trim().min(1, "Enter your first name").max(60),
  lastName: z.string().trim().min(1, "Enter your last name").max(60),
  phone: z
    .string()
    .trim()
    .regex(/^$|^\+?[0-9 ()-]{10,20}$/, "Enter a US phone number, for example (555) 123-4567")
    .optional(),
});

export const updateProfile = authedAction.inputSchema(profileSchema).action(async ({ parsedInput, ctx }) => {
  await db
    .update(user)
    .set({
      firstName: parsedInput.firstName,
      lastName: parsedInput.lastName,
      name: `${parsedInput.firstName} ${parsedInput.lastName}`,
      phone: parsedInput.phone || null,
    })
    .where(eq(user.id, ctx.user.id));
  revalidatePath("/app", "layout");
  return { ok: true };
});
