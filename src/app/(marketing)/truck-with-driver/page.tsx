import {
  NextTimeline,
  PhotoCta,
  PriceBreakdown,
  StickyFunnelCta,
  TrustStrip,
  type TimelineStep,
} from "@/components/marketing/funnel";
import { Container } from "@/components/marketing/section";
import { FAQSection, MainHeading } from "@/components/sections";
import { FeatureSpotlight } from "@/components/theater";
import {
  gavelIcon,
  lockClockIcon,
  nearMeIcon,
  searchIcon,
  taskAltIcon,
} from "@/components/ui/icons.generated";
import { ClientReviews } from "@/components/sections/client-reviews";
import { heroDescription, quoteHref, steps, truckFaq } from "@/components/pages/truck-with-driver/content";
import { HeroCompare } from "@/components/pages/truck-with-driver/hero-compare";
import { PopularRoutes } from "@/components/pages/truck-with-driver/routes";
import { MarketplaceStatsRow } from "@/components/pages/truck-with-driver/stats";
import { Trucks } from "@/components/pages/truck-with-driver/trucks";
import { authLinks, site } from "@/content/site";
import { buildMetadata, JsonLd, jsonLd } from "@/lib/seo";

export const revalidate = 3600;

const path = "/truck-with-driver";
const title = "Rent a Truck with Driver by the Hour";
const description = `Hire a truck with a professional driver by the hour or at a flat price for pickups, deliveries and small moves. Verified carriers bid; you pay the bid plus ${site.platformFeePercent}%, held in escrow.`;

export const metadata = buildMetadata({ title, description, path });

const timeline: TimelineStep[] = [
  { icon: searchIcon, when: "Today, a few minutes", title: steps[0]!.title, body: steps[0]!.description },
  { icon: gavelIcon, when: "Usually within hours", title: steps[1]!.title, body: steps[1]!.description },
  {
    icon: lockClockIcon,
    when: "When you choose",
    title: "Accept and pay into escrow",
    body: `You pay the bid plus the ${site.platformFeePercent}% service fee. The carrier is not paid yet.`,
  },
  {
    icon: nearMeIcon,
    when: "On the day",
    title: "Follow the job",
    body: "The driver updates the trip status from their phone, with photos at pickup and delivery.",
  },
  {
    icon: taskAltIcon,
    when: "When it's done",
    title: steps[2]!.title,
    body: `Confirm the job is done, or it auto-confirms ${site.autoConfirmHours} hours after delivery with no dispute.`,
  },
];

export default function TruckWithDriverPage() {
  return (
    <>
      <JsonLd
        data={[
          jsonLd.breadcrumbs([{ name: "Truck with driver", path }]),
          jsonLd.service({ name: "Truck with driver", description, path, serviceType: "Truck with driver" }),
          {
            "@context": "https://schema.org",
            "@type": "HowTo",
            name: "How to rent a truck with a driver on AllShip AI",
            step: steps.map((s, i) => ({
              "@type": "HowToStep",
              position: i + 1,
              name: s.title,
              text: s.description,
            })),
          },
        ]}
      />
      <MainHeading
        title="Rent a truck"
        highlight="with a driver"
        description={heroDescription}
        ctas={[
          { label: "Get bids", href: quoteHref, variant: "filled", track: "twd_hero_quote" },
          { label: "Compare trucks", href: "#trucks", variant: "outlined" },
        ]}
        media={<HeroCompare />}
      />
      <Container>
        <TrustStrip />
      </Container>
      <MarketplaceStatsRow />
      <Trucks />
      <NextTimeline id="twd-next" title="How it works" steps={timeline} tone="low" />
      <section aria-label="The driver's side" className="medium:py-24 py-16">
        <Container>
          <FeatureSpotlight
            scene="driverTrip"
            device="phone"
            eyebrow="During the job"
            title="The driver runs the job from a phone. You see every step."
            description="Trip started, pickup photos, live location and a signed delivery: the same milestones appear on your load page as they happen. Demo data is illustrative."
          />
        </Container>
      </section>
      <PriceBreakdown
        title="Hourly or flat, the math is the same"
        exampleBidCents={48_000}
        exampleLabel="Example: a carrier bids 4 hours at $120 an hour"
        lead="Carriers bid by the hour or at a flat price. Whatever they bid, you pay it plus our service fee, held in escrow, and the carrier keeps 100% of the bid."
      />
      <PopularRoutes />
      <ClientReviews placement="truck-with-driver" />
      <FAQSection items={truckFaq} />
      <PhotoCta
        id="twd-final"
        title="Need a truck and a driver this week?"
        description="Post your job for free, compare bids from verified carriers and pay into escrow only when you book."
        primary={{ label: "Rent Truck", href: quoteHref, track: "twd_final_quote" }}
        secondary={{ label: "Become Shipper", href: authLinks.signUp.href }}
        image={{ src: "/images/box-truck-yard.jpg", alt: "Box truck parked in a yard" }}
      />
      <StickyFunnelCta
        href={quoteHref}
        label="Get bids"
        note="Free to post · pay only when you book"
        track="twd_sticky"
      />
    </>
  );
}
