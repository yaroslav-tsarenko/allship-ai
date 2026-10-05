import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/env", () => ({ env: { OPENAI_MODEL: "gpt-test", NODE_ENV: "test" } }));

const { countWords, isValidSlug, publishIssues, readingMinutesFor, slugify, effectiveStatus } = await import("@/features/admin/blog/rules");
const { wrap, heading, prefixLines, headingAt, block } = await import("@/features/admin/blog/text-ops");
const { runWritingTask, buildLinkCandidates } = await import("@/server/ai/writing");
const { sniffImageType } = await import("@/server/storage/blog-media");

const words = (n: number) => Array.from({ length: n }, (_, i) => `word${i}`).join(" ");

describe("blog rules", () => {
  it("slugifies titles", () => {
    expect(slugify("Open vs. Enclosed: Which One’s Worth It?")).toBe("open-vs-enclosed-which-ones-worth-it");
    expect(isValidSlug("open-vs-enclosed")).toBe(true);
    expect(isValidSlug("Open--vs")).toBe(false);
  });

  it("counts words without markdown syntax", () => {
    expect(countWords("## Heading\n\n**Bold** text with [a link](/x) and ![img](/a.png)")).toBe(7);
    expect(readingMinutesFor(words(460))).toBe(2);
  });

  it("lists every publish blocker", () => {
    const issues = publishIssues({ title: "", slug: "ok", excerpt: "short", body: words(10), coverKey: "/media/blog/a.webp", coverAlt: "", seoDescription: "x" });
    expect(issues.map((i) => i.field)).toEqual(["title", "excerpt", "coverAlt", "body", "seoDescription"]);
    expect(
      publishIssues({ title: "T", slug: "t", excerpt: "An excerpt that is long enough to pass the check.", body: words(320), coverKey: "/c.webp", coverAlt: "Truck", seoDescription: "d".repeat(120) }),
    ).toEqual([]);
  });

  it("treats due scheduled posts as published", () => {
    expect(effectiveStatus("scheduled", new Date(Date.now() - 1000))).toBe("published");
    expect(effectiveStatus("scheduled", new Date(Date.now() + 60_000))).toBe("scheduled");
  });
});

describe("text ops", () => {
  it("wraps and unwraps bold", () => {
    const e = wrap("make this bold", 5, 9, "**", "**", "x");
    expect(e.text).toBe("**this**");
    const v = "make **this** bold";
    expect(wrap(v, 7, 11, "**", "**", "x").text).toBe("this");
  });

  it("toggles headings and list prefixes", () => {
    expect(heading("Intro line", 2, 2, 2).text).toBe("## Intro line");
    expect(heading("## Intro line", 2, 2, 2).text).toBe("Intro line");
    expect(prefixLines("a\nb", 0, 3, () => "- ", /^\s*[-*+]\s+/).text).toBe("- a\n- b");
  });

  it("finds the heading at the cursor and pads blocks", () => {
    const v = "## First\n\ntext\n\n## Second section\n\nmore";
    expect(headingAt(v, v.indexOf("Second") + 2)).toBe("Second section");
    expect(headingAt(v, v.length)).toBe("Second section");
    expect(block("para", 4, 4, "| a |").text).toBe("\n\n| a |");
  });
});

describe("offline writing helpers", () => {
  const candidates = buildLinkCandidates({ posts: [{ slug: "freight-class-explained", title: "Freight Class Explained: How NMFC Density Works" }], categories: [{ slug: "moving", name: "Moving" }] });
  const base = { title: "Moving checklist", excerpt: "", body: "", candidates };

  it("cleans hype words and adds contractions", async () => {
    const improved = await runWritingTask({ ...base, task: "improve", selection: "We leverage a seamless, cutting-edge process in order to help." });
    expect(improved).toMatchObject({ kind: "replace", offline: true });
    if (improved.kind === "replace") expect(improved.text).toBe("We use a smooth, modern process to help.");
    const friendly = await runWritingTask({ ...base, task: "friendlier", selection: "You will see that it is simple. Do not pay cash." });
    if (friendly.kind === "replace") expect(friendly.text).toBe("You'll see that it's simple. Don't pay cash.");
  });

  it("builds outlines, SEO text, FAQs and link suggestions from the post", async () => {
    const outline = await runWritingTask({ ...base, task: "outline", topic: "Open vs enclosed auto transport: which one is worth it" });
    expect(outline.kind === "insert" && outline.text).toContain("## How open auto transport works");
    const body = "## How freight class works\n\nFreight class depends on density. Heavier, denser freight usually ships at a lower class and costs less.\n\n## Next step\n\nUse the freight class calculator before you post an LTL load.";
    const seo = await runWritingTask({ ...base, task: "seo", title: "Freight class explained: a guide", excerpt: "How density sets freight class.", body });
    expect(seo.kind === "seo" && seo.seoDescription.length).toBeGreaterThanOrEqual(70);
    const faqs = await runWritingTask({ ...base, task: "faqs", body });
    expect(faqs.kind === "faqs" && faqs.items).toEqual([{ question: "How freight class works?", answer: "Freight class depends on density. Heavier, denser freight usually ships at a lower class and costs less." }]);
    const links = await runWritingTask({ ...base, task: "internal_links", body });
    expect(links.kind === "links" && links.items.map((l) => l.href)).toContain("/tools/freight-class-calculator");
  });
});

describe("media sniffing", () => {
  it("recognizes allowed image signatures only", () => {
    expect(sniffImageType(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe("image/jpeg");
    expect(sniffImageType(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe("image/png");
    expect(sniffImageType(new TextEncoder().encode("RIFF1234WEBPVP8 "))).toBe("image/webp");
    expect(sniffImageType(new TextEncoder().encode("<svg xmlns="))).toBeNull();
  });
});
