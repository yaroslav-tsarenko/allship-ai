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
import { ScrubWords } from "@/components/motion/scroll";
import {
  allFaq,
  allIntroJourney,
  allIntroStart,
  allPerspective,
  allVision,
} from "@/components/pages/all/content";
import { ServicesDirectory } from "@/components/pages/all/services-directory";
import { FAQSection } from "@/components/sections";
import { FeatureSpotlight, TheaterTabs } from "@/components/theater";
import { authLinks } from "@/content/site";
import { buildMetadata, JsonLd, jsonLd } from "@/lib/seo";

export const revalidate = 3600;

const path = "/all";

export const metadata = buildMetadata({
  title: "All Services: Moving, Vehicles, Freight and Trucks",
  description:
    "Explore every AllShip AI service: household and office moves, car, boat and RV transport, freight, heavy equipment and truck rental, with verified carriers and escrow.",
  path,
});

function ValueList({ items, id }: { items: React.ReactNode[]; id: string }) {
  return (
    <ol
      aria-labelledby={id}
      className="border-outline-variant medium:grid-cols-2 medium:gap-x-12 mt-10 grid border-t"
    >
      {items.map((item, i) => (
        <li
          key={i}
          className="border-outline-variant text-body-lg text-on-surface-variant grid grid-cols-[44px_minmax(0,1fr)] gap-3 border-b py-6 text-pretty"
        >
          <span className="text-title-md text-primary font-mono tabular-nums">
            {String(i + 1).padStart(2, "0")}
          </span>
          <div>{item}</div>
        </li>
      ))}
    </ol>
  );
}

export default function AllServicesPage() {
  const values = allVision.sections[0]!.list!.items;
  const principles = allPerspective.sections[0]!.list!.items;
  return (
    <>
      <JsonLd data={jsonLd.breadcrumbs([{ name: "All services", path }])} />
      <FunnelHero
        id="all-title"
        eyebrow="All services"
        title="Moves, vehicles, freight and trucks."
        highlight="One marketplace for all of it."
        lead="Each of the 23 shipment types has its own form, so carriers get the details they need to price it. Verified carriers bid, and your payment waits in escrow until delivery."
      >
        <div id="all-quote">
          <QuoteStarter />
        </div>
      </FunnelHero>

      <Container>
        <TrustStrip />
      </Container>

      <ServicesDirectory />

      <section aria-labelledby="all-vision" className="medium:py-24 py-16">
        <Container>
          <p className="text-title-sm text-primary font-medium">Our vision</p>
          <h2
            id="all-vision"
            className="text-headline-lg text-on-surface medium:text-display-sm mt-3 max-w-[880px] font-normal text-balance"
          >
            {allVision.title}
          </h2>
          <ScrubWords
            className="text-headline-sm text-on-surface medium:text-headline-md mt-8 max-w-[1040px] font-normal text-pretty"
            accent={["anything,", "verified", "escrow"]}
            text="Our mission is to make it simple to ship anything, from a household move to a car, a pallet of freight or a piece of heavy equipment, through a transparent marketplace where verified carriers bid and payment waits in escrow until delivery."
          />
          <h3 id="all-values" className="text-title-lg text-on-surface mt-14">
            {allVision.sections[0]!.title}
          </h3>
          <ValueList id="all-values" items={values} />
        </Container>
      </section>

      <section aria-labelledby="all-tour" className="bg-surface-container-low medium:py-24 py-16">
        <Container>
          <div className="large:grid-cols-2 large:items-end large:gap-16 mb-10 grid gap-4">
            <h2
              id="all-tour"
              className="text-headline-lg text-on-surface medium:text-display-sm font-normal text-balance"
            >
              {allIntroStart.title}
            </h2>
            <p className="text-body-lg text-on-surface-variant max-w-[56ch] text-pretty">
              {allIntroStart.description}
            </p>
          </div>
          <TheaterTabs
            label="How AllShip AI works"
            tabs={[
              { scene: "postLoad", label: "Post" },
              { scene: "bidsCompare", label: "Compare" },
              { scene: "liveTracking", label: "Track" },
              { scene: "escrowFlow", label: "Pay" },
            ]}
          />
        </Container>
      </section>

      <section aria-label="Works on every screen" className="medium:py-24 py-16">
        <Container>
          <FeatureSpotlight
            scene="adaptive"
            eyebrow="Perspective"
            title={allPerspective.title}
            description={allPerspective.description}
          />
          <h3 id="all-principles" className="text-title-lg text-on-surface mt-16">
            {allPerspective.sections[0]!.title}
          </h3>
          <ValueList id="all-principles" items={principles} />
        </Container>
      </section>

      <PriceBreakdown visual="static" />

      <NextTimeline />

      <FAQSection items={allFaq} tone="low" />

      <PhotoCta
        id="all-journey"
        title={allIntroJourney.title}
        description={allIntroJourney.description}
        primary={{ label: "Get a quote", href: "/quote", track: "all_final_quote" }}
        secondary={{ label: "Create free account", href: authLinks.signUp.href }}
        image={{
          src: "/images/warehouse-wrapped-goods.jpg",
          alt: "Wrapped goods staged in a warehouse for loading",
        }}
      />

      <StickyFunnelCta
        href="#all-quote"
        label="Get prices"
        note="Free to post · pay only when you book"
        hideWhileVisible="all-quote"
        track="all_sticky"
      />
    </>
  );
}
