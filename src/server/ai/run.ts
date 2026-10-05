import "server-only";
import { and, asc, desc, eq } from "drizzle-orm";
import OpenAI from "openai";
import type { ResponseInputItem } from "openai/resources/responses/responses";
import { env } from "@/env";
import type { Actor } from "@/server/actor";
import { db } from "@/server/db/client";
import { aiMessage, aiThread } from "@/server/db/schema";
import type { ViewerRole } from "@/server/viewer/viewer";
import { offlineReply } from "./offline";
import { systemPrompt } from "./prompt";
import { openAiToolSpecs, runTool, type ToolContext } from "./tools";
import type { AssistantAction, PageContext, StoredPart, StreamEvent } from "./types";
import { log } from "@/lib/log";

export const MAX_INPUT_CHARS = 4000;
const MAX_TOOL_ROUNDS = 5;
const HISTORY_MESSAGES = 16;
const MAX_TOOL_OUTPUT_CHARS = 12_000;

export function roleOf(actor: Actor): ViewerRole {
  if (actor.orgRole === "driver") return "driver";
  if (actor.orgRole === "owner" || actor.orgRole === "dispatcher") return actor.orgRole;
  return "shipper";
}

export function aiConfigured() {
  return Boolean(env.OPENAI_API_KEY);
}

let client: OpenAI | null = null;
function openai() {
  client ??= new OpenAI({ apiKey: env.OPENAI_API_KEY, maxRetries: 2, timeout: 60_000 });
  return client;
}

function titleFrom(text: string) {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > 60 ? `${clean.slice(0, 57).trimEnd()}…` : clean || "New conversation";
}

async function ensureThread(actor: Actor, threadId: string | null, firstText: string) {
  if (threadId) {
    const [row] = await db.select().from(aiThread).where(and(eq(aiThread.id, threadId), eq(aiThread.userId, actor.userId))).limit(1);
    if (row) return { thread: row, created: false };
  }
  const [row] = await db.insert(aiThread).values({ userId: actor.userId, title: titleFrom(firstText) }).returning();
  return { thread: row!, created: true };
}

async function history(threadId: string): Promise<ResponseInputItem[]> {
  const rows = await db.select().from(aiMessage).where(eq(aiMessage.threadId, threadId)).orderBy(desc(aiMessage.createdAt)).limit(HISTORY_MESSAGES);
  return rows.reverse().flatMap((row) => {
    const parts = row.parts as StoredPart[];
    const text = parts
      .map((p) => (p.type === "text" ? p.text : p.type === "action" ? `[Offered button: ${p.action.label}]` : ""))
      .filter(Boolean)
      .join("\n");
    if (!text || row.role === "system") return [];
    return [{ role: row.role === "user" ? "user" : "assistant", content: text } as ResponseInputItem];
  });
}

export async function* runAssistant(input: { actor: Actor; threadId: string | null; text: string; page: PageContext | null }): AsyncGenerator<StreamEvent> {
  const { actor, page } = input;
  const text = input.text.slice(0, MAX_INPUT_CHARS);
  const role = roleOf(actor);
  const { thread, created } = await ensureThread(actor, input.threadId, text);
  if (created) yield { type: "thread", threadId: thread.id, title: thread.title };

  const prior = await history(thread.id);
  await db.insert(aiMessage).values({ threadId: thread.id, role: "user", parts: [{ type: "text", text }] satisfies StoredPart[] });

  const actions: AssistantAction[] = [];
  const toolParts: StoredPart[] = [];
  const pending: StreamEvent[] = [];
  const ctx: ToolContext = {
    actor,
    role,
    emit: (action) => {
      actions.push(action);
      pending.push({ type: "action", action });
    },
  };
  let answer = "";

  try {
    if (!aiConfigured()) {
      for await (const event of offlineReply(ctx, text, page)) {
        if (event.type === "text") answer += event.delta;
        if (event.type === "tool") toolParts.push({ type: "tool", name: event.name, summary: event.label });
        yield event;
        while (pending.length) yield pending.shift()!;
      }
    } else {
      const tools = openAiToolSpecs(role);
      const reasoningModel = /^(o\d|gpt-5)/.test(env.OPENAI_MODEL);
      const conversation: ResponseInputItem[] = [...prior, { role: "user", content: text }];
      for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
        const stream = await openai().responses.create({
          model: env.OPENAI_MODEL,
          instructions: systemPrompt(actor, role, page),
          input: conversation,
          tools: round === MAX_TOOL_ROUNDS ? [] : tools,
          stream: true,
          store: false,
          ...(reasoningModel ? { include: ["reasoning.encrypted_content" as const] } : {}),
          max_output_tokens: reasoningModel ? 4000 : 1200,
          user: actor.userId,
        });
        let final: OpenAI.Responses.Response | null = null;
        for await (const event of stream) {
          if (event.type === "response.output_text.delta") {
            answer += event.delta;
            yield { type: "text", delta: event.delta };
          } else if (event.type === "response.completed" || event.type === "response.incomplete") {
            final = event.response;
          } else if (event.type === "response.failed") {
            throw new Error(event.response.error?.message ?? "The model request failed");
          } else if (event.type === "error") {
            throw new Error(event.message);
          }
        }
        const calls = (final?.output ?? []).filter((o): o is OpenAI.Responses.ResponseFunctionToolCall => o.type === "function_call");
        if (calls.length === 0) break;
        conversation.push(...(final?.output ?? []).filter((o) => o.type === "function_call" || o.type === "message" || o.type === "reasoning").map((o) => o as ResponseInputItem));
        for (const call of calls) {
          let args: unknown = {};
          try {
            args = JSON.parse(call.arguments || "{}");
          } catch {
            args = {};
          }
          const { label, result } = await runTool(ctx, call.name, args);
          toolParts.push({ type: "tool", name: call.name, summary: label });
          yield { type: "tool", name: call.name, label };
          while (pending.length) yield pending.shift()!;
          conversation.push({ type: "function_call_output", call_id: call.call_id, output: JSON.stringify(result).slice(0, MAX_TOOL_OUTPUT_CHARS) });
        }
      }
    }
  } catch (error) {
    log.error("assistant run failed", { scope: "ai", err: error });
    yield { type: "error", message: "The assistant ran into a problem. Try again in a moment." };
  }

  const parts: StoredPart[] = [...toolParts, ...(answer ? [{ type: "text" as const, text: answer }] : []), ...actions.map((action) => ({ type: "action" as const, action }))];
  const [saved] = await db.insert(aiMessage).values({ threadId: thread.id, role: "assistant", parts }).returning({ id: aiMessage.id });
  await db.update(aiThread).set({ updatedAt: new Date() }).where(eq(aiThread.id, thread.id));
  yield { type: "done", messageId: saved!.id, offline: !aiConfigured() };
}

export async function listThreads(actor: Actor) {
  return db.select({ id: aiThread.id, title: aiThread.title, updatedAt: aiThread.updatedAt }).from(aiThread).where(eq(aiThread.userId, actor.userId)).orderBy(desc(aiThread.updatedAt)).limit(50);
}

export async function getThread(actor: Actor, threadId: string) {
  const [thread] = await db.select().from(aiThread).where(and(eq(aiThread.id, threadId), eq(aiThread.userId, actor.userId))).limit(1);
  if (!thread) return null;
  const messages = await db.select({ id: aiMessage.id, role: aiMessage.role, parts: aiMessage.parts, createdAt: aiMessage.createdAt }).from(aiMessage).where(eq(aiMessage.threadId, thread.id)).orderBy(asc(aiMessage.createdAt));
  return { thread, messages: messages.map((m) => ({ ...m, parts: m.parts as StoredPart[] })) };
}

export async function deleteThread(actor: Actor, threadId: string) {
  await db.delete(aiThread).where(and(eq(aiThread.id, threadId), eq(aiThread.userId, actor.userId)));
}

export async function renameThread(actor: Actor, threadId: string, title: string) {
  await db.update(aiThread).set({ title: titleFrom(title) }).where(and(eq(aiThread.id, threadId), eq(aiThread.userId, actor.userId)));
}
