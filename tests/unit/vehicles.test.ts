import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { bodyTypeFromVpic, displayMake, modelYears } from "@/features/vehicles/catalog";
import { isValidVin, normalizeVin, vinCheckDigit, vinIssue } from "@/features/vehicles/vin";

vi.mock("server-only", () => ({}));
const warn = vi.fn();
vi.mock("@/lib/log", () => ({ log: { warn: (...args: unknown[]) => warn(...args), info: vi.fn(), error: vi.fn(), debug: vi.fn() } }));

const { decodeVin, getMakes, getModels, resetVpicCache } = await import("@/server/vehicles/vpic");

describe("VIN", () => {
  it.each(["1HGCM82633A004352", "1M8GDM9AXKP042788", "11111111111111111"])("accepts %s", (vin) => {
    expect(vinIssue(vin)).toBeNull();
    expect(isValidVin(vin)).toBe(true);
  });

  it("computes the check digit, including X", () => {
    expect(vinCheckDigit("1HGCM82633A004352")).toBe("3");
    expect(vinCheckDigit("1M8GDM9AXKP042788")).toBe("X");
  });

  it("normalizes spaces, dashes and case", () => {
    expect(normalizeVin(" 1hgcm8-2633a 004352 ")).toBe("1HGCM82633A004352");
    expect(isValidVin("1hgcm82633a004352")).toBe(true);
  });

  it("explains what's wrong", () => {
    expect(vinIssue("1HGCM82633A00435")).toMatch(/17 characters/);
    expect(vinIssue("1HGCM82633AO04352")).toMatch(/I, O or Q/);
    expect(vinIssue("1HGCM82643A004352")).toMatch(/check digit/);
    expect(vinIssue("1HGCM8263#A004352")).toMatch(/letters and numbers/);
    expect(vinIssue("")).toBeNull();
  });
});

describe("catalog helpers", () => {
  it("lists model years newest first, through next year", () => {
    const years = modelYears(new Date("2026-06-01"));
    expect(years[0]).toBe(2027);
    expect(years.at(-1)).toBe(1981);
  });

  it("maps vPIC body classes", () => {
    expect(bodyTypeFromVpic("Sport Utility Vehicle (SUV)/Multi-Purpose Vehicle (MPV)")).toBe("SUV or crossover");
    expect(bodyTypeFromVpic("Sedan/Saloon")).toBe("Sedan");
    expect(bodyTypeFromVpic("Pickup")).toBe("Pickup truck");
    expect(bodyTypeFromVpic("Convertible/Cabriolet")).toBe("Convertible");
    expect(bodyTypeFromVpic("Bus")).toBe("Other");
  });

  it("formats uppercase vPIC makes", () => {
    expect(displayMake("HONDA")).toBe("Honda");
    expect(displayMake("MERCEDES-BENZ", ["Mercedes-Benz"])).toBe("Mercedes-Benz");
    expect(displayMake("BMW")).toBe("BMW");
    expect(displayMake("LAND ROVER")).toBe("Land Rover");
  });
});

describe("vPIC client", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    resetVpicCache();
    warn.mockClear();
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => vi.unstubAllGlobals());

  const ok = (results: unknown[]) => Promise.resolve(new Response(JSON.stringify({ Count: results.length, Results: results }), { status: 200 }));

  it("merges makes across vehicle types, dedupes and caches", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.includes("/car?")) return ok([{ MakeName: "HONDA" }, { MakeName: "TESLA" }]);
      if (url.includes("mpv")) return ok([{ MakeName: "HONDA" }, { MakeName: "JEEP" }]);
      return ok([{ MakeName: "RAM" }]);
    });
    const first = await getMakes("car");
    expect(first).toEqual({ ok: true, data: ["Honda", "Jeep", "Ram", "Tesla"] });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(String(fetchMock.mock.calls[0]![0])).toBe("https://vpic.nhtsa.dot.gov/api/vehicles/GetMakesForVehicleType/car?format=json");
    await getMakes("car");
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("fetches models for make, year and type", async () => {
    fetchMock.mockImplementation(() => ok([{ Model_Name: "Street Glide" }, { Model_Name: "Fat Boy" }, { Model_Name: "Street Glide" }]));
    const res = await getModels("motorcycle", "Harley-Davidson", 2021);
    expect(res).toEqual({ ok: true, data: ["Fat Boy", "Street Glide"] });
    expect(String(fetchMock.mock.calls[0]![0])).toBe("https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMakeYear/make/Harley-Davidson/modelyear/2021/vehicletype/motorcycle?format=json");
  });

  it("returns no models before 1981 without calling vPIC", async () => {
    expect(await getModels("car", "Ford", 1965)).toEqual({ ok: true, data: [] });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("decodes a VIN into form values", async () => {
    fetchMock.mockImplementation(() => ok([{ ModelYear: "2003", Make: "HONDA", Model: "Accord", BodyClass: "Coupe", VehicleType: "PASSENGER CAR", ErrorCode: "0" }]));
    const res = await decodeVin("1hgcm82633a004352");
    expect(res).toEqual({ ok: true, data: { vin: "1HGCM82633A004352", year: 2003, make: "Honda", model: "Accord", body: "Coupe", bodyType: "Coupe", vehicleType: "PASSENGER CAR" } });
  });

  it("rejects an invalid VIN without calling vPIC", async () => {
    const res = await decodeVin("1HGCM82643A004352");
    expect(res).toMatchObject({ ok: false, invalid: expect.stringMatching(/check digit/) });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("degrades when vPIC is down, logs once and backs off", async () => {
    fetchMock.mockRejectedValue(new Error("CONNECT tunnel failed, response 403"));
    expect(await getMakes("motorcycle")).toEqual({ ok: false });
    expect(await getModels("truck", "Ford", 2020)).toEqual({ ok: false });
    expect(warn).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("treats a non-200 answer as unavailable", async () => {
    fetchMock.mockResolvedValue(new Response("nope", { status: 503 }));
    expect(await getMakes("motorcycle")).toEqual({ ok: false });
  });
});
