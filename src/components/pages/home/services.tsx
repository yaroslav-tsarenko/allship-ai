import Link from "next/link";
import { Container } from "@/components/marketing/section";
import { ServicesTruck } from "@/components/theater/illustrations";
import { Button } from "@/components/ui/button";
import { categories, categoriesInGroup, categoryGroups, hubCanonical, type Category } from "@/content/categories";
import { cn } from "@/lib/cn";
import { homeServices } from "./content";
import { eyebrow, sectionTitle } from "./shared";

const hrefFor = (c: Category) => hubCanonical[c.key] ?? `/services/${c.slug}`;

export function HomeServices() {
  return (
    <section aria-labelledby="home-services" className="py-16 medium:py-24">
      <Container>
        <div className="grid grid-cols-[minmax(0,1fr)] gap-x-16 gap-y-8 large:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] large:items-center">
          <div>
            <p className={eyebrow}>Services</p>
            <h2 id="home-services" className={`mt-3 ${sectionTitle}`}>
              Four kinds of job, {categories.length} load categories, one way to book
            </h2>
            <p className="mt-4 max-w-[52ch] text-body-lg text-pretty text-on-surface-variant">
              Each group has its own form with the fields that matter for it. Whatever you ship, the rest is the same: verified carriers, bids, escrow, tracking and delivery proof.
            </p>
          </div>
          <figure className="min-w-0">
            <ServicesTruck
              className="w-full"
              title="A truck cut away into four numbered sections: 1 boxes and furniture for moving, 2 a car for vehicles, 3 a crate on a pallet for freight and equipment, 4 the cab with its driver for truck rental."
            />
            <figcaption className="sr-only">The numbers match the four service groups listed below.</figcaption>
          </figure>
        </div>
        <ol className="mt-12 grid grid-cols-[minmax(0,1fr)] border-t border-outline-variant medium:grid-cols-2">
          {homeServices.map((g, i) => {
            const group = categoryGroups[g.key];
            const items = categoriesInGroup(g.key);
            return (
              <li
                key={g.key}
                className={cn(
                  "grid grid-cols-[2.5rem_minmax(0,1fr)] gap-x-3 border-b border-outline-variant py-8 medium:pr-8",
                  i % 2 === 1 && "medium:border-l medium:pr-0 medium:pl-8",
                )}
              >
                <span aria-hidden="true" className="flex size-9 items-center justify-center rounded-full border-2 border-on-surface font-mono text-title-sm text-on-surface">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <h3 className="text-headline-sm text-on-surface">{group.label}</h3>
                  <p className="mt-1 text-body-lg text-pretty text-on-surface-variant">{g.summary}</p>
                  <p className="mt-4 text-label-lg text-on-surface-variant">
                    {items.length} {items.length === 1 ? "category" : "categories"}
                  </p>
                  <ul className="mt-2 flex flex-wrap gap-x-1 gap-y-1 text-body-md" aria-label={`${group.label} categories`}>
                    {items.map((c, ci) => (
                      <li key={c.key}>
                        <Link href={hrefFor(c)} className="rounded-xs text-on-surface underline decoration-outline-variant underline-offset-4 hover:text-primary hover:decoration-primary">
                          {c.name}
                        </Link>
                        {ci < items.length - 1 && <span aria-hidden="true" className="text-outline">, </span>}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 text-body-md text-pretty text-on-surface">
                    <span className="font-medium">Price: </span>
                    {g.pricing}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {g.actions.map((a, ai) => (
                      <Button key={a.href} asChild variant={ai === 0 ? "tonal" : "text"}>
                        <Link href={a.href} data-track={`home_service_${g.key}`}>
                          {a.label}
                        </Link>
                      </Button>
                    ))}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </Container>
    </section>
  );
}
