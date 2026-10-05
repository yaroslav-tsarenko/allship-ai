import Link from "next/link";
import { CtaButtons, Description, FAQSection } from "@/components/sections";
import { ClientReviews } from "@/components/sections/client-reviews";
import { FeeCalculator } from "@/components/marketing/core/fee-calculator";
import { Breadcrumbs } from "@/components/marketing/breadcrumbs";
import { Container } from "@/components/marketing/section";
import { enter } from "@/components/motion/enter";
import { RevealText } from "@/components/motion/reveal-text";
import { QuickQuote } from "@/components/pages/home/quick-quote";
import { pricingCompare, pricingFaq, pricingIntro, pricingSections } from "@/components/pages/pricing/content";
import { MarketRanges } from "@/components/pages/pricing/market-ranges";
import { Theater } from "@/components/theater";
import { Icon } from "@/components/ui/icon";
import { arrowForwardIcon, swapHorizIcon } from "@/components/ui/icons.generated";
import { authLinks, site } from "@/content/site";
import { buildMetadata, JsonLd, jsonLd } from "@/lib/seo";

export const revalidate = 3600;

const path = "/pricing";
const title = `Pricing: Carrier Bid Plus a ${site.platformFeePercent}% Service Fee`;
const description = `Transparent pricing for moving, freight, vehicles and truck rental: the carrier's bid plus a ${site.platformFeePercent}% fee, held in escrow until delivery. Carriers keep 100% of their bid.`;

export const metadata = buildMetadata({ title, description, path });

const fee = `${site.platformFeePercent}%`;

export default function PricingPage() {
  return (
    <>
      <JsonLd
        data={{
          ...jsonLd.service({ name: "AllShip AI marketplace service fee", description, path, serviceType: "Shipping marketplace" }),
          offers: { "@type": "Offer", description: `${fee} service fee on the accepted carrier bid, paid by the shipper`, priceCurrency: "USD" },
        }}
      />
      <header className="pt-6 pb-16 medium:pt-8 medium:pb-24">
        <Container>
          <Breadcrumbs items={[{ name: "Pricing", path }]} />
          <div className="mt-10 grid gap-12 large:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] large:items-start large:gap-20 medium:mt-14">
            <div>
              <p className="mb-4 text-title-sm font-medium text-primary" {...enter(0)}>
                One formula for every load
              </p>
              <h1 className="text-display-sm font-normal tracking-tight text-balance medium:text-display-lg">
                <RevealText>Pricing: the carrier’s bid plus</RevealText> <span className="text-primary"><RevealText delay={160}>{fee}</RevealText></span>
              </h1>
              <p className="mt-6 max-w-[620px] text-body-lg text-pretty text-on-surface-variant medium:text-title-lg medium:font-normal" {...enter(3)}>
                {pricingIntro}
              </p>
              <p aria-hidden="true" className="mt-10 flex flex-wrap items-baseline gap-x-4 gap-y-2 font-mono text-title-lg text-on-surface-variant medium:text-headline-sm" {...enter(4)}>
                <span className="text-on-surface">bid</span>
                <span>+</span>
                <span className="text-on-surface">{fee}</span>
                <span>=</span>
                <span className="text-primary">your total</span>
                <span className="basis-full font-sans text-body-md">held in escrow until delivery</span>
              </p>
            </div>
            <div id="fee-calculator" className="scroll-mt-24" {...enter(5)}>
              <FeeCalculator />
              <p className="mt-3 text-body-sm text-on-surface-variant">The carrier receives the full bid. The fee is shown again at checkout before you pay.</p>
            </div>
          </div>
        </Container>
      </header>

      <section aria-labelledby="escrow-title" className="bg-surface-container-low py-16 medium:py-24">
        <Container>
          <div className="grid gap-6 large:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] large:items-end large:gap-16">
            <h2 id="escrow-title" className="text-headline-lg font-normal text-balance medium:text-display-sm">
              Where your money is at every step
            </h2>
            <p className="text-body-lg text-pretty text-on-surface-variant medium:text-body-xl">
              You pay when you book. The carrier is paid after delivery. In between, the money waits in escrow through Stripe, and a dispute opened before you confirm holds it.
            </p>
          </div>
          <Theater scene="escrowFlow" className="mt-12" steps caption="Illustrative example with sample amounts." />
        </Container>
      </section>

      <section aria-labelledby="compare-title" className="py-16 medium:py-24">
        <Container>
          <h2 id="compare-title" className="max-w-[760px] text-headline-lg font-normal text-balance medium:text-display-sm">
            Who pays what
          </h2>
          <div className="mt-8 -mx-4 overflow-x-auto px-4 medium:mx-0 medium:px-0" role="region" aria-label="What shippers and carriers pay" tabIndex={0}>
            <table className="w-full min-w-[640px] border-collapse border-t border-on-surface text-left">
              <thead>
                <tr className="border-b border-outline-variant text-label-lg text-on-surface-variant">
                  <th scope="col" className="w-[30%] py-3 pr-4 font-medium">
                    <span className="sr-only">Item</span>
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Shippers
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium text-primary">
                    Carriers
                  </th>
                </tr>
              </thead>
              <tbody>
                {pricingCompare.map((r) => (
                  <tr key={r.item} className="border-b border-outline-variant">
                    <th scope="row" className="py-4 pr-4 text-title-sm font-medium text-on-surface">
                      {r.item}
                    </th>
                    <td className="px-4 py-4 text-body-lg text-on-surface-variant">{r.shipper}</td>
                    <td className="px-4 py-4 text-body-lg text-on-surface">{r.carrier}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Container>
      </section>

      <Description title="How bids are priced" eyebrow="The details" sections={pricingSections} toc tone="low">
        <MarketRanges />
        <CtaButtons
          className="mt-10"
          ctas={[
            { label: "Get bids for your load", href: "/quote", variant: "filled", track: "pricing_quote" },
            { label: "Become a carrier", href: authLinks.carrierSignUp.href, variant: "outlined" },
          ]}
        />
      </Description>

      <section aria-labelledby="start-title" className="py-16 medium:py-24">
        <Container>
          <h2 id="start-title" className="mx-auto max-w-[760px] text-center text-headline-lg font-normal text-balance medium:text-display-sm">
            See real prices for your route
          </h2>
          <p className="mx-auto mt-4 max-w-[620px] text-center text-body-lg text-pretty text-on-surface-variant">
            Moves get instant prices from movers&apos; published rates. Everything else gets bids from verified carriers. Posting is free.
          </p>
          <div className="mt-8">
            <QuickQuote arrowIcon={<Icon icon={arrowForwardIcon} size={20} />} swapIcon={<Icon icon={swapHorizIcon} size={22} />} />
          </div>
          <p className="mt-6 text-center text-body-md text-on-surface-variant">
            Need a rough range first? Try the{" "}
            <Link href="/tools/moving-cost-calculator" className="rounded-xs text-primary underline-offset-4 hover:underline">
              moving cost calculator
            </Link>
            .
          </p>
        </Container>
      </section>

      <ClientReviews placement="pricing" />
      <FAQSection title="Pricing questions" items={pricingFaq} tone="low" />
    </>
  );
}
