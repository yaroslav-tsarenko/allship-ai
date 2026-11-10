"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { bidRequestSchema, bookingSchema, moveRequestSchema } from "@/features/moving/schema";
import { tierGaps, validateTiers, volumeForBedrooms } from "@/features/moving/pricing";
import { rateCardSchema } from "@/features/pricing/schema";
import { getActor } from "@/server/actor";
import { getSession } from "@/server/auth/session";
import { db } from "@/server/db/client";
import { auditLog, carrierProfile, carrierRateTier, carrierServiceRates } from "@/server/db/schema";
import { buildMoveLoad, createInstantBid, enrollFollowup, findMatches, insertMoveLoad, priceCandidates, type InstantQuoteRecord } from "@/server/matcher/service";
import { resolveRoute } from "@/server/matcher/geo";
import { clientIp, consumeRateLimit } from "@/server/rate-limit";
import { verifyTurnstile } from "@/server/turnstile";
import { startMovingFunnel } from "@/server/matcher/funnel";
import { actionClient, ActionError, authedAction } from "./safe-action";

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

  const session = await getSession();
  if (session) {
    const actor = await getActor(session.user.id);
    if (actor.accountType !== "shipper") throw new ActionError("You're signed in with a carrier account. Sign in as a shipper to book a move.");
    if (session.user.email.toLowerCase() !== input.contact.email.toLowerCase()) {
      throw new ActionError(`You're signed in as ${session.user.email}. Use that email or sign out first.`);
    }
    const row = await db.transaction((tx) => insertMoveLoad(tx, actor.userId, built, { publish: true, publishOnVerify: false }));
    const placed = await createInstantBid(row.id);
    await enrollFollowup(actor.email, actor.userId, row.id, row.publicId);
    revalidatePath("/app/loads");
    const href = `/app/loads/${row.publicId}${placed ? `?bid=${placed.bidId}` : ""}#bids`;
    return { status: "booked" as const, href };
  }

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

  const session = await getSession();
  if (session) {
    const actor = await getActor(session.user.id);
    if (actor.accountType !== "shipper") throw new ActionError("You're signed in with a carrier account. Sign in as a shipper to post a move.");
    if (session.user.email.toLowerCase() !== input.contact.email.toLowerCase()) {
      throw new ActionError(`You're signed in as ${session.user.email}. Use that email or sign out first.`);
    }
    const row = await db.transaction((tx) => insertMoveLoad(tx, actor.userId, built, { publish: true, publishOnVerify: false }));
    await enrollFollowup(actor.email, actor.userId, row.id, row.publicId);
    revalidatePath("/app/loads");
    return { status: "booked" as const, href: `/app/loads/${row.publicId}` };
  }

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
