import "server-only";
import { and, desc, eq, isNull, lt } from "drizzle-orm";
import { env } from "@/env";
import { db } from "@/server/db/client";
import { squareConnection } from "@/server/db/schema";
import { openToken, sealToken } from "./crypto";

export const SQUARE_SCOPES = ["PAYMENTS_READ", "PAYMENTS_WRITE", "MERCHANT_PROFILE_READ"] as const;
export const SQUARE_STATE_COOKIE = "allship_square_state";
const SQUARE_VERSION = "2025-04-16";

export const squareConfigured = () => Boolean(env.SQUARE_APPLICATION_ID && env.SQUARE_APPLICATION_SECRET);
const base = () => (env.SQUARE_ENVIRONMENT === "sandbox" ? "https://connect.squareupsandbox.com" : "https://connect.squareup.com");
export const squareRedirectUri = () => `${env.NEXT_PUBLIC_APP_URL}/api/square/callback`;

export function authorizeUrl(state: string) {
  const url = new URL(`${base()}/oauth2/authorize`);
  url.searchParams.set("client_id", env.SQUARE_APPLICATION_ID!);
  url.searchParams.set("scope", SQUARE_SCOPES.join(" "));
  url.searchParams.set("session", "false");
  url.searchParams.set("state", state);
  url.searchParams.set("redirect_uri", squareRedirectUri());
  return url.toString();
}

type TokenResponse = { access_token: string; refresh_token: string; expires_at: string; merchant_id: string };

export class SquareError extends Error {
  constructor(
    readonly path: string,
    readonly status: number,
    readonly code: string,
    readonly detail?: string,
  ) {
    super(`Square ${path} ${status}: ${code}`);
  }
}

export async function square<T>(path: string, init: RequestInit & { token?: string } = {}) {
  const { token, ...rest } = init;
  const res = await fetch(`${base()}${path}`, {
    ...rest,
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
    headers: { "Content-Type": "application/json", "Square-Version": SQUARE_VERSION, ...(token ? { Authorization: `Bearer ${token}` } : {}), ...rest.headers },
  });
  const data = (await res.json().catch(() => ({}))) as T & { errors?: Array<{ code?: string; detail?: string }>; message?: string };
  if (!res.ok) throw new SquareError(path, res.status, data.errors?.[0]?.code ?? data.message ?? "error", data.errors?.[0]?.detail);
  return data;
}

const grant = (body: Record<string, string>) =>
  square<TokenResponse>("/oauth2/token", { method: "POST", body: JSON.stringify({ client_id: env.SQUARE_APPLICATION_ID, client_secret: env.SQUARE_APPLICATION_SECRET, ...body }) });

async function mainLocation(token: string) {
  const { locations = [] } = await square<{ locations?: Array<{ id: string; status: string; business_name?: string; name?: string }> }>("/v2/locations", { token });
  const active = locations.find((l) => l.status === "ACTIVE") ?? locations[0];
  return { locationId: active?.id ?? null, businessName: active?.business_name ?? active?.name ?? null };
}

export async function connectWithCode(code: string) {
  const tokens = await grant({ code, grant_type: "authorization_code", redirect_uri: squareRedirectUri() });
  const location = await mainLocation(tokens.access_token);
  const values = {
    environment: env.SQUARE_ENVIRONMENT,
    accessToken: sealToken(tokens.access_token),
    refreshToken: sealToken(tokens.refresh_token),
    expiresAt: new Date(tokens.expires_at),
    scopes: [...SQUARE_SCOPES],
    ...location,
    revokedAt: null,
  };
  await db.insert(squareConnection).values({ merchantId: tokens.merchant_id, ...values }).onConflictDoUpdate({ target: squareConnection.merchantId, set: values });
  return { merchantId: tokens.merchant_id, ...location };
}

async function activeConnection() {
  const [row] = await db
    .select()
    .from(squareConnection)
    .where(and(isNull(squareConnection.revokedAt), eq(squareConnection.environment, env.SQUARE_ENVIRONMENT)))
    .orderBy(desc(squareConnection.updatedAt))
    .limit(1);
  return row ?? null;
}

export async function hasSquareConnection() {
  return Boolean(await activeConnection());
}

export type SquareCheckout = { applicationId: string; locationId: string; environment: "production" | "sandbox" };

export async function squareCheckout(): Promise<SquareCheckout | null> {
  if (!squareConfigured()) return null;
  const row = await activeConnection();
  if (!row?.locationId) return null;
  return { applicationId: env.SQUARE_APPLICATION_ID!, locationId: row.locationId, environment: env.SQUARE_ENVIRONMENT };
}

async function refreshRow(row: typeof squareConnection.$inferSelect) {
  const tokens = await grant({ refresh_token: openToken(row.refreshToken), grant_type: "refresh_token" });
  const patch = { accessToken: sealToken(tokens.access_token), refreshToken: sealToken(tokens.refresh_token ?? openToken(row.refreshToken)), expiresAt: new Date(tokens.expires_at) };
  await db.update(squareConnection).set(patch).where(eq(squareConnection.merchantId, row.merchantId));
  return tokens.access_token;
}

export async function squareAccess() {
  const row = await activeConnection();
  if (!row) return null;
  const soon = Date.now() + 24 * 3_600_000;
  const accessToken = row.expiresAt.getTime() < soon ? await refreshRow(row) : openToken(row.accessToken);
  return { accessToken, locationId: row.locationId, merchantId: row.merchantId };
}

export async function refreshExpiringSquareTokens(days = 7) {
  const rows = await db
    .select()
    .from(squareConnection)
    .where(and(isNull(squareConnection.revokedAt), lt(squareConnection.expiresAt, new Date(Date.now() + days * 86_400_000))));
  let refreshed = 0;
  for (const row of rows) {
    await refreshRow(row);
    refreshed += 1;
  }
  return { refreshed };
}
