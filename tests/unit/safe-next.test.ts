import { describe, expect, it } from "vitest";
import { safeNext } from "@/features/auth/safe-next";

describe("safeNext", () => {
  it("keeps internal paths", () => {
    expect(safeNext("/app/loads?status=open")).toBe("/app/loads?status=open");
  });

  it.each(["https://evil.example", "//evil.example", "/\\evil.example", "javascript:alert(1)", "", null, undefined])(
    "falls back for %s",
    (value) => {
      expect(safeNext(value)).toBe("/app");
    },
  );
});
