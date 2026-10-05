import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  NextTimeline,
  PhotoCta,
  PriceBreakdown,
  StickyFunnelCta,
  TrustStrip,
} from "@/components/marketing/funnel";
import { Faq } from "@/components/marketing/faq";
import { Container, Section } from "@/components/marketing/section";
import { CategoryIndex } from "@/components/marketing/services/category-index";
import { CategoryVisual } from "@/components/marketing/services/category-visual";
import { Glance } from "@/components/marketing/services/glance";
import { NextSteps } from "@/components/marketing/services/next-steps";
import { PageHero } from "@/components/marketing/services/page-hero";
import { FeatureSpotlight } from "@/components/theater";
import { Icon } from "@/components/ui/icon";
import { arrowForwardIcon } from "@/components/ui/icons.generated";
import {
  categories,
  categoryBySlug,
  categoryGroups,
  type Category,
  hubCanonical,
} from "@/content/categories";
import { categoryDetails } from "@/content/category-details";
import { site } from "@/content/site";
import { buildMetadata, JsonLd, jsonLd } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return categories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = categoryBySlug(slug);
  if (!category) return {};
  const detail = categoryDetails[category.key];
  return buildMetadata({
    title: detail.metaTitle,
    description: detail.metaDescription,
    path: `/services/${category.slug}`,
    canonicalPath: hubCanonical[category.key],
  });
}

const hubs: Partial<Record<Category["key"], { label: string; href: string }>> = {
  heavy_equipment: { label: "Heavy equipment", href: "/heavy-load" },
  truck_with_driver: { label: "Truck with driver", href: "/truck-with-driver" },
};

const hubFor = (category: Category) => hubs[category.key] ?? categoryGroups[category.group];

const lowerFirst = (s: string) => (/^[A-Z]{2}/.test(s) ? s : s.charAt(0).toLowerCase() + s.slice(1));

const everyPost = [
  "Pickup and delivery addresses with date and time windows",
  "Extra stops along the route, if any",
  "Up to 5 photos and 5 files, such as spec sheets or floor plans",
  "Anything else carriers should know, in your own words",
];

export default async function ServiceCategoryPage({ params }: Props) {
  const { slug } = await params;
  const category = categoryBySlug(slug);
  if (!category) notFound();

  const detail = categoryDetails[category.key];
  const hub = hubFor(category);
  const path = `/services/${category.slug}`;
  const related = detail.related
    .map((key) => categories.find((c) => c.key === key))
    .filter((c): c is Category => Boolean(c));

  return (
    <>
      <JsonLd
        data={jsonLd.service({
          name: detail.h1,
          description: detail.metaDescription,
          path,
          serviceType: detail.serviceType,
        })}
      />

      <PageHero
        crumbs={[
          { name: "Services", path: "/all" },
          { name: category.name, path },
        ]}
        eyebrow={
          <Link href={hub.href} className="hover:underline">
            {hub.label}
          </Link>
        }
        title={detail.h1}
        lead={detail.intro}
        category={category.slug}
        source={`services_${category.slug}`}
        aside={<CategoryVisual category={category} priority="desktop" />}
        asideAlign="center"
      >
        <Glance items={detail.glance} className="mt-10" />
      </PageHero>

      <Container>
        <TrustStrip />
      </Container>

      <Section tone="low" spacing="md" labelledBy="needs-heading">
        <div className="large:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] large:gap-16 grid gap-10">
          <div>
            <h2
              id="needs-heading"
              className="text-headline-md medium:text-headline-lg font-normal text-balance"
            >
              What carriers need from you
            </h2>
            <p className="text-body-lg text-on-surface-variant mt-4 text-pretty">
              These are the fields in the {lowerFirst(category.name)} form. Complete answers let carriers bid
              on the real job instead of padding for unknowns.
            </p>
            <h3 className="text-title-sm text-on-surface mt-8 font-medium">Every post also includes</h3>
            <ul className="text-body-md text-on-surface-variant mt-3 flex flex-col gap-2">
              {everyPost.map((item) => (
                <li key={item} className="flex gap-2">
                  <span aria-hidden className="bg-outline mt-2 size-1.5 shrink-0 rounded-full" />
                  <span className="text-pretty">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="divide-outline-variant bg-surface medium:px-8 divide-y rounded-lg px-5">
            {detail.needs.map((group) => (
              <div
                key={group.title}
                className="medium:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] medium:gap-8 grid gap-3 py-6"
              >
                <h3 className="text-title-lg text-on-surface">{group.title}</h3>
                <ul className="flex flex-col gap-3">
                  {group.items.map((item) => (
                    <li key={item} className="text-body-lg text-on-surface-variant flex gap-3 text-pretty">
                      <span aria-hidden className="bg-primary mt-2.5 h-px w-3 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section spacing="md" labelledBy="prep-heading">
        <div className="large:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] large:gap-16 grid gap-12">
          <div>
            <h2
              id="prep-heading"
              className="text-headline-md medium:text-headline-lg font-normal text-balance"
            >
              Before pickup
            </h2>
            <ol className="expanded:grid-cols-2 mt-8 grid gap-x-10 gap-y-6">
              {detail.prep.map((tip, i) => (
                <li key={tip} className="flex gap-4">
                  <span className="text-title-lg text-primary w-8 shrink-0 font-mono tabular-nums">
                    {i + 1}
                  </span>
                  <p className="text-body-lg text-on-surface text-pretty">{tip}</p>
                </li>
              ))}
            </ol>
          </div>
          <aside className="large:border-l large:border-outline-variant large:pl-10">
            <NextSteps keys={detail.tools} />
          </aside>
        </div>
      </Section>

      <section aria-label="Posting a load" className="bg-surface-container-low medium:py-24 py-16">
        <Container>
          <FeatureSpotlight
            scene={category.group === "moving" ? "instantQuote" : "postLoad"}
            eyebrow={category.group === "moving" ? "Instant prices or bids" : "Posting takes a few minutes"}
            title={
              category.group === "moving"
                ? "See movers' prices now, or let them bid"
                : `Post your ${lowerFirst(category.shortName)} once`
            }
            description={
              category.group === "moving"
                ? "Movers who publish rates price standard moves instantly. Anything unusual, post it and verified movers bid. Demo data is illustrative."
                : `Pick ${lowerFirst(category.name)}, add the details above and the route. The load goes live after you confirm your email. Demo data is illustrative.`
            }
          />
        </Container>
      </section>

      <NextTimeline id="booking-heading" title="How booking and payment work" />

      <PriceBreakdown tone="low" />

      <Section spacing="md" labelledBy="faq-heading">
        <div className="large:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] large:gap-16 grid gap-8">
          <h2 id="faq-heading" className="text-headline-md medium:text-headline-lg font-normal text-balance">
            {category.name} questions
          </h2>
          <Faq items={detail.faqs} />
        </div>
      </Section>

      <Section spacing="sm" labelledBy="related-heading">
        <div className="medium:flex-row medium:items-end medium:justify-between flex flex-col gap-3">
          <h2 id="related-heading" className="text-headline-sm text-on-surface font-normal">
            Related services
          </h2>
          <Link
            href={hub.href}
            className="text-title-sm text-primary inline-flex items-center gap-1 font-medium hover:underline"
          >
            {hub.label} overview
            <Icon icon={arrowForwardIcon} size={18} />
          </Link>
        </div>
        <CategoryIndex items={related} className="mt-6" />
      </Section>

      <PhotoCta
        id="category-final"
        title="Post it once and compare verified bids"
        description={`Verified carriers bid on your job. You pay the accepted bid plus the ${site.platformFeePercent}% service fee, held in escrow until delivery.`}
        primary={{
          label: "Get a quote",
          href: `/quote?category=${category.slug}`,
          track: `services_${category.slug}_final`,
        }}
        secondary={{ label: "How pricing works", href: "/pricing" }}
        image={category.image.cutout ? undefined : { src: category.image.src, alt: category.image.alt }}
      />

      <StickyFunnelCta
        href={`/quote?category=${category.slug}`}
        label="Get a quote"
        note="Free to post · pay only when you book"
        hideWhileVisible="hero-quote"
        track={`services_${category.slug}_sticky`}
      />
    </>
  );
}
