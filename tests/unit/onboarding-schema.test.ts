import { describe, expect, it } from "vitest";
import { carrierOnboardingSchema } from "@/features/onboarding/schemas";

const base = {
  firstName: "Dana",
  lastName: "Reyes",
  phone: "(555) 201-3344",
  legalName: "Reyes Hauling LLC",
  usdotNumber: "3912204",
  mcNumber: "MC-1290033",
};

describe("carrierOnboardingSchema", () => {
  it("normalizes MC numbers", () => {
    expect(carrierOnboardingSchema.parse(base).mcNumber).toBe("1290033");
  });

  it("accepts an empty MC number", () => {
    expect(carrierOnboardingSchema.parse({ ...base, mcNumber: "" }).mcNumber).toBe("");
  });

  it("rejects USDOT numbers longer than 8 digits", () => {
    expect(carrierOnboardingSchema.safeParse({ ...base, usdotNumber: "123456789" }).success).toBe(false);
  });

  it("requires a phone number", () => {
    expect(carrierOnboardingSchema.safeParse({ ...base, phone: "" }).success).toBe(false);
  });
});
