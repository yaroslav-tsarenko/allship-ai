import Image from "next/image";
import type { ReactNode } from "react";
import { Container } from "@/components/marketing/section";
import { authLinks } from "@/content/site";
import { cn } from "@/lib/cn";
import { CtaButtons } from "./cta-buttons";
import { sectionId, type Cta, type SectionImage } from "./types";

export function Introduction({
  title,
  description,
  image,
  reverse = false,
  cta = { label: "Get started", href: authLinks.signUp.href },
  secondaryCta,
  eyebrow,
  children,
  id,
  tone = "surface",
  imageClassName,
}: {
  title: string;
  description: ReactNode;
  image: SectionImage;
  reverse?: boolean;
  cta?: Cta | null;
  secondaryCta?: Cta;
  eyebrow?: string;
  children?: ReactNode;
  id?: string;
  tone?: "surface" | "low";
  imageClassName?: string;
}) {
  const headingId = id ?? sectionId("intro", title);
  return (
    <section aria-labelledby={headingId} className={cn("py-14 medium:py-20", tone === "low" && "bg-surface-container-low")}>
      <Container>
        <div className="grid items-center gap-10 large:grid-cols-2 large:gap-16">
          <div className={cn("overflow-hidden rounded-xl bg-surface-container", reverse && "large:order-2")}>
            <Image
              src={image.src}
              alt={image.alt}
              width={typeof image.src === "string" ? (image.width ?? 1200) : undefined}
              height={typeof image.src === "string" ? (image.height ?? 800) : undefined}
              sizes="(min-width: 1200px) 600px, 100vw"
              className={cn("h-auto w-full object-cover", imageClassName)}
            />
          </div>
          <div className={cn(reverse && "large:order-1")}>
            {eyebrow && <p className="mb-3 text-title-sm font-medium text-primary">{eyebrow}</p>}
            <h2 id={headingId} className="text-headline-lg font-normal text-balance medium:text-display-sm">
              {title}
            </h2>
            <div className="mt-5 flex flex-col gap-4 text-body-lg text-pretty text-on-surface-variant medium:text-body-xl">{typeof description === "string" ? <p>{description}</p> : description}</div>
            {children}
            {cta && (
              <CtaButtons
                className="mt-8"
                ctas={[{ ...cta, variant: cta.variant ?? "filled" }, ...(secondaryCta ? [{ ...secondaryCta, variant: secondaryCta.variant ?? ("text" as const) }] : [])]}
              />
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}
