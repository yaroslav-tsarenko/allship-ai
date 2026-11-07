import { describe, expect, it } from "vitest";
import { isSamePlace, routeIssues, scheduleIssues, zipStateIssue } from "@/features/loads/route-rules";
import { bidInputSchema, loadInputSchema } from "@/features/loads/schema";
import { describeDetail, describeDetails, detailHints, detailsSchema, emptyDetails, fieldsOf, loadSpecs, otherKey } from "@/features/loads/spec";
import { cleanDetails, detailsFor, stepSchema } from "@/features/loads/wizard-model";
import { buildCsp } from "@/lib/security/csp";
import { zipState } from "@/server/geo/zip";
import type { LoadCategory } from "@/server/db/schema/enums";

const valid: Record<LoadCategory, Record<string, unknown>> = {
  car_or_light_truck: { vin: "1HGCM82633A004352", year: "2003", make: "Honda", model: "Accord", bodyType: "Coupe", condition: "Runs and drives", trailer: "Open trailer" },
  motorcycle: { year: "2021", make: "Harley-Davidson", model: "Street Glide", condition: "Runs and drives", style: "Standard" },
  powerboat: { make: "Sea Ray", model: "240 Sundeck", length: "24", width: "8.5", height: "9", weight: "6200" },
  sailboat: { make: "Catalina", length: "30", beam: "10.8", height: "8", weight: "10200", keel: "Fin keel" },
  personal_watercraft: { quantity: "2", make: "Sea-Doo", weight: "1800" },
  atv_powersports: { quantity: "1", type: "Other", typeOther: "Go-kart", weight: "300", condition: "Runs and drives" },
  commercial_truck: { quantity: "1", year: "2018", make: "Freightliner", model: "Cascadia", class: "Tractor", weightClass: "Class 8, over 33,000 lb", method: "Driven away", condition: "Runs and drives" },
  vehicle_parts: { description: "Engine block", quantity: "1", weight: "450", length: "36", width: "30", height: "30" },
  trailer: { type: "Utility", hitch: "Bumper pull", length: "12", width: "6", height: "4", weight: "1800", method: "Towed" },
  rv: { rvType: "Travel trailer", make: "Airstream", length: "25", width: "8", height: "10", weight: "7300", method: "Towed", condition: "Runs and drives" },
  local_moving: { residence: "House", bedrooms: "3", pickupFloor: "Ground floor", deliveryFloor: "2nd floor" },
  long_distance_moving: { residence: "Apartment", bedrooms: "2", pickupFloor: "Ground floor", deliveryFloor: "Ground floor", packing: "I'll pack", storageMonths: "0" },
  household_items: { itemCount: "12", pickupFloor: "Ground floor", deliveryFloor: "2nd floor", furniture: ["Sofa", "Other"], furnitureOther: "Pool table" },
  office_moving: { space: "Small office", squareFeet: "Under 500 sq ft", workstations: "1–5", largeFurniture: "1–5", pickupFloor: "Ground floor", deliveryFloor: "Ground floor" },
  business_moving: { location: "Restaurant", squareFeet: "500–1,000 sq ft", workstations: "1–5", largeEquipment: "3–5", pickupFloor: "Ground floor", deliveryFloor: "Ground floor" },
  corporate_relocation: { space: "Tech hub", squareFeet: "10,000+ sq ft", workstations: "100+", meetingRooms: "6–10", cubicles: "20+", security: "No" },
  student_moving: { residence: "Dormitory", boxes: "6–10", pickupFloor: "2nd floor", deliveryFloor: "Ground floor" },
  military_moving: { moveType: "PCS", household: "Couple", bedrooms: "2", boxes: "11–30" },
  heavy_lifting: { items: ["Piano"], itemWeight: "500+ lb", count: "1–2", distance: "Between floors", pickupFloor: "2nd floor" },
  freight: { description: "Packaged auto parts", quantity: "12", weight: "9600", length: "48", width: "40", height: "52", units: ["Pallets"] },
  heavy_equipment: { equipmentType: "Skid steer", make: "Bobcat", quantity: "1", weight: "8100", length: "12", width: "6", height: "7", loading: "Drives on and off" },
  truck_rental: { truckType: "Cargo van", days: "2", cargo: "Furniture from a studio", helpers: "None" },
  truck_with_driver: { truckType: "Pickup truck", hours: "4", cargo: "Lumber and tools", helpers: "1" },
};

const categories = Object.keys(loadSpecs) as LoadCategory[];

const parse = (category: LoadCategory, details: Record<string, unknown>) => detailsSchema(category).safeParse(cleanDetails(details));
const messages = (res: ReturnType<typeof parse>) => (res.success ? [] : res.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`));

describe("load specs", () => {
  it("covers all 23 categories", () => expect(categories).toHaveLength(23));

  it.each(categories)("%s accepts a realistic load", (category) => {
    const res = parse(category, valid[category]);
    expect(messages(res)).toEqual([]);
  });

  it.each(categories)("%s rejects an empty form with field errors", (category) => {
    const required = fieldsOf(category).filter((f) => f.required);
    const res = parse(category, emptyDetails(category));
    expect(res.success).toBe(required.length === 0);
    if (!res.success) expect(res.error.issues.map((i) => i.path[0])).toEqual(expect.arrayContaining(required.map((f) => f.name)));
  });

  it.each(categories)("%s keeps every select, number and text field bounded", (category) => {
    for (const f of fieldsOf(category)) {
      if (f.kind === "number") {
        expect(f.max).toBeGreaterThan(f.min);
        expect(f.unit || f.integer).toBeTruthy();
      }
      if (f.kind === "text") expect(f.maxLength).toBeLessThanOrEqual(200);
    }
  });

  it("enforces ranges, whole numbers and units in messages", () => {
    expect(messages(parse("freight", { ...valid.freight, quantity: "2.5" }))).toContain("quantity: Use a whole number");
    expect(messages(parse("freight", { ...valid.freight, weight: "60000" }))).toContain("weight: Enter 45,000 lb or less");
    expect(messages(parse("powerboat", { ...valid.powerboat, width: "2" }))).toContain("width: Enter at least 3 ft");
    expect(messages(parse("truck_with_driver", { ...valid.truck_with_driver, hours: "20" }))).toContain("hours: Enter 14 hours or less");
  });

  it("validates the VIN check digit and model year", () => {
    expect(messages(parse("car_or_light_truck", { ...valid.car_or_light_truck, vin: "1HGCM82643A004352" }))[0]).toMatch(/check digit/);
    expect(messages(parse("car_or_light_truck", { ...valid.car_or_light_truck, year: "1850" }))[0]).toMatch(/year: Choose 1900 or later/);
    expect(parse("car_or_light_truck", { ...valid.car_or_light_truck, vin: "" }).success).toBe(true);
  });

  it("requires a description when Other is picked", () => {
    expect(messages(parse("atv_powersports", { ...valid.atv_powersports, typeOther: "" }))).toContain("typeOther: Tell carriers what it is");
    expect(messages(parse("household_items", { ...valid.household_items, furnitureOther: "" }))).toContain("furnitureOther: Tell carriers what it is");
    expect(parse("household_items", { ...valid.household_items, furniture: ["Sofa"], furnitureOther: "" }).success).toBe(true);
  });

  it("blocks contact details and profanity in free text", () => {
    expect(messages(parse("freight", { ...valid.freight, description: "Call 555-123-4567 for specs" }))[0]).toMatch(/phone number/);
    expect(messages(parse("truck_rental", { ...valid.truck_rental, cargo: "my sh1t" }))[0]).toMatch(/offensive/);
    expect(messages(parse("atv_powersports", { ...valid.atv_powersports, typeOther: "see karts.com" }))[0]).toMatch(/link/);
  });

  it("checks weight against the unit count", () => {
    expect(messages(parse("freight", { ...valid.freight, quantity: "2", weight: "12000" }))[0]).toMatch(/4,600 lb per pallet/);
    expect(parse("freight", { ...valid.freight, units: ["Crates"], quantity: "2", weight: "12000" }).success).toBe(true);
    expect(messages(parse("personal_watercraft", { ...valid.personal_watercraft, quantity: "1", weight: "5000" }))[0]).toMatch(/2,000 lb per watercraft/);
  });

  it("hints at oversize and overweight loads", () => {
    expect(detailHints("heavy_equipment", { ...valid.heavy_equipment, width: "10", height: "12" })[0]).toMatch(/wider than 8.5 ft, taller than 10 ft/);
    expect(detailHints("heavy_equipment", { ...valid.heavy_equipment, weight: "60000" }).join(" ")).toMatch(/overweight permit/);
    expect(detailHints("freight", { ...valid.freight, width: "110" })[0]).toMatch(/wider than 8.5 ft/);
    expect(detailHints("freight", valid.freight)).toEqual([]);
    expect(detailHints("freight", { ...valid.freight, quantity: "34" }).join(" ")).toMatch(/30 pallets/);
  });

  it("describes Other values and still shows legacy fields", () => {
    const furniture = fieldsOf("household_items").find((f) => f.name === "furniture")!;
    expect(describeDetail(furniture, ["Sofa", "Other"], { furnitureOther: "Pool table" })).toBe("Sofa, Pool table");
    expect(describeDetails("car_or_light_truck", { year: 2019, make: "Honda", model: "CR-V", convertible: true })).toEqual(
      expect.arrayContaining([
        { label: "Make", value: "Honda" },
        { label: "Convertible", value: "Yes" },
      ]),
    );
  });

  it("restores Other text and drops stale select values when editing", () => {
    const restored = detailsFor("atv_powersports", { type: "Other", typeOther: "Go-kart", condition: "Totaled" });
    expect(restored.type).toBe("Other");
    expect(restored[otherKey("type")]).toBe("Go-kart");
    expect(restored.condition).toBe("");
  });

  it("still parses version 1 details that are within the new rules", () => {
    const old = { year: 2019, make: "Honda", model: "CR-V EX", condition: "Runs and drives", trailer: "Open trailer", modified: false, convertible: false };
    expect(messages(parse("car_or_light_truck", old))).toEqual(["bodyType: Choose body type"]);
    expect(parse("rv", { rvType: "Travel trailer", make: "Airstream Flying Cloud 25FB", length: 25, width: 8, height: 10, weight: 7300, method: "Towed", condition: "Runs and drives" }).success).toBe(true);
  });
});

describe("ZIP and route rules", () => {
  it("knows every ZIP in the dataset and its state", () => {
    expect(zipState("78701")).toBe("TX");
    expect(zipState("10001")).toBe("NY");
    expect(zipState("06390")).toBe("NY");
    expect(zipState("06901")).toBe("CT");
    expect(zipState("00000")).toBeNull();
    expect(zipState("7870")).toBeNull();
  });

  it("explains mismatches", () => {
    expect(zipStateIssue("78701", "CA", "TX")).toBe("ZIP 78701 is in Texas, not California.");
    expect(zipStateIssue("00000", "TX", null)).toMatch(/can't find ZIP 00000/);
    expect(zipStateIssue("00901", "", "PR")).toMatch(/50 states and DC/);
    expect(zipStateIssue("78701", "TX", undefined)).toBeNull();
  });

  const stop = (over: Record<string, string> = {}) => ({ address: "100 Congress Ave", city: "Austin", state: "TX", postalCode: "78701", windowStart: "2026-10-10", windowEnd: "", ...over });

  it("flags the same pickup and delivery except for local work", () => {
    expect(isSamePlace(stop(), stop({ address: "100 congress ave." }))).toBe(true);
    expect(isSamePlace(stop(), stop({ address: "200 Congress Ave" }))).toBe(false);
    expect(isSamePlace(stop({ address: "" }), stop({ address: "" }))).toBe(true);
    expect(routeIssues(stop(), stop(), "freight", zipState)).toEqual([{ path: ["dropoff", "address"], message: expect.stringMatching(/same place/) }]);
    expect(routeIssues(stop(), stop(), "local_moving", zipState)).toEqual([]);
    expect(routeIssues(stop(), stop({ postalCode: "80202", state: "TX", address: "1 Main" }), "freight", zipState)[0]?.message).toBe("ZIP 80202 is in Colorado, not Texas.");
  });

  it("keeps dates between today and 12 months out", () => {
    expect(scheduleIssues(stop({ windowStart: "2026-10-01" }), stop(), "2026-10-04")[0]?.message).toMatch(/past/);
    expect(scheduleIssues(stop({ windowStart: "2027-11-01" }), stop(), "2026-10-04")[0]?.message).toMatch(/12 months/);
    expect(scheduleIssues(stop(), stop({ windowStart: "2026-10-12" }), "2026-10-04")).toEqual([]);
  });

  it("validates the wizard route step with ZIP lookups", async () => {
    const zipStates = async () => (zip: string) => zipState(zip);
    const schema = stepSchema(2, "freight", { today: "2026-10-04", zipStates });
    const good = await schema.safeParseAsync({ pickup: stop(), dropoff: stop({ address: "1 Main St", city: "Denver", state: "CO", postalCode: "80202", windowStart: "2026-10-14" }) });
    expect(good.success).toBe(true);
    const bad = await schema.safeParseAsync({ pickup: stop({ windowStart: "2026-10-01" }), dropoff: stop({ city: "Denver", state: "CA", postalCode: "80202", windowStart: "2026-10-14", address: "1 Main St" }) });
    expect(bad.error?.issues.map((i) => `${i.path.join(".")}: ${i.message}`)).toEqual(["pickup.windowStart: The pickup date can't be in the past", "dropoff.postalCode: ZIP 80202 is in Colorado, not California."]);
  });

  it("checks titles and notes on the review step", () => {
    const schema = stepSchema(3, "freight");
    expect(schema.safeParse({ title: "Pallets to Denver", notes: "Dock 4, gate code 1234", targetPrice: "", biddingDays: "5" }).success).toBe(true);
    const res = schema.safeParse({ title: "Pallets to Denver", notes: "email me at bob at gmail dot com", targetPrice: "", biddingDays: "5" });
    expect(res.error?.issues[0]?.message).toMatch(/email address/);
  });
});

describe("server schemas", () => {
  const base = {
    category: "freight",
    title: "Pallets to Denver",
    pickup: { address: "100 Congress Ave", city: "Austin", state: "TX", postalCode: "78701", windowStart: "2026-10-10" },
    dropoff: { address: "1 Main St", city: "Denver", state: "CO", postalCode: "80202", windowStart: "2026-10-12" },
    details: {},
  };

  it("rejects contact details in the load title and notes", () => {
    expect(loadInputSchema.safeParse(base).success).toBe(true);
    expect(loadInputSchema.safeParse({ ...base, title: "Call 5551234567" }).success).toBe(false);
    expect(loadInputSchema.safeParse({ ...base, notes: "WhatsApp me" }).success).toBe(false);
    expect(loadInputSchema.safeParse({ ...base, dropoff: { ...base.pickup } }).success).toBe(false);
  });

  it("keeps bids free of contact details", () => {
    const bid = { loadId: "0190f5c2-4c1a-7c3e-9b1a-1b2c3d4e5f60", amount: 900, estimatedPickupAt: "2026-10-10", estimatedDeliveryAt: "2026-10-12", message: "Dry van with liftgate, two drivers, pickup on the 10th and delivery by the 12th with photos at both ends." };
    expect(bidInputSchema.safeParse(bid).success).toBe(true);
    expect(bidInputSchema.safeParse({ ...bid, message: `${bid.message} Text me at 512 555 0188.` }).error?.issues[0]?.message).toMatch(/phone number/);
    expect(bidInputSchema.safeParse({ ...bid, estimatedDeliveryAt: "2026-10-09" }).success).toBe(false);
  });

  it("allows Google Places in the CSP", () => {
    const csp = buildCsp({ mode: "static" });
    expect(csp).toMatch(/connect-src[^;]*https:\/\/places\.googleapis\.com/);
    expect(csp).toMatch(/script-src[^;]*https:\/\/maps\.googleapis\.com/);
    expect(csp).toMatch(/img-src[^;]*https:\/\/maps\.gstatic\.com/);
  });
});
