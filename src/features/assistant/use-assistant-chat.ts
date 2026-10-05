"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getAiThreadAction } from "@/server/actions/ai";
import type { PageContext, StoredPart, StreamEvent } from "@/server/ai/types";

export const MAX_CHARS = 4000;
const threadKey = "allship:ai-thread";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  parts: StoredPart[];
  status: "streaming" | "done" | "error" | "stopped";
  error?: string;
  offline?: boolean;
  live?: boolean;
};

let seq = 0;
const localId = () => `local-${Date.now().toString(36)}-${(seq++).toString(36)}`;

function readThreadId() {
  try {
    return window.sessionStorage.getItem(threadKey);
  } catch {
    return null;
  }
}

function writeThreadId(id: string | null) {
  try {
    if (id) window.sessionStorage.setItem(threadKey, id);
    else window.sessionStorage.removeItem(threadKey);
  } catch {}
}

function applyEvent(message: ChatMessage, event: StreamEvent): ChatMessage {
  switch (event.type) {
    case "text": {
      const parts = [...message.parts];
      const last = parts.at(-1);
      if (last?.type === "text") parts[parts.length - 1] = { type: "text", text: last.text + event.delta };
      else parts.push({ type: "text", text: event.delta });
      return { ...message, parts };
    }
    case "tool":
      return {
        ...message,
        parts: [...message.parts, { type: "tool", name: event.name, summary: event.label }],
      };
    case "action":
      return { ...message, parts: [...message.parts, { type: "action", action: event.action }] };
    case "done":
      return { ...message, id: event.messageId, status: "done", offline: event.offline };
    case "error":
      return { ...message, status: "error", error: event.message };
    default:
      return message;
  }
}

export function useAssistantChat({ page }: { page: () => PageContext }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [initialId] = useState(readThreadId);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [title, setTitle] = useState<string | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [loadingThread, setLoadingThread] = useState(Boolean(initialId));
  const [threadsVersion, setThreadsVersion] = useState(0);
  const controller = useRef<AbortController | null>(null);
  const threadRef = useRef<string | null>(null);

  const setThread = useCallback((id: string | null, nextTitle: string | null) => {
    threadRef.current = id;
    setThreadId(id);
    setTitle(nextTitle);
    writeThreadId(id);
  }, []);

  const applyThread = useCallback(
    (data: Awaited<ReturnType<typeof getAiThreadAction>>["data"]) => {
      setLoadingThread(false);
      if (!data) {
        setThread(null, null);
        setMessages([]);
        return false;
      }
      setThread(data.thread.id, data.thread.title);
      setMessages(
        data.messages
          .filter((m) => m.role === "user" || m.role === "assistant")
          .map((m) => ({
            id: m.id,
            role: m.role as ChatMessage["role"],
            parts: m.parts,
            status: "done" as const,
          })),
      );
      return true;
    },
    [setThread],
  );

  const fetchThread = useCallback(
    (id: string) =>
      getAiThreadAction({ threadId: id })
        .catch(() => null)
        .then((result) => applyThread(result?.data ?? null)),
    [applyThread],
  );

  const openThread = useCallback(
    (id: string) => {
      controller.current?.abort();
      setLoadingThread(true);
      return fetchThread(id);
    },
    [fetchThread],
  );

  useEffect(() => {
    if (initialId) void fetchThread(initialId);
    return () => controller.current?.abort();
  }, [fetchThread, initialId]);

  const updateLast = useCallback((fn: (m: ChatMessage) => ChatMessage) => {
    setMessages((list) => {
      const last = list.at(-1);
      if (!last || last.role !== "assistant") return list;
      return [...list.slice(0, -1), fn(last)];
    });
  }, []);

  const send = useCallback(
    async (raw: string) => {
      const text = raw.trim().slice(0, MAX_CHARS);
      if (!text || controller.current) return;
      const abort = new AbortController();
      controller.current = abort;
      setStreaming(true);
      setMessages((list) => [
        ...list,
        { id: localId(), role: "user", parts: [{ type: "text", text }], status: "done" },
        { id: localId(), role: "assistant", parts: [], status: "streaming", live: true },
      ]);
      try {
        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ threadId: threadRef.current, text, page: page() }),
          signal: abort.signal,
        });
        if (!res.ok || !res.body) {
          const body = (await res.json().catch(() => null)) as { error?: string } | null;
          updateLast((m) => ({
            ...m,
            status: "error",
            error: body?.error ?? "The assistant isn't available right now. Try again in a moment.",
          }));
          return;
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let finished = false;
        const handle = (line: string) => {
          if (!line.trim()) return;
          let event: StreamEvent;
          try {
            event = JSON.parse(line) as StreamEvent;
          } catch {
            return;
          }
          if (event.type === "thread") {
            setThread(event.threadId, event.title);
            setThreadsVersion((v) => v + 1);
            return;
          }
          if (event.type === "done" || event.type === "error") finished = true;
          updateLast((m) =>
            m.status === "error" && event.type === "done"
              ? { ...m, id: event.messageId, offline: event.offline }
              : applyEvent(m, event),
          );
        };
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          lines.forEach(handle);
        }
        handle(buffer + decoder.decode());
        if (!finished)
          updateLast((m) => ({
            ...m,
            status: "error",
            error: "The connection dropped before the answer finished.",
          }));
      } catch {
        if (abort.signal.aborted) updateLast((m) => ({ ...m, status: "stopped" }));
        else
          updateLast((m) => ({
            ...m,
            status: "error",
            error: navigator.onLine
              ? "Couldn't reach the assistant. Try again."
              : "You're offline. Check your connection and try again.",
          }));
      } finally {
        controller.current = null;
        setStreaming(false);
      }
    },
    [page, setThread, updateLast],
  );

  const stop = useCallback(() => controller.current?.abort(), []);

  const retry = useCallback(() => {
    if (controller.current) return;
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    const text = lastUser?.parts.find((p) => p.type === "text")?.text;
    if (!lastUser || !text) return;
    const at = messages.lastIndexOf(lastUser);
    setMessages((list) => list.slice(0, at));
    void send(text);
  }, [messages, send]);

  const newChat = useCallback(() => {
    controller.current?.abort();
    setThread(null, null);
    setMessages([]);
  }, [setThread]);

  const forget = useCallback(
    (id: string) => {
      if (threadRef.current === id) newChat();
      setThreadsVersion((v) => v + 1);
    },
    [newChat],
  );

  const renamed = useCallback((id: string, next: string) => {
    if (threadRef.current === id) setTitle(next);
  }, []);

  return {
    messages,
    threadId,
    title,
    streaming,
    loadingThread,
    threadsVersion,
    send,
    stop,
    retry,
    newChat,
    openThread,
    forget,
    renamed,
  };
}
