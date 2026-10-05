"use server";

import { z } from "zod";
import { getActor } from "@/server/actor";
import { aiConfigured, deleteThread, getThread, listThreads, renameThread } from "@/server/ai/run";
import { authedAction } from "./safe-action";

const withActor = authedAction.use(async ({ next, ctx }) => next({ ctx: { ...ctx, actor: await getActor(ctx.user.id) } }));

export const listAiThreadsAction = withActor.action(async ({ ctx }) => {
  const threads = await listThreads(ctx.actor);
  return { configured: aiConfigured(), threads: threads.map((t) => ({ ...t, updatedAt: t.updatedAt.toISOString() })) };
});

export const getAiThreadAction = withActor.inputSchema(z.object({ threadId: z.uuid() })).action(async ({ parsedInput, ctx }) => {
  const data = await getThread(ctx.actor, parsedInput.threadId);
  if (!data) return null;
  return { thread: { id: data.thread.id, title: data.thread.title }, messages: data.messages.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() })) };
});

export const deleteAiThreadAction = withActor.inputSchema(z.object({ threadId: z.uuid() })).action(async ({ parsedInput, ctx }) => {
  await deleteThread(ctx.actor, parsedInput.threadId);
  return { ok: true };
});

export const renameAiThreadAction = withActor.inputSchema(z.object({ threadId: z.uuid(), title: z.string().trim().min(1).max(80) })).action(async ({ parsedInput, ctx }) => {
  await renameThread(ctx.actor, parsedInput.threadId, parsedInput.title);
  return { ok: true };
});
