import { describe, expect, it } from "vitest";
import { canTransition } from "@/server/loads/transitions";

describe("load transitions", () => {
  it("lets the shipper publish a draft", () => expect(canTransition("draft", "open", "shipper")).toBe(true));
  it("only the system books a load after payment", () => {
    expect(canTransition("awaiting_payment", "booked", "system")).toBe(true);
    expect(canTransition("awaiting_payment", "booked", "shipper")).toBe(false);
  });
  it("carriers cannot complete a load", () => expect(canTransition("delivered", "completed", "carrier")).toBe(false));
  it("completed is terminal", () => expect(canTransition("completed", "open", "admin")).toBe(false));
});
