"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import Image from "next/image";
import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { arrowBackIcon, arrowForwardIcon, closeIcon, descriptionIcon, openInNewIcon } from "@/components/ui/icons.generated";
import { cn } from "@/lib/cn";

export type GalleryItem = { id: string; url: string; kind: string; label: string; isPdf: boolean; createdAt: string | null };

const timeFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

export function MediaGallery({ items, label, className }: { items: GalleryItem[]; label: string; className?: string }) {
  const [index, setIndex] = useState<number | null>(null);
  const images = items.filter((i) => !i.isPdf);
  const docs = items.filter((i) => i.isPdf);
  const active = index != null ? images[index] : null;
  const step = (delta: number) => setIndex((i) => (i == null ? i : (i + delta + images.length) % images.length));

  if (items.length === 0) return null;

  return (
    <div className={className}>
      <ul aria-label={label} className="grid grid-cols-3 gap-2 medium:grid-cols-4">
        {images.map((item, i) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => setIndex(i)}
              className="group relative block aspect-square w-full cursor-pointer overflow-hidden rounded-sm bg-surface-container-highest outline-offset-2 focus-visible:outline-2 focus-visible:outline-primary"
            >
              <Image
                src={item.url}
                alt={`${item.label}${item.createdAt ? `, ${timeFmt.format(new Date(item.createdAt))}` : ""}`}
                fill
                unoptimized
                sizes="200px"
                className={cn("transition-transform duration-300 ease-standard group-hover:scale-[1.03]", item.kind === "pod_signature" ? "bg-white object-contain p-2" : "object-cover")}
              />
              {item.kind === "pod_signature" && <span className="absolute inset-x-0 bottom-0 bg-scrim/50 px-2 py-1 text-left text-label-sm text-white">Signature</span>}
            </button>
          </li>
        ))}
        {docs.map((item) => (
          <li key={item.id}>
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="state-layer flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-sm bg-surface-container-highest p-2 text-center text-on-surface-variant"
            >
              <Icon icon={descriptionIcon} />
              <span className="text-label-md">PDF</span>
              <span className="sr-only">{item.label}, opens in a new tab</span>
            </a>
          </li>
        ))}
      </ul>
      <DialogPrimitive.Root open={active != null} onOpenChange={(open) => !open && setIndex(null)}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/88 data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in" />
          <DialogPrimitive.Content
            className="fixed inset-0 z-50 flex flex-col text-white outline-none"
            onKeyDown={(e) => {
              if (e.key === "ArrowRight") step(1);
              if (e.key === "ArrowLeft") step(-1);
            }}
          >
            <div className="flex items-center gap-2 px-2 py-2 medium:px-4">
              <DialogPrimitive.Close aria-label="Close" className="inline-flex size-12 cursor-pointer items-center justify-center rounded-full hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white">
                <Icon icon={closeIcon} />
              </DialogPrimitive.Close>
              <div className="min-w-0 flex-1">
                <DialogPrimitive.Title className="truncate text-title-md">{active?.label}</DialogPrimitive.Title>
                <DialogPrimitive.Description className="text-body-sm text-white/70">
                  {index != null ? `${index + 1} of ${images.length}` : ""}
                  {active?.createdAt ? ` · ${timeFmt.format(new Date(active.createdAt))}` : ""}
                </DialogPrimitive.Description>
              </div>
              {active && (
                <a href={active.url} target="_blank" rel="noreferrer" aria-label="Open original in a new tab" className="inline-flex size-12 items-center justify-center rounded-full hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white">
                  <Icon icon={openInNewIcon} />
                </a>
              )}
            </div>
            <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 pb-6 medium:px-20">
              {active && (
                <div className={cn("relative size-full", active.kind === "pod_signature" && "max-h-[320px] max-w-[640px] rounded-sm bg-white")}>
                  <Image key={active.id} src={active.url} alt={active.label} fill unoptimized sizes="100vw" className={cn("object-contain", active.kind === "pod_signature" && "p-4")} />
                </div>
              )}
              {images.length > 1 && (
                <>
                  <button type="button" onClick={() => step(-1)} aria-label="Previous photo" className="absolute left-2 inline-flex size-12 cursor-pointer items-center justify-center rounded-full bg-black/40 hover:bg-black/60 focus-visible:outline-2 focus-visible:outline-white medium:left-4">
                    <Icon icon={arrowBackIcon} />
                  </button>
                  <button type="button" onClick={() => step(1)} aria-label="Next photo" className="absolute right-2 inline-flex size-12 cursor-pointer items-center justify-center rounded-full bg-black/40 hover:bg-black/60 focus-visible:outline-2 focus-visible:outline-white medium:right-4">
                    <Icon icon={arrowForwardIcon} />
                  </button>
                </>
              )}
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </div>
  );
}
