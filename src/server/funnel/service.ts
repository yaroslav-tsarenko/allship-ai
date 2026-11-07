import "server-only";
import { and, desc, eq, gt } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import { categories } from "@/content/categories";
import { formConfigs, mapPublicLoad, PayloadError, SMS_CONSENT_TEXT, summarize, type ContactValues, type FormKind, type MappedLoad } from "@/features/public-load/model";
import type { Attribution } from "@/lib/attribution";
import { log } from "@/lib/log";
import { zipState } from "@/server/geo/zip";
import { ActionError } from "@/server/actions/safe-action";
import { getActor } from "@/server/actor";
import { auth } from "@/server/auth/auth";
import { db } from "@/server/db/client";
import { lead, load, user } from "@/server/db/schema";
import { createPublicLoad, publishPendingLoads } from "@/server/loads/service";
import { notifyAdmins } from "@/server/notify/telegram";
import { attachUser, enroll, stopEnrollments } from "@/server/nurture";
import { sendPublishConfirmation } from "./emails";
import { createPublishLink } from "./links";

export type FunnelResult = { kind: "published"; publicId: string } | { kind: "verify"; publicId: string; email: string };

type Contact = Omit<ContactValues, "phone"> & { phone: string };

const categoryName = (key: string) => categories.find((c) => c.key === key)?.name ?? key;
const route = (m: MappedLoad) => `${m.pickup.city}, ${m.pickup.state} → ${m.dropoff.city}, ${m.dropoff.state}`;

function attributionFields(attribution: Attribution) {
  const { gclid, gbraid, wbraid, ...rest } = attribution;
  return {
    gclid: gclid ?? gbraid ?? wbraid ?? null,
    utm: Object.fromEntries(Object.entries(rest).filter((e): e is [string, string] => typeof e[1] === "string")),
  };
}

export function mapOrThrow(kind: FormKind, payload: unknown) {
  try {
    return mapPublicLoad(kind, payload, new Date(), zipState);
  } catch (error) {
    if (error instanceof PayloadError) throw new ActionError(error.message);
    throw error;
  }
}

async function findUser(email: string) {
  const [row] = await db
    .select({ id: user.id, email: user.email, firstName: user.firstName, accountType: user.accountType, banned: user.banned, phone: user.phone, onboardingCompletedAt: user.onboardingCompletedAt })
    .from(user)
    .where(eq(user.email, email))
    .limit(1);
  return row ?? null;
}

async function assertCanPost(userId: string) {
  const actor = await getActor(userId);
  if (actor.accountType !== "shipper" || actor.orgId) {
    throw new ActionError("This email belongs to a carrier or driver account, which can't post loads. Use a different email to post as a shipper, or sign in to bid on loads.");
  }
  return actor;
}

async function upsertLead({ email, contact, kind, path, mapped, attribution, status, userId, loadId, smsConsent, extra }: { email: string; contact: Partial<Contact>; kind: FormKind; path: string; mapped?: MappedLoad; attribution: Attribution; status: "partial" | "converted"; userId?: string | null; loadId?: string; smsConsent?: boolean; extra?: Record<string, unknown> }) {
  const name = [contact.firstName, contact.lastName].filter(Boolean).join(" ") || null;
  const payload: Record<string, unknown> = {
    form: kind,
    path,
    ...extra,
    ...(mapped ? { category: mapped.category, from: `${mapped.pickup.city}, ${mapped.pickup.state} ${mapped.pickup.postalCode}`, to: `${mapped.dropoff.city}, ${mapped.dropoff.state} ${mapped.dropoff.postalCode}`, date: mapped.pickup.windowStart, title: mapped.title } : {}),
    ...(loadId ? { loadId } : {}),
    ...(smsConsent !== undefined ? { smsConsent, smsConsentText: smsConsent ? SMS_CONSENT_TEXT : null, smsConsentAt: smsConsent ? new Date().toISOString() : null } : {}),
  };
  const { gclid, utm } = attributionFields(attribution);
  const since = new Date(Date.now() - 7 * 86_400_000);
  const [existing] = await db
    .select({ id: lead.id, payload: lead.payload })
    .from(lead)
    .where(and(eq(lead.email, email), eq(lead.type, "quote"), eq(lead.status, "partial"), gt(lead.createdAt, since)))
    .orderBy(desc(lead.createdAt))
    .limit(1);
  if (existing) {
    await db
      .update(lead)
      .set({ name: name ?? undefined, phone: contact.phone || undefined, status, userId: userId ?? undefined, payload: { ...existing.payload, ...payload }, ...(gclid ? { gclid } : {}), ...(Object.keys(utm).length ? { utm } : {}) })
      .where(eq(lead.id, existing.id));
    return existing.id;
  }
  const [row] = await db.insert(lead).values({ type: "quote", status, email, name, phone: contact.phone || null, userId: userId ?? null, payload, gclid, utm }).returning({ id: lead.id });
  return row!.id;
}

export async function savePartial({ kind, contact, summary, attribution }: { kind: FormKind; contact: Partial<Contact> & { email: string }; summary: string; attribution: Attribution }) {
  const email = contact.email.trim().toLowerCase();
  const existing = await findUser(email);
  if (existing?.accountType === "carrier") return { leadId: null };
  const path = formConfigs[kind].path;
  const leadId = await upsertLead({ email, contact, kind, path, attribution, status: "partial", userId: existing?.id ?? null, extra: { summary } });
  await enroll("abandoned_form", { email, userId: existing?.id ?? null, leadId, context: { path, summary, form: kind, firstName: contact.firstName || null } });
  return { leadId };
}

async function afterPublished(email: string, userId: string, rows: Array<{ id: string; publicId: string; title: string }>) {
  for (const row of rows) {
    await stopEnrollments({ loadId: row.id, sequence: "verify_publish" }, "published");
    await enroll("load_followup", { email, userId, loadId: row.id, context: { publicId: row.publicId, title: row.title } });
  }
  if (rows.length) {
    revalidateTag("open-loads", "max");
    revalidatePath("/loads");
  }
}

export async function submitFunnel({ kind, payload, contact, attribution, sessionUser }: { kind: FormKind; payload: unknown; contact: Contact; attribution: Attribution; sessionUser: { id: string; email: string } | null }): Promise<FunnelResult> {
  const mapped = mapOrThrow(kind, payload);
  const email = contact.email.trim().toLowerCase();
  const path = formConfigs[kind].path;
  const summary = `${categoryName(mapped.category)}, ${route(mapped)}`;

  if (sessionUser && sessionUser.email.toLowerCase() !== email) {
    throw new ActionError(`You're signed in as ${sessionUser.email}. Use that email to post, or sign out first.`);
  }

  const existing = await findUser(email);
  if (existing?.banned) throw new ActionError("This account is not available. Contact support for help.");

  let userId: string;
  let isNew = false;
  if (existing) {
    await assertCanPost(existing.id);
    userId = existing.id;
    const patch: Partial<typeof user.$inferInsert> = {};
    if (!existing.phone) patch.phone = contact.phone;
    if (!existing.firstName) Object.assign(patch, { firstName: contact.firstName, lastName: contact.lastName });
    if (Object.keys(patch).length) await db.update(user).set(patch).where(eq(user.id, userId));
  } else {
    const ctx = await auth.$context;
    const created = await ctx.internalAdapter.createUser({
      email,
      name: `${contact.firstName} ${contact.lastName}`.trim(),
      emailVerified: false,
      firstName: contact.firstName,
      lastName: contact.lastName,
      phone: contact.phone,
      accountType: "shipper",
    }, { method: "magic-link" });
    if (!created) throw new Error("Could not create the account");
    userId = created.id;
    isNew = true;
  }

  const publishNow = Boolean(sessionUser && sessionUser.id === userId);
  const row = await createPublicLoad({ shipperId: userId, category: mapped.category, title: mapped.title, pickup: mapped.pickup, dropoff: mapped.dropoff, details: mapped.details, notes: mapped.notes, publish: publishNow });
  const leadId = await upsertLead({ email, contact, kind, path, mapped, attribution, status: "converted", userId, loadId: row.id, smsConsent: contact.smsConsent });

  await stopEnrollments({ email, sequence: "abandoned_form" }, "form_submitted");
  await attachUser(email, userId);

  if (publishNow) {
    await afterPublished(email, userId, [row]);
    if (existing && !existing.onboardingCompletedAt) await db.update(user).set({ onboardingCompletedAt: new Date() }).where(eq(user.id, userId));
    await notifyAdmins(`New load ${row.publicId} published from ${path}: ${summary}.`);
    return { kind: "published", publicId: row.publicId };
  }

  await enroll("verify_publish", { email, userId, leadId, loadId: row.id, context: { publicId: row.publicId, title: row.title, summary, firstName: contact.firstName } });
  await sendConfirmation(email, userId, contact.firstName, { publicId: row.publicId, summary });
  await notifyAdmins(`New load ${row.publicId} from ${path} (${isNew ? "new account" : "existing account"}, waiting for email confirmation): ${summary}.`);
  return { kind: "verify", publicId: row.publicId, email };
}

async function pendingDrafts(userId: string) {
  return db
    .select({ id: load.id, publicId: load.publicId, title: load.title, category: load.category, pickup: load.pickup, dropoff: load.dropoff })
    .from(load)
    .where(and(eq(load.shipperId, userId), eq(load.status, "draft"), eq(load.publishOnVerify, true)))
    .orderBy(desc(load.createdAt));
}

async function sendConfirmation(email: string, userId: string, firstName: string | null | undefined, latest?: { publicId: string; summary: string }) {
  const drafts = await pendingDrafts(userId);
  const head = latest ?? (drafts[0] ? { publicId: drafts[0].publicId, summary: `${categoryName(drafts[0].category)}, ${drafts[0].pickup.city}, ${drafts[0].pickup.state} → ${drafts[0].dropoff.city}, ${drafts[0].dropoff.state}` } : null);
  if (!head) return false;
  const url = await createPublishLink(email);
  try {
    await sendPublishConfirmation(email, { url, publicId: head.publicId, summary: head.summary, firstName, count: Math.max(drafts.length, 1) });
  } catch (error) {
    log.error("publish confirmation email failed", { scope: "funnel", err: error });
    throw new ActionError("We saved your load but couldn't send the confirmation email. Try “Resend” in a minute, or call us.");
  }
  return true;
}

export async function resendConfirmation(email: string) {
  const normalized = email.trim().toLowerCase();
  const existing = await findUser(normalized);
  if (!existing || existing.banned || existing.accountType !== "shipper") return;
  await sendConfirmation(normalized, existing.id, existing.firstName);
}

export type StashedLoad = { kind: FormKind; payload: unknown; contact: Partial<Contact>; attribution: Attribution; smsConsent: boolean };

export async function claimForUser(userId: string, stash: StashedLoad | null) {
  const actor = await getActor(userId);
  if (actor.accountType !== "shipper" || actor.orgId) return { error: "carrier_account" as const, publicIds: [] };

  const [current] = await db.select({ email: user.email, firstName: user.firstName, lastName: user.lastName, phone: user.phone, onboardingCompletedAt: user.onboardingCompletedAt }).from(user).where(eq(user.id, userId)).limit(1);
  if (!current) return { error: "not_found" as const, publicIds: [] };

  const created: Array<{ id: string; publicId: string; title: string }> = [];
  if (stash) {
    try {
      const mapped = mapPublicLoad(stash.kind, stash.payload, new Date(), zipState);
      const row = await createPublicLoad({ shipperId: userId, category: mapped.category, title: mapped.title, pickup: mapped.pickup, dropoff: mapped.dropoff, details: mapped.details, notes: mapped.notes, publish: true });
      created.push(row);
      await upsertLead({ email: current.email, contact: stash.contact, kind: stash.kind, path: formConfigs[stash.kind].path, mapped, attribution: stash.attribution, status: "converted", userId, loadId: row.id, smsConsent: stash.smsConsent });
      await stopEnrollments({ email: current.email, sequence: "abandoned_form" }, "form_submitted");
      await notifyAdmins(`New load ${row.publicId} published from ${formConfigs[stash.kind].path} with Google sign-in: ${summarize({ category: mapped.category, pickup: { ...mapped.pickup, windowEnd: "", address: "" }, dropoff: { ...mapped.dropoff, windowEnd: "", address: "" } })}.`);
    } catch (error) {
      log.warn("stashed load could not be created", { scope: "funnel", err: error });
    }
  }

  const published = await publishPendingLoads(userId);
  await afterPublished(current.email, userId, [...created, ...published]);
  if (published.length) await stopEnrollments({ userId, sequence: "verify_publish" }, "email_confirmed");
  await attachUser(current.email, userId);

  const patch: Partial<typeof user.$inferInsert> = {};
  if (!current.onboardingCompletedAt) patch.onboardingCompletedAt = new Date();
  if (stash?.contact.firstName && !current.firstName) patch.firstName = stash.contact.firstName;
  if (stash?.contact.lastName && !current.lastName) patch.lastName = stash.contact.lastName;
  if (stash?.contact.phone && !current.phone) patch.phone = stash.contact.phone;
  if (Object.keys(patch).length) await db.update(user).set(patch).where(eq(user.id, userId));

  const all = [...created, ...published];
  return { error: null, publicIds: all.map((r) => r.publicId) };
}
