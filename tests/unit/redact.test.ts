import { describe, expect, it } from "vitest";
import { redact, redactString } from "@/lib/redact";

describe("redact", () => {
  it("masks emails, phone numbers and bearer tokens in strings", () => {
    expect(redactString("mail jane.doe@example.com or call (555) 123-4567 / +1 555.123.4567")).toBe("mail [email] or call [phone] / [phone]");
    expect(redactString("Authorization: Bearer abc.def-123")).toBe("Authorization: Bearer [redacted]");
  });

  it("keeps Stripe ids, uuids and timestamps intact", () => {
    const value = "pi_3Q8x9a2eZvKYlo2C1abc 0f8fad5b-d9cb-469f-a165-70867728950e 2026-10-04T12:00:00Z 1759579200000";
    expect(redactString(value)).toBe(value);
  });

  it("redacts sensitive keys recursively and serializes errors", () => {
    const err = Object.assign(new Error("failed for bob@example.com"), { digest: "123" });
    const out = redact({ email: "a@b.co", phone: "5551234567", password: "x", headers: { cookie: "s=1", authorization: "Bearer t" }, nested: { address: "1 Main St", amountCents: 1200 }, err }) as Record<string, unknown>;
    expect(out.email).toBe("[redacted]");
    expect(out.phone).toBe("[redacted]");
    expect(out.password).toBe("[redacted]");
    expect(out.headers).toEqual({ cookie: "[redacted]", authorization: "[redacted]" });
    expect(out.nested).toEqual({ address: "[redacted]", amountCents: 1200 });
    expect(out.err).toMatchObject({ name: "Error", message: "failed for [email]", digest: "123" });
  });
});
