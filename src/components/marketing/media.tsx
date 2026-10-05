import Image from "next/image";
import { enter as enterProps } from "@/components/motion/enter";
import { cn } from "@/lib/cn";

type MediaProps = {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  imgClassName?: string;
  priority?: boolean | "desktop";
  sizes?: string;
  caption?: string;
  radius?: "none" | "md" | "xl";
  parallax?: boolean | "hero";
  enter?: number;
};

export function Media({ src, alt, width, height, className, imgClassName, priority, sizes = "(min-width: 840px) 50vw, 100vw", caption, radius = "xl", parallax, enter }: MediaProps) {
  const clip = parallax && !caption;
  return (
    <figure
      className={cn("relative m-0", clip && "isolate overflow-hidden", clip && radius === "xl" && "rounded-xl", clip && radius === "md" && "rounded-md", className)}
      {...(enter === undefined ? {} : enterProps(enter))}
    >
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        preload={priority === true}
        fetchPriority={priority ? "high" : undefined}
        sizes={sizes}
        data-parallax={clip ? (parallax === "hero" ? "hero" : "") : undefined}
        className={cn(
          "h-full w-full object-cover",
          radius === "xl" && "rounded-xl",
          radius === "md" && "rounded-md",
          imgClassName,
        )}
      />
      {caption && <figcaption className="mt-3 text-body-sm text-on-surface-variant">{caption}</figcaption>}
    </figure>
  );
}
