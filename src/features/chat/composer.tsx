"use client";

import Image from "next/image";
import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { toast } from "sonner";
import { Icon } from "@/components/ui/icon";
import { attachFileIcon, closeIcon, errorIcon, pictureAsPdfIcon, sendIcon } from "@/components/ui/icons.generated";
import { cn } from "@/lib/cn";
import { prepareImage, uploadBlob, UploadError, type UploadContentType } from "@/features/uploads/upload";
import { fileSize } from "./format";

export type OutgoingAttachment = { key: string; name: string; contentType: string; size: number; previewUrl: string | null };

type Draft = {
  id: string;
  name: string;
  contentType: string;
  size: number;
  previewUrl: string | null;
  progress: number;
  status: "uploading" | "done" | "error";
  key?: string;
  error?: string;
  file: File;
};

const ACCEPT = "image/jpeg,image/png,image/webp,image/heic,application/pdf";
const ACCEPTED = new Set(ACCEPT.split(","));
const MAX_FILES = 6;
const MAX_BYTES = 15 * 1024 * 1024;
const MAX_LENGTH = 4000;

export function Composer({ loadId, onSend }: { loadId: string; onSend: (body: string, attachments: OutgoingAttachment[]) => void }) {
  const [text, setText] = useState("");
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const area = useRef<HTMLTextAreaElement>(null);
  const picker = useRef<HTMLInputElement>(null);
  const handedOff = useRef(new Set<string>());
  const live = useRef<Draft[]>([]);

  useEffect(() => {
    live.current = drafts;
  }, [drafts]);

  useEffect(
    () => () => {
      for (const d of live.current) if (d.previewUrl && !handedOff.current.has(d.previewUrl)) URL.revokeObjectURL(d.previewUrl);
    },
    [],
  );

  useLayoutEffect(() => {
    const el = area.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [text]);

  const patch = (id: string, next: Partial<Draft>) => setDrafts((list) => list.map((d) => (d.id === id ? { ...d, ...next } : d)));

  const upload = async (draft: Draft) => {
    patch(draft.id, { status: "uploading", progress: 0, error: undefined });
    try {
      const { blob, contentType } = draft.contentType === "application/pdf" ? { blob: draft.file as Blob, contentType: "application/pdf" as UploadContentType } : await prepareImage(draft.file);
      const key = await uploadBlob({ loadId, purpose: "chat", blob, contentType, onProgress: (p) => patch(draft.id, { progress: p }) });
      patch(draft.id, { status: "done", progress: 1, key, contentType, size: blob.size });
    } catch (error) {
      patch(draft.id, { status: "error", error: error instanceof UploadError ? error.message : "Upload failed. Try again." });
    }
  };

  const addFiles = (files: FileList | null) => {
    if (!files?.length) return;
    const room = MAX_FILES - drafts.length;
    const picked = Array.from(files);
    if (picked.length > room) toast(`You can attach up to ${MAX_FILES} files per message.`);
    const next: Draft[] = [];
    for (const file of picked.slice(0, Math.max(0, room))) {
      if (!ACCEPTED.has(file.type)) {
        toast.error(`${file.name} isn't a photo or PDF.`);
        continue;
      }
      if (file.size > MAX_BYTES) {
        toast.error(`${file.name} is larger than 15 MB.`);
        continue;
      }
      const isImage = file.type.startsWith("image/") && file.type !== "image/heic";
      next.push({ id: crypto.randomUUID(), name: file.name, contentType: file.type, size: file.size, previewUrl: isImage ? URL.createObjectURL(file) : null, progress: 0, status: "uploading", file });
    }
    if (!next.length) return;
    setDrafts((list) => [...list, ...next]);
    for (const d of next) void upload(d);
  };

  const remove = (id: string) =>
    setDrafts((list) => {
      const d = list.find((x) => x.id === id);
      if (d?.previewUrl) URL.revokeObjectURL(d.previewUrl);
      return list.filter((x) => x.id !== id);
    });

  const uploading = drafts.some((d) => d.status === "uploading");
  const ready = drafts.filter((d) => d.status === "done" && d.key);
  const canSend = !uploading && (text.trim().length > 0 || ready.length > 0) && text.length <= MAX_LENGTH;

  const send = () => {
    if (!canSend) return;
    const attachments = ready.map((d) => ({ key: d.key!, name: d.name, contentType: d.contentType, size: d.size, previewUrl: d.previewUrl }));
    for (const a of attachments) if (a.previewUrl) handedOff.current.add(a.previewUrl);
    onSend(text, attachments);
    setText("");
    setDrafts((list) => {
      for (const d of list) if (d.previewUrl && !handedOff.current.has(d.previewUrl)) URL.revokeObjectURL(d.previewUrl);
      return [];
    });
    area.current?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="border-t border-outline-variant/60 bg-inherit px-2 pt-2 pb-[max(env(safe-area-inset-bottom),8px)] medium:px-3 medium:pb-3">
      {drafts.length > 0 && (
        <ul aria-label="Attachments" className="flex gap-2 overflow-x-auto px-1 pb-2 [scrollbar-width:thin]">
          {drafts.map((d) => (
            <li key={d.id} className="relative size-20 shrink-0 animate-pop-in overflow-hidden rounded-md bg-surface-container-highest">
              {d.previewUrl ? (
                <Image src={d.previewUrl} alt={d.name} fill unoptimized sizes="80px" className={cn("object-cover", d.status !== "done" && "opacity-60")} />
              ) : (
                <span className="flex size-full flex-col items-center justify-center gap-1 p-1.5 text-center text-on-surface-variant">
                  <Icon icon={pictureAsPdfIcon} size={24} />
                  <span className="line-clamp-2 text-[11px] leading-tight break-all">{d.name}</span>
                </span>
              )}
              {d.status === "uploading" && (
                <span className="absolute inset-x-1.5 bottom-1.5 h-1 overflow-hidden rounded-full bg-on-surface/20" role="progressbar" aria-label={`Uploading ${d.name}`} aria-valuenow={Math.round(d.progress * 100)} aria-valuemin={0} aria-valuemax={100}>
                  <span className="block h-full rounded-full bg-primary transition-[width] duration-150" style={{ width: `${Math.max(6, d.progress * 100)}%` }} />
                </span>
              )}
              {d.status === "error" && (
                <button type="button" onClick={() => void upload(d)} title={d.error} className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center gap-0.5 bg-error-container/90 text-label-sm text-on-error-container">
                  <Icon icon={errorIcon} size={20} />
                  Retry
                </button>
              )}
              <button type="button" aria-label={`Remove ${d.name}`} onClick={() => remove(d.id)} className="absolute top-1 right-1 flex size-6 cursor-pointer items-center justify-center rounded-full bg-inverse-surface/80 text-inverse-on-surface">
                <Icon icon={closeIcon} size={16} />
              </button>
              <span className="sr-only">{fileSize(d.size)}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="flex items-end gap-1">
        <input ref={picker} type="file" accept={ACCEPT} multiple hidden onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
        <button
          type="button"
          aria-label="Attach photos or PDFs"
          title="Attach photos or PDFs"
          disabled={drafts.length >= MAX_FILES}
          onClick={() => picker.current?.click()}
          className="state-layer mb-1 inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-on-surface-variant disabled:cursor-not-allowed disabled:opacity-38"
        >
          <Icon icon={attachFileIcon} />
        </button>
        <div className="flex min-h-12 min-w-0 flex-1 items-center rounded-[24px] bg-surface-container-highest px-4 focus-within:outline-2 focus-within:outline-primary">
          <label htmlFor="chat-composer" className="sr-only">
            Message
          </label>
          <textarea
            id="chat-composer"
            ref={area}
            rows={1}
            value={text}
            maxLength={MAX_LENGTH + 200}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDown}
            onPaste={(e) => {
              if (e.clipboardData.files.length) {
                e.preventDefault();
                addFiles(e.clipboardData.files);
              }
            }}
            placeholder="Message"
            enterKeyHint="send"
            className="block max-h-40 w-full resize-none bg-transparent py-3 text-body-lg text-on-surface outline-none placeholder:text-on-surface-variant"
          />
        </div>
        <button
          type="button"
          aria-label="Send"
          title="Send"
          disabled={!canSend}
          onClick={send}
          className="state-layer mb-0.5 inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-primary text-on-primary transition-[background-color,color,border-radius] duration-(--duration-short4) active:rounded-[14px] disabled:cursor-not-allowed disabled:bg-on-surface/12 disabled:text-on-surface/38"
        >
          <Icon icon={sendIcon} size={22} filled />
        </button>
      </div>
      {text.length > MAX_LENGTH - 200 && (
        <p className={cn("px-14 pt-1 text-right text-label-md", text.length > MAX_LENGTH ? "text-error" : "text-on-surface-variant")}>
          {text.length.toLocaleString("en-US")} / {MAX_LENGTH.toLocaleString("en-US")}
        </p>
      )}
    </div>
  );
}
