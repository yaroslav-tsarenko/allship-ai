"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import Image from "next/image";
import { useEffect } from "react";
import { Icon } from "@/components/ui/icon";
import { arrowBackIcon, arrowForwardIcon, closeIcon, downloadIcon } from "@/components/ui/icons.generated";

export type LightboxImage = { url: string; name: string; caption: string };

const control = "state-layer inline-flex size-12 cursor-pointer items-center justify-center rounded-full bg-black/40 text-white transition-[border-radius] active:rounded-[16px] disabled:opacity-30";

export function Lightbox({ images, index, onIndexChange, onClose }: { images: LightboxImage[]; index: number | null; onIndexChange: (i: number) => void; onClose: () => void }) {
  const open = index !== null && Boolean(images[index]);
  const current = open ? images[index] : null;

  useEffect(() => {
    if (!open || index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" && index < images.length - 1) onIndexChange(index + 1);
      if (e.key === "ArrowLeft" && index > 0) onIndexChange(index - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, index, images.length, onIndexChange]);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/90 data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in" />
        <DialogPrimitive.Content className="fixed inset-0 z-50 flex flex-col outline-none data-[state=closed]:animate-fade-out data-[state=open]:animate-dialog-in">
          <DialogPrimitive.Title className="sr-only">{current?.name ?? "Photo"}</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">{current?.caption ?? ""}</DialogPrimitive.Description>
          <div className="flex items-center gap-2 p-3 text-white">
            <DialogPrimitive.Close className={control} aria-label="Close">
              <Icon icon={closeIcon} />
            </DialogPrimitive.Close>
            <div className="min-w-0 flex-1">
              <p className="truncate text-title-md">{current?.caption}</p>
              {images.length > 1 && index !== null && (
                <p className="text-body-md text-white/70">
                  {index + 1} of {images.length}
                </p>
              )}
            </div>
            {current && (
              <a href={current.url} download={current.name} target="_blank" rel="noreferrer" className={control} aria-label="Download">
                <Icon icon={downloadIcon} />
              </a>
            )}
          </div>
          <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 pb-6 medium:px-20">
            {current && (
              <div className="relative size-full">
                <Image key={current.url} src={current.url} alt={current.name} fill unoptimized sizes="100vw" className="animate-fade-in object-contain" />
              </div>
            )}
            {images.length > 1 && index !== null && (
              <>
                <button type="button" aria-label="Previous photo" disabled={index === 0} onClick={() => onIndexChange(index - 1)} className={`${control} absolute top-1/2 left-3 -translate-y-1/2`}>
                  <Icon icon={arrowBackIcon} />
                </button>
                <button type="button" aria-label="Next photo" disabled={index === images.length - 1} onClick={() => onIndexChange(index + 1)} className={`${control} absolute top-1/2 right-3 -translate-y-1/2`}>
                  <Icon icon={arrowForwardIcon} />
                </button>
              </>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
