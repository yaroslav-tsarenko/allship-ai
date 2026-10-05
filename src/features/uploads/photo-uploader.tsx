"use client";

import Image from "next/image";
import { useCallback, useEffect, useId, useRef, useState, type DragEvent } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { closeIcon, errorIcon, photoCameraIcon, photoLibraryIcon, pictureAsPdfIcon, replayIcon } from "@/components/ui/icons.generated";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/cn";
import { prepareImage, uploadBlob, UploadError, type UploadPurpose } from "./upload";

type ItemStatus = "preparing" | "uploading" | "done" | "error";

type Item = {
  id: string;
  file: File;
  name: string;
  previewUrl: string | null;
  isPdf: boolean;
  status: ItemStatus;
  progress: number;
  key?: string;
  error?: string;
};

export type PhotoUploaderProps = {
  loadId: string;
  purpose: UploadPurpose;
  max?: number;
  onChange: (keys: string[]) => void;
  onBusyChange?: (busy: boolean) => void;
  allowPdf?: boolean;
  label?: string;
  description?: string;
  disabled?: boolean;
  className?: string;
};

const imageTypes = ["image/jpeg", "image/png", "image/webp", "image/heic"];
const MAX_BYTES = 15 * 1024 * 1024;

function newId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
}

export function PhotoUploader({
  loadId,
  purpose,
  max = 6,
  onChange,
  onBusyChange,
  allowPdf = false,
  label = "Photos",
  description,
  disabled = false,
  className,
}: PhotoUploaderProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [dragging, setDragging] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const cameraRef = useRef<HTMLInputElement>(null);
  const filesRef = useRef<HTMLInputElement>(null);
  const controllers = useRef(new Map<string, AbortController>());
  const itemsRef = useRef(items);
  const changeRef = useRef(onChange);
  const busyRef = useRef(onBusyChange);
  const lastKeys = useRef("");
  const lastBusy = useRef(false);
  const labelId = useId();
  const helpId = useId();
  const acceptAttr = allowPdf ? "image/*,application/pdf" : "image/*";

  useEffect(() => {
    itemsRef.current = items;
    changeRef.current = onChange;
    busyRef.current = onBusyChange;
  });

  useEffect(() => {
    const keys = items.filter((i) => i.status === "done" && i.key).map((i) => i.key!);
    const signature = keys.join("|");
    if (signature !== lastKeys.current) {
      lastKeys.current = signature;
      changeRef.current(keys);
    }
    const busy = items.some((i) => i.status === "preparing" || i.status === "uploading");
    if (busy !== lastBusy.current) {
      lastBusy.current = busy;
      busyRef.current?.(busy);
    }
  }, [items]);

  useEffect(() => {
    const active = controllers.current;
    return () => {
      for (const c of active.values()) c.abort();
      for (const i of itemsRef.current) if (i.previewUrl) URL.revokeObjectURL(i.previewUrl);
    };
  }, []);

  const patch = useCallback((id: string, next: Partial<Item>) => {
    setItems((list) => list.map((i) => (i.id === id ? { ...i, ...next } : i)));
  }, []);

  const run = useCallback(
    async (item: Item) => {
      const controller = new AbortController();
      controllers.current.set(item.id, controller);
      try {
        patch(item.id, { status: "preparing", progress: 0, error: undefined });
        const { blob, contentType } = item.isPdf ? { blob: item.file as Blob, contentType: "application/pdf" as const } : await prepareImage(item.file);
        if (blob.size > MAX_BYTES) throw new UploadError("Files must be 15 MB or smaller.");
        patch(item.id, { status: "uploading" });
        const key = await uploadBlob({
          loadId,
          purpose,
          blob,
          contentType,
          signal: controller.signal,
          onProgress: (fraction) => patch(item.id, { progress: fraction }),
        });
        patch(item.id, { status: "done", progress: 1, key });
        setAnnouncement(`${item.name} uploaded.`);
      } catch (error) {
        if (controller.signal.aborted) return;
        const message = error instanceof UploadError ? error.message : "Upload failed. Try again.";
        patch(item.id, { status: "error", error: message });
        setAnnouncement(`${item.name} failed to upload. ${message}`);
      } finally {
        controllers.current.delete(item.id);
      }
    },
    [loadId, patch, purpose],
  );

  const addFiles = useCallback(
    (list: FileList | File[]) => {
      if (disabled) return;
      const files = Array.from(list);
      const accepted = allowPdf ? [...imageTypes, "application/pdf"] : imageTypes;
      const room = max - itemsRef.current.length;
      const valid = files.filter((f) => accepted.includes(f.type) || (f.type === "" && /\.(heic|heif)$/i.test(f.name)));
      const skippedType = files.length - valid.length;
      const taking = valid.slice(0, Math.max(room, 0));
      const skippedRoom = valid.length - taking.length;
      setNotice(
        skippedRoom > 0
          ? `You can add up to ${max} ${max === 1 ? "file" : "files"}.`
          : skippedType > 0
            ? allowPdf
              ? "Only photos (JPEG, PNG, WebP, HEIC) and PDFs are supported."
              : "Only photos (JPEG, PNG, WebP, HEIC) are supported."
            : null,
      );
      if (taking.length === 0) return;
      const created: Item[] = taking.map((file) => {
        const isPdf = file.type === "application/pdf";
        const normalized = file.type === "" ? new File([file], file.name, { type: "image/heic" }) : file;
        return {
          id: newId(),
          file: normalized,
          name: file.name || "Photo",
          isPdf,
          previewUrl: isPdf ? null : URL.createObjectURL(normalized),
          status: "preparing",
          progress: 0,
        };
      });
      setItems((current) => [...current, ...created]);
      for (const item of created) void run(item);
    },
    [allowPdf, disabled, max, run],
  );

  const remove = (id: string) => {
    controllers.current.get(id)?.abort();
    setItems((list) => {
      const target = list.find((i) => i.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      if (target) setAnnouncement(`${target.name} removed.`);
      return list.filter((i) => i.id !== id);
    });
    setNotice(null);
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    if (event.dataTransfer.files.length) addFiles(event.dataTransfer.files);
  };

  const full = items.length >= max;
  const doneCount = items.filter((i) => i.status === "done").length;

  return (
    <div className={cn("flex flex-col gap-3", className)} role="group" aria-labelledby={labelId} aria-describedby={helpId}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p id={labelId} className="text-title-sm text-on-surface">
          {label}
        </p>
        <p className="text-body-sm text-on-surface-variant tabular-nums">
          {doneCount} of {max}
        </p>
      </div>
      <div
        onDragOver={(event) => {
          if (disabled || full) return;
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "flex flex-col gap-3 rounded-lg border border-dashed p-3 transition-colors duration-150 ease-standard medium:p-4",
          dragging ? "border-primary bg-primary-container/40" : "border-outline-variant bg-surface-container-low",
        )}
      >
        {items.length > 0 && (
          <ul className="grid grid-cols-3 gap-2 medium:grid-cols-4" aria-label="Selected files">
            {items.map((item) => (
              <li key={item.id} className="relative aspect-square overflow-hidden rounded-md bg-surface-container-highest">
                {item.previewUrl ? (
                  <Image src={item.previewUrl} alt={item.name} fill unoptimized sizes="160px" className={cn("object-cover", item.status !== "done" && "opacity-70")} />
                ) : (
                  <span className="flex size-full flex-col items-center justify-center gap-1 p-2 text-center text-on-surface-variant">
                    <Icon icon={pictureAsPdfIcon} size={28} />
                    <span className="line-clamp-2 text-label-sm break-all">{item.name}</span>
                  </span>
                )}
                {(item.status === "preparing" || item.status === "uploading") && (
                  <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-scrim/30 text-white">
                    <Spinner size={22} />
                    <span className="text-label-md tabular-nums">{item.status === "preparing" ? "Preparing" : `${Math.round(item.progress * 100)}%`}</span>
                    <span
                      className="absolute inset-x-0 bottom-0 h-1 bg-primary transition-[width] duration-150"
                      style={{ width: `${Math.round(item.progress * 100)}%` }}
                      role="progressbar"
                      aria-label={`Uploading ${item.name}`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={Math.round(item.progress * 100)}
                    />
                  </span>
                )}
                {item.status === "error" && (
                  <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-error-container/90 p-2 text-center text-on-error-container">
                    <Icon icon={errorIcon} size={20} />
                    <span className="line-clamp-2 text-label-sm">{item.error}</span>
                    <button
                      type="button"
                      onClick={() => void run(item)}
                      className="state-layer mt-1 inline-flex h-8 items-center gap-1 rounded-full px-3 text-label-md font-medium"
                      aria-label={`Retry ${item.name}`}
                    >
                      <Icon icon={replayIcon} size={16} />
                      Retry
                    </button>
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => remove(item.id)}
                  aria-label={`Remove ${item.name}`}
                  className="state-layer absolute top-1 right-1 inline-flex size-8 items-center justify-center rounded-full bg-scrim/55 text-white"
                >
                  <Icon icon={closeIcon} size={18} />
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="tonal" leading={<Icon icon={photoCameraIcon} size={20} />} disabled={disabled || full} onClick={() => cameraRef.current?.click()} className="pointer-fine:hidden">
            Take photo
          </Button>
          <Button type="button" variant="outlined" leading={<Icon icon={photoLibraryIcon} size={20} />} disabled={disabled || full} onClick={() => filesRef.current?.click()}>
            {items.length ? "Add more" : allowPdf ? "Choose files" : "Choose photos"}
          </Button>
          <p id={helpId} className="min-w-0 flex-1 basis-48 text-body-sm text-on-surface-variant">
            {description ?? (allowPdf ? "Photos or PDFs, up to 15 MB each." : "Large photos are resized before upload.")}
            <span className="hidden pointer-fine:inline"> You can also drop files here.</span>
          </p>
        </div>
        {notice && (
          <p className="text-body-sm text-error" role="alert">
            {notice}
          </p>
        )}
      </div>
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(event) => {
          if (event.target.files) addFiles(event.target.files);
          event.target.value = "";
        }}
      />
      <input
        ref={filesRef}
        type="file"
        accept={acceptAttr}
        multiple={max > 1}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(event) => {
          if (event.target.files) addFiles(event.target.files);
          event.target.value = "";
        }}
      />
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
    </div>
  );
}
