import "server-only";
import { randomBytes } from "node:crypto";
import { and, asc, count, desc, eq, ilike, inArray, lte, ne, or, sql, type SQL } from "drizzle-orm";
import { revalidatePath, revalidateTag, updateTag } from "next/cache";
import { publishIssues, readingMinutesFor, slugify, type PostStatus } from "@/features/admin/blog/rules";
import { ActionError } from "@/server/actions/safe-action";
import { ADMIN_PAGE_SIZE, type Paged } from "@/server/admin/queries";
import { db } from "@/server/db/client";
import { auditLog, post, postCategory, postTag, postToTag, user } from "@/server/db/schema";
import { BLOG_TAG } from "./queries";

export type AdminPostFilter = PostStatus | "all";

const effectiveStatus = sql<PostStatus>`case when ${post.status} = 'scheduled' and ${post.publishedAt} <= now() then 'published' else ${post.status}::text end`;

function like(term: string) {
  return `%${term.replace(/[%_\\]/g, (c) => `\\${c}`)}%`;
}

export async function listAdminPosts({ filter, q, category, page }: { filter: AdminPostFilter; q?: string; category?: string; page: number }) {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const base: SQL[] = [];
  if (q) base.push(or(ilike(post.title, like(q)), ilike(post.slug, like(q)), ilike(post.excerpt, like(q)))!);
  if (category) base.push(eq(postCategory.slug, category));
  const where = [...base, ...(filter === "all" ? [] : [sql`${effectiveStatus} = ${filter}`])];
  const [rows, [totalRow], countRows] = await Promise.all([
    db
      .select({
        id: post.id,
        slug: post.slug,
        title: post.title,
        status: effectiveStatus,
        publishedAt: post.publishedAt,
        updatedAt: post.updatedAt,
        categoryName: postCategory.name,
        categorySlug: postCategory.slug,
        authorName: user.name,
        coverKey: post.coverKey,
      })
      .from(post)
      .innerJoin(user, eq(user.id, post.authorId))
      .leftJoin(postCategory, eq(postCategory.id, post.categoryId))
      .where(and(...where))
      .orderBy(desc(post.updatedAt))
      .limit(ADMIN_PAGE_SIZE)
      .offset((safePage - 1) * ADMIN_PAGE_SIZE),
    db.select({ n: count() }).from(post).leftJoin(postCategory, eq(postCategory.id, post.categoryId)).where(and(...where)),
    db.select({ status: effectiveStatus, n: count() }).from(post).leftJoin(postCategory, eq(postCategory.id, post.categoryId)).where(and(...base)).groupBy(effectiveStatus),
  ]);
  const counts: Record<string, number> = { all: 0 };
  for (const r of countRows) {
    counts[r.status] = r.n;
    counts.all = (counts.all ?? 0) + r.n;
  }
  const total = totalRow?.n ?? 0;
  const result: Paged<(typeof rows)[number]> & { counts: Record<string, number> } = { rows, total, page: safePage, pageCount: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)), counts };
  return result;
}

export async function getEditorPost(id: string) {
  const [row] = await db
    .select({ post, authorName: user.name, categorySlug: postCategory.slug })
    .from(post)
    .innerJoin(user, eq(user.id, post.authorId))
    .leftJoin(postCategory, eq(postCategory.id, post.categoryId))
    .where(eq(post.id, id))
    .limit(1);
  if (!row) return null;
  const tags = await db.select({ id: postTag.id }).from(postToTag).innerJoin(postTag, eq(postTag.id, postToTag.tagId)).where(eq(postToTag.postId, id));
  return { ...row.post, authorName: row.authorName, categorySlug: row.categorySlug, tagIds: tags.map((t) => t.id) };
}

export type EditorPost = NonNullable<Awaited<ReturnType<typeof getEditorPost>>>;

export async function getEditorOptions() {
  const [categories, tags, posts] = await Promise.all([
    db.select({ id: postCategory.id, slug: postCategory.slug, name: postCategory.name }).from(postCategory).orderBy(asc(postCategory.name)),
    db.select({ id: postTag.id, slug: postTag.slug, name: postTag.name }).from(postTag).orderBy(asc(postTag.name)),
    db
      .select({ id: post.id, slug: post.slug, title: post.title })
      .from(post)
      .where(and(inArray(post.status, ["published", "scheduled"]), lte(post.publishedAt, new Date())))
      .orderBy(desc(post.publishedAt))
      .limit(300),
  ]);
  return { categories, tags, posts };
}

export async function slugTaken(slug: string, exceptId?: string) {
  const [row] = await db
    .select({ id: post.id })
    .from(post)
    .where(and(eq(post.slug, slug), exceptId ? ne(post.id, exceptId) : undefined))
    .limit(1);
  return Boolean(row);
}

async function uniqueSlug(base: string, exceptId?: string) {
  const root = slugify(base) || "untitled";
  if (!(await slugTaken(root, exceptId))) return root;
  for (let i = 2; i < 20; i++) {
    const candidate = `${root.slice(0, 74)}-${i}`;
    if (!(await slugTaken(candidate, exceptId))) return candidate;
  }
  return `${root.slice(0, 70)}-${randomBytes(3).toString("hex")}`;
}

export type PostFields = {
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  coverKey: string | null;
  coverAlt: string | null;
  categoryId: string | null;
  tagIds: string[];
  seoTitle: string | null;
  seoDescription: string | null;
  canonicalUrl: string | null;
  faq: Array<{ question: string; answer: string }>;
};

function columns(f: PostFields) {
  return {
    title: f.title.trim() || "Untitled post",
    excerpt: f.excerpt.trim(),
    body: { markdown: f.body },
    coverKey: f.coverKey || null,
    coverAlt: f.coverAlt?.trim() || null,
    categoryId: f.categoryId || null,
    seoTitle: f.seoTitle?.trim() || null,
    seoDescription: f.seoDescription?.trim() || null,
    canonicalUrl: f.canonicalUrl?.trim() || null,
    faq: f.faq.map((x) => ({ question: x.question.trim(), answer: x.answer.trim() })).filter((x) => x.question && x.answer),
    readingMinutes: readingMinutesFor(f.body),
  };
}

async function setTags(postId: string, tagIds: string[]) {
  await db.delete(postToTag).where(eq(postToTag.postId, postId));
  const unique = [...new Set(tagIds)];
  if (unique.length) await db.insert(postToTag).values(unique.map((tagId) => ({ postId, tagId }))).onConflictDoNothing();
}

export async function createPost(authorId: string, f: PostFields) {
  const slug = await uniqueSlug(f.slug || f.title || `untitled-${randomBytes(3).toString("hex")}`);
  const now = new Date();
  const [row] = await db
    .insert(post)
    .values({ ...columns(f), slug, authorId, status: "draft", createdAt: now, updatedAt: now })
    .returning({ id: post.id, slug: post.slug, updatedAt: post.updatedAt });
  if (!row) throw new ActionError("Couldn't create the post.");
  await setTags(row.id, f.tagIds);
  await db.insert(auditLog).values({ actorId: authorId, action: "post.create", entity: "post", entityId: row.id, diff: { slug } });
  return row;
}

async function currentRow(id: string) {
  const [row] = await db
    .select({ id: post.id, slug: post.slug, status: post.status, publishedAt: post.publishedAt, updatedAt: post.updatedAt, categorySlug: postCategory.slug })
    .from(post)
    .leftJoin(postCategory, eq(postCategory.id, post.categoryId))
    .where(eq(post.id, id))
    .limit(1);
  if (!row) throw new ActionError("This post no longer exists.");
  return row;
}

const sameInstant = (a: Date, b: Date) => Math.abs(a.getTime() - b.getTime()) < 1;

export type SaveResult =
  | { ok: true; updatedAt: Date; slug: string; slugError?: string }
  | { ok: false; conflict: true; updatedAt: Date };

export async function savePost(actorId: string, id: string, f: PostFields, { expectedUpdatedAt, force, publishLive }: { expectedUpdatedAt: Date; force?: boolean; publishLive?: boolean }): Promise<SaveResult> {
  const current = await currentRow(id);
  if (!force && !sameInstant(current.updatedAt, expectedUpdatedAt)) return { ok: false, conflict: true, updatedAt: current.updatedAt };
  const live = current.status === "published" || current.status === "scheduled";
  let slug = slugify(f.slug) || current.slug;
  let slugError: string | undefined;
  if (slug !== current.slug && (await slugTaken(slug, id))) {
    slugError = "Another post already uses this URL";
    slug = current.slug;
  }
  if (live) {
    if (!publishLive) throw new ActionError("Use Update to change a published or scheduled post.");
    const issues = publishIssues({ ...f, slug });
    if (issues.length) throw new ActionError(issues[0]!.message);
    if (slugError) throw new ActionError(slugError);
  }
  const updatedAt = new Date();
  const values = { ...columns(f), slug, updatedAt };
  const [row] = await db
    .update(post)
    .set(values)
    .where(force ? eq(post.id, id) : and(eq(post.id, id), sql`abs(extract(epoch from ${post.updatedAt}) - ${expectedUpdatedAt.getTime() / 1000}) < 0.001`))
    .returning({ updatedAt: post.updatedAt });
  if (!row) {
    const latest = await currentRow(id);
    return { ok: false, conflict: true, updatedAt: latest.updatedAt };
  }
  await setTags(id, f.tagIds);
  if (live) {
    const [cat] = f.categoryId ? await db.select({ slug: postCategory.slug }).from(postCategory).where(eq(postCategory.id, f.categoryId)).limit(1) : [];
    refreshBlog({ slugs: [current.slug, slug], categorySlugs: [current.categorySlug, cat?.slug ?? null], immediate: true });
    await db.insert(auditLog).values({ actorId, action: "post.update", entity: "post", entityId: id, diff: slug !== current.slug ? { slug: [current.slug, slug] } : {} });
  }
  return { ok: true, updatedAt: row.updatedAt, slug, slugError };
}

export type StatusOp = { op: "publish" } | { op: "schedule"; at: Date } | { op: "unpublish" } | { op: "archive" } | { op: "restore" };

export async function changeStatus(actorId: string, id: string, change: StatusOp) {
  const current = await currentRow(id);
  const full = await getEditorPost(id);
  if (!full) throw new ActionError("This post no longer exists.");
  if (change.op === "publish" || change.op === "schedule") {
    const issues = publishIssues({ title: full.title, slug: full.slug, excerpt: full.excerpt, body: full.body.markdown, coverKey: full.coverKey, coverAlt: full.coverAlt, seoDescription: full.seoDescription });
    if (issues.length) throw new ActionError(issues.map((i) => i.message).join(". "));
  }
  const now = new Date();
  const next: { status: PostStatus; publishedAt: Date | null } =
    change.op === "publish"
      ? { status: "published", publishedAt: current.status === "published" && current.publishedAt && current.publishedAt <= now ? current.publishedAt : now }
      : change.op === "schedule"
        ? { status: "scheduled", publishedAt: change.at }
        : change.op === "archive"
          ? { status: "archived", publishedAt: current.publishedAt }
          : { status: "draft", publishedAt: null };
  const [row] = await db.update(post).set({ ...next, updatedAt: now }).where(eq(post.id, id)).returning({ updatedAt: post.updatedAt, status: post.status, publishedAt: post.publishedAt });
  await db.insert(auditLog).values({ actorId, action: `post.${change.op}`, entity: "post", entityId: id, diff: { from: current.status, to: next.status, publishedAt: next.publishedAt?.toISOString() ?? null } });
  refreshBlog({ slugs: [current.slug], categorySlugs: [current.categorySlug], immediate: true });
  return row!;
}

export async function deletePost(actorId: string, id: string) {
  const current = await currentRow(id);
  if (current.status !== "draft") throw new ActionError("Only drafts can be deleted. Unpublish or archive the post instead.");
  await db.delete(post).where(eq(post.id, id));
  await db.insert(auditLog).values({ actorId, action: "post.delete", entity: "post", entityId: id, diff: { slug: current.slug } });
}

export async function createTag(name: string) {
  const clean = name.trim().replace(/\s+/g, " ").slice(0, 40);
  const slug = slugify(clean);
  if (!slug) throw new ActionError("Use letters or numbers in the tag name.");
  const [row] = await db
    .insert(postTag)
    .values({ slug, name: clean })
    .onConflictDoUpdate({ target: postTag.slug, set: { slug } })
    .returning({ id: postTag.id, slug: postTag.slug, name: postTag.name });
  return row!;
}

export async function publishDueScheduled() {
  const rows = await db
    .update(post)
    .set({ status: "published" })
    .where(and(eq(post.status, "scheduled"), lte(post.publishedAt, new Date())))
    .returning({ slug: post.slug, categoryId: post.categoryId });
  if (rows.length) {
    const ids = rows.map((r) => r.categoryId).filter((v): v is string => Boolean(v));
    const cats = ids.length ? await db.select({ slug: postCategory.slug }).from(postCategory).where(inArray(postCategory.id, ids)) : [];
    refreshBlog({ slugs: rows.map((r) => r.slug), categorySlugs: cats.map((c) => c.slug), immediate: false });
  }
  return rows.map((r) => r.slug);
}

export function refreshBlog({ slugs, categorySlugs, immediate }: { slugs: string[]; categorySlugs: Array<string | null>; immediate: boolean }) {
  if (immediate) updateTag(BLOG_TAG);
  else revalidateTag(BLOG_TAG, "max");
  revalidatePath("/blog");
  for (const s of new Set(slugs)) revalidatePath(`/blog/${s}`);
  for (const c of new Set(categorySlugs)) if (c) revalidatePath(`/blog/category/${c}`);
  revalidatePath("/sitemap/blog.xml");
  revalidatePath("/admin/blog");
}

export async function getPreviewPost(id: string) {
  const [row] = await db
    .select({
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
      body: post.body,
      seoTitle: post.seoTitle,
      seoDescription: post.seoDescription,
      canonicalUrl: post.canonicalUrl,
      faq: post.faq,
      categoryId: post.categoryId,
      status: post.status,
    })
    .from(post)
    .innerJoin(user, eq(user.id, post.authorId))
    .leftJoin(postCategory, eq(postCategory.id, post.categoryId))
    .where(eq(post.id, id))
    .limit(1);
  if (!row) return null;
  return { ...row, publishedAt: row.publishedAt?.toISOString() ?? null, updatedAt: row.updatedAt.toISOString() };
}
