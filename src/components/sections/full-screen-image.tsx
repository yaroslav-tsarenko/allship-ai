import Image from "next/image";
import { Container } from "@/components/marketing/section";
import type { SectionImage } from "./types";

export function FullScreenImage({ image, priority = false, caption }: { image: SectionImage; priority?: boolean; caption?: string }) {
  return (
    <figure className="m-0 py-6 medium:py-10">
      <Container width="wide">
        <div className="overflow-hidden rounded-xl bg-surface-container">
          <Image
            src={image.src}
            alt={image.alt}
            width={typeof image.src === "string" ? (image.width ?? 1440) : undefined}
            height={typeof image.src === "string" ? (image.height ?? 768) : undefined}
            preload={priority}
            fetchPriority={priority ? "high" : undefined}
            sizes="(min-width: 1440px) 1376px, 100vw"
            data-parallax=""
            className="aspect-[4/3] h-auto w-full object-cover medium:aspect-[1440/768]"
          />
        </div>
        {caption && <figcaption className="mt-3 text-body-sm text-on-surface-variant">{caption}</figcaption>}
      </Container>
    </figure>
  );
}
