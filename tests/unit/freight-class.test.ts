import { describe, expect, it } from "vitest";
import { calculateFreightClass, classForDensity, densityRangeLabel } from "@/components/marketing/tools/freight-class-math";

describe("classForDensity", () => {
  it.each([
    [0.5, "400"],
    [1, "300"],
    [1.99, "300"],
    [2, "250"],
    [4, "175"],
    [6, "125"],
    [8, "100"],
    [10, "92.5"],
    [12, "85"],
    [15, "70"],
    [22.5, "65"],
    [30, "60"],
    [35, "55"],
    [49.9, "55"],
    [50, "50"],
    [120, "50"],
  ])("density %s maps to class %s", (density, expected) => {
    expect(classForDensity(density)).toBe(expected);
  });
});

describe("calculateFreightClass", () => {
  it("computes density for a standard pallet", () => {
    const r = calculateFreightClass({ lengthIn: 48, widthIn: 40, heightIn: 48, weightLb: 500, pieces: 1 });
    expect(r?.cubicFeetPerPiece).toBeCloseTo(53.333, 3);
    expect(r?.density).toBeCloseTo(9.375, 3);
    expect(r?.freightClass).toBe("100");
  });

  it("multiplies volume and weight by piece count without changing density", () => {
    const one = calculateFreightClass({ lengthIn: 48, widthIn: 40, heightIn: 40, weightLb: 800, pieces: 1 });
    const three = calculateFreightClass({ lengthIn: 48, widthIn: 40, heightIn: 40, weightLb: 800, pieces: 3 });
    expect(three?.totalWeight).toBe(2400);
    expect(three?.totalCubicFeet).toBeCloseTo((one?.totalCubicFeet ?? 0) * 3, 6);
    expect(three?.density).toBeCloseTo(one?.density ?? 0, 6);
  });

  it("returns null for missing or invalid input", () => {
    expect(calculateFreightClass({ lengthIn: 0, widthIn: 40, heightIn: 40, weightLb: 100, pieces: 1 })).toBeNull();
    expect(calculateFreightClass({ lengthIn: 48, widthIn: 40, heightIn: 40, weightLb: Number.NaN, pieces: 1 })).toBeNull();
    expect(calculateFreightClass({ lengthIn: 48, widthIn: 40, heightIn: 40, weightLb: 100, pieces: 0 })).toBeNull();
  });
});

describe("densityRangeLabel", () => {
  it("describes the open-ended brackets", () => {
    expect(densityRangeLabel("50")).toBe("50 lb/ft³ or more");
    expect(densityRangeLabel("400")).toBe("Less than 1 lb/ft³");
    expect(densityRangeLabel("65")).toBe("22.5 to under 30 lb/ft³");
  });
});
