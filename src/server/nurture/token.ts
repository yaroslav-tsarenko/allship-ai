import { createHmac, timingSafeEqual } from "node:crypto";

export type EmailTokenPurpose = "unsubscribe" | "confirm";
export type EmailTokenPayload = { p: EmailTokenPurpose; e: string; s?: string; n?: string; x?: number };

const encode = (value: string) => Buffer.from(value, "utf8").toString("base64url");
const sign = (body: string, secret: string) => createHmac("sha256", secret).update(`nurture:${body}`).digest("base64url");

export function signEmailToken(payload: EmailTokenPayload, secret: string) {
  const body = encode(JSON.stringify({ ...payload, e: payload.e.trim().toLowerCase() }));
  return `${body}.${sign(body, secret)}`;
}

export function verifyEmailToken(token: string | null | undefined, secret: string, purpose: EmailTokenPurpose, now = Date.now()): EmailTokenPayload | null {
  if (!token || token.length > 2048) return null;
  const [body, mac, extra] = token.split(".");
  if (!body || !mac || extra !== undefined) return null;
  const expected = Buffer.from(sign(body, secret));
  const given = Buffer.from(mac);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as EmailTokenPayload;
    if (payload.p !== purpose || typeof payload.e !== "string" || !payload.e.includes("@")) return null;
    if (typeof payload.x === "number" && payload.x < now) return null;
    return payload;
  } catch {
    return null;
  }
}
