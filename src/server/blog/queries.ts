import "server-only";
import { and, desc, eq, inArray, lte, ne } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { db } from "@/server/db/client";
import { post, postCategory, postTag, postToTag, user } from "@/server/db/schema";
import { log } from "@/lib/log";

export const BLOG_TAG = "blog";

const published = () => and(inArray(post.status, ["published", "scheduled"]), lte(post.publishedAt, new Date()));

const listFields = {
  id: post.id,
  slug: post.slug,
  title: post.title,
  excerpt: post.excerpt,
  coverKey: post.coverKey,
  coverAlt: post.coverAlt,
  publishedAt: post.publishedAt,
  updatedAt: post.updatedAt,
  readingMinutes: post.readingMinutes,
  categorySlug: postCategory.slug,
  categoryName: postCategory.name,
  authorName: user.name,
};

type Serialized<T> = T extends Date ? string : T extends Array<infer U> ? Array<Serialized<U>> : T extends object ? { [K in keyof T]: Serialized<T[K]> } : T;

function serialize<T>(value: T): Serialized<T> {
  return JSON.parse(JSON.stringify(value)) as Serialized<T>;
}

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<Serialized<T>> {
  try {
    return serialize(await fn());
  } catch (error) {
    log.error("blog query failed", { scope: "blog", err: error });
    return serialize(fallback);
  }
}

export const listPosts = unstable_cache(
  async ({ categorySlug, limit = 24, offset = 0 }: { categorySlug?: string; limit?: number; offset?: number } = {}) =>
    safe(
      () =>
        db
          .select(listFields)
          .from(post)
          .innerJoin(user, eq(user.id, post.authorId))
          .leftJoin(postCategory, eq(postCategory.id, post.categoryId))
          .where(categorySlug ? and(published(), eq(postCategory.slug, categorySlug)) : published())
          .orderBy(desc(post.publishedAt))
          .limit(limit)
          .offset(offset),
      [],
    ),
  ["blog-list"],
  { tags: [BLOG_TAG], revalidate: 3600 },
);

export const getPost = unstable_cache(
  async (slug: string) =>
    safe(async () => {
      const [row] = await db
        .select({ ...listFields, body: post.body, seoTitle: post.seoTitle, seoDescription: post.seoDescription, canonicalUrl: post.canonicalUrl, faq: post.faq, categoryId: post.categoryId })
        .from(post)
        .innerJoin(user, eq(user.id, post.authorId))
        .leftJoin(postCategory, eq(postCategory.id, post.categoryId))
        .where(and(published(), eq(post.slug, slug)))
        .limit(1);
      return row ?? null;
    }, null),
  ["blog-post"],
  { tags: [BLOG_TAG], revalidate: 3600 },
);

export const getRelatedPosts = unstable_cache(
  async (postId: string, categoryId: string | null, limit = 3) =>
    safe(
      () =>
        db
          .select(listFields)
          .from(post)
          .innerJoin(user, eq(user.id, post.authorId))
          .leftJoin(postCategory, eq(postCategory.id, post.categoryId))
          .where(and(published(), ne(post.id, postId), categoryId ? eq(post.categoryId, categoryId) : undefined))
          .orderBy(desc(post.publishedAt))
          .limit(limit),
      [],
    ),
  ["blog-related"],
  { tags: [BLOG_TAG], revalidate: 3600 },
);

export const listCategories = unstable_cache(
  async () => safe(() => db.select().from(postCategory).orderBy(postCategory.name), []),
  ["blog-categories"],
  { tags: [BLOG_TAG], revalidate: 3600 },
);

export const listPostSlugs = unstable_cache(
  async () => safe(() => db.select({ slug: post.slug, updatedAt: post.updatedAt }).from(post).where(published()), []),
  ["blog-slugs"],
  { tags: [BLOG_TAG], revalidate: 3600 },
);

export const listPostTags = unstable_cache(
  async (postIds: string[]) =>
    safe(async () => {
      if (!postIds.length) return {} as Record<string, string[]>;
      const rows = await db
        .select({ postId: postToTag.postId, name: postTag.name })
        .from(postToTag)
        .innerJoin(postTag, eq(postTag.id, postToTag.tagId))
        .where(inArray(postToTag.postId, postIds))
        .orderBy(postTag.name);
      const byPost: Record<string, string[]> = {};
      for (const r of rows) (byPost[r.postId] ??= []).push(r.name);
      return byPost;
    }, {} as Record<string, string[]>),
  ["blog-post-tags"],
  { tags: [BLOG_TAG], revalidate: 3600 },
);

export type PostListItem = Awaited<ReturnType<typeof listPosts>>[number];
