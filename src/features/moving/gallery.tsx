"use client";

import Image, { type StaticImageData } from "next/image";
import { useEffect, useRef, useState } from "react";

export type GalleryItem = { src: StaticImageData; alt: string };

export function MovingGallery({ items }: { items: GalleryItem[] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState<number | null>(null);
  const current = index === null ? null : items[index];

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (index !== null && !d.open) d.showModal();
    if (index === null && d.open) d.close();
  }, [index]);

  const step = (delta: number) => setIndex((i) => (i === null ? i : (i + delta + items.length) % items.length));

  return (
    <>
      <ul className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:thin] medium:-mx-8 medium:gap-4 medium:px-8" aria-label="Photos">
        {items.map((item, i) => (
          <li key={item.alt} className={`shrink-0 snap-start ${i % 3 === 0 ? "w-[78vw] medium:w-[480px]" : "w-[62vw] medium:w-[340px]"}`}>
            <button type="button" onClick={() => setIndex(i)} className="group block w-full cursor-zoom-in overflow-hidden rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" aria-label={`Open photo: ${item.alt}`}>
              <Image
                src={item.src}
                alt={item.alt}
                sizes="(min-width: 840px) 480px, 78vw"
                className="aspect-[4/3] h-auto w-full object-cover transition-transform duration-(--duration-long2) ease-standard group-hover:scale-[1.02] motion-reduce:transition-none"
              />
            </button>
          </li>
        ))}
      </ul>
      <dialog
        ref={dialog}
        onClose={() => setIndex(null)}
        onClick={(e) => {
          if (e.target === e.currentTarget) setIndex(null);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") step(1);
          if (e.key === "ArrowLeft") step(-1);
        }}
        aria-label={current?.alt ?? "Photo"}
        className="m-auto max-h-[92dvh] max-w-[min(1100px,94vw)] overflow-visible bg-transparent p-0 backdrop:bg-scrim/80"
      >
        {current && (
          <figure className="flex flex-col gap-3">
            <Image src={current.src} alt={current.alt} sizes="94vw" className="max-h-[80dvh] w-auto rounded-md object-contain" />
            <figcaption className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-surface px-4 py-2 text-body-md text-on-surface">
              <span>{current.alt}</span>
              <span className="flex gap-2">
                <button type="button" onClick={() => step(-1)} className="state-layer h-10 cursor-pointer rounded-[20px] px-4 text-label-lg text-primary">
                  Previous
                </button>
                <button type="button" onClick={() => step(1)} className="state-layer h-10 cursor-pointer rounded-[20px] px-4 text-label-lg text-primary">
                  Next
                </button>
                <button type="button" onClick={() => setIndex(null)} className="state-layer h-10 cursor-pointer rounded-[20px] bg-primary px-4 text-label-lg text-on-primary" autoFocus>
                  Close
                </button>
              </span>
            </figcaption>
          </figure>
        )}
      </dialog>
    </>
  );
}
