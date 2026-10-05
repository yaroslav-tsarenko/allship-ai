import { createHmac } from "node:crypto";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/env", () => ({ env: { NODE_ENV: "test", EMAIL_FROM: "AllShip AI <no-reply@allship.ai>" } }));
vi.mock("@/server/db/client", () => ({ db: {} }));

const { blocksCategory } = await import("@/server/email/send");
const { suppressionFromEvent, verifySvixSignature } = await import("@/server/nurture/webhook");

describe("suppression rules", () => {
  it("never blocks without a suppression row", () => {
    expect(blocksCategory(null, "marketing")).toBe(false);
    expect(blocksCategory(null, "transactional")).toBe(false);
  });
  it("lets transactional mail through unsubscribes and complaints", () => {
    expect(blocksCategory({ reason: "unsubscribed", scope: "marketing" }, "transactional")).toBe(false);
    expect(blocksCategory({ reason: "complained", scope: "marketing" }, "transactional")).toBe(false);
  });
  it("stops transactional mail only on a hard bounce", () => {
    expect(blocksCategory({ reason: "bounced", scope: "all" }, "transactional")).toBe(true);
  });
  it("blocks marketing and lifecycle mail for any suppression", () => {
    for (const reason of ["unsubscribed", "complained", "bounced"]) {
      expect(blocksCategory({ reason, scope: "marketing" }, "marketing")).toBe(true);
      expect(blocksCategory({ reason, scope: "marketing" }, "lifecycle")).toBe(true);
    }
  });
});

describe("Resend webhook", () => {
  const secretBytes = Buffer.from("resend-webhook-test-secret");
  const secret = `whsec_${secretBytes.toString("base64")}`;
  const body = JSON.stringify({ type: "email.bounced", data: { to: ["Dana@Example.com"], bounce: { type: "Permanent" } } });
  const now = 1_790_000_000_000;
  const ts = String(Math.floor(now / 1000));
  const sig = createHmac("sha256", secretBytes).update(`msg_1.${ts}.${body}`).digest("base64");

  it("accepts a valid Svix signature", () => {
    expect(verifySvixSignature({ secret, id: "msg_1", timestamp: ts, signature: `v1,bad v1,${sig}`, body, now })).toBe(true);
  });
  it("rejects a wrong signature, stale timestamp or missing headers", () => {
    expect(verifySvixSignature({ secret, id: "msg_1", timestamp: ts, signature: `v1,${sig}`, body: `${body} `, now })).toBe(false);
    expect(verifySvixSignature({ secret, id: "msg_1", timestamp: ts, signature: `v1,${sig}`, body, now: now + 10 * 60_000 })).toBe(false);
    expect(verifySvixSignature({ secret, id: null, timestamp: ts, signature: `v1,${sig}`, body, now })).toBe(false);
  });
  it("turns hard bounces and complaints into suppressions and ignores soft bounces", () => {
    expect(suppressionFromEvent(JSON.parse(body))).toEqual({ emails: ["dana@example.com"], kind: "bounced" });
    expect(suppressionFromEvent({ type: "email.bounced", data: { to: ["a@b.co"], bounce: { type: "Transient" } } })).toBeNull();
    expect(suppressionFromEvent({ type: "email.complained", data: { to: "a@b.co" } })).toEqual({ emails: ["a@b.co"], kind: "complained" });
    expect(suppressionFromEvent({ type: "email.delivered", data: { to: ["a@b.co"] } })).toBeNull();
  });
});
