import "server-only";
import { and, arrayContains, asc, avg, count, desc, eq, gte, isNotNull, ne } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { log } from "@/lib/log";
import { db } from "@/server/db/client";
import { organization, partnerLogo, review, testimonial, user } from "@/server/db/schema";

export const SHOWCASE_TAG = "showcase";

export type PublicTestimonial = {
  id: string;
  quote: string;
  authorName: string;
  authorDetail: string | null;
  rating: number | null;
  sourceLabel: string;
  sourceUrl: string | null;
  reviewedAt: string | null;
  kind: "testimonial" | "platform";
};

export type PublicPartnerLogo = { id: string; name: string; imageUrl: string; href: string | null; relationship: string };

export type ReviewSummary = { count: number; average: number | null };

async function safe<T>(label: string, fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    log.error("showcase query failed", { scope: "showcase", query: label, err: error });
    return fallback;
  }
}

function shortName(name: string | null) {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "AllShip AI shipper";
  const first = parts[0]!;
  const last = parts.length > 1 ? ` ${parts[parts.length - 1]![0]!.toUpperCase()}.` : "";
  return `${first}${last}`;
}

export const getTestimonials = unstable_cache(
  async (placement: string, limit = 6): Promise<PublicTestimonial[]> =>
    safe(
      "testimonials",
      async () => {
        const rows = await db
          .select()
          .from(testimonial)
          .where(and(eq(testimonial.published, true), arrayContains(testimonial.placements, [placement])))
          .orderBy(asc(testimonial.sort), desc(testimonial.reviewedAt))
          .limit(limit);
        return rows.map((t) => ({
          id: t.id,
          quote: t.quote,
          authorName: t.authorName,
          authorDetail: t.authorDetail,
          rating: t.rating,
          sourceLabel: t.sourceLabel,
          sourceUrl: t.sourceUrl,
          reviewedAt: t.reviewedAt ? t.reviewedAt.toISOString() : null,
          kind: "testimonial" as const,
        }));
      },
      [],
    ),
  ["showcase-testimonials"],
  { tags: [SHOWCASE_TAG], revalidate: 3600 },
);

export const getPlatformReviews = unstable_cache(
  async (limit = 6): Promise<PublicTestimonial[]> =>
    safe(
      "platform-reviews",
      async () => {
        const rows = await db
          .select({ id: review.id, body: review.body, rating: review.rating, createdAt: review.createdAt, shipperName: user.name, carrierName: organization.name })
          .from(review)
          .innerJoin(user, eq(user.id, review.shipperId))
          .innerJoin(organization, eq(organization.id, review.carrierOrgId))
          .where(and(isNotNull(review.body), ne(review.body, ""), gte(review.rating, 4)))
          .orderBy(desc(review.createdAt))
          .limit(limit);
        return rows
          .filter((r) => (r.body ?? "").trim().length >= 20)
          .map((r) => ({
            id: r.id,
            quote: r.body!.trim(),
            authorName: shortName(r.shipperName),
            authorDetail: `Shipper · carried by ${r.carrierName}`,
            rating: r.rating,
            sourceLabel: "Verified review on AllShip AI",
            sourceUrl: null,
            reviewedAt: r.createdAt.toISOString(),
            kind: "platform" as const,
          }));
      },
      [],
    ),
  ["showcase-platform-reviews"],
  { tags: [SHOWCASE_TAG], revalidate: 3600 },
);

export const getReviewSummary = unstable_cache(
  async (): Promise<ReviewSummary> =>
    safe(
      "review-summary",
      async () => {
        const [row] = await db.select({ count: count(), average: avg(review.rating) }).from(review);
        const total = Number(row?.count ?? 0);
        return { count: total, average: total ? Math.round(Number(row?.average ?? 0) * 10) / 10 : null };
      },
      { count: 0, average: null },
    ),
  ["showcase-review-summary"],
  { tags: [SHOWCASE_TAG], revalidate: 3600 },
);

export const getPartnerLogos = unstable_cache(
  async (): Promise<PublicPartnerLogo[]> =>
    safe(
      "partner-logos",
      async () => {
        const rows = await db.select().from(partnerLogo).where(eq(partnerLogo.published, true)).orderBy(asc(partnerLogo.sort), asc(partnerLogo.name));
        return rows.map((p) => ({ id: p.id, name: p.name, imageUrl: p.imageKey, href: p.href, relationship: p.relationship }));
      },
      [],
    ),
  ["showcase-partner-logos"],
  { tags: [SHOWCASE_TAG], revalidate: 3600 },
);
