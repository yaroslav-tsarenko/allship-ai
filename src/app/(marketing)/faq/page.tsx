import Link from "next/link";
import { CtaBand } from "@/components/marketing/cta-band";
import { Faq } from "@/components/marketing/faq";
import { Container } from "@/components/marketing/section";
import { faqGroups } from "@/components/marketing/company/faq-content";
import { PageIntro } from "@/components/marketing/company/page-intro";
import { FaqFilter } from "@/components/marketing/company/faq-filter";
import { Icon } from "@/components/ui/icon";
import { searchIcon } from "@/components/ui/icons.generated";
import { site } from "@/content/site";
import { buildMetadata, JsonLd, jsonLd } from "@/lib/seo";

const path = "/faq";

export const metadata = buildMetadata({
  title: "FAQ: Shipping, Carriers, Payments and Safety",
  description: `Answers about AllShip AI for shippers and carriers: getting bids, the ${site.platformFeePercent}% service fee, escrow and payout timing, carrier verification and privacy.`,
  path,
});

export default function FaqPage() {
  const all = faqGroups.flatMap((g) => g.items);
  return (
    <>
      <JsonLd data={jsonLd.faq(all)} />
      <PageIntro
        crumbs={[{ name: "FAQ", path }]}
        title="Frequently asked questions"
        lead="Straight answers about how AllShip AI works, grouped by who is asking."
        aside={<FaqFilter target="#faq-groups" icon={<Icon icon={searchIcon} />} />}
      />

      <Container className="pb-16 medium:pb-24">
        <div className="grid grid-cols-1 gap-10 large:grid-cols-[220px_minmax(0,1fr)] large:gap-20">
          <nav aria-label="FAQ topics" className="large:sticky large:top-24 large:self-start">
            <p className="sr-only large:not-sr-only large:mb-3 large:text-label-lg large:text-on-surface-variant">Jump to</p>
            <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 large:mx-0 large:flex-col large:gap-1 large:overflow-visible large:px-0">
              {faqGroups.map((g) => (
                <li key={g.id} className="shrink-0">
                  <a
                    href={`#${g.id}`}
                    className="inline-flex h-10 items-center gap-2 rounded-sm border border-outline-variant px-4 text-label-lg text-on-surface hover:bg-surface-container large:w-full large:justify-between large:rounded-full large:border-0"
                  >
                    {g.label}
                    <span className="font-mono text-label-md text-on-surface-variant">{g.items.length}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div id="faq-groups" className="flex flex-col gap-16 medium:gap-20">
            {faqGroups.map((g) => (
              <section key={g.id} data-faq-group="" id={g.id} aria-labelledby={`${g.id}-h`} className="scroll-mt-24">
                <div className="flex flex-col gap-1 medium:flex-row medium:items-baseline medium:justify-between medium:gap-8">
                  <h2 id={`${g.id}-h`} className="text-headline-md font-normal text-on-surface medium:text-headline-lg">
                    {g.label}
                  </h2>
                  <p className="text-body-lg text-on-surface-variant">{g.intro}</p>
                </div>
                <Faq items={g.items} schema={false} className="mt-6" />
              </section>
            ))}
            <p className="text-body-lg text-pretty text-on-surface-variant">
              Did not find your question?{" "}
              <Link href="/contact-us" className="text-primary underline-offset-4 hover:underline">
                Contact us
              </Link>{" "}
              or call{" "}
              <a href={site.phone.href} className="text-primary underline-offset-4 hover:underline">
                {site.phone.display}
              </a>
              .
            </p>
          </div>
        </div>
      </Container>

      <CtaBand
        title="Ready to see real bids?"
        description="Post your load for free. Verified carriers bid, and you pay only when you accept one."
        primary={{ label: "Get a quote", href: "/quote" }}
        secondary={{ label: "I'm a carrier", href: "/partners" }}
      />
    </>
  );
}
