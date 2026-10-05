"use server";

import { z } from "zod";
import { env } from "@/env";
import { db } from "@/server/db/client";
import { newsletterSubscriber } from "@/server/db/schema";
import { sendNewsletterConfirmation } from "@/server/email/marketing";
import { clientIp, consumeRateLimit } from "@/server/rate-limit";
import { actionClient, ActionError } from "@/server/actions/safe-action";
import { newsletterToken } from "./newsletter-token";

export const subscribeNewsletter = actionClient
  .inputSchema(z.object({ email: z.email(), audience: z.enum(["shipper", "carrier"]).default("shipper") }))
  .action(async ({ parsedInput }) => {
    const ip = await clientIp();
    if (!(await consumeRateLimit(`newsletter:${ip}`, 5, 3600))) throw new ActionError("Too many attempts. Try again later.");
    const email = parsedInput.email.toLowerCase();
    await db
      .insert(newsletterSubscriber)
      .values({ email, audience: parsedInput.audience })
      .onConflictDoUpdate({ target: newsletterSubscriber.email, set: { unsubscribedAt: null, audience: parsedInput.audience } });
    await sendNewsletterConfirmation(email, `${env.NEXT_PUBLIC_APP_URL}/api/newsletter/confirm?email=${encodeURIComponent(email)}&token=${newsletterToken(email)}`);
    return { ok: true };
  });
