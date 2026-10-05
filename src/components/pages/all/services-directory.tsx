import Link from "next/link";
import { Container } from "@/components/marketing/section";
import { SectionHeader } from "@/components/sections";
import { CarCarrier, Dolly, Pallet, Truck } from "@/components/theater/illustrations";
import { Icon } from "@/components/ui/icon";
import { arrowForwardIcon } from "@/components/ui/icons.generated";
import {
  categories,
  categoryGroups,
  hubCanonical,
  type Category,
  type CategoryGroup,
} from "@/content/categories";
import { site } from "@/content/site";
import { JsonLd } from "@/lib/seo";

const art = { moving: Dolly, vehicles: CarCarrier, freight: Pallet, trucks: Truck } satisfies Record<
  CategoryGroup,
  unknown
>;

const groups: Array<{ group: CategoryGroup; intro: string; hubs: Array<{ label: string; href: string }> }> = [
  {
    group: "moving",
    intro: "Homes, offices and single items, priced by volume, distance, crew and access.",
    hubs: [
      { label: "Moving quotes", href: "/moving" },
      { label: "Post a moving load", href: "/moving-load" },
    ],
  },
  {
    group: "vehicles",
    intro: "Anything with wheels or a hull, on open or enclosed trailers.",
    hubs: [{ label: "Post a vehicle load", href: "/vehicle-load" }],
  },
  {
    group: "freight",
    intro: "Pallets, crates and machinery, including oversize loads.",
    hubs: [
      { label: "Post a freight load", href: "/freight-load" },
      { label: "Post a heavy load", href: "/heavy-load" },
    ],
  },
  {
    group: "trucks",
    intro: "A truck and a driver at your disposal, by the day or by the hour.",
    hubs: [
      { label: "Rent a truck", href: "/rent-truck" },
      { label: "Truck with driver", href: "/truck-with-driver" },
    ],
  },
];

const hrefFor = (c: Category) => hubCanonical[c.key] ?? `/services/${c.slug}`;

export function ServicesDirectory() {
  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "AllShip AI shipping services",
    itemListElement: categories.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      url: new URL(hrefFor(c), site.url).toString(),
    })),
  };
  return (
    <section aria-labelledby="all-services-title" className="bg-surface-container-low medium:py-24 py-16">
      <JsonLd data={itemList} />
      <Container>
        <SectionHeader
          id="all-services-title"
          eyebrow={`${categories.length} shipment types`}
          title="Every service on AllShip AI"
          description="Each shipment type has its own form, so carriers get the details they need to price your load. Pick one to see how it works, or post a load right away."
          className="mb-12"
        />
        <div className="medium:grid-cols-2 expanded:grid-cols-4 grid gap-x-10 gap-y-12">
          {groups.map(({ group, intro, hubs }) => {
            const Art = art[group];
            return (
              <nav key={group} aria-labelledby={`all-${group}`}>
                <Art className="mb-4 w-28" />
                <h3
                  id={`all-${group}`}
                  className="border-primary text-title-lg text-on-surface border-b-2 pb-3"
                >
                  {categoryGroups[group].label}
                </h3>
                <p className="text-body-md text-on-surface-variant mt-3 text-pretty">{intro}</p>
                <ul className="divide-outline-variant border-outline-variant mt-4 flex flex-col divide-y border-y">
                  {categories
                    .filter((c) => c.group === group)
                    .map((c) => (
                      <li key={c.slug}>
                        <Link
                          href={hrefFor(c)}
                          className="text-body-lg text-on-surface hover:text-primary block rounded-xs py-2.5 hover:underline"
                        >
                          {c.name}
                        </Link>
                      </li>
                    ))}
                </ul>
                <ul className="mt-4 flex flex-col gap-1">
                  {hubs.map((h) => (
                    <li key={h.href}>
                      <Link
                        href={h.href}
                        className="text-label-lg text-primary inline-flex items-center gap-1.5 rounded-xs py-1 font-medium hover:underline"
                      >
                        {h.label}
                        <Icon icon={arrowForwardIcon} size={16} />
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
