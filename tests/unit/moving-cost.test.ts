import { describe, expect, it } from "vitest";
import { cubicFeetForHome, estimateMove, movingAssumptions } from "@/components/marketing/tools/moving-cost-math";
import { interpolate } from "@/components/marketing/tools/rate-curve";

const base = { cubicFeet: 600, miles: 1000, packing: "none" as const, storageMonths: 0, unpacking: false };

describe("cubicFeetForHome", () => {
  it("uses the legacy bedroom table", () => {
    expect(cubicFeetForHome("1")).toBe(300);
    expect(cubicFeetForHome("3")).toBe(950);
    expect(cubicFeetForHome("8")).toBe(2600);
  });
});

describe("interpolate", () => {
  it("is linear between anchor points and clamps at the ends", () => {
    const pts = movingAssumptions.transportPerCubicFoot;
    expect(interpolate(pts, 25)).toEqual({ low: 1.2, high: 2.1 });
    expect(interpolate(pts, -10)).toEqual({ low: 1.0, high: 1.8 });
    expect(interpolate(pts, 9000)).toEqual({ low: 5.0, high: 8.5 });
  });
});

describe("estimateMove", () => {
  it("prices transport by cubic feet at the distance rate", () => {
    const e = estimateMove(base);
    expect(e.transport).toEqual({ low: 2160, high: 3600 });
    expect(e.carrierTotal).toEqual({ low: 2160, high: 3600 });
    expect(e.serviceFee).toEqual({ low: 220, high: 360 });
    expect(e.total).toEqual({ low: 2380, high: 3960 });
  });

  it("applies the minimum transport charge", () => {
    const e = estimateMove({ ...base, cubicFeet: 100, miles: 5 });
    expect(e.transport).toEqual({ low: 350, high: 600 });
  });

  it("adds packing by share, unpacking and storage months", () => {
    const e = estimateMove({ ...base, packing: "partial", unpacking: true, storageMonths: 2 });
    expect(e.packing).toEqual({ low: 180, high: 360 });
    expect(e.unpacking).toEqual({ low: 150, high: 300 });
    expect(e.storage).toEqual({ low: 300, high: 540 });
    expect(e.carrierTotal).toEqual({ low: 2790, high: 4800 });
  });

  it("keeps low at or below high and handles bad input", () => {
    const e = estimateMove({ cubicFeet: Number.NaN, miles: Number.NaN, packing: "full", storageMonths: -3, unpacking: true });
    expect(e.total).toEqual({ low: 0, high: 0 });
  });
});
