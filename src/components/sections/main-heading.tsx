import Image from "next/image";
import type { ReactNode } from "react";
import { enter } from "@/components/motion/enter";
import { RevealText } from "@/components/motion/reveal-text";
import { Container } from "@/components/marketing/section";
import { Icon } from "@/components/ui/icon";
import { checkCircleIcon } from "@/components/ui/icons.generated";
import { authLinks } from "@/content/site";
import { cn } from "@/lib/cn";
import { CtaButtons } from "./cta-buttons";
import { LazyVideo } from "./lazy-video";
import { imageSize, type Cta, type SectionImage } from "./types";

export const defaultHeroCtas: Cta[] = [
  { label: "Become Shipper", href: authLinks.signUp.href, variant: "outlined", track: "hero_shipper" },
  { label: "Become Carrier", href: authLinks.carrierSignUp.href, variant: "filled", track: "hero_carrier" },
];

type Props = {
  id?: string;
  checkmarks?: string[];
  kicker?: string;
  title: ReactNode;
  highlight?: string;
  description?: ReactNode;
  ctas?: Cta[];
  image?: SectionImage;
  video?: { src: string; poster: string; width: number; height: number; label?: string };
  media?: ReactNode;
  proof?: ReactNode;
  children?: ReactNode;
  className?: string;
};

export function MainHeading({ id = "hero-title", checkmarks = [], kicker, title, highlight, description, ctas = defaultHeroCtas, image, video, media, proof, children, className }: Props) {
  const hasMedia = Boolean(image || video || media);
  return (
    <section aria-labelledby={id} className={cn("pt-8 pb-14 medium:pt-14 medium:pb-20 large:pt-16", className)}>
      <Container>
        <div className={cn("grid grid-cols-1 gap-10", hasMedia && "large:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] large:items-center large:gap-16")}>
          <div>
            {checkmarks.length > 0 && (
              <ul className="mb-6 flex flex-wrap gap-2" {...enter(0)}>
                {checkmarks.map((text) => (
                  <li key={text} className="inline-flex h-8 items-center gap-1.5 rounded-sm bg-success-container pr-3 pl-2 text-label-lg font-medium text-on-success-container">
                    <Icon icon={checkCircleIcon} filled size={18} />
                    {text}
                  </li>
                ))}
              </ul>
            )}
            {kicker && (
              <p className="mb-3 text-title-md font-medium text-primary medium:text-title-lg" {...enter(1)}>
                {kicker}
              </p>
            )}
            <h1 id={id} className="max-w-[880px] text-display-sm font-normal tracking-tight text-balance medium:text-display-lg large:text-display-xl">
              <RevealText>{title}</RevealText>
              {highlight && (
                <>
                  {" "}
                  <span className="text-primary">
                    <RevealText delay={160}>{highlight}</RevealText>
                  </span>
                </>
              )}
            </h1>
            {description && (
              <div className="mt-6 max-w-[620px] text-body-lg text-pretty text-on-surface-variant medium:text-title-lg medium:font-normal" {...enter(3)}>
                {description}
              </div>
            )}
            {ctas.length > 0 && (
              <div {...enter(4)}>
                <CtaButtons ctas={ctas} className="mt-8" />
              </div>
            )}
            {proof && (
              <div className="mt-8" {...enter(5)}>
                {proof}
              </div>
            )}
          </div>
          {hasMedia && (
            <div {...enter(4)}>
              {media ??
                (video ? (
                  <LazyVideo src={video.src} poster={video.poster} width={video.width} height={video.height} label={video.label ?? "Product demo"} className="aspect-video rounded-xl" />
                ) : image ? (
                  <Image
                    src={image.src}
                    alt={image.alt}
                    {...imageSize(image, { width: 1200, height: 900 })}
                    preload
                    fetchPriority="high"
                    sizes="(min-width: 1200px) 560px, 100vw"
                    className="h-auto w-full rounded-xl object-cover"
                  />
                ) : null)}
            </div>
          )}
        </div>
        {children && (
          <div className="mt-10" {...enter(5)}>
            {children}
          </div>
        )}
      </Container>
    </section>
  );
}
