"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { bidRequestSchema, bookingSchema, googleStashSchema, moveRequestSchema, unlockSchema } from "@/features/moving/schema";
import { stashValue } from "@/server/funnel/links";
import { MOVING_CLAIM_PATH, MOVING_STASH_COOKIE } from "@/server/matcher/claim";
import { tierGaps, validateTiers, volumeForBedrooms } from "@/features/moving/pricing";
import { rateCardSchema } from "@/features/pricing/schema";
import { getActor } from "@/server/actor";
import { getSession } from "@/server/auth/session";
import { db } from "@/server/db/client";
import { auditLog, carrierProfile, carrierRateTier, carrierServiceRates } from "@/server/db/schema";
import { buildMoveLoad, findMatches, priceCandidates, type InstantQuoteRecord } from "@/server/matcher/service";
import { resolveRoute } from "@/server/matcher/geo";
import { clientIp, consumeRateLimit } from "@/server/rate-limit";
import { verifyTurnstile } from "@/server/turnstile";
import { ATTRIBUTION_COOKIE, parseAttribution } from "@/lib/attribution";
import { noteUnlockLead, publishForShipper, startMovingFunnel, unlockQuotes } from "@/server/matcher/funnel";
import { actionClient, ActionError, authedAction } from "./safe-action";

async function signedInShipper(email: string) {
  const session = await getSession();
  if (!session) return null;
  const actor = await getActor(session.user.id);
  if (actor.accountType !== "shipper" || actor.orgId) throw new ActionError("You're signed in with a carrier account. Sign out and book with a customer account.");
  if (session.user.email.toLowerCase() !== email.trim().toLowerCase()) throw new ActionError(`You're signed in as ${session.user.email}. Use that email or sign out first.`);
  return { id: actor.userId, email: session.user.email, phone: (session.user as { phone?: string | null }).phone ?? null };
}

export const stashMoveForGoogleAction = actionClient.inputSchema(googleStashSchema).action(async ({ parsedInput: input }) => {
  const ip = await clientIp();
  if (!(await consumeRateLimit(`matcher-stash:${ip}`, 20, 3600))) throw new ActionError("Too many requests from this connection. Try again in an hour or call us.");
  const token = await stashValue({ request: input.request, carrierOrgId: input.carrierOrgId ?? null, phone: input.phone || null }, 30);
  (await cookies()).set(MOVING_STASH_COOKIE, token, { path: MOVING_CLAIM_PATH, httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 1800 });
  return { ok: true as const };
});

export const unlockQuotesAction = actionClient.inputSchema(unlockSchema).action(async ({ parsedInput: input }) => {
  const ip = await clientIp();
  if (!(await consumeRateLimit(`matcher-unlock:${ip}`, 10, 3600))) throw new ActionError("Too many requests from this connection. Try again in an hour or call us.");
  if (!(await verifyTurnstile(input.turnstileToken, ip))) throw new ActionError("Please complete the security check.");
  const session = await getSession();
  if (session) {
    const phone = input.contact.phone || ((session.user as { phone?: string | null }).phone ?? "");
    noteUnlockLead({ id: session.user.id, name: session.user.name || input.contact.name, email: session.user.email, phone, isNew: false }, input.summary, input.marketingOptIn, parseAttribution((await cookies()).get(ATTRIBUTION_COOKIE)?.value));
    return { ok: true as const, signedIn: true };
  }
  const result = await unlockQuotes({ contact: input.contact, marketingOptIn: input.marketingOptIn, summary: input.summary });
  return { ok: true as const, signedIn: result.signedIn };
});

export const findMatchesAction = actionClient.inputSchema(moveRequestSchema).action(async ({ parsedInput: input }) => {
  const ip = await clientIp();
  if (!(await consumeRateLimit(`matcher:${ip}`, 30, 3600))) throw new ActionError("Too many searches from this connection. Try again in an hour or call us.");
  if (!(await verifyTurnstile(input.turnstileToken, ip))) throw new ActionError("Please complete the security check.");
  const result = await findMatches(input);
  if (!result.ok) return { ok: false as const, field: result.field, message: result.message };
  return { ok: true as const, route: result.route, volumeCuFt: result.volumeCuFt, matches: result.matches, requirements: result.requirements };
});

export const bookInstantQuoteAction = actionClient.inputSchema(bookingSchema).action(async ({ parsedInput: input }) => {
  const ip = await clientIp();
  if (!(await consumeRateLimit(`matcher-book:${ip}`, 6, 3600))) throw new ActionError("Too many booking requests from this connection. Try again in an hour or call us.");
  if (!(await verifyTurnstile(input.turnstileToken, ip))) throw new ActionError("Please complete the security check.");

  const req = input.request;
  const route = await resolveRoute(req.from, req.to);
  if ("error" in route) throw new ActionError("We couldn't find one of the addresses. Search again.");
  const [priced] = await priceCandidates(req, route, input.carrierOrgId);
  if (!priced) throw new ActionError("This carrier can no longer quote this move instantly. Search again to see current options.");
  if (priced.carrierCents !== input.quotedCarrierCents) {
    return { status: "price_changed" as const, carrierCents: priced.carrierCents, shipperTotalCents: priced.shipperTotalCents };
  }

  const quote: InstantQuoteRecord = {
    carrierOrgId: priced.carrierOrgId,
    carrierName: priced.name,
    carrierCents: priced.carrierCents,
    lines: priced.lines,
    miles: route.miles,
    distanceMethod: route.method,
    volumeCuFt: volumeForBedrooms(req.bedrooms),
    quotedAt: new Date().toISOString(),
  };
  const built = buildMoveLoad(req, route, quote);

  const signedIn = await signedInShipper(input.contact.email);
  if (signedIn) return { status: "booked" as const, href: await publishForShipper(signedIn, built, input.contact.phone) };

  const started = await startMovingFunnel({ contact: input.contact, marketingOptIn: input.marketingOptIn, built });
  return started.kind === "new" ? { status: "redirect" as const, href: started.url } : { status: "sign_in" as const, href: started.href };
});

export const requestMoveBidsAction = actionClient.inputSchema(bidRequestSchema).action(async ({ parsedInput: input }) => {
  const ip = await clientIp();
  if (!(await consumeRateLimit(`matcher-bids:${ip}`, 6, 3600))) throw new ActionError("Too many requests from this connection. Try again in an hour or call us.");
  if (!(await verifyTurnstile(input.turnstileToken, ip))) throw new ActionError("Please complete the security check.");

  const route = await resolveRoute(input.request.from, input.request.to);
  if ("error" in route) throw new ActionError("We couldn't find one of the addresses. Search again.");
  const built = buildMoveLoad(input.request, route, null);

  const signedIn = await signedInShipper(input.contact.email);
  if (signedIn) return { status: "booked" as const, href: await publishForShipper(signedIn, built, input.contact.phone) };

  const started = await startMovingFunnel({ contact: input.contact, marketingOptIn: input.marketingOptIn, built });
  return started.kind === "new" ? { status: "redirect" as const, href: started.url } : { status: "sign_in" as const, href: started.href };
});

const withCarrier = authedAction.use(async ({ next, ctx }) => {
  const actor = await getActor(ctx.user.id);
  if (!actor.orgId || (actor.orgRole !== "owner" && actor.orgRole !== "dispatcher")) throw new ActionError("Only carrier owners and dispatchers can change rates.");
  return next({ ctx: { ...ctx, actor, orgId: actor.orgId } });
});

export const saveRateCardAction = withCarrier.inputSchema(rateCardSchema).action(async ({ parsedInput: input, ctx }) => {
  if (!(await consumeRateLimit(`ratecard:${ctx.orgId}`, 30, 3600))) throw new ActionError("Too many changes in a short time. Try again later.");
  const tiers = [...input.tiers].sort((a, b) => a.fromMiles - b.fromMiles);
  const issues = validateTiers(tiers);
  if (issues.length) throw new ActionError(`Tier ${issues[0]!.index + 1}: ${issues[0]!.message}.`);
  if (input.instantQuotes && tiers.length === 0) throw new ActionError("Add at least one mileage tier before turning on instant quotes.");
  if (input.maxMiles < input.minMiles) throw new ActionError("The maximum distance must be at or above the minimum.");
  await db.transaction(async (tx) => {
    const [profile] = await tx.select({ orgId: carrierProfile.orgId }).from(carrierProfile).where(eq(carrierProfile.orgId, ctx.orgId)).limit(1).for("update");
    if (!profile) throw new ActionError("Finish your company profile first.");
    await tx
      .update(carrierProfile)
      .set({ instantQuotes: input.instantQuotes, instantQuoteMinMiles: input.minMiles, instantQuoteMaxMiles: input.maxMiles, serviceStates: [...new Set(input.serviceStates)].sort() })
      .where(eq(carrierProfile.orgId, ctx.orgId));
    await tx.delete(carrierRateTier).where(eq(carrierRateTier.orgId, ctx.orgId));
    if (tiers.length) await tx.insert(carrierRateTier).values(tiers.map((t) => ({ orgId: ctx.orgId, ...t })));
    await tx
      .insert(carrierServiceRates)
      .values({ orgId: ctx.orgId, packingPerCuFtCents: input.packingPerCuFtCents, unpackingPerCuFtCents: input.unpackingPerCuFtCents, storagePerCuFtMonthCents: input.storagePerCuFtMonthCents })
      .onConflictDoUpdate({
        target: carrierServiceRates.orgId,
        set: { packingPerCuFtCents: input.packingPerCuFtCents, unpackingPerCuFtCents: input.unpackingPerCuFtCents, storagePerCuFtMonthCents: input.storagePerCuFtMonthCents, updatedAt: new Date() },
      });
    await tx.insert(auditLog).values({ actorId: ctx.actor.userId, action: "carrier.rate_card_update", entity: "organization", entityId: ctx.orgId, diff: { instantQuotes: input.instantQuotes, tiers: tiers.length } });
  });
  revalidatePath("/app/settings/pricing");
  return { gaps: tierGaps(tiers, input.minMiles, input.maxMiles) };
});
