import Image from "next/image";
import { Media } from "@/components/marketing/media";
import type { Category } from "@/content/categories";

export function CategoryVisual({ category, priority }: { category: Category; priority?: boolean | "desktop" }) {
  const { image } = category;
  if (image.cutout) {
    return (
      <figure className="mx-auto my-0 flex aspect-[16/10] w-full max-w-[440px] items-center justify-center rounded-xl bg-white p-6 dark:brightness-90 large:mr-0">
        <Image src={image.src} alt={image.alt} width={image.width} height={image.height} preload={priority === true} fetchPriority={priority ? "high" : undefined} sizes={`${image.width}px`} className="h-auto w-auto max-w-full" />
      </figure>
    );
  }
  return (
    <Media
      src={image.src}
      alt={image.alt}
      width={image.width}
      height={image.height}
      priority={priority}
      sizes="(min-width: 1200px) 520px, (min-width: 600px) 80vw, 100vw"
      className="overflow-hidden rounded-xl aspect-[4/3] large:aspect-[5/4]"
    />
  );
}
