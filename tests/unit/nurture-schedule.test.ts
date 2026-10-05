import { describe, expect, it } from "vitest";
import { anchorOf, capReleaseAt, DAILY_CAP, firstSendAt, isWithinSendWindow, MIN_STEP_GAP_MS, nextSendWindow, nextStepAt, sequences, timeZoneForState } from "@/server/nurture/schedule";

const H = 3_600_000;

describe("sequence schedule", () => {
  it("defines the requested delays", () => {
    expect(sequences.verify_publish.steps).toEqual([1 * H, 24 * H, 72 * H]);
    expect(sequences.abandoned_form.steps).toEqual([0.5 * H, 24 * H, 96 * H]);
    expect(sequences.load_followup.steps).toEqual([0, 24 * H, 72 * H]);
    expect(sequences.post_delivery.steps).toEqual([24 * H, 14 * 24 * H]);
  });

  it("puts the first send at anchor plus the first offset", () => {
    const anchor = new Date("2026-10-05T15:00:00Z");
    expect(firstSendAt("verify_publish", anchor).toISOString()).toBe("2026-10-05T16:00:00.000Z");
    expect(firstSendAt("load_followup", anchor).toISOString()).toBe(anchor.toISOString());
  });

  it("schedules later steps from the anchor, never earlier than the minimum gap or now", () => {
    const anchor = new Date("2026-10-05T15:00:00Z");
    const onTime = nextStepAt("verify_publish", 1, anchor, new Date("2026-10-05T16:00:00Z"), new Date("2026-10-05T16:00:00Z"));
    expect(onTime?.toISOString()).toBe("2026-10-06T15:00:00.000Z");
    const lateSend = new Date("2026-10-06T14:00:00Z");
    const gapped = nextStepAt("verify_publish", 1, anchor, lateSend, lateSend);
    expect(gapped?.getTime()).toBe(lateSend.getTime() + MIN_STEP_GAP_MS);
    const overdue = new Date("2026-10-09T00:00:00Z");
    expect(nextStepAt("verify_publish", 2, anchor, null, overdue)?.getTime()).toBe(overdue.getTime());
  });

  it("returns null after the last step", () => {
    expect(nextStepAt("post_delivery", 2, new Date(), null, new Date())).toBeNull();
  });

  it("reads the anchor from context with a fallback", () => {
    const created = new Date("2026-10-01T00:00:00Z");
    expect(anchorOf({ anchorAt: "2026-10-02T00:00:00.000Z" }, created).toISOString()).toBe("2026-10-02T00:00:00.000Z");
    expect(anchorOf({ anchorAt: "nope" }, created)).toBe(created);
    expect(anchorOf({}, created)).toBe(created);
  });
});

describe("quiet hours", () => {
  it("maps states to time zones and defaults to Central", () => {
    expect(timeZoneForState("ca")).toBe("America/Los_Angeles");
    expect(timeZoneForState("NY")).toBe("America/New_York");
    expect(timeZoneForState(null)).toBe("America/Chicago");
    expect(timeZoneForState("ZZ")).toBe("America/Chicago");
  });

  it("allows 8:00 to 19:59 local", () => {
    expect(isWithinSendWindow(new Date("2026-10-05T13:00:00Z"), "America/Chicago")).toBe(true);
    expect(isWithinSendWindow(new Date("2026-10-05T12:59:00Z"), "America/Chicago")).toBe(false);
    expect(isWithinSendWindow(new Date("2026-10-06T00:59:00Z"), "America/Chicago")).toBe(true);
    expect(isWithinSendWindow(new Date("2026-10-06T01:00:00Z"), "America/Chicago")).toBe(false);
  });

  it("moves a late-evening send to 8:00 the next local morning", () => {
    expect(nextSendWindow(new Date("2026-10-06T03:30:00Z"), "America/Los_Angeles").toISOString()).toBe("2026-10-06T15:00:00.000Z");
    expect(nextSendWindow(new Date("2026-10-06T02:00:00Z"), "America/New_York").toISOString()).toBe("2026-10-06T12:00:00.000Z");
  });

  it("moves an early-morning send to 8:00 the same local day", () => {
    expect(nextSendWindow(new Date("2026-10-05T09:00:00Z"), "America/Chicago").toISOString()).toBe("2026-10-05T13:00:00.000Z");
  });

  it("handles the daylight saving change", () => {
    expect(nextSendWindow(new Date("2026-11-01T06:00:00Z"), "America/Chicago").toISOString()).toBe("2026-11-01T14:00:00.000Z");
    expect(nextSendWindow(new Date("2026-03-08T07:00:00Z"), "America/New_York").toISOString()).toBe("2026-03-08T12:00:00.000Z");
  });

  it("keeps a time already inside the window", () => {
    const d = new Date("2026-10-05T18:00:00Z");
    expect(nextSendWindow(d, "America/New_York")).toBe(d);
  });
});

describe("daily cap", () => {
  const now = new Date("2026-10-05T18:00:00Z");
  it("is open below the cap", () => {
    expect(capReleaseAt([new Date("2026-10-05T10:00:00Z")], now)).toBeNull();
  });
  it("releases a minute after the oldest counted send leaves the 24h window", () => {
    const sends = [new Date("2026-10-05T10:00:00Z"), new Date("2026-10-05T16:00:00Z")];
    expect(DAILY_CAP).toBe(2);
    expect(capReleaseAt(sends, now)?.toISOString()).toBe("2026-10-06T10:01:00.000Z");
  });
});
