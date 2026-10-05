"use server";

import { z } from "zod";
import { EXCERPT_MAX, IMAGE_TYPES, MAX_BODY_CHARS, MAX_IMAGE_BYTES, isValidSlug, slugify } from "@/features/admin/blog/rules";
import { getActor } from "@/server/actor";
import { buildLinkCandidates, runWritingTask, WRITING_LIMITS, WRITING_TASKS } from "@/server/ai/writing";
import { changeStatus, createPost, createTag, deletePost, getEditorOptions, getEditorPost, savePost, slugTaken } from "@/server/blog/admin";
import { renderMarkdown } from "@/server/blog/markdown";
import { consumeRateLimit } from "@/server/rate-limit";
import { createBlogUploadTarget } from "@/server/storage/blog-media";
import { ActionError, authedAction } from "./safe-action";
import { log } from "@/lib/log";

const adminAction = authedAction.use(async ({ next, ctx }) => {
  const actor = await getActor(ctx.user.id);
  if (!actor.isAdmin) throw new ActionError(ctx.user.role === "admin" ? "Turn on two-step verification to edit the blog." : "Admins only.");
  return next({ ctx: { ...ctx, actor } });
});

const optionalText = (max: number) => z.string().trim().max(max).nullable();

const mediaUrl = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v.startsWith("/") || /^https:\/\//.test(v), "Use an uploaded image")
  .nullable();

const fieldsSchema = z.object({
  title: z.string().max(200),
  slug: z.string().trim().max(80),
  excerpt: z.string().max(EXCERPT_MAX),
  body: z.string().max(MAX_BODY_CHARS),
  coverKey: mediaUrl,
  coverAlt: optionalText(300),
  categoryId: z.uuid().nullable(),
  tagIds: z.array(z.uuid()).max(20),
  seoTitle: optionalText(120),
  seoDescription: optionalText(320),
  canonicalUrl: z
    .string()
    .trim()
    .max(500)
    .refine((v) => v === "" || (v.startsWith("/") && !v.startsWith("//") && !v.includes("\\")) || /^https:\/\/[^\s/]+(\/[^\s]*)?$/.test(v), "Use a path like /blog/slug or a full https:// URL")
    .nullable(),
  faq: z.array(z.object({ question: z.string().max(300), answer: z.string().max(1200) })).max(20),
});

export const createPostAction = adminAction.inputSchema(z.object({ fields: fieldsSchema })).action(async ({ parsedInput, ctx }) => {
  if (!(await consumeRateLimit(`blog-create:${ctx.actor.userId}`, 30, 3600))) throw new ActionError("You're creating posts too quickly. Wait a few minutes.");
  const row = await createPost(ctx.actor.userId, parsedInput.fields);
  return { id: row.id, slug: row.slug, updatedAt: row.updatedAt.toISOString() };
});

export const savePostAction = adminAction
  .inputSchema(z.object({ id: z.uuid(), fields: fieldsSchema, expectedUpdatedAt: z.iso.datetime(), force: z.boolean().optional(), publishLive: z.boolean().optional() }))
  .action(async ({ parsedInput, ctx }) => {
    if (!(await consumeRateLimit(`blog-save:${ctx.actor.userId}`, 600, 3600))) throw new ActionError("Too many saves in a short time. Wait a minute.");
    const result = await savePost(ctx.actor.userId, parsedInput.id, parsedInput.fields, {
      expectedUpdatedAt: new Date(parsedInput.expectedUpdatedAt),
      force: parsedInput.force,
      publishLive: parsedInput.publishLive,
    });
    if (!result.ok) return { conflict: true as const, updatedAt: result.updatedAt.toISOString() };
    return { conflict: false as const, updatedAt: result.updatedAt.toISOString(), slug: result.slug, slugError: result.slugError ?? null };
  });

export const checkSlugAction = adminAction.inputSchema(z.object({ slug: z.string().trim().max(120), postId: z.uuid().nullable() })).action(async ({ parsedInput }) => {
  const slug = slugify(parsedInput.slug);
  if (!isValidSlug(slug)) return { slug, available: false, message: "Use lowercase letters, numbers and dashes" };
  const taken = await slugTaken(slug, parsedInput.postId ?? undefined);
  return { slug, available: !taken, message: taken ? "Another post already uses this URL" : null };
});

export const setPostStatusAction = adminAction
  .inputSchema(
    z.discriminatedUnion("op", [
      z.object({ id: z.uuid(), op: z.literal("publish") }),
      z.object({ id: z.uuid(), op: z.literal("schedule"), at: z.iso.datetime() }),
      z.object({ id: z.uuid(), op: z.literal("unpublish") }),
      z.object({ id: z.uuid(), op: z.literal("archive") }),
      z.object({ id: z.uuid(), op: z.literal("restore") }),
    ]),
  )
  .action(async ({ parsedInput, ctx }) => {
    const change = parsedInput.op === "schedule" ? { op: "schedule" as const, at: new Date(parsedInput.at) } : { op: parsedInput.op };
    const row = await changeStatus(ctx.actor.userId, parsedInput.id, change);
    return { status: row.status, publishedAt: row.publishedAt?.toISOString() ?? null, updatedAt: row.updatedAt.toISOString() };
  });

export const deletePostAction = adminAction.inputSchema(z.object({ id: z.uuid() })).action(async ({ parsedInput, ctx }) => {
  await deletePost(ctx.actor.userId, parsedInput.id);
  return { ok: true };
});

export const createTagAction = adminAction.inputSchema(z.object({ name: z.string().trim().min(1, "Enter a tag").max(40) })).action(async ({ parsedInput }) => createTag(parsedInput.name));

export const previewMarkdownAction = adminAction.inputSchema(z.object({ markdown: z.string().max(MAX_BODY_CHARS) })).action(async ({ parsedInput }) => {
  const { html, readingMinutes } = renderMarkdown(parsedInput.markdown);
  return { html, readingMinutes };
});

export const createBlogUploadAction = adminAction
  .inputSchema(z.object({ contentType: z.enum(IMAGE_TYPES), size: z.number().int().positive().max(MAX_IMAGE_BYTES, "Images must be 8 MB or smaller") }))
  .action(async ({ parsedInput, ctx }) => {
    if (!(await consumeRateLimit(`blog-upload:${ctx.actor.userId}`, 120, 3600))) throw new ActionError("Too many uploads. Wait a few minutes.");
    return createBlogUploadTarget(parsedInput.contentType);
  });

export const aiWritingAction = adminAction
  .inputSchema(
    z.object({
      postId: z.uuid().nullable(),
      task: z.enum(WRITING_TASKS),
      topic: z.string().max(WRITING_LIMITS.topic).optional(),
      heading: z.string().max(WRITING_LIMITS.heading).optional(),
      selection: z.string().max(WRITING_LIMITS.selection, "Select less text, up to 6,000 characters").optional(),
      title: z.string().max(WRITING_LIMITS.title),
      excerpt: z.string().max(WRITING_LIMITS.excerpt),
      body: z.string().max(MAX_BODY_CHARS),
      categoryName: z.string().max(80).nullable().optional(),
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    const [burst, daily] = await Promise.all([consumeRateLimit(`blog-ai:${ctx.actor.userId}`, 30, 300), consumeRateLimit(`blog-ai-day:${ctx.actor.userId}`, 400, 86_400)]);
    if (!burst || !daily) throw new ActionError("You've used the writing tools a lot in a short time. Try again in a few minutes.");
    if ((parsedInput.task === "improve" || parsedInput.task === "shorten" || parsedInput.task === "friendlier") && !parsedInput.selection?.trim()) throw new ActionError("Select some text first.");
    if (parsedInput.task === "draft_section" && !parsedInput.heading?.trim()) throw new ActionError("Put the cursor under a heading first.");
    const [options, current] = await Promise.all([getEditorOptions(), parsedInput.postId ? getEditorPost(parsedInput.postId) : null]);
    const candidates = buildLinkCandidates({ posts: options.posts, categories: options.categories, excludeSlug: current?.slug });
    try {
      return await runWritingTask({ ...parsedInput, body: parsedInput.body.slice(0, WRITING_LIMITS.body), candidates });
    } catch (error) {
      log.error("blog writing assistant failed", { scope: "blog-ai", err: error });
      throw new ActionError("The writing assistant couldn't finish. Try again.");
    }
  });
