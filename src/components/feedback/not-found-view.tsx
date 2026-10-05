import Link from "next/link";
import { RoutePin } from "@/components/theater/illustrations";
import { categories } from "@/content/categories";
import { footerNav, legalNav, mainNav, shipNav, site } from "@/content/site";
import type { FinderEntry } from "./site-finder";
import { SiteFinderLazy } from "./site-finder-lazy";

function finderEntries(): FinderEntry[] {
  const seen = new Set<string>();
  const out: FinderEntry[] = [];
  const add = (label: string, href: string, group: string) => {
    if (seen.has(href)) return;
    seen.add(href);
    out.push({ label, href, group });
  };
  for (const c of categories) add(c.name, `/services/${c.slug}`, "Service");
  for (const g of footerNav) for (const l of g.links) add(l.label, l.href, g.label);
  for (const l of mainNav) add(l.label, l.href, "Company");
  for (const l of legalNav) add(l.label, l.href, "Legal");
  return out;
}

export function NotFoundView({ title = "This page isn't on our route" }: { title?: string }) {
  return (
    <div className="mx-auto w-full max-w-[1280px] px-4 py-16 medium:px-8 medium:py-24">
      <div className="grid gap-12 expanded:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] expanded:gap-20">
        <div className="flex flex-col gap-5">
          <div className="w-28">
            <RoutePin />
          </div>
          <p className="text-title-sm font-medium text-primary">404 · not found</p>
          <h1 className="text-headline-lg text-balance medium:text-display-md">{title}</h1>
          <p className="text-body-lg text-on-surface-variant">
            The link may be old, mistyped, or the page was moved. Search below or pick a service. Shipping something right now? <Link href="/quote" className="text-primary underline underline-offset-2">Get a quote</Link> and carriers start bidding.
          </p>
          <SiteFinderLazy entries={finderEntries()} />
        </div>
        <nav aria-label="Popular pages" className="grid gap-8 medium:grid-cols-3 expanded:pt-10">
          {shipNav.map((group) => (
            <div key={group.label}>
              <h2 className="border-b border-outline-variant pb-2 text-title-sm text-on-surface">{group.label}</h2>
              <ul className="mt-3 flex flex-col gap-2.5">
                {group.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-body-md text-on-surface-variant hover:text-on-surface hover:underline">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <p className="text-body-md text-on-surface-variant medium:col-span-3">
            Looking for your loads or bids? <Link href="/app" className="text-primary underline underline-offset-2">Open your dashboard</Link>. Something else missing? Email{" "}
            <a href={`mailto:${site.email}?subject=Broken%20link`} className="text-primary underline underline-offset-2">
              {site.email}
            </a>
            .
          </p>
        </nav>
      </div>
    </div>
  );
}
