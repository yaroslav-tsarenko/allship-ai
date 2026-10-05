import { describe, expect, it } from "vitest";
import { estimateCarShipping } from "@/components/marketing/tools/car-shipping-math";

describe("estimateCarShipping", () => {
  it("returns the base distance range for a running sedan on an open trailer", () => {
    const e = estimateCarShipping({ miles: 1000, size: "sedan", trailer: "open", condition: "running" });
    expect(e.carrierTotal).toEqual({ low: 800, high: 1250 });
    expect(e.serviceFee).toEqual({ low: 80, high: 130 });
    expect(e.total).toEqual({ low: 880, high: 1380 });
    expect(e.perMile?.low).toBeCloseTo(0.8, 5);
  });

  it("interpolates between distance anchors", () => {
    const e = estimateCarShipping({ miles: 1500, size: "sedan", trailer: "open", condition: "running" });
    expect(e.carrierTotal).toEqual({ low: 950, high: 1480 });
  });

  it("applies size, enclosed and inoperable adjustments in order", () => {
    const e = estimateCarShipping({ miles: 1000, size: "suv", trailer: "enclosed", condition: "inoperable" });
    expect(e.carrierTotal.low).toBe(Math.round((800 * 1.15 * 1.4 + 150) / 10) * 10);
    expect(e.carrierTotal.high).toBe(Math.round((1250 * 1.15 * 1.7 + 250) / 10) * 10);
  });

  it("has no per-mile figure at zero miles", () => {
    expect(estimateCarShipping({ miles: 0, size: "sedan", trailer: "open", condition: "running" }).perMile).toBeNull();
  });
});
