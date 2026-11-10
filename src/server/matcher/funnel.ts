import "server-only";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { ATTRIBUTION_COOKIE, parseAttribution } from "@/lib/attribution";
import { formatUsd } from "@/lib/money";
import { ActionError } from "@/server/actions/safe-action";
import { getActor } from "@/server/actor";
import { auth } from "@/server/auth/auth";
import { db } from "@/server/db/client";
import { lead, user } from "@/server/db/schema";
import { CLAIM_PATH, createPublishLink } from "@/server/funnel/links";
import { notifyAdmins } from "@/server/notify/telegram";
import { attachUser, enroll, stopEnrollments } from "@/server/nurture";
import { insertMoveLoad, type buildMoveLoad } from "./service";

export type MovingFunnelInput = {
  contact: { name: string; email: string; phone: string };
  marketingOptIn: boolean;
  built: ReturnType<typeof buildMoveLoad>;
};

async function ensureShipper(email: string, contact: MovingFunnelInput["contact"]) {
  const [existing] = await db
    .select({ id: user.id, banned: user.banned, accountType: user.accountType, phone: user.phone, firstName: user.firstName })
    .from(user)
    .where(eq(user.email, email))
    .limit(1);
  const [firstName = contact.name, ...rest] = contact.name.trim().split(/\s+/);
  const lastName = rest.join(" ");
  if (existing) {
    if (existing.banned) throw new ActionError("This account is not available. Contact support for help.");
    const actor = await getActor(existing.id);
    if (actor.accountType !== "shipper" || actor.orgId) throw new ActionError("This email belongs to a carrier or driver account, which can't book moves. Use a different email.");
    const patch: Partial<typeof user.$inferInsert> = {};
    if (!existing.phone) patch.phone = contact.phone;
    if (!existing.firstName) Object.assign(patch, { firstName, lastName });
    if (Object.keys(patch).length) await db.update(user).set(patch).where(eq(user.id, existing.id));
    return { id: existing.id, firstName: existing.firstName ?? firstName, isNew: false };
  }
  const ctx = await auth.$context;
  const created = await ctx.internalAdapter.createUser({ email, name: contact.name.trim(), emailVerified: false, firstName, lastName, phone: contact.phone, accountType: "shipper" }, { method: "magic-link" });
  if (!created) throw new Error("Could not create the account");
  return { id: created.id, firstName, isNew: true };
}

export async function startMovingFunnel({ contact, marketingOptIn, built }: MovingFunnelInput) {
  const email = contact.email.trim().toLowerCase();
  const shipper = await ensureShipper(email, contact);
  const row = await db.transaction((tx) => insertMoveLoad(tx, shipper.id, built, { publish: false, publishOnVerify: true }));
  const quote = built.details.instantQuote as { carrierName: string; carrierCents: number } | undefined;
  const route = `${built.categoryName}, ${built.pickup.city}, ${built.pickup.state} → ${built.dropoff.city}, ${built.dropoff.state}`;
  const summary = quote ? `${route}, ${quote.carrierName} at ${formatUsd(quote.carrierCents)}` : `${route}, open for bids`;
  const attribution = parseAttribution((await cookies()).get(ATTRIBUTION_COOKIE)?.value);
  const { gclid, gbraid, wbraid, ...utm } = attribution;
  const [leadRow] = await db
    .insert(lead)
    .values({
      type: "quote",
      status: "converted",
      email,
      name: contact.name,
      phone: contact.phone,
      userId: shipper.id,
      gclid: gclid ?? gbraid ?? wbraid ?? null,
      utm: Object.fromEntries(Object.entries(utm).filter((e): e is [string, string] => typeof e[1] === "string")),
      payload: { form: quote ? "moving_instant_quote" : "moving_bid_request", path: "/moving", category: built.category, from: `${built.pickup.city}, ${built.pickup.state} ${built.pickup.postalCode ?? ""}`.trim(), to: `${built.dropoff.city}, ${built.dropoff.state} ${built.dropoff.postalCode ?? ""}`.trim(), date: built.pickup.windowStart, title: built.title, loadId: row.id, carrier: quote?.carrierName ?? null, carrierCents: quote?.carrierCents ?? null, marketingOptIn },
    })
    .returning({ id: lead.id });
  await stopEnrollments({ email, sequence: "abandoned_form" }, "form_submitted");
  await attachUser(email, shipper.id);
  const label = quote ? "Instant booking" : "Bid request";
  if (shipper.isNew) {
    const url = await createPublishLink(email, 0.25);
    await notifyAdmins(`${label} ${row.publicId} from /moving (new account, ${contact.phone}): ${summary}.`).catch(() => undefined);
    return { kind: "new" as const, url, publicId: row.publicId };
  }
  await enroll("verify_publish", { email, userId: shipper.id, leadId: leadRow?.id ?? null, loadId: row.id, context: { publicId: row.publicId, title: built.title, summary, firstName: shipper.firstName } });
  await notifyAdmins(`${label} ${row.publicId} from /moving (existing account, waiting for sign-in, ${contact.phone}): ${summary}.`).catch(() => undefined);
  return { kind: "existing" as const, href: `/sign-in?next=${encodeURIComponent(CLAIM_PATH)}`, publicId: row.publicId };
}
