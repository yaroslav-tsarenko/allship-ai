import { describe, expect, it } from "vitest";
import { feeFor, formatUsd, toCents } from "@/lib/money";

describe("money", () => {
  it("adds a 10% fee on top of the carrier price", () => {
    expect(feeFor(120000, 1000)).toEqual({ carrierAmountCents: 120000, platformFeeCents: 12000, shipperTotalCents: 132000 });
  });
  it("rounds half cents", () => {
    expect(feeFor(1005, 1000).platformFeeCents).toBe(101);
  });
  it("converts dollars to cents without float drift", () => {
    expect(toCents(19.99)).toBe(1999);
    expect(toCents(1200.1)).toBe(120010);
  });
  it("formats USD", () => {
    expect(formatUsd(132000)).toBe("$1,320.00");
    expect(formatUsd(132000, true)).toBe("$1,320");
  });
});
