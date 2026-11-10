import "server-only";
import { generateRandomString } from "better-auth/crypto";
import { env } from "@/env";
import { auth } from "@/server/auth/auth";

export const PUBLISH_LINK_HOURS = 72;
export const CLAIM_PATH = "/load/claim";
export const CONFIRM_PATH = "/load/confirm";
const STASH_PREFIX = "public-load-stash:";

const appUrl = () => env.BETTER_AUTH_URL ?? env.NEXT_PUBLIC_APP_URL;

export async function createMagicToken(email: string, hours = PUBLISH_LINK_HOURS) {
  const ctx = await auth.$context;
  const token = generateRandomString(32, "a-z", "A-Z");
  await ctx.internalAdapter.createVerificationValue({
    identifier: `magic-link:${token}`,
    value: JSON.stringify({ type: "magic-link", email: email.trim().toLowerCase() }),
    expiresAt: new Date(Date.now() + hours * 3_600_000),
  });
  return token;
}

export async function createPublishLink(email: string, hours = PUBLISH_LINK_HOURS) {
  const token = await createMagicToken(email, hours);
  const url = new URL("/api/auth/magic-link/verify", appUrl());
  url.searchParams.set("token", token);
  url.searchParams.set("callbackURL", CLAIM_PATH);
  url.searchParams.set("errorCallbackURL", CONFIRM_PATH);
  return url.toString();
}

export async function stashValue(value: unknown, minutes = 60) {
  const ctx = await auth.$context;
  const token = generateRandomString(40, "a-z", "A-Z", "0-9");
  await ctx.internalAdapter.createVerificationValue({
    identifier: `${STASH_PREFIX}${token}`,
    value: JSON.stringify(value),
    expiresAt: new Date(Date.now() + minutes * 60_000),
  });
  return token;
}

export async function takeStash<T>(token: string): Promise<T | null> {
  if (!/^[a-zA-Z0-9]{40}$/.test(token)) return null;
  const ctx = await auth.$context;
  const row = await ctx.internalAdapter.consumeVerificationValue(`${STASH_PREFIX}${token}`);
  if (!row) return null;
  try {
    return JSON.parse(row.value) as T;
  } catch {
    return null;
  }
}
