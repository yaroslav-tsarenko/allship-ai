import { describe, expect, it } from "vitest";
import { contactSchema, formatUsPhone, locationSchema, mapPublicLoad, normalizeUsPhone, PayloadError, stepSchema, summarize, vehicleChoices } from "@/features/public-load/model";

const now = new Date("2026-10-04T15:00:00Z");

const stop = (over: Record<string, unknown> = {}) => ({ postalCode: "78701", city: "Austin", state: "TX", address: "", windowStart: "2026-10-10", windowEnd: "", ...over });

const carPayload = (over: Record<string, unknown> = {}) => ({
  category: "car_or_light_truck",
  pickup: stop(),
  dropoff: stop({ postalCode: "80202", city: "Denver", state: "CO", windowStart: "2026-10-14" }),
  details: { year: "2019", make: "Toyota", model: "RAV4", bodyType: "SUV or crossover", condition: "Runs and drives", trailer: "Open trailer", modified: false },
  title: "",
  notes: "  Gate code 1234 ",
  ...over,
});

describe("mapPublicLoad", () => {
  it("maps a vehicle payload to a load with coerced details and a suggested title", () => {
    const mapped = mapPublicLoad("vehicle", carPayload(), now);
    expect(mapped.category).toBe("car_or_light_truck");
    expect(mapped.details.year).toBe(2019);
    expect(mapped.title).toBe("2019 Toyota RAV4 to Denver");
    expect(mapped.notes).toBe("Gate code 1234");
    expect(mapped.pickup).toEqual({ address: "", city: "Austin", state: "TX", postalCode: "78701", windowStart: "2026-10-10" });
  });

  it("keeps a title the shipper typed and the latest date when given", () => {
    const mapped = mapPublicLoad("vehicle", carPayload({ title: "My car", pickup: stop({ windowEnd: "2026-10-12" }) }), now);
    expect(mapped.title).toBe("My car");
    expect(mapped.pickup.windowEnd).toBe("2026-10-12");
  });

  it("rejects a category that belongs to another form", () => {
    expect(() => mapPublicLoad("vehicle", carPayload({ category: "freight" }), now)).toThrow(PayloadError);
    expect(() => mapPublicLoad("freight", { ...carPayload(), category: "car_or_light_truck" }, now)).toThrow(PayloadError);
  });

  it("rejects missing required details with the field path", () => {
    try {
      mapPublicLoad("vehicle", carPayload({ details: { year: "2019", make: "Toyota" } }), now);
      throw new Error("expected failure");
    } catch (e) {
      expect(e).toBeInstanceOf(PayloadError);
      expect((e as PayloadError).field).toMatch(/^details\./);
    }
  });

  it("rejects delivery before pickup and past dates", () => {
    expect(() => mapPublicLoad("vehicle", carPayload({ dropoff: stop({ windowStart: "2026-10-09" }) }), now)).toThrow("Delivery can't be before pickup");
    expect(() => mapPublicLoad("vehicle", carPayload({ pickup: stop({ windowStart: "2026-09-01" }) }), now)).toThrow(PayloadError);
  });

  it("keeps Places coordinates only when both are present", () => {
    const mapped = mapPublicLoad("vehicle", carPayload({ pickup: stop({ lat: 30.27, lng: -97.74, placeId: "abc" }), dropoff: stop({ postalCode: "80202", city: "Denver", state: "CO", windowStart: "2026-10-14", lat: 39.7 }) }), now);
    expect(mapped.pickup).toMatchObject({ lat: 30.27, lng: -97.74, placeId: "abc" });
    expect(mapped.dropoff.lat).toBeUndefined();
  });

  it("maps freight with multiselect and switches", () => {
    const mapped = mapPublicLoad(
      "freight",
      {
        category: "freight",
        pickup: stop(),
        dropoff: stop({ postalCode: "80202", city: "Denver", state: "CO", windowStart: "2026-10-11" }),
        details: { description: "Auto parts", quantity: "4", weight: "1800", length: "48", width: "40", height: "50", units: ["Pallets"], hazardous: true, freightClass: "" },
        title: "",
        notes: "",
      },
      now,
    );
    expect(mapped.details).toMatchObject({ quantity: 4, weight: 1800, units: ["Pallets"], hazardous: true, stackable: false });
    expect(mapped.details.freightClass).toBeUndefined();
    expect(mapped.notes).toBeNull();
  });
});

describe("step validation", () => {
  it("requires a category from the form's list", () => {
    expect(stepSchema("type", "", vehicleChoices).safeParse({ category: "" }).success).toBe(false);
    expect(stepSchema("type", "", vehicleChoices).safeParse({ category: "rv" }).success).toBe(true);
    expect(stepSchema("type", "", vehicleChoices).safeParse({ category: "freight" }).success).toBe(false);
  });

  it("validates ZIP, state and date order on the location step", async () => {
    const schema = locationSchema("2026-10-04", "car_or_light_truck");
    expect((await schema.safeParseAsync({ pickup: stop(), dropoff: stop({ postalCode: "80202", city: "Denver", state: "CO", windowStart: "2026-10-12" }) })).success).toBe(true);
    const bad = await schema.safeParseAsync({ pickup: stop({ postalCode: "7870", state: "Texas" }), dropoff: stop({ windowStart: "2026-10-12", windowEnd: "2026-10-11" }) });
    expect(bad.success).toBe(false);
    const paths = bad.error!.issues.map((i) => i.path.join("."));
    expect(paths).toEqual(expect.arrayContaining(["pickup.postalCode", "pickup.state", "dropoff.windowEnd"]));
  });
});

describe("contact", () => {
  it("normalizes US phone numbers", () => {
    expect(normalizeUsPhone("(512) 555-0188")).toBe("+15125550188");
    expect(normalizeUsPhone("+1 512 555 0188")).toBe("+15125550188");
    expect(normalizeUsPhone("012 555 0188")).toBeNull();
    expect(normalizeUsPhone("555-0188")).toBeNull();
    expect(formatUsPhone("5125550188")).toBe("(512) 555-0188");
    expect(formatUsPhone("15125550188")).toBe("(512) 555-0188");
  });

  it("parses contact details and lowercases email", () => {
    const parsed = contactSchema.parse({ firstName: " Ann ", lastName: "Lee", email: " Ann@Example.COM ", phone: "512-555-0188" });
    expect(parsed).toEqual({ firstName: "Ann", lastName: "Lee", email: "ann@example.com", phone: "+15125550188", smsConsent: false });
    expect(contactSchema.safeParse({ firstName: "", lastName: "Lee", email: "nope", phone: "1" }).success).toBe(false);
  });

  it("summarizes the load for the abandoned form email", () => {
    expect(summarize({ category: "local_moving", pickup: stop(), dropoff: stop({ city: "Round Rock" }) })).toBe("Local moving, Austin, TX to Round Rock, TX");
  });
});
