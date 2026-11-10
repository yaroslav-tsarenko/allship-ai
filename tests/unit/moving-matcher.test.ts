import { describe, expect, it } from "vitest";
import { moveCategory, priceMove, rankMatches, selectTier, tierGaps, validateTiers, volumeForBedrooms, type RateTier } from "@/features/moving/pricing";
import { moveRequestSchema } from "@/features/moving/schema";
import { allCityData } from "@/server/matcher/city-data.generated";
import { cityData, zip3Data } from "@/server/matcher/geo-data";
import { haversineMiles, lookupPlace, roadMiles, suggestPlaces } from "@/server/matcher/places";

const tiers: RateTier[] = [
  { fromMiles: 0, toMiles: 500, ratePerCuFtCents: 418 },
  { fromMiles: 501, toMiles: 1000, ratePerCuFtCents: 612 },
  { fromMiles: 1001, toMiles: 1500, ratePerCuFtCents: 675 },
];
const rates = { packingPerCuFtCents: 90, unpackingPerCuFtCents: 23, storagePerCuFtMonthCents: 86 };
const base = { volumeCuFt: 600, miles: 420, packing: "none" as const, unpacking: false, storageMonths: 0 };

describe("bedroom volumes", () => {
  it("maps 1–8 bedrooms to the legacy cubic feet", () => {
    expect([1, 2, 3, 4, 5, 6, 7, 8].map(volumeForBedrooms)).toEqual([300, 600, 950, 1300, 1650, 2000, 2300, 2600]);
    expect(() => volumeForBedrooms(0)).toThrow();
    expect(() => volumeForBedrooms(9)).toThrow();
  });
});

describe("selectTier", () => {
  it("picks the tier containing the rounded distance, inclusive on both ends", () => {
    expect(selectTier(tiers, 0)?.ratePerCuFtCents).toBe(418);
    expect(selectTier(tiers, 500)?.ratePerCuFtCents).toBe(418);
    expect(selectTier(tiers, 500.4)?.ratePerCuFtCents).toBe(418);
    expect(selectTier(tiers, 500.6)?.ratePerCuFtCents).toBe(612);
    expect(selectTier(tiers, 1000)?.ratePerCuFtCents).toBe(612);
    expect(selectTier(tiers, 1500)?.ratePerCuFtCents).toBe(675);
  });

  it("returns null outside every tier instead of falling back", () => {
    expect(selectTier(tiers, 1501)).toBeNull();
    expect(selectTier([{ fromMiles: 100, toMiles: 200, ratePerCuFtCents: 300 }], 50)).toBeNull();
    expect(selectTier([], 10)).toBeNull();
  });

  it("ignores tiers with a zero rate", () => {
    expect(selectTier([{ fromMiles: 0, toMiles: 100, ratePerCuFtCents: 0 }], 50)).toBeNull();
  });
});

describe("priceMove", () => {
  it("prices transport as volume × tier rate", () => {
    const q = priceMove(tiers, rates, base)!;
    expect(q.lines).toHaveLength(1);
    expect(q.carrierCents).toBe(600 * 418);
  });

  it("adds packing by level, unpacking and storage by month", () => {
    const q = priceMove(tiers, rates, { ...base, miles: 800, packing: "half", unpacking: true, storageMonths: 3 })!;
    const byKey = Object.fromEntries(q.lines.map((l) => [l.key, l.cents]));
    expect(byKey.transport).toBe(600 * 612);
    expect(byKey.packing).toBe(Math.round(600 * 90 * 0.5));
    expect(byKey.unpacking).toBe(600 * 23);
    expect(byKey.storage).toBe(600 * 86 * 3);
    expect(q.carrierCents).toBe(600 * 612 + 27_000 + 13_800 + 154_800);
  });

  it("uses 25% and 100% packing shares", () => {
    expect(priceMove(tiers, rates, { ...base, packing: "quarter" })!.lines[1]!.cents).toBe(Math.round(600 * 90 * 0.25));
    expect(priceMove(tiers, rates, { ...base, packing: "full" })!.lines[1]!.cents).toBe(600 * 90);
  });

  it("skips the carrier when a requested service has no rate", () => {
    expect(priceMove(tiers, null, { ...base, packing: "full" })).toBeNull();
    expect(priceMove(tiers, { ...rates, unpackingPerCuFtCents: 0 }, { ...base, unpacking: true })).toBeNull();
    expect(priceMove(tiers, { ...rates, storagePerCuFtMonthCents: 0 }, { ...base, storageMonths: 2 })).toBeNull();
    expect(priceMove(tiers, null, base)).not.toBeNull();
  });

  it("skips the carrier when no tier covers the distance", () => {
    expect(priceMove(tiers, rates, { ...base, miles: 2400 })).toBeNull();
  });
});

describe("validateTiers and gaps", () => {
  it("accepts ascending, non-overlapping integer tiers", () => {
    expect(validateTiers(tiers)).toEqual([]);
  });

  it("flags overlaps, reversed ranges and empty rates", () => {
    const issues = validateTiers([
      { fromMiles: 0, toMiles: 500, ratePerCuFtCents: 400 },
      { fromMiles: 500, toMiles: 400, ratePerCuFtCents: 0 },
    ]);
    expect(issues.map((i) => i.index)).toEqual([1, 1, 1]);
  });

  it("finds uncovered distance ranges", () => {
    expect(tierGaps(tiers, 0, 3500)).toEqual([[1501, 3500]]);
    expect(tierGaps([{ fromMiles: 100, toMiles: 200, ratePerCuFtCents: 1 }], 0, 300)).toEqual([
      [0, 99],
      [201, 300],
    ]);
    expect(tierGaps(tiers, 0, 1500)).toEqual([]);
  });
});

describe("move category", () => {
  it("is local under 150 miles", () => {
    expect(moveCategory(149.9)).toBe("local_moving");
    expect(moveCategory(150)).toBe("long_distance_moving");
  });
});

describe("places", () => {
  const data = { zip3Data, cityData };

  it("resolves ZIP codes to their ZIP3 centroid", () => {
    const p = lookupPlace("78701", data)!;
    expect(p.state).toBe("TX");
    expect(p.postalCode).toBe("78701");
    expect(p.precision).toBe("zip");
  });

  it("resolves city and state in several spellings", () => {
    expect(lookupPlace("Austin, TX", data)?.state).toBe("TX");
    expect(lookupPlace("austin texas", data)?.city).toBe("Austin");
    expect(lookupPlace("Saint Louis, MO", data)?.state).toBe("MO");
    expect(lookupPlace("Denver, CO, USA", data)?.city).toBe("Denver");
  });

  it("returns null for unknown places", () => {
    expect(lookupPlace("Nowhereville, ZZ", data)).toBeNull();
    expect(lookupPlace("", data)).toBeNull();
  });

  it("suggests cities by prefix", () => {
    expect(suggestPlaces("Housto", data)).toContain("Houston, TX");
    expect(suggestPlaces("a", data)).toEqual([]);
  });

  it("estimates road miles with a 1.2 factor", () => {
    const a = { lat: 30.27, lng: -97.74 };
    const b = { lat: 39.74, lng: -104.99 };
    const straight = haversineMiles(a, b);
    expect(straight).toBeGreaterThan(760);
    expect(straight).toBeLessThan(790);
    expect(roadMiles(a, b)).toBeCloseTo(straight * 1.2, 6);
  });
});

describe("move request schema", () => {
  const valid = { moveType: "house", from: "78701", to: "Denver, CO", bedrooms: "2", pickupDate: "2026-11-01" };

  it("accepts a minimal request", () => {
    const r = moveRequestSchema.parse(valid);
    expect(r.packing).toBe("none");
    expect(r.bedrooms).toBe(2);
  });

  it("rejects delivery before pickup and storage without months", () => {
    expect(moveRequestSchema.safeParse({ ...valid, deliveryDate: "2026-10-01" }).success).toBe(false);
    expect(moveRequestSchema.safeParse({ ...valid, storage: true, storageMonths: 0 }).success).toBe(false);
    expect(moveRequestSchema.safeParse({ ...valid, bedrooms: 9 }).success).toBe(false);
  });
});

describe("rankMatches", () => {
  const m = (name: string, total: number, rating: number | null = null, reviewCount = 0) => ({ name, shipperTotalCents: total, rating, reviewCount });

  it("sorts by total and caps the list", () => {
    const out = rankMatches([m("C", 300), m("A", 100), m("B", 200), m("D", 400)], 3);
    expect(out.map((x) => x.name)).toEqual(["A", "B", "C"]);
  });

  it("labels the lowest price only when it is unique and there is a comparison", () => {
    expect(rankMatches([m("A", 100)])[0]!.labels).toEqual([]);
    expect(rankMatches([m("A", 100), m("B", 100)])[0]!.labels).toEqual([]);
    expect(rankMatches([m("A", 100), m("B", 200)])[0]!.labels).toEqual(["lowest_price"]);
  });

  it("labels top rated only with enough reviews and a unique best rating", () => {
    expect(rankMatches([m("A", 100, 5, 1), m("B", 200, 4.9, 2)]).flatMap((x) => x.labels)).toEqual(["lowest_price"]);
    const out = rankMatches([m("A", 100, 4.2, 10), m("B", 200, 4.8, 5)]);
    expect(out[1]!.labels).toEqual(["top_rated"]);
    expect(rankMatches([m("A", 100, 4.8, 5), m("B", 200, 4.8, 5)]).flatMap((x) => x.labels)).toEqual(["lowest_price"]);
  });
});

describe("full city index", () => {
  const full = { zip3Data, cityData: allCityData };

  it("keeps major cities first and adds every town from the ZIP data", () => {
    expect(suggestPlaces("mia", full)[0]).toBe("Miami, FL");
    expect(suggestPlaces("boca", full)).toContain("Boca Raton, FL");
  });

  it("resolves small towns that the major-city list misses", () => {
    expect(lookupPlace("Boca Grande, FL", full)).toMatchObject({ city: "Boca Grande", state: "FL", precision: "city" });
  });
});
