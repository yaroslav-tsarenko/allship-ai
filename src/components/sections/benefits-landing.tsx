import Image from "next/image";
import { Container } from "@/components/marketing/section";
import { Icon } from "@/components/ui/icon";
import { keyboardArrowDownIcon } from "@/components/ui/icons.generated";
import { cn } from "@/lib/cn";
import { SectionHeader } from "./section-header";
import { sectionId, type SectionImage } from "./types";

export type BenefitLandingItem = { title: string; description: string; more?: string; image: SectionImage };

export function BenefitsLanding({ title, description, items, id, tone = "surface" }: { title: string; description?: string; items: BenefitLandingItem[]; id?: string; tone?: "surface" | "low" }) {
  const headingId = id ?? sectionId("benefits-landing", title);
  return (
    <section aria-labelledby={headingId} className={cn("py-14 medium:py-20", tone === "low" && "bg-surface-container-low")}>
      <Container>
        <SectionHeader id={headingId} title={title} description={description} className="mb-10" />
        <ul className="grid gap-x-6 gap-y-10 medium:grid-cols-2 large:grid-cols-3">
          {items.map((item) => (
            <li key={item.title} className="flex flex-col">
              <div className="overflow-hidden rounded-lg bg-surface-container">
                <Image
                  src={item.image.src}
                  alt={item.image.alt}
                  width={typeof item.image.src === "string" ? (item.image.width ?? 640) : undefined}
                  height={typeof item.image.src === "string" ? (item.image.height ?? 420) : undefined}
                  sizes="(min-width: 1200px) 400px, (min-width: 600px) 45vw, 100vw"
                  className="aspect-[16/10] h-auto w-full object-cover"
                />
              </div>
              <h3 className="mt-5 text-title-lg text-on-surface">{item.title}</h3>
              <p className="mt-2 text-body-lg text-pretty text-on-surface-variant">{item.description}</p>
              {item.more && (
                <details className="m3-details group mt-3">
                  <summary className="inline-flex cursor-pointer list-none items-center gap-1 rounded-xs text-label-lg font-medium text-primary marker:hidden [&::-webkit-details-marker]:hidden">
                    <span className="group-open:hidden">Learn more</span>
                    <span className="hidden group-open:inline">Show less</span>
                    <Icon icon={keyboardArrowDownIcon} size={18} className="transition-transform duration-(--duration-medium2) ease-(--ease-emphasized) group-open:rotate-180" />
                  </summary>
                  <p className="pt-2 text-body-md text-pretty text-on-surface-variant">{item.more}</p>
                </details>
              )}
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
