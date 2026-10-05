import { describe, expect, it } from "vitest";
import { estimatedWeight, roomCubicFeet, rooms, suggestTruck, totalCubicFeet } from "@/components/marketing/tools/cubic-feet-math";

describe("totalCubicFeet", () => {
  it("sums item volumes by quantity", () => {
    expect(totalCubicFeet({ "sofa-3": 1, "bed-queen": 2, "box-medium": 10 })).toBe(50 + 130 + 30);
  });

  it("ignores unknown ids, negatives and fractions", () => {
    expect(totalCubicFeet({ nope: 4, "sofa-3": -1, "dining-chair": 2.7 })).toBe(10);
  });

  it("has unique item ids", () => {
    const ids = rooms.flatMap((r) => r.items.map((i) => i.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("totals a single room", () => {
    const living = rooms.find((r) => r.id === "living");
    expect(living && roomCubicFeet(living, { "sofa-3": 1, "bed-queen": 1 })).toBe(50);
  });
});

describe("suggestTruck", () => {
  it("returns null for empty inventory", () => {
    expect(suggestTruck(0)).toBeNull();
  });

  it("picks the smallest truck whose usable space fits", () => {
    expect(suggestTruck(300)?.size).toBe("10 ft");
    expect(suggestTruck(341)?.size).toBe("16 ft");
    expect(suggestTruck(700)?.size).toBe("20 ft");
    expect(suggestTruck(1200)?.size).toBe("26 ft");
  });

  it("asks for several large trucks past one 26 ft load", () => {
    const s = suggestTruck(2000);
    expect(s?.size).toBe("26 ft");
    expect(s?.count).toBe(2);
  });
});

describe("estimatedWeight", () => {
  it("uses 7 lb per cubic foot", () => {
    expect(estimatedWeight(1000)).toBe(7000);
  });
});
