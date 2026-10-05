"use server";

import { APIError } from "better-auth/api";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getActor } from "@/server/actor";
import { auth } from "@/server/auth/auth";
import { consumeRateLimit } from "@/server/rate-limit";
import { ActionError, authedAction } from "./safe-action";

const adminAction = authedAction.use(async ({ next, ctx }) => {
  const actor = await getActor(ctx.user.id);
  if (!actor.isAdmin) throw new ActionError("Admins only.");
  if (!ctx.user.twoFactorEnabled) throw new ActionError("Turn on two-step verification to manage users.");
  return next({ ctx: { ...ctx, actor } });
});

const inputSchema = z.object({
  email: z.email("Enter a valid email").trim().max(200),
  name: z.string().trim().min(1, "Enter a name").max(120),
  password: z.string().min(10, "Use at least 10 characters").max(128),
  accountType: z.enum(["shipper", "carrier"]),
  role: z.enum(["user", "admin"]),
  emailVerified: z.boolean(),
});

export const createUserAction = adminAction.inputSchema(inputSchema).action(async ({ parsedInput, ctx }) => {
  if (!(await consumeRateLimit(`admin-create-user:${ctx.actor.userId}`, 50, 3600))) {
    throw new ActionError("You're creating accounts too quickly. Wait a few minutes.");
  }

  try {
    const { user } = await auth.api.createUser({
      headers: await headers(),
      body: {
        email: parsedInput.email,
        name: parsedInput.name,
        password: parsedInput.password,
        role: parsedInput.role,
        data: { accountType: parsedInput.accountType, emailVerified: parsedInput.emailVerified },
      },
    });
    revalidatePath("/admin/users");
    return { id: user.id, email: user.email };
  } catch (error) {
    if (error instanceof APIError) throw new ActionError(error.message ?? "Could not create the user.");
    throw error;
  }
});
