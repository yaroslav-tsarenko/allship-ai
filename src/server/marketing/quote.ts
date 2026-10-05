"use server";

import { cookies } from "next/headers";
import { categoryBySlug } from "@/content/categories";
import { heavyEquipmentFields, quoteFields } from "@/features/quote/fields";
import { quoteSchema } from "@/features/quote/schema";
import { ATTRIBUTION_COOKIE, parseAttribution } from "@/lib/attribution";
import { actionClient, ActionError } from "@/server/actions/safe-action";
import { db } from "@/server/db/client";
import { lead } from "@/server/db/schema";
import { sendLeadReceipt } from "@/server/email/marketing";
import { notifyAdmins } from "@/server/notify/telegram";
import { clientIp, consumeRateLimit } from "@/server/rate-limit";
import { verifyTurnstile } from "@/server/turnstile";

export const submitQuote = actionClient.inputSchema(quoteSchema).action(async ({ parsedInput: input }) => {
  const category = categoryBySlug(input.category);
  if (!category) throw new ActionError("Choose what you're shipping.");

  const ip = await clientIp();
  if (!(await consumeRateLimit(`quote:${ip}`, 8, 3600))) throw new ActionError("Too many requests from this connection. Try again in an hour or call us.");
  if (!(await verifyTurnstile(input.turnstileToken, ip))) throw new ActionError("Please complete the security check.");

  const fields = category.key === "heavy_equipment" ? heavyEquipmentFields : quoteFields[category.group];
  const details: Record<string, string> = {};
  for (const field of fields) {
    const value = input.details[field.name]?.trim() ?? "";
    if (field.required && !value) throw new ActionError(`${field.label} is required.`);
    if (value) details[field.name] = value;
  }

  const attribution = parseAttribution((await cookies()).get(ATTRIBUTION_COOKIE)?.value);
  const { gclid, gbraid, wbraid, ...utm } = attribution;

  const [row] = await db
    .insert(lead)
    .values({
      type: "quote",
      name: input.name,
      email: input.email.toLowerCase(),
      phone: input.phone || null,
      gclid: gclid ?? gbraid ?? wbraid ?? null,
      utm: Object.fromEntries(Object.entries(utm).filter((e): e is [string, string] => typeof e[1] === "string")),
      payload: {
        category: category.key,
        from: input.from,
        to: input.to,
        date: input.date || null,
        flexible: input.flexible,
        details,
        notes: input.notes || null,
        marketingOptIn: input.marketingOptIn,
        source: input.source ?? null,
      },
    })
    .returning({ id: lead.id });

  const summary = `${category.name} from ${input.from} to ${input.to}`;
  await Promise.allSettled([
    sendLeadReceipt(input.email, input.name.split(" ")[0] ?? input.name, summary),
    notifyAdmins(`New quote request: ${category.name}, ${input.from} → ${input.to}. Open the admin console to review.`),
  ]);

  return { id: row?.id ?? null, category: category.key };
});
