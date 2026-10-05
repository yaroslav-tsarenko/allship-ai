import "server-only";
import { createHmac } from "node:crypto";
import { and, eq, gte, inArray, isNotNull, or } from "drizzle-orm";
import { env } from "@/env";
import type { Actor } from "@/server/actor";
import { db } from "@/server/db/client";
import { conversation, load } from "@/server/db/schema";
import { topics } from "./topics";

const TOKEN_TTL_SECONDS = 60 * 60;

function base64url(input: Buffer | string) {
  return Buffer.from(input).toString("base64url");
}

export function signSupabaseJwt(claims: Record<string, unknown>, secret: string) {
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64url(JSON.stringify(claims));
  const signature = createHmac("sha256", secret).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${signature}`;
}

export async function topicsForActor(actor: Actor) {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const staff = Boolean(actor.orgId && (actor.orgRole === "owner" || actor.orgRole === "dispatcher"));
  const loadScope =
    actor.orgId && actor.orgRole === "driver"
      ? and(eq(load.driverId, actor.userId), eq(load.carrierOrgId, actor.orgId))
      : staff && actor.orgId
        ? eq(load.carrierOrgId, actor.orgId)
        : eq(load.shipperId, actor.userId);
  const loads = await db
    .select({ id: load.id })
    .from(load)
    .where(and(loadScope, or(gte(load.updatedAt, since), inArray(load.status, ["booked", "assigned", "en_route_to_pickup", "in_transit", "delivered", "disputed"]))))
    .limit(200);
  const loadIds = loads.map((l) => l.id);
  const conversations = loadIds.length
    ? await db
        .select({ id: conversation.id })
        .from(conversation)
        .where(and(inArray(conversation.loadId, loadIds), actor.orgId && actor.orgRole ? eq(conversation.carrierOrgId, actor.orgId) : eq(conversation.shipperId, actor.userId), isNotNull(conversation.id)))
    : [];
  return [topics.user(actor.userId), ...loadIds.map(topics.load), ...conversations.map((c) => topics.conversation(c.id))];
}

export async function createRealtimeToken(actor: Actor) {
  if (!env.SUPABASE_JWT_SECRET) return null;
  const now = Math.floor(Date.now() / 1000);
  const allowed = await topicsForActor(actor);
  return {
    token: signSupabaseJwt({ sub: actor.userId, role: "authenticated", aud: "authenticated", iat: now, exp: now + TOKEN_TTL_SECONDS, topics: allowed }, env.SUPABASE_JWT_SECRET),
    expiresAt: (now + TOKEN_TTL_SECONDS) * 1000,
    topics: allowed,
  };
}
