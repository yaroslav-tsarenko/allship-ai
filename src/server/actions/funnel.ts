"use server";

import { cookies } from "next/headers";
import { z } from "zod";
import { contactSchema, emailSchema, formKinds, normalizeUsPhone, type FormKind } from "@/features/public-load/model";
import { ATTRIBUTION_COOKIE, parseAttribution } from "@/lib/attribution";
import { getSession } from "@/server/auth/session";
import { mapOrThrow, resendConfirmation, savePartial, submitFunnel, type StashedLoad } from "@/server/funnel/service";
import { stashValue } from "@/server/funnel/links";
import { STASH_COOKIE } from "@/server/funnel/stash-cookie";
import { clientIp, consumeRateLimit } from "@/server/rate-limit";
import { verifyTurnstile } from "@/server/turnstile";
import { actionClient, ActionError } from "./safe-action";

const kindSchema = z.enum(formKinds as [FormKind, ...FormKind[]]);

async function attribution() {
  return parseAttribution((await cookies()).get(ATTRIBUTION_COOKIE)?.value);
}

export const submitPublicLoad = actionClient
  .inputSchema(
    z.object({
      kind: kindSchema,
      payload: z.unknown(),
      contact: contactSchema,
      website: z.string().max(200).optional(),
      turnstileToken: z.string().max(4000).optional(),
    }),
  )
  .action(async ({ parsedInput: input }) => {
    if (input.website) return { kind: "verify" as const, publicId: "", email: input.contact.email };
    const ip = await clientIp();
    if (!(await consumeRateLimit(`public-load:${ip}`, 6, 3600))) throw new ActionError("Too many loads from this connection in the last hour. Try again later or call us.");
    if (!(await consumeRateLimit(`public-load-email:${input.contact.email}`, 5, 3600))) throw new ActionError("Too many loads for this email in the last hour. Try again later.");
    if (!(await verifyTurnstile(input.turnstileToken, ip))) throw new ActionError("Please complete the security check.");
    const session = await getSession();
    return submitFunnel({
      kind: input.kind,
      payload: input.payload,
      contact: input.contact,
      attribution: await attribution(),
      sessionUser: session ? { id: session.user.id, email: session.user.email } : null,
    });
  });

export const savePartialLead = actionClient
  .inputSchema(
    z.object({
      kind: kindSchema,
      email: emailSchema,
      firstName: z.string().trim().max(60).optional(),
      lastName: z.string().trim().max(60).optional(),
      phone: z.string().trim().max(30).optional(),
      summary: z.string().trim().max(300),
    }),
  )
  .action(async ({ parsedInput: input }) => {
    const ip = await clientIp();
    if (!(await consumeRateLimit(`public-load-partial:${ip}`, 10, 3600))) return { ok: false };
    await savePartial({
      kind: input.kind,
      contact: { email: input.email, firstName: input.firstName, lastName: input.lastName, phone: input.phone ? (normalizeUsPhone(input.phone) ?? undefined) : undefined },
      summary: input.summary,
      attribution: await attribution(),
    });
    return { ok: true };
  });

export const resendPublishLink = actionClient.inputSchema(z.object({ email: emailSchema })).action(async ({ parsedInput: { email } }) => {
  const ip = await clientIp();
  if (!(await consumeRateLimit(`publish-resend:${ip}`, 6, 3600)) || !(await consumeRateLimit(`publish-resend-email:${email}`, 3, 3600))) {
    throw new ActionError("You've asked for several links already. Check your spam folder, or try again in an hour.");
  }
  await resendConfirmation(email);
  return { ok: true };
});

export const stashPublicLoad = actionClient
  .inputSchema(
    z.object({
      kind: kindSchema,
      payload: z.unknown(),
      contact: z.object({ firstName: z.string().trim().max(60).optional(), lastName: z.string().trim().max(60).optional(), phone: z.string().trim().max(30).optional() }),
      smsConsent: z.boolean().default(false),
    }),
  )
  .action(async ({ parsedInput: input }) => {
    const ip = await clientIp();
    if (!(await consumeRateLimit(`public-load-stash:${ip}`, 10, 3600))) throw new ActionError("Too many attempts from this connection. Try again later.");
    mapOrThrow(input.kind, input.payload);
    const stash: StashedLoad = {
      kind: input.kind,
      payload: input.payload,
      contact: { firstName: input.contact.firstName || undefined, lastName: input.contact.lastName || undefined, phone: input.contact.phone ? (normalizeUsPhone(input.contact.phone) ?? undefined) : undefined },
      attribution: await attribution(),
      smsConsent: input.smsConsent,
    };
    const token = await stashValue(stash, 60);
    (await cookies()).set(STASH_COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/load/claim", maxAge: 3600 });
    return { ok: true };
  });
