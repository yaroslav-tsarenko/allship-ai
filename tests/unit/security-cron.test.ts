import { describe, expect, it } from "vitest";
import { isAuthorizedCron } from "@/lib/security/cron-auth";

const secret = "s3cr3t-cron-value-123456";

describe("isAuthorizedCron", () => {
  it("accepts the exact bearer token", () => {
    expect(isAuthorizedCron(`Bearer ${secret}`, secret)).toBe(true);
  });

  it.each([
    null,
    undefined,
    "",
    secret,
    `bearer ${secret}`,
    `Bearer ${secret} `,
    `Bearer ${secret}x`,
    "Bearer ",
  ])("rejects %j", (header) => {
    expect(isAuthorizedCron(header, secret)).toBe(false);
  });

  it("fails closed without a configured secret or with a weak one", () => {
    expect(isAuthorizedCron("Bearer undefined", undefined)).toBe(false);
    expect(isAuthorizedCron("Bearer ", "")).toBe(false);
    expect(isAuthorizedCron("Bearer short", "short")).toBe(false);
  });
});
