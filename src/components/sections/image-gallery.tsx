"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/cn";
import type { SectionImage } from "./types";

const paths = { prev: "m406-481 177 177q9 9 8.5 21t-9.5 21q-9 9-21.5 9t-21.5-9L341-460q-5-5-7-10t-2-11q0-6 2-11t7-10l199-199q9-9 21.5-9t21.5 9q9 9 9 21.5t-9 21.5L406-481Z", next: "M530-481 353-658q-9-9-8.5-21t9.5-21q9-9 21.5-9t21.5 9l198 198q5 5 7 10t2 11q0 6-2 11t-7 10L396-261q-9 9-21 8.5t-21-9.5q-9-9-9-21.5t9-21.5l176-176Z", close: "M480-438 270-228q-9 9-21 9t-21-9q-9-9-9-21t9-21l210-210-210-210q-9-9-9-21t9-21q9-9 21-9t21 9l210 210 210-210q9-9 21-9t21 9q9 9 9 21t-9 21L522-480l210 210q9 9 9 21t-9 21q-9 9-21 9t-21-9L480-438Z" };

function Glyph({ d }: { d: string }) {
  return (
    <svg viewBox="0 -960 960 960" width={24} height={24} fill="currentColor" aria-hidden="true" focusable="false">
      <path d={d} />
    </svg>
  );
}

const iconButton =
  "state-layer inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-[20px] transition-[border-radius] duration-(--duration-short4) active:rounded-[12px]";

export function ImageGallery({ images, label = "Photos", unoptimized = false, className }: { images: SectionImage[]; label?: string; unoptimized?: boolean; className?: string }) {
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const count = images.length;
  if (!count) return null;
  const current = images[index] ?? images[0]!;
  const step = (d: number) => setIndex((i) => (i + d + count) % count);
  const dims = (img: SectionImage) => (typeof img.src === "string" ? { width: img.width ?? 1200, height: img.height ?? 800 } : {});

  return (
    <div className={cn("flex flex-col gap-3", className)} role="region" aria-label={label}>
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <div className="relative overflow-hidden rounded-lg bg-surface-container">
          <Dialog.Trigger asChild>
            <button type="button" className="block w-full cursor-zoom-in" aria-label={`Open photo ${index + 1} of ${count} full screen`}>
              <Image src={current.src} alt={current.alt} {...dims(current)} unoptimized={unoptimized} sizes="(min-width: 840px) 640px, 100vw" className="aspect-[4/3] h-auto w-full object-cover" />
            </button>
          </Dialog.Trigger>
          {count > 1 && (
            <>
              <button type="button" onClick={() => step(-1)} aria-label="Previous photo" title="Previous" className={cn(iconButton, "absolute top-1/2 left-2 -translate-y-1/2 bg-surface/90 text-on-surface")}>
                <Glyph d={paths.prev} />
              </button>
              <button type="button" onClick={() => step(1)} aria-label="Next photo" title="Next" className={cn(iconButton, "absolute top-1/2 right-2 -translate-y-1/2 bg-surface/90 text-on-surface")}>
                <Glyph d={paths.next} />
              </button>
            </>
          )}
        </div>
        {count > 1 && (
          <ul className="flex gap-2 overflow-x-auto pb-1">
            {images.map((img, i) => (
              <li key={i} className="shrink-0">
                <button
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`Show photo ${i + 1}`}
                  aria-current={i === index ? "true" : undefined}
                  className="block overflow-hidden rounded-sm ring-offset-2 ring-offset-surface aria-[current=true]:ring-2 aria-[current=true]:ring-primary"
                >
                  <Image src={img.src} alt="" {...dims(img)} unoptimized={unoptimized} sizes="96px" className="h-16 w-24 object-cover" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-scrim/80 data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in" />
          <Dialog.Content
            className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 p-4 outline-none data-[state=open]:animate-dialog-in"
            onKeyDown={(e) => {
              if (e.key === "ArrowRight") step(1);
              if (e.key === "ArrowLeft") step(-1);
            }}
          >
            <Dialog.Title className="sr-only">
              {label}: photo {index + 1} of {count}
            </Dialog.Title>
            <Dialog.Description className="sr-only">{current.alt}</Dialog.Description>
            <Image src={current.src} alt={current.alt} {...dims(current)} unoptimized={unoptimized} sizes="100vw" className="max-h-[80vh] w-auto max-w-full rounded-md object-contain" />
            <div className="flex items-center gap-2 rounded-full bg-surface-container-high p-1 text-on-surface">
              {count > 1 && (
                <button type="button" onClick={() => step(-1)} aria-label="Previous photo" className={iconButton}>
                  <Glyph d={paths.prev} />
                </button>
              )}
              <span className="px-2 text-label-lg tabular-nums">
                {index + 1} / {count}
              </span>
              {count > 1 && (
                <button type="button" onClick={() => step(1)} aria-label="Next photo" className={iconButton}>
                  <Glyph d={paths.next} />
                </button>
              )}
              <Dialog.Close aria-label="Close" className={iconButton}>
                <Glyph d={paths.close} />
              </Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
