import "server-only";
import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { estimateCarShipping, vehicleSizes } from "@/components/marketing/tools/car-shipping-math";
import { cubicFeetForHome, estimateMove, homeSizes, packingLevels } from "@/components/marketing/tools/moving-cost-math";
import { calculateFreightClass } from "@/components/marketing/tools/freight-class-math";
import { carrierFaq, paymentsFaq, safetyFaq, shipperFaq } from "@/components/marketing/company/faq-content";
import { categories } from "@/content/categories";
import { listBoardLoads } from "@/features/board/queries";
import { US_STATES } from "@/features/loads/schema";
import { describeDetail, fieldsOf } from "@/features/loads/spec";
import { tourIds, tourMeta } from "@/features/tours/ids";
import { formatUsd } from "@/lib/money";
import type { Actor } from "@/server/actor";
import { listCarrierBids } from "@/server/bids/service";
import { db } from "@/server/db/client";
import { carrierProfile, load, notification, payout } from "@/server/db/schema";
import type { LoadCategory, LoadStatus } from "@/server/db/schema/enums";
import { getLoadForCarrier, getShipperLoad, listShipperLoads } from "@/server/loads/service";
import { statusLabels } from "@/server/loads/transitions";
import { listTrips, trackingFor } from "@/server/trips/service";
import type { ViewerRole } from "@/server/viewer/viewer";
import type { AssistantAction } from "./types";

export type ToolContext = { actor: Actor; role: ViewerRole; emit: (action: AssistantAction) => void };

type ToolDef<S extends z.ZodType> = {
  name: string;
  label: string;
  description: string;
  roles: ViewerRole[];
  input: S;
  run: (ctx: ToolContext, input: z.infer<S>) => Promise<unknown>;
};

function tool<S extends z.ZodType>(def: ToolDef<S>) {
  return def as unknown as ToolDef<z.ZodType>;
}

const everyone: ViewerRole[] = ["shipper", "owner", "dispatcher", "driver"];
const carrierStaff: ViewerRole[] = ["owner", "dispatcher"];
const categoryKeys = categories.map((c) => c.key) as [LoadCategory, ...LoadCategory[]];
const stateCodes = US_STATES.map((s) => s[0]) as unknown as [string, ...string[]];
const publicIdSchema = z.string().regex(/^AS-[A-Z0-9]{4,10}$/, "Use a load ID like AS-7K2P9Q");

const appPaths = ["/app", "/app/loads", "/app/loads/new", "/app/board", "/app/bids", "/app/trips", "/app/team", "/app/messages", "/app/payouts", "/app/reviews", "/app/notifications", "/app/settings", "/app/settings/security", "/app/settings/notifications"] as const;

function place(stop: { city?: string; state?: string }) {
  return [stop.city, stop.state].filter(Boolean).join(", ") || "Unknown";
}

function detailsFor(category: LoadCategory, details: Record<string, unknown>) {
  const out: Record<string, string> = {};
  for (const f of fieldsOf(category)) {
    const v = describeDetail(f, details[f.name]);
    if (v) out[f.label] = v;
  }
  return out;
}

const knowledge = [...shipperFaq, ...carrierFaq, ...paymentsFaq, ...safetyFaq];

export const tools = [
  tool({
    name: "search_help",
    label: "Checking the help center",
    description: "Search AllShip AI help articles (fees, escrow, verification, cancellations, safety, how bidding works). Use before answering policy questions.",
    roles: everyone,
    input: z.object({ query: z.string().min(2).max(200) }),
    run: async (_ctx, { query }) => {
      const terms = query.toLowerCase().split(/\W+/).filter((t) => t.length > 2);
      const scored = knowledge
        .map((item) => {
          const hay = `${item.question} ${typeof item.answer === "string" ? item.answer : ""}`.toLowerCase();
          return { item, score: terms.reduce((n, t) => n + (hay.includes(t) ? 1 : 0), 0) };
        })
        .filter((s) => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 4);
      return scored.map(({ item }) => ({ question: item.question, answer: typeof item.answer === "string" ? item.answer : "" }));
    },
  }),
  tool({
    name: "open_page",
    label: "Preparing a link",
    description: "Offer the user a button that opens a page in the dashboard. Use when they ask where something is or want to go somewhere.",
    roles: everyone,
    input: z.object({ path: z.enum(appPaths), label: z.string().min(2).max(40) }),
    run: async (ctx, { path, label }) => {
      ctx.emit({ type: "navigate", href: path, label });
      return { offered: true };
    },
  }),
  tool({
    name: "start_tour",
    label: "Preparing a guided tour",
    description: `Offer an interactive step-by-step tour of the product. Available tours: ${tourIds.map((id) => `${id} (${tourMeta[id].title})`).join("; ")}.`,
    roles: everyone,
    input: z.object({ tourId: z.enum(tourIds) }),
    run: async (ctx, { tourId }) => {
      const meta = tourMeta[tourId];
      if (!meta.roles.includes(ctx.role)) return { error: "That tour isn't available for this account." };
      ctx.emit({ type: "start_tour", tourId, label: `Show me: ${meta.title}` });
      return { offered: true };
    },
  }),
  tool({
    name: "recent_notifications",
    label: "Reading your notifications",
    description: "List the user's latest notifications (unread first).",
    roles: everyone,
    input: z.object({}),
    run: async (ctx) =>
      db
        .select({ title: notification.title, body: notification.body, href: notification.href, read: notification.readAt, at: notification.createdAt })
        .from(notification)
        .where(eq(notification.userId, ctx.actor.userId))
        .orderBy(desc(notification.createdAt))
        .limit(10),
  }),
  tool({
    name: "estimate_price",
    label: "Estimating a price",
    description: "Ballpark price range for a shipment using AllShip's public calculators. kind=car needs miles + vehicleSize; kind=move needs miles + homeSize; kind=freight_class needs pallet dimensions and weight. Always say it's an estimate and real bids decide the price.",
    roles: everyone,
    input: z.object({
      kind: z.enum(["car", "move", "freight_class"]),
      miles: z.number().min(1).max(4000).optional(),
      vehicleSize: z.enum(vehicleSizes.map((v) => v.value) as [string, ...string[]]).optional(),
      enclosed: z.boolean().optional(),
      inoperable: z.boolean().optional(),
      homeSize: z.enum(homeSizes.map((h) => h.value) as [string, ...string[]]).optional(),
      packing: z.enum(packingLevels.map((p) => p.value) as [string, ...string[]]).optional(),
      lengthIn: z.number().positive().optional(),
      widthIn: z.number().positive().optional(),
      heightIn: z.number().positive().optional(),
      weightLb: z.number().positive().optional(),
      pieces: z.number().int().positive().optional(),
    }),
    run: async (_ctx, i) => {
      if (i.kind === "car") {
        if (!i.miles || !i.vehicleSize) return { error: "Need miles and vehicleSize." };
        const e = estimateCarShipping({ miles: i.miles, size: i.vehicleSize as never, trailer: i.enclosed ? "enclosed" : "open", condition: i.inoperable ? "inoperable" : "running" });
        return { totalLow: formatUsd(e.total.low * 100), totalHigh: formatUsd(e.total.high * 100), note: "Includes the 10% service fee. Real bids may differ." };
      }
      if (i.kind === "move") {
        if (!i.miles || !i.homeSize) return { error: "Need miles and homeSize." };
        const e = estimateMove({ cubicFeet: cubicFeetForHome(i.homeSize as never), miles: i.miles, packing: (i.packing ?? packingLevels[0]!.value) as never, storageMonths: 0, unpacking: false });
        return { estimate: e, note: "Dollar amounts. Includes the 10% service fee. Real bids may differ." };
      }
      if (!i.lengthIn || !i.widthIn || !i.heightIn || !i.weightLb) return { error: "Need lengthIn, widthIn, heightIn and weightLb." };
      return calculateFreightClass({ lengthIn: i.lengthIn, widthIn: i.widthIn, heightIn: i.heightIn, weightLb: i.weightLb, pieces: i.pieces ?? 1 }) ?? { error: "Check the dimensions." };
    },
  }),
  tool({
    name: "list_my_loads",
    label: "Looking up your loads",
    description: "List the shipper's loads. filter: active (posted, booked or moving), drafts, past.",
    roles: ["shipper"],
    input: z.object({ filter: z.enum(["active", "drafts", "past"]).default("active") }),
    run: async (ctx, { filter }) => {
      const rows = await listShipperLoads(ctx.actor, filter);
      return rows.slice(0, 20).map((r) => ({
        publicId: r.publicId,
        title: r.title,
        status: statusLabels[r.status as LoadStatus],
        route: `${place(r.pickup)} → ${place(r.dropoff)}`,
        bids: r.bids,
        lowestBid: r.lowestBidCents ? formatUsd(r.lowestBidCents) : null,
      }));
    },
  }),
  tool({
    name: "get_my_load",
    label: "Reading the load",
    description: "Full details of one of the shipper's loads: status, route, details, every bid with carrier rating and history, payment and latest tracking position. Use it to compare bids.",
    roles: ["shipper"],
    input: z.object({ publicId: publicIdSchema }),
    run: async (ctx, { publicId }) => {
      const data = await getShipperLoad(ctx.actor, publicId);
      if (!data) return { error: "No load with that ID on this account." };
      const tracking = ["en_route_to_pickup", "in_transit"].includes(data.load.status) ? await trackingFor(ctx.actor, data.load.id, 1) : null;
      const last = tracking?.points.at(-1);
      return {
        publicId: data.load.publicId,
        title: data.load.title,
        category: data.load.category,
        status: statusLabels[data.load.status],
        pickup: { place: place(data.load.pickup), window: [data.load.pickup.windowStart, data.load.pickup.windowEnd] },
        dropoff: { place: place(data.load.dropoff), window: [data.load.dropoff.windowStart, data.load.dropoff.windowEnd] },
        details: detailsFor(data.load.category, data.load.details),
        targetPrice: data.load.targetPriceCents ? formatUsd(data.load.targetPriceCents) : null,
        biddingClosesAt: data.load.biddingClosesAt,
        bids: data.bids
          .filter((b) => b.status === "active" || b.status === "accepted")
          .map((b) => ({
            carrier: b.carrierName,
            amount: formatUsd(b.amountCents),
            totalWithFee: formatUsd(Math.round(b.amountCents * 1.1)),
            status: b.status,
            fmcsa: b.fmcsaStatus,
            rating: b.rating,
            reviews: b.reviews,
            completedLoads: b.completedLoads,
            pickupBy: b.estimatedPickupAt,
            deliveryBy: b.estimatedDeliveryAt,
            message: b.message.slice(0, 600),
          })),
        carrier: data.carrier?.name ?? null,
        lastPosition: last ? { lat: last.lat, lng: last.lng, at: last.recordedAt, speedMph: last.speedMph } : null,
        link: `/app/loads/${data.load.publicId}`,
      };
    },
  }),
  tool({
    name: "draft_load",
    label: "Drafting your load",
    description: `Prepare a new load form pre-filled from the conversation. The user reviews and posts it themselves. category must be one of: ${categoryKeys.join(", ")}. details keys must match that category's form fields when known.`,
    roles: ["shipper"],
    input: z.object({
      category: z.enum(categoryKeys),
      title: z.string().max(120).optional(),
      pickupCity: z.string().max(80).optional(),
      pickupState: z.enum(stateCodes).optional(),
      pickupZip: z.string().regex(/^\d{5}$/).optional(),
      pickupDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      dropoffCity: z.string().max(80).optional(),
      dropoffState: z.enum(stateCodes).optional(),
      dropoffZip: z.string().regex(/^\d{5}$/).optional(),
      details: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.array(z.string())])).optional(),
      notes: z.string().max(1000).optional(),
    }),
    run: async (ctx, i) => {
      const fields = fieldsOf(i.category).map((f) => ({ name: f.name, label: f.label, kind: f.kind, required: Boolean(f.required), options: "options" in f ? f.options : undefined }));
      ctx.emit({
        type: "prefill_load",
        label: "Review and post this load",
        prefill: {
          category: i.category,
          title: i.title,
          pickup: { city: i.pickupCity, state: i.pickupState, postalCode: i.pickupZip, date: i.pickupDate },
          dropoff: { city: i.dropoffCity, state: i.dropoffState, postalCode: i.dropoffZip },
          details: i.details,
          notes: i.notes,
        },
      });
      return { offered: true, formFields: fields, note: "The user still needs to fill any missing required fields and post it." };
    },
  }),
  tool({
    name: "search_open_loads",
    label: "Searching the load board",
    description: "Search open loads on the board for a carrier. Filters are optional.",
    roles: carrierStaff,
    input: z.object({ categories: z.array(z.enum(categoryKeys)).max(10).default([]), fromState: z.enum(stateCodes).optional(), toState: z.enum(stateCodes).optional(), sort: z.enum(["newest", "pickup", "target"]).default("newest") }),
    run: async (ctx, i) => {
      const rows = await listBoardLoads({ categories: i.categories, from: i.fromState ?? null, to: i.toState ?? null, sort: i.sort }, ctx.actor.orgId);
      return rows.slice(0, 15).map((r) => ({
        publicId: r.publicId,
        title: r.title,
        category: r.category,
        route: `${place({ city: r.pickupCity ?? undefined, state: r.pickupState ?? undefined })} → ${place({ city: r.dropoffCity ?? undefined, state: r.dropoffState ?? undefined })}`,
        pickup: r.pickupStart,
        targetPrice: r.targetPriceCents ? formatUsd(r.targetPriceCents) : null,
        yourBid: r.myBidCents ? formatUsd(r.myBidCents) : null,
        bids: r.bids,
        link: `/app/board/${r.publicId}`,
      }));
    },
  }),
  tool({
    name: "get_open_load",
    label: "Reading the load",
    description: "Details of an open load (or a load your company booked) as a carrier sees it: route, dates, item details, number of competing bids, your current bid.",
    roles: carrierStaff,
    input: z.object({ publicId: publicIdSchema }),
    run: async (ctx, { publicId }) => {
      const data = await getLoadForCarrier(ctx.actor, publicId);
      if (!data) return { error: "That load isn't open or isn't visible to your company." };
      return {
        publicId: data.load.publicId,
        title: data.load.title,
        category: data.load.category,
        status: statusLabels[data.load.status],
        pickup: { place: place(data.load.pickup), window: [data.load.pickup.windowStart, data.load.pickup.windowEnd] },
        dropoff: { place: place(data.load.dropoff), window: [data.load.dropoff.windowStart, data.load.dropoff.windowEnd] },
        details: detailsFor(data.load.category, data.load.details),
        targetPrice: data.load.targetPriceCents ? formatUsd(data.load.targetPriceCents) : null,
        competingBids: data.bidCount,
        yourBid: data.myBid ? { amount: formatUsd(data.myBid.amountCents), status: data.myBid.status } : null,
        link: `/app/board/${data.load.publicId}`,
      };
    },
  }),
  tool({
    name: "draft_bid",
    label: "Drafting your bid",
    description: "Prepare a bid for the carrier to review and submit themselves. amount is what the carrier receives in USD. message must be at least 80 characters, specific to the load (equipment, timing, experience), professional, no phone numbers or emails.",
    roles: carrierStaff,
    input: z.object({ publicId: publicIdSchema, amount: z.number().min(25).max(500_000), message: z.string().min(80).max(1500) }),
    run: async (ctx, i) => {
      const clean = i.message.replace(/\b[\w.+-]+@[\w-]+\.[\w.]+\b/g, "").replace(/\+?\d[\d\s().-]{8,}\d/g, "");
      ctx.emit({ type: "prefill_bid", publicId: i.publicId, amount: i.amount, message: clean, label: `Review bid on ${i.publicId}` });
      return { offered: true, shipperPays: formatUsd(Math.round(i.amount * 110)), youReceive: formatUsd(i.amount * 100) };
    },
  }),
  tool({
    name: "list_my_bids",
    label: "Looking up your bids",
    description: "List the carrier company's bids. filter: active, won, closed (lost or withdrawn).",
    roles: carrierStaff,
    input: z.object({ filter: z.enum(["active", "won", "closed"]).default("active") }),
    run: async (ctx, { filter }) => {
      const rows = await listCarrierBids(ctx.actor, filter);
      return rows.slice(0, 20).map((r) => ({ publicId: r.loadPublicId, title: r.loadTitle, amount: formatUsd(r.amountCents), status: r.status, loadStatus: statusLabels[r.loadStatus], route: `${place(r.pickup)} → ${place(r.dropoff)}` }));
    },
  }),
  tool({
    name: "list_trips",
    label: "Looking up trips",
    description: "List trips (booked loads) for the carrier team or the driver. filter: upcoming (booked/assigned), active (on the road or awaiting confirmation), done.",
    roles: ["owner", "dispatcher", "driver"],
    input: z.object({ filter: z.enum(["upcoming", "active", "done"]).default("active") }),
    run: async (ctx, { filter }) => {
      const rows = await listTrips(ctx.actor, filter);
      return rows.slice(0, 20).map((r) => ({
        publicId: r.publicId,
        title: r.title,
        status: statusLabels[r.status],
        route: `${place(r.pickup)} → ${place(r.dropoff)}`,
        pickupWindow: r.pickup.windowStart ?? null,
        driver: r.driverName ?? "Not assigned",
        link: `/app/trips/${r.publicId}`,
        nextStep: nextStepFor(r.status, Boolean(r.driverId)),
      }));
    },
  }),
  tool({
    name: "payout_status",
    label: "Checking payouts",
    description: "Carrier company payout setup status and the latest payouts.",
    roles: ["owner"],
    input: z.object({}),
    run: async (ctx) => {
      if (!ctx.actor.orgId) return { error: "No company." };
      const [profile] = await db.select({ payoutsEnabled: carrierProfile.payoutsEnabled, connected: carrierProfile.stripeAccountId }).from(carrierProfile).where(eq(carrierProfile.orgId, ctx.actor.orgId)).limit(1);
      const recent = await db
        .select({ amountCents: payout.amountCents, status: payout.status, paidAt: payout.paidAt, publicId: load.publicId })
        .from(payout)
        .innerJoin(load, eq(load.id, payout.loadId))
        .where(and(eq(payout.carrierOrgId, ctx.actor.orgId), inArray(payout.status, ["pending", "scheduled", "paid", "held"])))
        .orderBy(desc(payout.createdAt))
        .limit(10);
      return { setUp: Boolean(profile?.connected), payoutsEnabled: Boolean(profile?.payoutsEnabled), recent: recent.map((p) => ({ ...p, amount: formatUsd(p.amountCents) })) };
    },
  }),
];

export function nextStepFor(status: LoadStatus, hasDriver: boolean) {
  switch (status) {
    case "booked":
      return hasDriver ? "Start the trip when you head to pickup." : "Assign a driver.";
    case "assigned":
      return "Driver taps Start trip when heading to pickup.";
    case "en_route_to_pickup":
      return "At pickup: take photos of the shipment and confirm pickup.";
    case "in_transit":
      return "At delivery: get the recipient's name and signature, take photos, confirm delivery.";
    case "delivered":
      return "Waiting for the shipper to confirm. Payment releases on confirmation or automatically after 72 hours.";
    case "disputed":
      return "A dispute is open. Add details in the load chat; our team will follow up.";
    default:
      return null;
  }
}

export function toolsFor(role: ViewerRole) {
  return tools.filter((t) => t.roles.includes(role));
}

export function openAiToolSpecs(role: ViewerRole) {
  return toolsFor(role).map((t) => ({
    type: "function" as const,
    name: t.name,
    description: t.description,
    parameters: z.toJSONSchema(t.input, { target: "draft-7", io: "input" }) as Record<string, unknown>,
    strict: false,
  }));
}

export async function runTool(ctx: ToolContext, name: string, rawArgs: unknown) {
  const def = toolsFor(ctx.role).find((t) => t.name === name);
  if (!def) return { label: "Working", result: { error: `Tool ${name} isn't available.` } };
  const parsed = def.input.safeParse(rawArgs ?? {});
  if (!parsed.success) return { label: def.label, result: { error: "Invalid arguments", issues: parsed.error.issues.slice(0, 5).map((i) => `${i.path.join(".")}: ${i.message}`) } };
  try {
    return { label: def.label, result: await def.run(ctx, parsed.data) };
  } catch (error) {
    return { label: def.label, result: { error: error instanceof Error ? error.message : "Tool failed" } };
  }
}
