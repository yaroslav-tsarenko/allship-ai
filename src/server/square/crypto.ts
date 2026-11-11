import "server-only";
import { createCipheriv, createDecipheriv, createHmac, hkdfSync, randomBytes, timingSafeEqual } from "node:crypto";
import { env } from "@/env";

const key = () => Buffer.from(hkdfSync("sha256", env.BETTER_AUTH_SECRET, "allship", "square-oauth-token", 32));

export function sealToken(plain: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const body = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return ["v1", iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), body.toString("base64url")].join(".");
}

export function openToken(sealed: string) {
  const [version, iv, tag, body] = sealed.split(".");
  if (version !== "v1" || !iv || !tag || !body) throw new Error("Unknown token format");
  const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(body, "base64url")), decipher.final()]).toString("utf8");
}

const linkMac = (expires: number) => createHmac("sha256", env.BETTER_AUTH_SECRET).update(`square-connect:${expires}`).digest("base64url");

export function signConnectLink(hours = 72) {
  const expires = Date.now() + hours * 3_600_000;
  return `${expires}.${linkMac(expires)}`;
}

export function verifyConnectLink(token: string | null | undefined, now = Date.now()) {
  if (!token || token.length > 200) return false;
  const [raw, mac] = token.split(".");
  const expires = Number(raw);
  if (!mac || !Number.isFinite(expires) || expires < now) return false;
  const expected = Buffer.from(linkMac(expires));
  const given = Buffer.from(mac);
  return expected.length === given.length && timingSafeEqual(expected, given);
}
