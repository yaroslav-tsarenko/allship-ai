import Link from "next/link";
import { CtaButtons, Description, FAQSection } from "@/components/sections";
import { ClientReviews } from "@/components/sections/client-reviews";
import { StickyCta } from "@/components/marketing/landing/lp-parts";
import { Container } from "@/components/marketing/section";
import { FeatureSpotlight, TheaterTabs } from "@/components/theater";
import { Truck } from "@/components/theater/illustrations";
import { CarrierSignUp } from "@/components/pages/partners/carrier-sign-up";
import { dispatchIntro, dispatchSections, partnersFaq, partnersIntro } from "@/components/pages/partners/content";
import { DispatchCompare } from "@/components/pages/partners/dispatch-compare";
import { HeroProof } from "@/components/pages/partners/hero-proof";
import { LanesBand, PartnersHero, PayoutStory, Requirements, TeamRoles } from "@/components/pages/partners/sections";
import { authLinks, site } from "@/content/site";
import { buildMetadata, JsonLd, jsonLd } from "@/lib/seo";

export const revalidate = 3600;

const path = "/partners";
const title = "Partner with AllShip AI: Loads for Carriers, 100% of Your Bid";
const description = `Carriers bid their own price on moves, vehicles, freight and heavy equipment and keep 100% of it. Shippers pay the ${site.platformFeePercent}% fee. Optional dispatch service available.`;

export const metadata = buildMetadata({ title, description, path });

const link = "rounded-xs font-medium text-primary underline-offset-4 hover:underline";

export default function PartnersPage() {
  return (
    <>
      <JsonLd
        data={[
          jsonLd.breadcrumbs([{ name: "Partners", path }]),
          jsonLd.service({ name: "AllShip AI for carriers", description, path, serviceType: "Freight load board and marketplace for carriers" }),
          jsonLd.service({ name: "AllShip AI dispatch service", description: dispatchIntro, path: `${path}#dispatch`, serviceType: "Truck dispatch service" }),
        ]}
      />
      <PartnersHero proof={<HeroProof />} />

      <section aria-labelledby="tour-title" className="bg-surface-container-low py-16 medium:py-24">
        <Container>
          <div className="grid gap-6 large:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] large:gap-16">
            <div>
              <p className="text-title-sm font-medium text-primary">AI load matching, inside a carrier account</p>
              <h2 id="tour-title" className="mt-3 text-headline-lg font-normal text-balance medium:text-display-sm">
                The tools you get the day you are verified
              </h2>
            </div>
            <div className="flex flex-col gap-4 text-body-lg text-pretty text-on-surface-variant">
              <p>{partnersIntro}</p>
              <p>
                Filter the board by load type and pickup state, or ask the AllShip AI assistant for loads that match your service area and equipment. Every load shows the pickup and delivery areas, distance and dates before you bid, and the bid form shows exactly what you receive.{" "}
                <Link href="/loads" className={link}>
                  See what is on the board today
                </Link>
              </p>
            </div>
          </div>
          <TheaterTabs
            className="mt-12"
            label="Carrier account tour"
            caption="Illustrative demo of the carrier side of AllShip AI with sample data."
            tabs={[
              { scene: "carrierBoard", label: "Find and bid" },
              { scene: "fleet", label: "Fleet" },
              { scene: "driverTrip", label: "Driver app" },
              { scene: "chat", label: "Messages" },
              { scene: "escrowFlow", label: "Payout" },
            ]}
          />
        </Container>
      </section>

      <PayoutStory />

      <section aria-label="Instant quotes" className="py-20 medium:py-28">
        <Container>
          <FeatureSpotlight
            scene="rateCard"
            reverse
            eyebrow="Instant quotes for movers"
            title="Get booked without bidding, at the rates you publish"
            description="Set a rate per cubic foot for each distance range, plus packing, unpacking and storage. Shippers on the moving page see your price next to other movers and can book you on the spot. You get a bid at that price and 24 hours to withdraw it."
          >
            <Link href="/moving" className={link}>
              See the moving page shippers use
            </Link>
          </FeatureSpotlight>
        </Container>
      </section>

      <section aria-labelledby="team-title" className="bg-surface-container-low py-20 medium:py-28">
        <Container>
          <div className="grid gap-12 large:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] large:gap-20">
            <div>
              <p className="text-title-sm font-medium text-primary">One account for your whole team</p>
              <h2 id="team-title" className="mt-3 text-headline-lg font-normal text-balance medium:text-display-sm">
                Owner, dispatchers and drivers, each with the right view
              </h2>
              <p className="mt-5 max-w-[520px] text-body-lg text-pretty text-on-surface-variant">
                Your drivers update trips from their phones, so you and the shipper see each status and every truck on the fleet map while trips are active. That record builds your reputation as a reliable carrier.
              </p>
              <Truck className="mt-10 max-w-[280px]" />
            </div>
            <TeamRoles />
          </div>
        </Container>
      </section>

      <LanesBand />
      <Requirements />
      <CarrierSignUp />
      <ClientReviews placement="partners" title="What our partners say" />
      <FAQSection items={partnersFaq} />
      <Description id="dispatch" title="Partnership" eyebrow="Optional dispatch service" description={dispatchIntro} sections={dispatchSections} toc tone="low">
        <DispatchCompare />
        <CtaButtons
          className="mt-10"
          ctas={[
            { label: "Ask about dispatch", href: "/contact-us?topic=carrier", variant: "filled", track: "partners_dispatch_contact" },
            { label: "Sign up as a carrier", href: "#carrier-sign-up", variant: "outlined" },
          ]}
        />
      </Description>
      <StickyCta href={authLinks.carrierSignUp.href} label="Become a carrier" note="Free to bid. Keep 100% of it." />
    </>
  );
}
