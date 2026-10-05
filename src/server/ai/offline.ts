import "server-only";
import { categories } from "@/content/categories";
import { US_STATES } from "@/features/loads/schema";
import { runTool, type ToolContext } from "./tools";
import type { PageContext, StreamEvent } from "./types";

type Row = Record<string, unknown>;

function* words(text: string): Generator<StreamEvent> {
  for (const chunk of text.match(/\S+\s*/g) ?? []) yield { type: "text", delta: chunk };
}

async function call(ctx: ToolContext, name: string, args: Record<string, unknown>, out: StreamEvent[]) {
  const { label, result } = await runTool(ctx, name, args);
  out.push({ type: "tool", name, label });
  return result as unknown;
}

function guessCategory(text: string) {
  const t = text.toLowerCase();
  const rules: Array<[RegExp, string]> = [
    [/\b(car|suv|sedan|truck|pickup|vehicle)\b/, "car_or_light_truck"],
    [/\b(motorcycle|motorbike)\b/, "motorcycle"],
    [/\bboat\b/, "powerboat"],
    [/\b(apartment|house|home|bedroom|move|moving)\b/, "long_distance_moving"],
    [/\b(pallet|freight|ltl|crate)\b/, "freight"],
    [/\b(excavator|tractor|equipment|forklift)\b/, "heavy_equipment"],
  ];
  const hit = rules.find(([re]) => re.test(t))?.[1];
  return categories.some((c) => c.key === hit) ? hit : categories[0]!.key;
}

const stateCodes = new Set<string>(US_STATES.map((s) => s[0]));

export function guessRoute(text: string) {
  const m = text.match(/\bfrom\s+([a-z][a-z .'-]*?)(?:,?\s+([a-z]{2}))?\s+to\s+([a-z][a-z .'-]*?)(?:,?\s+([a-z]{2}))?\s*(?=[.,!?;]|\s(?:on|by|in|next|this|around|before|after)\b|$)/i);
  if (!m) return {};
  const city = (v?: string) => v?.trim().replace(/\b\w/g, (c) => c.toUpperCase()).slice(0, 80);
  const state = (v?: string) => (v && stateCodes.has(v.toUpperCase()) ? v.toUpperCase() : undefined);
  const out: Record<string, string> = {};
  const pickupState = state(m[2]);
  const dropoffState = state(m[4]);
  out.pickupCity = city(pickupState ? m[1] : [m[1], m[2]].filter(Boolean).join(" "))!;
  out.dropoffCity = city(dropoffState ? m[3] : [m[3], m[4]].filter(Boolean).join(" "))!;
  if (pickupState) out.pickupState = pickupState;
  if (dropoffState) out.dropoffState = dropoffState;
  return out;
}

export async function* offlineReply(ctx: ToolContext, text: string, page: PageContext | null): AsyncGenerator<StreamEvent> {
  const t = text.toLowerCase();
  const out: StreamEvent[] = [];
  const explicitId = text.toUpperCase().match(/\bAS-[A-Z0-9]{4,10}\b/)?.[0];
  const publicId = explicitId ?? page?.publicId;
  const wantsToShip = /\b(ship|move|send|post|transport|haul)\b/.test(t);
  const staff = ctx.role === "owner" || ctx.role === "dispatcher";
  let reply = "";

  if (/\b(tour|show me around|walk me through|how do i use|getting started)\b/.test(t)) {
    const tourId = ctx.role === "shipper" ? "welcome-shipper" : ctx.role === "driver" ? "welcome-driver" : "welcome-carrier";
    await call(ctx, "start_tour", { tourId }, out);
    reply = "Sure. Start the tour below and I'll point out each part of the dashboard as we go.";
  } else if (/\b(fee|escrow|cancel|refund|verif|insurance|dispute|safe|payout|paid)\b/.test(t)) {
    const hits = (await call(ctx, "search_help", { query: text }, out)) as Row[];
    const top = hits[0];
    reply = top ? `${String(top.answer)}` : "I couldn't find that in the help center. Contact support and we'll sort it out.";
  } else if (ctx.role === "shipper" && publicId && (explicitId || !wantsToShip)) {
    const load = (await call(ctx, "get_my_load", { publicId }, out)) as Row & { bids?: Row[] };
    if ("error" in load) reply = String(load.error);
    else {
      const bids = load.bids ?? [];
      const verified = bids.filter((b) => b.fmcsa === "verified" && b.status === "active");
      const pick = (verified.length ? verified : bids)[0];
      reply = `${load.publicId} (${load.title}) is ${String(load.status).toLowerCase()}. `;
      reply += bids.length
        ? `You have ${bids.length} bid${bids.length === 1 ? "" : "s"}. ${pick ? `The strongest value looks like ${pick.carrier} at ${pick.amount} (${pick.totalWithFee} with the fee)${pick.rating ? `, rated ${pick.rating} from ${pick.reviews} reviews` : ""}. Check their dates against your window before you accept.` : ""}`
        : "No bids yet. Most loads get their first bids within a day.";
    }
  } else if (ctx.role === "shipper" && wantsToShip) {
    await call(ctx, "draft_load", { category: guessCategory(text), ...guessRoute(text), notes: text.slice(0, 500) }, out);
    reply = "I started a load form for you. Add the pickup and delivery details, check the item fields, then post it to get bids.";
  } else if (ctx.role === "shipper") {
    const loads = (await call(ctx, "list_my_loads", { filter: "active" }, out)) as Row[];
    reply = loads.length
      ? `You have ${loads.length} active load${loads.length === 1 ? "" : "s"}:\n\n${loads.map((l) => `- **${l.publicId}** ${l.title}: ${l.status}, ${l.bids} bid${l.bids === 1 ? "" : "s"}`).join("\n")}\n\nAsk me about any of them by ID.`
      : "You don't have active loads. Tell me what you need to ship and I'll start the form.";
  } else if (staff && publicId && /\bbid\b/.test(t)) {
    const load = (await call(ctx, "get_open_load", { publicId }, out)) as Row;
    if ("error" in load) reply = String(load.error);
    else {
      const amount = Number(String(load.targetPrice ?? "").replace(/[^0-9.]/g, "")) || 1000;
      await call(
        ctx,
        "draft_bid",
        {
          publicId,
          amount,
          message: `We can handle ${load.title} from ${String(load.pickup && (load.pickup as Row).place)} to ${String(load.dropoff && (load.dropoff as Row).place)} within your pickup window. Our team is insured and FMCSA registered, and we'll confirm pickup details by chat after booking.`,
        },
        out,
      );
      reply = `I drafted a bid on ${publicId}. Adjust the price and message to match your costs, then submit it.`;
    }
  } else if (staff && /\b(trip|driver|assign)\b/.test(t)) {
    const trips = (await call(ctx, "list_trips", { filter: "upcoming" }, out)) as Row[];
    reply = trips.length ? trips.map((r) => `- **${r.publicId}** ${r.route}: ${r.status}. ${r.nextStep ?? ""}`).join("\n") : "No upcoming trips right now.";
  } else if (staff) {
    const loads = (await call(ctx, "search_open_loads", { categories: [], sort: "newest" }, out)) as Row[];
    reply = loads.length
      ? `Here are the newest open loads:\n\n${loads.slice(0, 5).map((l) => `- **${l.publicId}** ${l.title}, ${l.route}${l.targetPrice ? `, target ${l.targetPrice}` : ""}`).join("\n")}\n\nAsk me to draft a bid on any of them.`
      : "The board is quiet right now. Check back soon or widen your filters.";
  } else {
    const trips = (await call(ctx, "list_trips", { filter: "active" }, out)) as Row[];
    const next = trips[0] ?? ((await call(ctx, "list_trips", { filter: "upcoming" }, out)) as Row[])[0];
    reply = next ? `Next up: **${next.publicId}**, ${next.route}. ${next.nextStep ?? ""}` : "You don't have trips right now. Your dispatcher will assign one.";
  }

  for (const event of out) yield event;
  yield* words(reply);
}
