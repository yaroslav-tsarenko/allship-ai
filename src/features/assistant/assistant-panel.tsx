"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { Icon } from "@/components/ui/icon";
import { IconButton } from "@/components/ui/icon-button";
import {
  arrowBackIcon,
  arrowDownwardIcon,
  checkIcon,
  closeIcon,
  contentCopyIcon,
  editSquareIcon,
  errorIcon,
  historyIcon,
  infoIcon,
  refreshIcon,
  sendIcon,
  stopIcon,
} from "@/components/ui/icons.generated";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/cn";
import { listAiThreadsAction } from "@/server/actions/ai";
import type { AssistantAction, StoredPart } from "@/server/ai/types";
import type { ViewerRole } from "@/server/viewer/viewer";
import { ActionCard } from "./action-card";
import { loadHrefFor, pageContextFor, suggestionsFor } from "./context";
import { Markdown } from "./markdown";
import { SparkIcon } from "./spark-icon";
import { ThreadHistory, type ThreadSummary } from "./thread-history";
import { MAX_CHARS, useAssistantChat, type ChatMessage } from "./use-assistant-chat";

export type PanelMode = "compact" | "overlay" | "docked";

const textOf = (parts: StoredPart[]) => parts.flatMap((p) => (p.type === "text" ? [p.text] : [])).join("");

function ToolLines({ parts, live }: { parts: StoredPart[]; live: boolean }) {
  const tools = parts
    .filter((p): p is Extract<StoredPart, { type: "tool" }> => p.type === "tool")
    .filter((p, i, all) => i === 0 || all[i - 1]!.summary !== p.summary);
  if (tools.length === 0) return null;
  return (
    <ul className="flex flex-col gap-1" aria-hidden="true">
      {tools.map((t, i) => {
        const active = live && i === tools.length - 1;
        return (
          <li key={i} className="text-body-md text-on-surface-variant flex items-center gap-2">
            {active ? (
              <Spinner size={14} className="text-primary" />
            ) : (
              <Icon icon={checkIcon} size={16} className="text-on-surface-variant/70" />
            )}
            <span className={cn(active && "animate-pulse motion-reduce:animate-none")}>
              {t.summary}
              {active ? "…" : ""}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function AssistantMessage({
  message,
  isLast,
  role,
  onRetry,
  onAction,
  onLink,
}: {
  message: ChatMessage;
  isLast: boolean;
  role: ViewerRole;
  onRetry: () => void;
  onAction: (kind: "navigate" | "tour") => void;
  onLink: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const text = textOf(message.parts);
  const actions = message.parts.flatMap((p) => (p.type === "action" ? [p.action] : [])) as AssistantAction[];
  const streaming = message.status === "streaming";
  const hasTools = message.parts.some((p) => p.type === "tool");
  const toolsLive = streaming && !text;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {}
  };

  return (
    <div className="flex gap-3">
      <SparkIcon
        size={22}
        className={cn(
          "text-primary mt-0.5 shrink-0",
          streaming && "animate-spin [animation-duration:2.4s] motion-reduce:animate-none",
        )}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <ToolLines parts={message.parts} live={toolsLive} />
        {streaming && !text && !hasTools && (
          <p className="text-body-md text-on-surface-variant animate-pulse motion-reduce:animate-none">
            Thinking…
          </p>
        )}
        {text && <Markdown text={text} idHref={(id) => loadHrefFor(role, id)} onLink={onLink} />}
        {actions.length > 0 && (
          <div className="flex flex-col gap-2">
            {actions.map((action, i) => (
              <ActionCard key={i} action={action} onDone={onAction} />
            ))}
          </div>
        )}
        {message.status === "error" && (
          <div className="text-body-md text-error flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="flex items-center gap-1.5">
              <Icon icon={errorIcon} size={18} />
              {message.error}
            </span>
            {isLast && (
              <button
                type="button"
                onClick={onRetry}
                className="state-layer text-label-lg text-primary inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full px-3 font-medium"
              >
                <Icon icon={refreshIcon} size={18} />
                Retry
              </button>
            )}
          </div>
        )}
        {message.status === "stopped" && (
          <p className="text-body-md text-on-surface-variant">You stopped this answer.</p>
        )}
        {message.status === "done" && text && (
          <div className="-mt-1 -ml-2 flex items-center gap-1">
            <button
              type="button"
              onClick={() => void copy()}
              aria-label={copied ? "Copied" : "Copy answer"}
              title={copied ? "Copied" : "Copy"}
              className="state-layer text-on-surface-variant inline-flex size-8 cursor-pointer items-center justify-center rounded-full"
            >
              <Icon icon={copied ? checkIcon : contentCopyIcon} size={18} />
            </button>
            {isLast && message.offline && (
              <span className="text-body-sm text-on-surface-variant flex items-center gap-1.5">
                <Icon icon={infoIcon} size={16} />
                Demo mode: AI isn&apos;t connected yet
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AssistantPanel({
  role,
  firstName,
  open,
  mode,
  onClose,
}: {
  role: ViewerRole;
  firstName: string;
  open: boolean;
  mode: PanelMode;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const pathRef = useRef(pathname);
  useEffect(() => {
    pathRef.current = pathname;
  }, [pathname]);
  const page = useCallback(() => pageContextFor(pathRef.current, document.title), []);
  const chat = useAssistantChat({ page });
  const [view, setView] = useState<"chat" | "history">("chat");
  const [draft, setDraft] = useState("");
  const [threads, setThreads] = useState<ThreadSummary[] | null>(null);
  const [configured, setConfigured] = useState(true);
  const [atBottom, setAtBottom] = useState(true);
  const rootRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const stick = useRef(true);

  useEffect(() => {
    let cancelled = false;
    void listAiThreadsAction()
      .catch(() => null)
      .then((res) => {
        if (cancelled || !res?.data) return;
        setConfigured(res.data.configured);
        setThreads(res.data.threads);
      });
    return () => {
      cancelled = true;
    };
  }, [chat.threadsVersion]);

  useEffect(() => {
    if (open && view === "chat")
      requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }));
  }, [open, view]);

  const last = chat.messages.at(-1);
  const announcement =
    last?.role === "assistant" && last.live && last.status !== "streaming"
      ? last.status === "error"
        ? (last.error ?? "Something went wrong")
        : last.status === "stopped"
          ? "Stopped"
          : textOf(last.parts) || "Done"
      : "";

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el && stick.current) el.scrollTop = el.scrollHeight;
  }, [chat.messages, view]);

  useLayoutEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [draft, open, view]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const bottom = el.scrollHeight - el.scrollTop - el.clientHeight < 48;
    stick.current = bottom;
    setAtBottom(bottom);
  };

  const scrollToBottom = () => {
    const el = scrollRef.current;
    if (!el) return;
    stick.current = true;
    setAtBottom(true);
    el.scrollTo({
      top: el.scrollHeight,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  };

  const submit = (text = draft) => {
    if (!text.trim() || chat.streaming || text.length > MAX_CHARS) return;
    stick.current = true;
    setAtBottom(true);
    setView("chat");
    void chat.send(text);
    setDraft("");
  };

  const onLink = () => {
    if (mode === "compact") onClose();
  };

  const onAction = (kind: "navigate" | "tour") => {
    if (mode === "compact" || (kind === "tour" && mode !== "docked")) onClose();
  };

  useEffect(() => {
    if (!open) return;
    const onEscape = (e: globalThis.KeyboardEvent) => {
      const active = document.activeElement;
      if (e.key !== "Escape" || e.defaultPrevented) return;
      if (active && active !== document.body && !rootRef.current?.contains(active)) return;
      onClose();
    };
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [open, onClose]);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Tab" || mode !== "compact" || !rootRef.current) return;
    const focusable = Array.from(
      rootRef.current.querySelectorAll<HTMLElement>(
        "a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),[tabindex]:not([tabindex='-1'])",
      ),
    ).filter((el) => el.offsetParent !== null);
    const first = focusable[0];
    const lastEl = focusable.at(-1);
    if (!first || !lastEl) return;
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      lastEl.focus();
    } else if (!e.shiftKey && document.activeElement === lastEl) {
      e.preventDefault();
      first.focus();
    }
  };

  const ctx = pageContextFor(pathname);
  const suggestions = suggestionsFor(role, ctx);
  const over = draft.length - MAX_CHARS;
  const nearLimit = draft.length > MAX_CHARS - 400;
  const empty = chat.messages.length === 0;

  return (
    <div ref={rootRef} onKeyDown={onKeyDown} className="flex h-full min-h-0 flex-col">
      <header className="medium:pl-3 flex h-16 shrink-0 items-center gap-1 pr-2 pl-2">
        {view === "history" ? (
          <>
            <IconButton icon={arrowBackIcon} label="Back to chat" onClick={() => setView("chat")} />
            <h2 className="text-title-lg text-on-surface flex-1 truncate pl-1">Conversations</h2>
          </>
        ) : (
          <>
            <span className="text-primary flex size-10 items-center justify-center">
              <SparkIcon size={24} />
            </span>
            <div className="min-w-0 flex-1">
              <h2 id="assistant-title" className="text-title-md text-on-surface truncate">
                AllShip AI
              </h2>
              {chat.title && <p className="text-body-sm text-on-surface-variant truncate">{chat.title}</p>}
            </div>
            <IconButton icon={historyIcon} label="Conversations" onClick={() => setView("history")} />
            <IconButton
              icon={editSquareIcon}
              label="New chat"
              disabled={empty && !chat.threadId}
              onClick={() => {
                chat.newChat();
                setDraft("");
                inputRef.current?.focus();
              }}
            />
          </>
        )}
        <IconButton icon={closeIcon} label="Close assistant" onClick={onClose} />
      </header>

      {view === "history" ? (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <ThreadHistory
            threads={threads}
            activeId={chat.threadId}
            onOpen={(id) => {
              setView("chat");
              stick.current = true;
              void chat.openThread(id);
            }}
            onRenamed={(id, title) => {
              setThreads((list) => list?.map((t) => (t.id === id ? { ...t, title } : t)) ?? null);
              chat.renamed(id, title);
            }}
            onDeleted={(id) => {
              setThreads((list) => list?.filter((t) => t.id !== id) ?? null);
              chat.forget(id);
            }}
          />
        </div>
      ) : (
        <div className="relative flex min-h-0 flex-1 flex-col">
          <div
            ref={scrollRef}
            onScroll={onScroll}
            className="medium:px-5 min-h-0 flex-1 overflow-y-auto overscroll-contain px-4"
          >
            {chat.loadingThread ? (
              <div className="text-primary flex h-full items-center justify-center">
                <Spinner />
              </div>
            ) : empty ? (
              <div className="flex min-h-full flex-col justify-end gap-6 pt-6 pb-4">
                <div>
                  <SparkIcon size={32} className="text-primary mb-4" />
                  <p className="text-headline-sm text-on-surface">Hi {firstName}</p>
                  <p className="text-body-lg text-on-surface-variant mt-1">
                    {role === "shipper"
                      ? "Ask about your loads and bids, or tell me what you need to ship."
                      : role === "driver"
                        ? "Ask about your trips and what to do at each stop."
                        : "Ask me to find loads, draft bids or check on your trips."}
                  </p>
                </div>
                <div className="flex flex-col items-start gap-2" role="group" aria-label="Suggestions">
                  {suggestions.map((s) => (
                    <button
                      key={s.label}
                      type="button"
                      onClick={() => submit(s.prompt)}
                      className="state-layer border-outline-variant text-label-lg text-on-surface inline-flex min-h-10 max-w-full cursor-pointer items-center rounded-sm border px-4 py-2 text-left font-medium"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
                {!configured && (
                  <p className="bg-surface-container-highest text-body-md text-on-surface-variant flex items-start gap-2 rounded-sm px-3 py-2.5">
                    <Icon icon={infoIcon} size={18} className="mt-px shrink-0" />
                    Demo mode: AI isn&apos;t connected yet. Answers use simple rules over your real account
                    data.
                  </p>
                )}
              </div>
            ) : (
              <ol className="flex flex-col gap-6 py-4" aria-label="Conversation">
                {chat.messages.map((m, i) =>
                  m.role === "user" ? (
                    <li key={m.id} className="animate-message-in flex justify-end pl-10">
                      <p className="bg-surface-container-highest text-body-lg text-on-surface rounded-[20px] rounded-br-xs px-4 py-2.5 break-words whitespace-pre-wrap">
                        {textOf(m.parts)}
                      </p>
                    </li>
                  ) : (
                    <li key={m.id}>
                      <AssistantMessage
                        message={m}
                        isLast={i === chat.messages.length - 1}
                        role={role}
                        onRetry={chat.retry}
                        onAction={onAction}
                        onLink={onLink}
                      />
                    </li>
                  ),
                )}
              </ol>
            )}
          </div>
          {!atBottom && !empty && (
            <button
              type="button"
              onClick={scrollToBottom}
              aria-label="Jump to latest"
              className="state-layer bg-surface-container-highest text-on-surface shadow-elevation-2 absolute bottom-3 left-1/2 inline-flex size-10 -translate-x-1/2 cursor-pointer items-center justify-center rounded-md"
            >
              <Icon icon={arrowDownwardIcon} size={20} />
            </button>
          )}
        </div>
      )}

      <div className="sr-only" aria-live="polite" role="status">
        {announcement}
      </div>

      {view === "chat" && (
        <div className="medium:px-4 shrink-0 px-3 pt-2 pb-[max(env(safe-area-inset-bottom),12px)]">
          <form
            data-tour="assistant-composer"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
            className="bg-surface-container-highest focus-within:outline-primary/70 flex items-end gap-1 rounded-[24px] py-1 pr-1 pl-4 focus-within:outline-1"
          >
            <label htmlFor="assistant-input" className="sr-only">
              Message AllShip AI
            </label>
            <textarea
              id="assistant-input"
              ref={inputRef}
              rows={1}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  submit();
                }
              }}
              placeholder="Ask AllShip AI"
              aria-describedby={nearLimit ? "assistant-count" : undefined}
              aria-invalid={over > 0 || undefined}
              className="text-body-lg text-on-surface placeholder:text-on-surface-variant max-h-[200px] min-h-10 flex-1 resize-none bg-transparent py-2 outline-none"
            />
            {chat.streaming ? (
              <button
                type="button"
                onClick={chat.stop}
                aria-label="Stop answer"
                title="Stop"
                className="state-layer bg-on-surface text-surface inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full"
              >
                <Icon icon={stopIcon} filled size={20} />
              </button>
            ) : (
              <button
                type="submit"
                aria-label="Send"
                title="Send"
                disabled={!draft.trim() || over > 0}
                className="state-layer bg-primary text-on-primary disabled:text-on-surface/38 inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors disabled:cursor-default disabled:bg-transparent"
              >
                <Icon icon={sendIcon} size={20} />
              </button>
            )}
          </form>
          <div className="flex items-center justify-between gap-3 px-2 pt-1.5">
            <p className="text-body-sm text-on-surface-variant">
              AllShip AI can make mistakes. You confirm every change.
            </p>
            {nearLimit && (
              <p
                id="assistant-count"
                className={cn(
                  "text-body-sm shrink-0 tabular-nums",
                  over > 0 ? "text-error" : "text-on-surface-variant",
                )}
              >
                {draft.length.toLocaleString("en-US")} / {MAX_CHARS.toLocaleString("en-US")}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
