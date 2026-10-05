import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/env";

export function newsletterToken(email: string) {
  return createHmac("sha256", env.BETTER_AUTH_SECRET).update(`newsletter:${email}`).digest("base64url");
}

export function verifyNewsletterToken(email: string, token: string) {
  const expected = Buffer.from(newsletterToken(email));
  const given = Buffer.from(token);
  return expected.length === given.length && timingSafeEqual(expected, given);
}
