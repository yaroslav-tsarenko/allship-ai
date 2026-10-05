import Image from "next/image";
import {
  FunnelHero,
  NextTimeline,
  PhotoCta,
  PriceBreakdown,
  QuoteStarter,
  StickyFunnelCta,
  TrustStrip,
} from "@/components/marketing/funnel";
import { Container } from "@/components/marketing/section";
import {
  shipBest,
  shipFaq,
  shipGreen,
  shipIntroAgain,
  shipIntroEasy,
  shipTracking,
} from "@/components/pages/ship/content";
import { ClientReviews, FAQSection } from "@/components/sections";
import { FeatureSpotlight, TheaterTabs } from "@/components/theater";
import { CheckList } from "@/components/marketing/check-list";
import { authLinks } from "@/content/site";
import { buildMetadata, JsonLd, jsonLd } from "@/lib/seo";

export const revalidate = 3600;

const path = "/ship";
const description =
  "Ship furniture, vehicles, pallets and full truckloads with FMCSA-verified carriers. Compare bids, track your load live and pay into escrow released after delivery.";

export const metadata = buildMetadata({
  title: "Shipping with Verified Carriers and Live Tracking",
  description,
  path,
});

export default function ShipPage() {
  return (
    <>
      <JsonLd
        data={[
          jsonLd.breadcrumbs([{ name: "Ship", path }]),
          jsonLd.service({
            name: "Shipping with verified carriers",
            description,
            path,
            serviceType: "Freight and shipping",
          }),
        ]}
      />
      <FunnelHero
        id="ship-title"
        eyebrow="Ship with AllShip AI"
        title="Post once, let verified carriers compete,"
        highlight="pay after delivery"
        lead={shipIntroEasy.description}
      >
        <div id="ship-quote">
          <QuoteStarter />
        </div>
      </FunnelHero>

      <Container>
        <TrustStrip />
      </Container>

      <section aria-labelledby="ship-tour" className="medium:py-24 py-16">
        <Container>
          <div className="large:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] large:items-end large:gap-16 mb-10 grid gap-4">
            <h2
              id="ship-tour"
              className="text-headline-lg text-on-surface medium:text-display-sm font-normal text-balance"
            >
              {shipBest.title}
            </h2>
            <p className="text-body-lg text-on-surface-variant max-w-[56ch] text-pretty">
              This is the real product, step by step: post a load, compare bids, follow the truck and release
              payment. Demo data is illustrative.
            </p>
          </div>
          <TheaterTabs
            label="Shipping on AllShip AI"
            tabs={[
              { scene: "postLoad", label: "Post" },
              { scene: "bidsCompare", label: "Compare" },
              { scene: "liveTracking", label: "Track" },
              { scene: "escrowFlow", label: "Pay" },
            ]}
          />
        </Container>
      </section>

      <section aria-label="AI assistant" className="bg-surface-container-low medium:py-24 py-16">
        <Container>
          <FeatureSpotlight
            scene="aiAssistant"
            eyebrow="Optimized shipping for every need"
            title="An assistant that does the busywork, never the deciding"
            description="Describe the load in plain words and the assistant drafts it, estimates a fair price and compares bids. You review everything before it is posted or booked."
          >
            <CheckList items={shipBest.assistant} />
          </FeatureSpotlight>
        </Container>
      </section>

      <PriceBreakdown visual="static" tone="surface" title="Cost-effective and transparent pricing" />

      <section aria-label="Live tracking" className="bg-surface-container-low medium:py-24 py-16">
        <Container>
          <FeatureSpotlight
            scene="liveTracking"
            reverse
            eyebrow={shipTracking.eyebrow}
            title={shipTracking.title}
            description={shipTracking.description}
          />
        </Container>
      </section>

      <section aria-labelledby="ship-green" className="medium:py-24 py-16">
        <Container>
          <div className="large:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] large:items-center large:gap-16 grid gap-10">
            <figure className="large:aspect-[5/4] relative m-0 aspect-[4/3] overflow-hidden rounded-xl">
              <Image
                src="/images/truck-interior-tiers.jpg"
                alt="Truck loaded in tiers with blankets and straps"
                fill
                sizes="(min-width: 1200px) 700px, 100vw"
                className="scale-110 object-cover"
                data-speed="0.1"
              />
            </figure>
            <div>
              <p className="text-title-sm text-primary font-medium">{shipGreen.eyebrow}</p>
              <h2
                id="ship-green"
                className="text-headline-lg text-on-surface medium:text-display-sm mt-3 font-normal text-balance"
              >
                {shipGreen.title}
              </h2>
              <p className="text-body-lg text-on-surface-variant mt-4 text-pretty">{shipGreen.description}</p>
              <ol className="border-outline-variant mt-8 border-t">
                {shipGreen.points.map((p, i) => (
                  <li
                    key={p}
                    className="border-outline-variant text-body-lg text-on-surface grid grid-cols-[40px_minmax(0,1fr)] gap-3 border-b py-4 text-pretty"
                  >
                    <span className="text-title-md text-primary font-mono tabular-nums">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {p}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </Container>
      </section>

      <NextTimeline
        tone="low"
        lead="From the first post to the payout, every step happens in your AllShip account, with an email or push notification when something needs you."
      />

      <ClientReviews placement="ship" />

      <FAQSection items={shipFaq} />

      <PhotoCta
        id="ship-again"
        title={shipIntroAgain.title}
        description={shipIntroAgain.description}
        primary={{ label: "Get a quote", href: "/quote", track: "ship_final_quote" }}
        secondary={{ label: "Create free account", href: authLinks.signUp.href }}
        image={{
          src: "/images/box-truck-side.jpg",
          alt: "White box truck at a loading dock, seen from the side",
        }}
      />

      <StickyFunnelCta
        href="#ship-quote"
        label="Get prices"
        note="Free to post · pay only when you book"
        hideWhileVisible="ship-quote"
        track="ship_sticky"
      />
    </>
  );
}
