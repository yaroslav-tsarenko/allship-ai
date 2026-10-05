import { describe, expect, it } from "vitest";
import { signEmailToken, verifyEmailToken } from "@/server/nurture/token";

const secret = "test-secret-that-is-long-enough-1234567890";

describe("email tokens", () => {
  it("round-trips and normalizes the email", () => {
    const token = signEmailToken({ p: "unsubscribe", e: " Dana@Example.com ", s: "abandoned_form" }, secret);
    expect(verifyEmailToken(token, secret, "unsubscribe")).toMatchObject({ e: "dana@example.com", s: "abandoned_form" });
  });

  it("rejects a tampered body or signature", () => {
    const token = signEmailToken({ p: "unsubscribe", e: "a@b.co" }, secret);
    const [body, mac] = token.split(".");
    const forged = Buffer.from(JSON.stringify({ p: "unsubscribe", e: "victim@b.co" })).toString("base64url");
    expect(verifyEmailToken(`${forged}.${mac}`, secret, "unsubscribe")).toBeNull();
    expect(verifyEmailToken(`${body}.${mac}x`, secret, "unsubscribe")).toBeNull();
    expect(verifyEmailToken(`${body}.${mac}.extra`, secret, "unsubscribe")).toBeNull();
  });

  it("rejects another secret, another purpose, and junk", () => {
    const token = signEmailToken({ p: "unsubscribe", e: "a@b.co" }, secret);
    expect(verifyEmailToken(token, `${secret}x`, "unsubscribe")).toBeNull();
    expect(verifyEmailToken(token, secret, "confirm")).toBeNull();
    expect(verifyEmailToken("", secret, "unsubscribe")).toBeNull();
    expect(verifyEmailToken(null, secret, "unsubscribe")).toBeNull();
    expect(verifyEmailToken("a.b", secret, "unsubscribe")).toBeNull();
  });

  it("honors an expiry when present", () => {
    const token = signEmailToken({ p: "confirm", e: "a@b.co", x: 1_000 }, secret);
    expect(verifyEmailToken(token, secret, "confirm", 999)).not.toBeNull();
    expect(verifyEmailToken(token, secret, "confirm", 1_001)).toBeNull();
  });
});
