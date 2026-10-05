import { describe, expect, it } from "vitest";
import { tourDefinitions } from "@/features/tours/definitions";
import { tourIds, tourMeta, toursFor, welcomeTourFor } from "@/features/tours/ids";

describe("guided tours", () => {
  it("defines 4 to 8 steps for every tour and role", () => {
    for (const id of tourIds) {
      for (const role of tourMeta[id].roles) {
        const steps = tourDefinitions[id].steps.filter((s) => !s.roles || s.roles.includes(role));
        expect(steps.length, `${id} for ${role}`).toBeGreaterThanOrEqual(4);
        expect(steps.length, `${id} for ${role}`).toBeLessThanOrEqual(8);
        expect(steps[0]?.anchor, `${id} opens with the assistant`).toBeUndefined();
      }
    }
  });

  it("gives tours with a dynamic target a fallback", () => {
    for (const id of tourIds) {
      const def = tourDefinitions[id];
      if (def.target) expect(def.fallback, id).toBeDefined();
    }
  });

  it("offers each role its own welcome tour", () => {
    for (const role of ["shipper", "owner", "dispatcher", "driver"] as const) {
      expect(toursFor(role)).toContain(welcomeTourFor(role));
      expect(toursFor(role)).toContain("assistant");
    }
  });
});
