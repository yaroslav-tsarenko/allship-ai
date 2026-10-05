"use server";

import { cookies } from "next/headers";
import { z } from "zod";
import { ATTRIBUTION_COOKIE, parseAttribution } from "@/lib/attribution";
import { actionClient, ActionError } from "@/server/actions/safe-action";
import { db } from "@/server/db/client";
import { lead } from "@/server/db/schema";
import { clientIp, consumeRateLimit } from "@/server/rate-limit";
import { verifyTurnstile } from "@/server/turnstile";

const contactInput = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.email().max(254),
  phone: z
    .string()
    .trim()
    .max(32)
    .regex(/^[0-9+()\-.\s]*$/)
    .optional(),
  topic: z.enum(["shipping", "carrier", "billing", "other"]),
  message: z.string().trim().min(20).max(2000),
  turnstileToken: z.string().max(4096).optional(),
});

export const submitContact = actionClient.inputSchema(contactInput).action(async ({ parsedInput }) => {
  const ip = await clientIp();
  if (!(await consumeRateLimit(`contact:${ip}`, 5, 3600))) throw new ActionError("Too many messages from this connection. Try again in an hour or email us directly.");
  if (!(await verifyTurnstile(parsedInput.turnstileToken, ip))) throw new ActionError("We couldn't confirm you're not a robot. Refresh the page and try again.");

  const store = await cookies();
  const { gclid, landing, referrer, ...utm } = parseAttribution(store.get(ATTRIBUTION_COOKIE)?.value);
  const utmPayload: Record<string, string> = {};
  for (const [k, v] of Object.entries({ ...utm, landing, referrer })) if (v) utmPayload[k] = v;

  await db.insert(lead).values({
    type: "contact",
    name: parsedInput.name,
    email: parsedInput.email.toLowerCase(),
    phone: parsedInput.phone || null,
    payload: { topic: parsedInput.topic, message: parsedInput.message },
    utm: utmPayload,
    gclid: gclid ?? null,
  });

  return { ok: true };
});
