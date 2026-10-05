import { createHmac, timingSafeEqual } from "node:crypto";

const TOLERANCE_SECONDS = 300;

export function verifySvixSignature({ secret, id, timestamp, signature, body, now = Date.now() }: { secret: string; id: string | null; timestamp: string | null; signature: string | null; body: string; now?: number }) {
  if (!id || !timestamp || !signature) return false;
  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(now / 1000 - ts) > TOLERANCE_SECONDS) return false;
  const key = Buffer.from(secret.startsWith("whsec_") ? secret.slice(6) : secret, "base64");
  const expected = Buffer.from(createHmac("sha256", key).update(`${id}.${timestamp}.${body}`).digest("base64"));
  return signature.split(" ").some((part) => {
    const [version, value] = part.split(",");
    if (version !== "v1" || !value) return false;
    const given = Buffer.from(value);
    return given.length === expected.length && timingSafeEqual(given, expected);
  });
}

type ResendEvent = { type?: string; data?: { to?: string[] | string; bounce?: { type?: string } } };

export function suppressionFromEvent(event: ResendEvent): { emails: string[]; kind: "bounced" | "complained" } | null {
  const to = event.data?.to;
  const emails = (Array.isArray(to) ? to : to ? [to] : []).map((e) => e.trim().toLowerCase()).filter((e) => e.includes("@"));
  if (emails.length === 0) return null;
  if (event.type === "email.complained") return { emails, kind: "complained" };
  if (event.type === "email.bounced") {
    const type = event.data?.bounce?.type?.toLowerCase();
    if (type && type !== "permanent") return null;
    return { emails, kind: "bounced" };
  }
  return null;
}
