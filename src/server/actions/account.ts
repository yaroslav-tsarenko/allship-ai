"use server";

import { and, eq } from "drizzle-orm";
import { APIError } from "better-auth/api";
import { cookies, headers } from "next/headers";
import { z } from "zod";
import { requestLogger } from "@/lib/log";
import { anonymizeAccount } from "@/server/account/delete";
import { deletionBlockers } from "@/server/account/blockers";
import { auth } from "@/server/auth/auth";
import { db } from "@/server/db/client";
import { account, auditLog } from "@/server/db/schema";
import { clientIp, consumeRateLimit } from "@/server/rate-limit";
import { ActionError, authedAction } from "./safe-action";

const FRESH_SESSION_MS = 10 * 60 * 1000;

const deleteSchema = z.object({
  confirmation: z.string().trim(),
  password: z.string().max(256).optional(),
});

export const deleteAccount = authedAction.inputSchema(deleteSchema).action(async ({ parsedInput, ctx }) => {
  const userId = ctx.user.id;
  const logger = await requestLogger({ scope: "account", userId });
  if (parsedInput.confirmation.toUpperCase() !== "DELETE") throw new ActionError("Type DELETE to confirm.");
  if (ctx.session.session.impersonatedBy) throw new ActionError("Accounts can't be deleted while an admin is impersonating them.");
  if (!(await consumeRateLimit(`account-delete:${userId}`, 5, 15 * 60))) throw new ActionError("Too many attempts. Wait 15 minutes and try again.");

  const requestHeaders = await headers();
  const [credential] = await db
    .select({ id: account.id })
    .from(account)
    .where(and(eq(account.userId, userId), eq(account.providerId, "credential")))
    .limit(1);

  if (credential) {
    if (!parsedInput.password) throw new ActionError("Enter your password to confirm it's you.");
    try {
      await auth.api.verifyPassword({ body: { password: parsedInput.password }, headers: requestHeaders });
    } catch (error) {
      if (error instanceof APIError) throw new ActionError("That password isn't right.");
      throw error;
    }
  } else if (Date.now() - new Date(ctx.session.session.createdAt).getTime() > FRESH_SESSION_MS) {
    throw new ActionError("For your security, sign out and sign in again, then delete your account within 10 minutes.");
  }

  const blockers = await deletionBlockers(userId);
  if (blockers.length) throw new ActionError(`Your account can't be deleted yet: ${blockers.map((b) => b.title).join("; ")}.`);

  const ip = await clientIp();
  const userAgent = requestHeaders.get("user-agent");
  const summary = await anonymizeAccount(userId);
  await db.insert(auditLog).values({
    actorId: userId,
    action: "account.delete",
    entity: "user",
    entityId: userId,
    diff: { method: credential ? "password" : "fresh_session", ...summary },
    ip,
    userAgent,
  });
  logger.info("account deleted", summary);

  const store = await cookies();
  for (const c of store.getAll()) {
    if (c.name.includes("allship.")) store.set(c.name, "", { maxAge: 0, path: "/", secure: c.name.startsWith("__Secure-"), httpOnly: true, sameSite: "lax" });
  }
  return { ok: true };
});
