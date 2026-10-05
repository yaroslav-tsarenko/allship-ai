import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/marketing/section";
import { Icon } from "@/components/ui/icon";
import { arrowForwardIcon } from "@/components/ui/icons.generated";
import { categoryFreight, categoryHeavyEquipment, categoryMoving, categoryVehicles, legacyAlt } from "@/assets/legacy";
import { SectionHeader } from "./section-header";
import { sectionId, type SectionImage } from "./types";

export type LoadCategoryItem = { label: string; title: string; href: string; image: SectionImage };

export const defaultLoadCategories: LoadCategoryItem[] = [
  { label: "Vehicles & Boats", title: "Cars, boats, motorcycles, RVs, trailers, parts", href: "/vehicle-load", image: { src: categoryVehicles, alt: legacyAlt.categoryVehicles } },
  { label: "Moving", title: "Furniture, appliances", href: "/moving-load", image: { src: categoryMoving, alt: legacyAlt.categoryMoving } },
  { label: "Heavy Equipment", title: "Farm, construction", href: "/heavy-load", image: { src: categoryHeavyEquipment, alt: legacyAlt.categoryHeavyEquipment } },
  { label: "Freight", title: "LTL, FTL", href: "/freight-load", image: { src: categoryFreight, alt: legacyAlt.categoryFreight } },
];

export function LoadCategories({ title, description, items = defaultLoadCategories, id }: { title?: string; description?: string; items?: LoadCategoryItem[]; id?: string }) {
  const headingId = id ?? sectionId("categories", title ?? "load-categories");
  return (
    <section aria-labelledby={headingId} className="py-10 medium:py-14">
      <Container>
        {title ? <SectionHeader id={headingId} title={title} description={description} className="mb-10" /> : <h2 id={headingId} className="sr-only">Choose what you are shipping</h2>}
        <ul className="grid gap-3 medium:grid-cols-2 large:grid-cols-4">
          {items.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="group state-layer relative flex h-full min-h-[220px] flex-col overflow-hidden rounded-lg bg-surface-container-low p-5 text-on-surface transition-[background-color,border-radius] duration-(--duration-medium2) ease-standard hover:rounded-xl hover:bg-surface-container"
              >
                <span className="text-label-lg font-medium text-primary">{item.label}</span>
                <span className="mt-1 max-w-[220px] text-title-lg text-pretty">{item.title}</span>
                <span className="mt-auto inline-flex items-center gap-1 pt-6 text-label-lg font-medium text-on-surface-variant group-hover:text-primary">
                  Post a load
                  <Icon icon={arrowForwardIcon} size={18} className="transition-transform duration-(--duration-medium2) ease-standard group-hover:translate-x-1" />
                </span>
                <Image
                  src={item.image.src}
                  alt={item.image.alt}
                  width={typeof item.image.src === "string" ? (item.image.width ?? 400) : undefined}
                  height={typeof item.image.src === "string" ? (item.image.height ?? 300) : undefined}
                  sizes="(min-width: 1200px) 180px, 45vw"
                  className="pointer-events-none absolute right-0 bottom-0 h-auto w-[52%] max-w-[200px] object-contain transition-transform duration-(--duration-long2) ease-(--ease-emphasized-decelerate) group-hover:scale-105"
                />
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
