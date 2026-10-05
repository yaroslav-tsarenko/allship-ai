import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/server/db/client", () => ({ db: {} }));
vi.mock("@/env", () => ({ env: {} }));
vi.mock("@/server/notify/telegram", () => ({ notifyAdmins: vi.fn() }));

const { assessFmcsa } = await import("@/server/carriers/fmcsa");

describe("assessFmcsa", () => {
  const active = { allowedToOperate: "Y", statusCode: "A", legalName: "REYES HAULING LLC", bipdInsuranceRequired: "Y", bipdInsuranceOnFile: "750" };
  it("verifies an active carrier with matching name and insurance", () => expect(assessFmcsa(active, "Reyes Hauling, LLC")).toBe("verified"));
  it("fails inactive authority", () => expect(assessFmcsa({ ...active, allowedToOperate: "N" }, "Reyes Hauling")).toBe("failed"));
  it("sends name mismatches to manual review", () => expect(assessFmcsa(active, "Blue Line Freight")).toBe("manual_review"));
  it("sends missing insurance to manual review", () => expect(assessFmcsa({ ...active, bipdInsuranceOnFile: "0" }, "Reyes Hauling")).toBe("manual_review"));
  it("fails when no record exists", () => expect(assessFmcsa(null, "Anything")).toBe("failed"));
});
