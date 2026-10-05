"use client";

import Image from "next/image";
import { Fragment, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { chatBubbleIcon, errorIcon, pictureAsPdfIcon, visibilityIcon } from "@/components/ui/icons.generated";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/cn";
import { useRealtime } from "@/lib/realtime/use-realtime";
import { markConversationReadAction, newMessagesAction, olderMessagesAction, sendMessageAction } from "@/server/actions/chat";
import type { ChatMessage, ChatSide, ConversationDetail } from "@/server/chat/service";
import { topics } from "@/server/realtime/topics";
import { requestCountsRefresh } from "@/features/shell/live-counts";
import { Composer, type OutgoingAttachment } from "./composer";
import { CHAT_READ_EVENT, CHAT_UPDATED_EVENT, avatarTone, clockTime, dividerLabel, fileSize, initials } from "./format";
import { Lightbox, type LightboxImage } from "./lightbox";

type Pending = { tempId: string; body: string; attachments: OutgoingAttachment[]; status: "sending" | "failed"; error?: string; createdAt: string };

type Row = {
  id: string;
  senderId: string;
  senderName: string;
  senderSide: ChatSide;
  body: string;
  createdAt: string;
  attachments: { key: string; name: string; contentType: string; size: number; url: string | null }[];
  pending?: Pending;
};

const GROUP_GAP_MS = 5 * 60 * 1000;
const sideLabel: Record<ChatSide, string> = { shipper: "Shipper", carrier: "Carrier", driver: "Driver" };

function merge(current: ChatMessage[], incoming: ChatMessage[]) {
  if (!incoming.length) return current;
  const map = new Map(current.map((m) => [m.id, m]));
  for (const m of incoming) map.set(m.id, m);
  return [...map.values()].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

const urlPattern = /(https?:\/\/[^\s<]+[^\s<.,;:!?)\]'"])/g;

function Linkified({ text }: { text: string }) {
  const parts = text.split(urlPattern);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <a key={i} href={part} target="_blank" rel="noreferrer noopener" className="underline underline-offset-2 break-all">
            {part}
          </a>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}

export function Thread({ conversation, initialMessages, initialHasMore, viewerId, header }: { conversation: ConversationDetail; initialMessages: ChatMessage[]; initialHasMore: boolean; viewerId: string; header: ReactNode }) {
  const [messages, setMessages] = useState(initialMessages);
  const [pending, setPending] = useState<Pending[]>([]);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const lastId = useRef<string | null>(initialMessages.at(-1)?.id ?? null);
  const stickToBottom = useRef(true);
  const prependAnchor = useRef<number | null>(null);
  const fetching = useRef(false);
  const multiParty = conversation.participants.length > 2;

  useEffect(() => {
    lastId.current = messages.at(-1)?.id ?? lastId.current;
  }, [messages]);

  const markRead = useCallback(() => {
    if (conversation.readOnly || document.visibilityState !== "visible") return;
    void markConversationReadAction({ conversationId: conversation.id })
      .then(() => requestCountsRefresh())
      .catch(() => {});
    window.dispatchEvent(new CustomEvent(CHAT_READ_EVENT, { detail: conversation.id }));
  }, [conversation.id, conversation.readOnly]);

  useEffect(() => {
    markRead();
    const onVisible = () => {
      if (document.visibilityState === "visible") markRead();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [markRead]);

  const fetchNew = useCallback(async () => {
    if (fetching.current) return;
    fetching.current = true;
    try {
      const result = await newMessagesAction({ conversationId: conversation.id, after: lastId.current }).catch(() => null);
      const fresh = result?.data ?? [];
      if (!fresh.length) return;
      const el = scroller.current;
      stickToBottom.current = !el || el.scrollHeight - el.scrollTop - el.clientHeight < 160;
      setMessages((list) => merge(list, fresh));
      if (fresh.some((m) => m.senderId !== viewerId)) {
        markRead();
        window.dispatchEvent(new Event(CHAT_UPDATED_EVENT));
      }
    } finally {
      fetching.current = false;
    }
  }, [conversation.id, viewerId, markRead]);

  useRealtime(
    topics.conversation(conversation.id),
    (event) => {
      if (event.event === "message" && event.payload.senderId !== viewerId) void fetchNew();
    },
    { onFallback: () => void fetchNew(), fallbackIntervalMs: 5_000 },
  );

  const loadOlder = async () => {
    const first = messages[0];
    if (!first || loadingOlder) return;
    setLoadingOlder(true);
    const result = await olderMessagesAction({ conversationId: conversation.id, before: first.id }).catch(() => null);
    setLoadingOlder(false);
    if (!result?.data) return;
    prependAnchor.current = scroller.current ? scroller.current.scrollHeight - scroller.current.scrollTop : null;
    stickToBottom.current = false;
    setHasMore(result.data.hasMore);
    setMessages((list) => merge(list, result.data!.messages));
  };

  const deliver = async (item: Pending) => {
    const result = await sendMessageAction({
      conversationId: conversation.id,
      body: item.body,
      attachments: item.attachments.map(({ key, name, contentType, size }) => ({ key, name, contentType, size })),
    }).catch(() => null);
    if (result?.data) {
      const sent = result.data;
      setMessages((list) => merge(list, [sent]));
      setPending((list) => list.filter((p) => p.tempId !== item.tempId));
      for (const a of item.attachments) if (a.previewUrl) setTimeout(() => URL.revokeObjectURL(a.previewUrl!), 30_000);
      window.dispatchEvent(new Event(CHAT_UPDATED_EVENT));
      return;
    }
    const error = result?.serverError ?? (result?.validationErrors ? "This message couldn't be sent." : "Not sent. Check your connection.");
    setPending((list) => list.map((p) => (p.tempId === item.tempId ? { ...p, status: "failed", error } : p)));
  };

  const send = (body: string, attachments: OutgoingAttachment[]) => {
    const item: Pending = { tempId: `tmp-${crypto.randomUUID()}`, body: body.trim(), attachments, status: "sending", createdAt: new Date().toISOString() };
    stickToBottom.current = true;
    setPending((list) => [...list, item]);
    void deliver(item);
  };

  const retry = (item: Pending) => {
    const next = { ...item, status: "sending" as const, error: undefined };
    setPending((list) => list.map((p) => (p.tempId === item.tempId ? next : p)));
    void deliver(next);
  };

  const discard = (item: Pending) => setPending((list) => list.filter((p) => p.tempId !== item.tempId));

  const rows: Row[] = useMemo(
    () => [
      ...messages.map((m) => ({ ...m, attachments: m.attachments.map((a) => ({ key: a.storageKey, name: a.name, contentType: a.contentType, size: a.size, url: a.url })) })),
      ...pending.map((p) => ({
        id: p.tempId,
        senderId: viewerId,
        senderName: "You",
        senderSide: "shipper" as ChatSide,
        body: p.body,
        createdAt: p.createdAt,
        attachments: p.attachments.map((a) => ({ key: a.key, name: a.name, contentType: a.contentType, size: a.size, url: a.previewUrl })),
        pending: p,
      })),
    ],
    [messages, pending, viewerId],
  );

  const images: LightboxImage[] = useMemo(
    () =>
      rows.flatMap((r) =>
        r.attachments
          .filter((a) => a.contentType.startsWith("image/") && a.url)
          .map((a) => ({ url: a.url!, name: a.name, caption: `${r.senderId === viewerId ? "You" : r.senderName} · ${dividerLabel(r.createdAt)}, ${clockTime(r.createdAt)}`, key: `${r.id}:${a.key}` })),
      ),
    [rows, viewerId],
  );
  const imageIndex = useMemo(() => new Map(images.map((img, i) => [(img as LightboxImage & { key: string }).key, i])), [images]);

  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el) return;
    if (prependAnchor.current !== null) {
      el.scrollTop = el.scrollHeight - prependAnchor.current;
      prependAnchor.current = null;
      return;
    }
    if (stickToBottom.current) el.scrollTop = el.scrollHeight;
  }, [rows.length]);

  const onScroll = () => {
    const el = scroller.current;
    if (el) stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 160;
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {header}
      <div ref={scroller} onScroll={onScroll} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pt-2 pb-4 medium:px-6" aria-live="polite" aria-relevant="additions">
        {hasMore ? (
          <div className="flex justify-center py-3">
            <Button variant="text" size="sm" loading={loadingOlder} onClick={loadOlder}>
              Load earlier messages
            </Button>
          </div>
        ) : (
          <div className="mx-auto flex max-w-[420px] flex-col items-center gap-2 px-4 pt-8 pb-6 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
              <Icon icon={chatBubbleIcon} />
            </span>
            <p className="text-title-sm text-on-surface">Messages about {conversation.loadPublicId}</p>
            <p className="text-body-md text-on-surface-variant">
              {conversation.participants.map((p, i) => (
                <Fragment key={p.id}>
                  {i > 0 && (i === conversation.participants.length - 1 ? " and " : ", ")}
                  <span className="text-on-surface">{p.id === viewerId ? "you" : p.name}</span> ({sideLabel[p.side].toLowerCase()})
                </Fragment>
              ))}{" "}
              can see this conversation.
            </p>
            {rows.length === 0 && <p className="text-body-md text-on-surface-variant">Confirm pickup times, access details or anything else about the move.</p>}
          </div>
        )}
        <ol className="flex flex-col">
          {rows.map((row, i) => {
            const prev = rows[i - 1];
            const next = rows[i + 1];
            const mine = row.senderId === viewerId;
            const newDay = !prev || new Date(prev.createdAt).toDateString() !== new Date(row.createdAt).toDateString();
            const joinsPrev = !newDay && prev && prev.senderId === row.senderId && new Date(row.createdAt).getTime() - new Date(prev.createdAt).getTime() < GROUP_GAP_MS;
            const nextNewDay = next && new Date(next.createdAt).toDateString() !== new Date(row.createdAt).toDateString();
            const joinsNext = next && !nextNewDay && next.senderId === row.senderId && new Date(next.createdAt).getTime() - new Date(row.createdAt).getTime() < GROUP_GAP_MS;
            const pics = row.attachments.filter((a) => a.contentType.startsWith("image/") && a.url);
            const files = row.attachments.filter((a) => !pics.includes(a));
            const p = row.pending;
            return (
              <li key={row.id} className={cn("flex flex-col", joinsPrev ? "mt-0.5" : "mt-3", p && "animate-message-in")}>
                {newDay && (
                  <div className="my-3 flex items-center justify-center" role="separator" aria-label={dividerLabel(row.createdAt)}>
                    <span className="text-label-md font-medium text-on-surface-variant">{dividerLabel(row.createdAt)}</span>
                  </div>
                )}
                {!mine && !joinsPrev && multiParty && (
                  <span className="mb-1 ml-12 text-label-md text-on-surface-variant">
                    {row.senderName} · {sideLabel[row.senderSide]}
                  </span>
                )}
                <div className={cn("flex items-end gap-2", mine ? "justify-end" : "justify-start")}>
                  {!mine && (
                    <span aria-hidden="true" className={cn("flex size-8 shrink-0 items-center justify-center rounded-full text-label-md font-medium", joinsNext ? "invisible" : avatarTone(row.senderName))}>
                      {initials(row.senderName)}
                    </span>
                  )}
                  <div className={cn("flex max-w-[min(80%,560px)] min-w-0 flex-col gap-1", mine ? "items-end" : "items-start")}>
                    {!mine && !multiParty && <span className="sr-only">{row.senderName}:</span>}
                    {pics.length > 0 && (
                      <div className={cn("grid gap-1", pics.length > 1 ? "grid-cols-2" : "grid-cols-1")}>
                        {pics.map((a) => {
                          const idx = imageIndex.get(`${row.id}:${a.key}`);
                          return (
                            <button
                              key={a.key}
                              type="button"
                              onClick={() => idx !== undefined && setLightbox(idx)}
                              aria-label={`Open photo ${a.name}`}
                              className={cn("relative cursor-zoom-in overflow-hidden rounded-[18px] bg-surface-container-highest outline-offset-2", pics.length > 1 ? "size-32 medium:size-40" : "h-56 w-60 medium:h-64 medium:w-72")}
                            >
                              <Image src={a.url!} alt={a.name} fill unoptimized sizes="288px" className={cn("object-cover", p?.status === "sending" && "opacity-70")} />
                            </button>
                          );
                        })}
                      </div>
                    )}
                    {files.map((a) =>
                      a.url ? (
                        <a
                          key={a.key}
                          href={a.url}
                          target="_blank"
                          rel="noreferrer"
                          className="state-layer flex max-w-full items-center gap-3 rounded-md border border-outline-variant bg-surface py-2 pr-4 pl-3 text-on-surface"
                        >
                          <Icon icon={pictureAsPdfIcon} className="shrink-0 text-error" />
                          <span className="min-w-0">
                            <span className="block truncate text-label-lg">{a.name}</span>
                            <span className="block text-label-md text-on-surface-variant">PDF · {fileSize(a.size)}</span>
                          </span>
                        </a>
                      ) : (
                        <span key={a.key} className="flex items-center gap-3 rounded-md border border-outline-variant py-2 pr-4 pl-3 text-on-surface-variant">
                          <Icon icon={pictureAsPdfIcon} className="shrink-0" />
                          <span className="truncate text-label-lg">{a.name}</span>
                        </span>
                      ),
                    )}
                    {row.body && (
                      <div
                        className={cn(
                          "rounded-[20px] px-4 py-2.5 text-body-lg break-words whitespace-pre-wrap",
                          mine ? "bg-primary-container text-on-primary-container" : "bg-surface-container-highest text-on-surface",
                          mine && joinsPrev && "rounded-tr-[6px]",
                          mine && joinsNext && "rounded-br-[6px]",
                          !mine && joinsPrev && "rounded-tl-[6px]",
                          !mine && joinsNext && "rounded-bl-[6px]",
                          p?.status === "failed" && "bg-error-container text-on-error-container",
                        )}
                      >
                        <Linkified text={row.body} />
                      </div>
                    )}
                  </div>
                </div>
                {p?.status === "failed" ? (
                  <div className="mt-1 flex items-center justify-end gap-1 text-label-md text-error" role="alert">
                    <Icon icon={errorIcon} size={16} />
                    <span>{p.error}</span>
                    <button type="button" onClick={() => retry(p)} className="state-layer ml-1 cursor-pointer rounded-full px-2 py-1 font-medium text-primary">
                      Retry
                    </button>
                    <button type="button" onClick={() => discard(p)} className="state-layer cursor-pointer rounded-full px-2 py-1 font-medium text-on-surface-variant">
                      Delete
                    </button>
                  </div>
                ) : (
                  !joinsNext && (
                    <span className={cn("mt-1 text-label-md text-on-surface-variant", mine ? "self-end" : "ml-10")}>
                      {p ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Spinner size={12} />
                          Sending…
                        </span>
                      ) : (
                        <time dateTime={row.createdAt}>{clockTime(row.createdAt)}</time>
                      )}
                    </span>
                  )
                )}
              </li>
            );
          })}
        </ol>
      </div>
      {conversation.readOnly ? (
        <div className="flex items-center gap-3 border-t border-outline-variant/60 px-4 py-3 text-body-md text-on-surface-variant">
          <Icon icon={visibilityIcon} size={20} />
          You&apos;re viewing this conversation as AllShip staff. Replies are off.
        </div>
      ) : (
        <Composer loadId={conversation.loadId} onSend={send} />
      )}
      <Lightbox images={images} index={lightbox} onIndexChange={setLightbox} onClose={() => setLightbox(null)} />
    </div>
  );
}
