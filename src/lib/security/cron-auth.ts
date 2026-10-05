import { createHash, timingSafeEqual } from "node:crypto";

const digest = (value: string) => createHash("sha256").update(value, "utf8").digest();

export function isAuthorizedCron(
  authorization: string | null | undefined,
  secret: string | null | undefined,
) {
  if (!secret || secret.length < 16 || !authorization) return false;
  return timingSafeEqual(digest(authorization), digest(`Bearer ${secret}`));
}
