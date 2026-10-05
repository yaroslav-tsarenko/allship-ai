import Image from "next/image";
import { legacyAlt, slidePlatformOverview, slidePostAndCompare, slideTrackAndPay } from "@/assets/legacy";
import { Container } from "@/components/marketing/section";
import { Carousel } from "./carousel";
import { SectionHeader } from "./section-header";
import { sectionId, type SectionImage } from "./types";

export const defaultSlides: SectionImage[] = [
  { src: slidePlatformOverview, alt: legacyAlt.slidePlatformOverview },
  { src: slidePostAndCompare, alt: legacyAlt.slidePostAndCompare },
  { src: slideTrackAndPay, alt: legacyAlt.slideTrackAndPay },
];

export function FullSlider({ title, description, slides = defaultSlides, id }: { title: string; description?: string; slides?: SectionImage[]; id?: string }) {
  const headingId = id ?? sectionId("slider", title);
  return (
    <section aria-labelledby={headingId} className="overflow-hidden py-16 medium:py-24">
      <Container>
        <SectionHeader id={headingId} title={title} description={description} className="mb-10" />
        <Carousel label={title}>
          {slides.map((s, i) => (
            <Image
              key={i}
              src={s.src}
              alt={s.alt}
              width={typeof s.src === "string" ? (s.width ?? 1204) : undefined}
              height={typeof s.src === "string" ? (s.height ?? 607) : undefined}
              sizes="(min-width: 1200px) 740px, (min-width: 600px) 70vw, 88vw"
              className="h-auto w-full rounded-xl"
              draggable={false}
            />
          ))}
        </Carousel>
      </Container>
    </section>
  );
}
