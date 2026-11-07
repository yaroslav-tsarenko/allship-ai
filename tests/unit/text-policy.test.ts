import { describe, expect, it } from "vitest";
import { checkText, findContact, hasProfanity, isSpam, maskProfanity, normalizeText, policyText } from "@/lib/validation/text-policy";

describe("profanity", () => {
  it.each(["f*ck this", "fvck", "fuuuck", "sh1t happens", "a$$hole driver", "b!tch", "f u c k", "f.u.c.k"])("catches %s", (t) => {
    expect(hasProfanity(t)).toBe(true);
  });

  it.each(["Scunthorpe", "assess the class", "cocktail table", "Hancock Street", "shiitake mushrooms", "Sussex", "therapist office", "bass guitar", "analysis", "cumulative weight", "Titanic replica", "grass seed pallets"])("allows %s", (t) => {
    expect(hasProfanity(t)).toBe(false);
  });

  it("masks but keeps the first letter", () => {
    expect(maskProfanity("this is sh1t")).toBe("this is s***");
    expect(maskProfanity("clean message")).toBe("clean message");
  });
});

describe("contact details", () => {
  it.each([
    ["555-123-4567", "phone"],
    ["call (555) 123 4567 after 5", "phone"],
    ["+1 555.123.4567", "phone"],
    ["5551234567", "phone"],
    ["five five five one two three four five six seven", "phone"],
    ["my cell 555 one two three 4567", "phone"],
    ["text 555-1234 tonight", "phone"],
    ["john.doe@gmail.com", "email"],
    ["john at gmail dot com", "email"],
    ["john (at) yahoo (dot) com", "email"],
    ["jane [at] mycompany [dot] net", "email"],
    ["jane at hotmail", "email"],
    ["see www.mymovers.biz", "link"],
    ["https://example.org/load", "link"],
    ["mymovers.com has photos", "link"],
    ["mymovers dot com", "link"],
    ["wa.me/15551234567", "link"],
    ["follow @bigtruckguy", "handle"],
    ["telegram: haulerjoe", "handle"],
    ["WhatsApp me for details", "handle"],
    ["message me on Telegram", "handle"],
    ["insta @joe.moves", "handle"],
    ["Please call me before you bid", "request"],
    ["text me when you're close", "request"],
    ["give me a call", "request"],
    ["my email is below", "request"],
  ])("blocks %s", (text, kind) => {
    expect(findContact(text)).toBe(kind);
  });

  it.each([
    "Take I-95 to exit 12",
    "2 bedroom apartment on the 3rd floor",
    "Room 101, building B",
    "Pickup ZIP 78701, delivery 80202",
    "ZIPs 78701 80202",
    "Gate code 1234",
    "Dates 10/15/26 - 10/20/26 work",
    "Pallets are 48 x 40 x 52 in, 12,500 lb total",
    "Turn signal is broken, rolls fine",
    "Pickup @ 5pm, dock 3",
    "The driver can call the front desk on arrival",
    "Meet at the loading dock at noon. Co-op parking lot",
    "One or two boxes, maybe three",
    "U.S. Route 66, St. Louis area",
    "Elevator from 8 to 11 am",
    "Snap-on tool chest, 400 lb",
    "Unit 4B, 2nd floor, 1 flight of stairs",
    "Year 2019, 45000 miles",
  ])("allows %s", (text) => {
    expect(findContact(text)).toBeNull();
  });
});

describe("spam and normalization", () => {
  it.each(["!!!!!!", "......", "aaaaaaaaaa", "asdasdasdasdasdasd", "-- -- --"])("flags %s", (t) => expect(isSpam(t)).toBe(true));
  it.each(["Sofa", "OK", "3 boxes", "Heeelp moving a piano"])("allows %s", (t) => expect(isSpam(t)).toBe(false));

  it("collapses whitespace", () => {
    expect(normalizeText("  two   sofas \t and  a bed ")).toBe("two sofas and a bed");
    expect(normalizeText("line one  \n\n\n\n  line two", true)).toBe("line one\n\nline two");
  });
});

describe("policyText", () => {
  const schema = policyText({ label: "Notes", max: 50, multiline: true });

  it("normalizes and accepts clean text", () => {
    expect(schema.parse("  Gate   code 1234 ")).toBe("Gate code 1234");
    expect(schema.parse("")).toBe("");
  });

  it("returns a friendly contact message", () => {
    const res = schema.safeParse("call me 555 123 4567");
    expect(res.success).toBe(false);
    expect(res.error?.issues[0]?.message).toMatch(/shared after you book/);
  });

  it("enforces required, min and max", () => {
    const required = policyText({ label: "Title", min: 4, max: 10, required: true });
    expect(required.safeParse("").error?.issues[0]?.message).toBe("Enter title");
    expect(required.safeParse("abc").success).toBe(false);
    expect(required.safeParse("a".repeat(4) + " long text").success).toBe(false);
  });

  it("can allow contacts but still block profanity", () => {
    const review = policyText({ label: "Review", max: 200, contacts: false });
    expect(review.safeParse("Call me anytime, great job").success).toBe(true);
    expect(review.safeParse("total sh1t service").success).toBe(false);
  });

  it("reports the first issue only", () => {
    expect(checkText("f*ck call me", {})?.kind).toBe("profanity");
  });
});
