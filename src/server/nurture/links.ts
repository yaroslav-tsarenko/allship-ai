import "server-only";
import { env } from "@/env";
import { signEmailToken, verifyEmailToken, type EmailTokenPurpose } from "./token";
import type { SequenceId } from "./schedule";

export const absoluteUrl = (path: string) => new URL(path, env.NEXT_PUBLIC_APP_URL).toString();

export function unsubscribeToken(email: string, sequence?: SequenceId) {
  return signEmailToken({ p: "unsubscribe", e: email, s: sequence }, env.BETTER_AUTH_SECRET);
}

export function unsubscribePageUrl(email: string, sequence?: SequenceId) {
  return absoluteUrl(`/unsubscribe?t=${unsubscribeToken(email, sequence)}`);
}

export function oneClickUnsubscribeUrl(email: string, sequence?: SequenceId) {
  return absoluteUrl(`/api/email/unsubscribe?t=${unsubscribeToken(email, sequence)}`);
}

export function readEmailToken(token: string | null | undefined, purpose: EmailTokenPurpose) {
  return verifyEmailToken(token, env.BETTER_AUTH_SECRET, purpose);
}

export function withCampaign(path: string, sequence: SequenceId, extra: Record<string, string | null | undefined> = {}) {
  const url = new URL(path, env.NEXT_PUBLIC_APP_URL);
  for (const [k, v] of Object.entries(extra)) if (v) url.searchParams.set(k, v);
  url.searchParams.set("utm_source", "email");
  url.searchParams.set("utm_medium", "nurture");
  url.searchParams.set("utm_campaign", sequence);
  return url.toString();
}
