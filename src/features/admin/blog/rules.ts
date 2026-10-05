export const POST_STATUSES = ["draft", "scheduled", "published", "archived"] as const;
export type PostStatus = (typeof POST_STATUSES)[number];

export const SEO_TITLE_MAX = 60;
export const SEO_DESCRIPTION_MIN = 70;
export const SEO_DESCRIPTION_MAX = 160;
export const MIN_PUBLISH_WORDS = 300;
export const EXCERPT_MAX = 300;
export const MAX_BODY_CHARS = 200_000;
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export const MAX_IMAGE_EDGE = 2400;
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

export function isValidSlug(slug: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length <= 80;
}

export function stripMarkdown(markdown: string) {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`|~-]+/g, " ");
}

export function countWords(markdown: string) {
  return stripMarkdown(markdown).split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w)).length;
}

export function readingMinutesFor(markdown: string) {
  return Math.max(1, Math.round(markdown.split(/\s+/).filter(Boolean).length / 230));
}

export type PublishCheckInput = {
  title: string;
  excerpt: string;
  body: string;
  coverKey: string | null;
  coverAlt: string | null;
  seoDescription: string | null;
  slug: string;
};

export type PublishIssue = { field: string; message: string };

export function publishIssues(p: PublishCheckInput): PublishIssue[] {
  const issues: PublishIssue[] = [];
  if (!p.title.trim()) issues.push({ field: "title", message: "Add a title" });
  if (!isValidSlug(p.slug)) issues.push({ field: "slug", message: "Use a URL slug with lowercase letters, numbers and dashes" });
  if (p.excerpt.trim().length < 40) issues.push({ field: "excerpt", message: "Write an excerpt of at least 40 characters" });
  if (!p.coverKey) issues.push({ field: "cover", message: "Add a cover image" });
  else if (!p.coverAlt?.trim()) issues.push({ field: "coverAlt", message: "Describe the cover image in alt text" });
  const words = countWords(p.body);
  if (words < MIN_PUBLISH_WORDS) issues.push({ field: "body", message: `Write at least ${MIN_PUBLISH_WORDS} words (now ${words})` });
  const desc = p.seoDescription?.trim().length ?? 0;
  if (desc < SEO_DESCRIPTION_MIN || desc > SEO_DESCRIPTION_MAX) issues.push({ field: "seoDescription", message: `Keep the meta description between ${SEO_DESCRIPTION_MIN} and ${SEO_DESCRIPTION_MAX} characters (now ${desc})` });
  return issues;
}

export function isLive(status: PostStatus, publishedAt: Date | string | null) {
  if (status !== "published" && status !== "scheduled") return false;
  return Boolean(publishedAt && new Date(publishedAt).getTime() <= Date.now());
}

export function effectiveStatus(status: PostStatus, publishedAt: Date | string | null): PostStatus {
  return status === "scheduled" && isLive(status, publishedAt) ? "published" : status;
}
