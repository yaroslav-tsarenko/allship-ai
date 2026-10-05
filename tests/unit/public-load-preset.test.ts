import { describe, expect, it } from "vitest";
import { categoryFromParam, movingChoices, placeFromParam, presetFromSearch, vehicleChoices } from "@/features/public-load/model";

describe("public load presets from the URL", () => {
  it("accepts category keys, slugs and short aliases within the form's choices", () => {
    expect(categoryFromParam("motorcycle", vehicleChoices)).toBe("motorcycle");
    expect(categoryFromParam("office_moving", movingChoices)).toBe("office_moving");
    expect(categoryFromParam("long-distance-moving", movingChoices)).toBe("long_distance_moving");
    expect(categoryFromParam("Car", vehicleChoices)).toBe("car_or_light_truck");
    expect(categoryFromParam("motorcycle", movingChoices)).toBe("");
    expect(categoryFromParam("spaceship", vehicleChoices)).toBe("");
    expect(categoryFromParam(null, vehicleChoices)).toBe("");
  });

  it("parses ZIP codes and city, state pairs", () => {
    expect(placeFromParam("10001")).toEqual({ postalCode: "10001" });
    expect(placeFromParam("Miami, fl")).toEqual({ city: "Miami", state: "FL" });
    expect(placeFromParam("Austin, TX 78701")).toEqual({ postalCode: "78701", city: "Austin", state: "TX" });
    expect(placeFromParam("Denver")).toEqual({ city: "Denver" });
    expect(placeFromParam("Paris, ZZ")).toBeNull();
    expect(placeFromParam("")).toBeNull();
    expect(placeFromParam("<script>")).toBeNull();
  });

  it("returns null when the URL carries nothing useful", () => {
    expect(presetFromSearch("?kind=vehicle", vehicleChoices)).toBeNull();
    expect(presetFromSearch("?type=rv&from=10001&to=Miami,%20FL", vehicleChoices)).toEqual({ category: "rv", from: { postalCode: "10001" }, to: { city: "Miami", state: "FL" } });
  });
});
