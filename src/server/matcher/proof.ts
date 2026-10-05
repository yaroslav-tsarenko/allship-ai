import "server-only";
import { and, asc, arrayContains, count, eq, inArray, sql } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { db } from "@/server/db/client";
import { review, testimonial } from "@/server/db/schema";

export const MIN_REVIEWS_FOR_STATS = 3;

export type MovingTestimonial = { id: string; quote: string; authorName: string; authorDetail: string | null; rating: number | null; sourceLabel: string; sourceUrl: string | null; reviewedAt: string | null };

export const getMovingProof = unstable_cache(
  async () => {
    const [testimonials, [stats]] = await Promise.all([
      db
        .select({
          id: testimonial.id,
          quote: testimonial.quote,
          authorName: testimonial.authorName,
          authorDetail: testimonial.authorDetail,
          rating: testimonial.rating,
          sourceLabel: testimonial.sourceLabel,
          sourceUrl: testimonial.sourceUrl,
          reviewedAt: sql<string | null>`to_char(${testimonial.reviewedAt}, 'YYYY-MM-DD')`,
        })
        .from(testimonial)
        .where(and(eq(testimonial.published, true), arrayContains(testimonial.placements, ["moving"]), inArray(testimonial.audience, ["shipper", "any"])))
        .orderBy(asc(testimonial.sort))
        .limit(12),
      db.select({ n: count(), avg: sql<number | null>`avg(${review.rating})::float` }).from(review),
    ]);
    const reviews = stats && stats.n >= MIN_REVIEWS_FOR_STATS && stats.avg !== null ? { count: stats.n, average: Math.round(stats.avg * 10) / 10 } : null;
    return { testimonials: testimonials as MovingTestimonial[], reviews };
  },
  ["moving-proof"],
  { revalidate: 3600, tags: ["testimonials", "reviews"] },
);
