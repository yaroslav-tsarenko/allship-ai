import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { legacyAlt, legacyVideos, movingBenefitAi, movingBenefitNationwide, movingBenefitSupport, movingGallery1, movingGallery5, movingGallery7, movingScreen2, benefitRouteOptimization } from "@/assets/legacy";
import { Icon } from "@/components/ui/icon";
import { boltIcon, scheduleIcon, supportAgentIcon } from "@/components/ui/icons.generated";
import { Container } from "@/components/marketing/section";
import {
  AdvantagesLine,
  BenefitsLanding,
  BenefitWrapper,
  ClientReviews,
  ComparisonTable,
  Description,
  FAQSection,
  FullScreenImage,
  FullSlider,
  HowItWorks,
  ImageGallery,
  InfoWithIcons,
  Introduction,
  LoadCategories,
  MainHeading,
  ReadyToGetStarted,
  RouteEstimate,
  TrustCompanies,
  UniversalSection,
} from "@/components/sections";

export const metadata: Metadata = { title: "Section library", robots: { index: false, follow: false } };

function Label({ children }: { children: string }) {
  return (
    <Container>
      <p className="mt-6 inline-flex rounded-xs bg-tertiary-container px-2 py-1 font-mono text-body-sm text-on-tertiary-container">{children}</p>
    </Container>
  );
}

export default function SectionsGallery() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <>
      <Label>MainHeading</Label>
      <MainHeading
        checkmarks={["Residential & Business", "Ship Anything to Anywhere"]}
        kicker="Maximize savings, reduce time, automate control"
        title="Every shipment,"
        highlight="one platform"
        description="AllShip AI is your AI-driven shipping ally, with tools for posting, tracking and managing shipments with precision and care."
        video={legacyVideos.howItWorksDemo}
      />
      <Label>LoadCategories</Label>
      <LoadCategories />
      <Label>HowItWorks</Label>
      <HowItWorks
        items={[
          { title: "Get quotes", description: "Compare bids from licensed carriers and choose the best option for your budget and schedule." },
          { title: "Choose and book", description: "Accept the bid that fits. Your payment is held in escrow until delivery." },
          { title: "Ship and track", description: "Follow the load from pickup to delivery and confirm when it arrives." },
        ]}
      />
      <Label>BenefitWrapper</Label>
      <BenefitWrapper />
      <Label>UniversalSection</Label>
      <UniversalSection />
      <Label>ClientReviews (hidden when there is no data)</Label>
      <ClientReviews placement="home" />
      <Label>FullSlider</Label>
      <FullSlider title="Full control over your shipments" description="Track loads, talk to carriers and manage schedules in one place." />
      <Label>FAQSection</Label>
      <FAQSection
        schema={false}
        items={[
          { question: "How do I post a load?", answer: "Choose a category, describe the load and the route, and publish it. Carriers start bidding right away." },
          { question: "When is the carrier paid?", answer: "After delivery is confirmed. Until then the payment stays in escrow." },
        ]}
      />
      <Label>Description</Label>
      <Description
        title="About AllShip AI"
        description={"AllShip AI connects shippers with verified carriers.\n\nThis block renders long-form text with optional sub-sections and lists."}
        sections={[
          { title: "Our mission", content: "Make shipping simple, transparent and safe." },
          { title: "What we check", list: { items: ["USDOT and MC numbers", "Insurance", "Payout account"] } },
          { title: "How payments work", list: { ordered: true, items: ["You accept a bid", "You pay into escrow", "The carrier is paid after delivery"] } },
        ]}
      />
      <Label>FullScreenImage</Label>
      <FullScreenImage image={{ src: movingGallery7, alt: legacyAlt.movingGallery7 }} />
      <Label>Introduction</Label>
      <Introduction title="AI help in logistics" description="Plan routes, compare bids and track loads with tools built into the platform." image={{ src: benefitRouteOptimization, alt: legacyAlt.benefitRouteOptimization }} reverse />
      <Label>InfoWithIcons</Label>
      <InfoWithIcons
        title="Why movers choose us"
        items={[
          { icon: <Icon icon={boltIcon} size={22} />, title: "Fast bids", subtitle: "Carriers respond to new loads quickly." },
          { icon: <Icon icon={scheduleIcon} size={22} />, title: "Flexible dates", subtitle: "Pick the pickup window that suits you." },
          { icon: <Icon icon={supportAgentIcon} size={22} />, title: "Real support", subtitle: "Talk to a person when you need help." },
        ]}
      />
      <Label>AdvantagesLine</Label>
      <AdvantagesLine title="Moving made simple" description="Everything you need for a move, in one place." points={["Personalized moving plans", "Real-time move tracking", "Professional, vetted movers", "Flexible scheduling options"]} />
      <Label>BenefitsLanding</Label>
      <BenefitsLanding
        title="Choose the best US moving company"
        items={[
          { title: "AI-powered efficiency", description: "Smart route planning and carrier selection.", more: "AI compares routes and carrier availability for your move.", image: { src: movingBenefitAi, alt: legacyAlt.movingBenefitAi } },
          { title: "Nationwide coverage", description: "Across town or across the country.", image: { src: movingBenefitNationwide, alt: legacyAlt.movingBenefitNationwide } },
          { title: "Support", description: "Help when you need it.", more: "Call or message our team.", image: { src: movingBenefitSupport, alt: legacyAlt.movingBenefitSupport } },
        ]}
      />
      <Label>ComparisonTable</Label>
      <ComparisonTable title="How we compare" columns={["Typical broker", "AllShip AI"]} rows={[{ label: "Payment", cells: ["Paid upfront", "Held in escrow until delivery"] }, { label: "Carrier checks", cells: ["Varies", "USDOT, MC and insurance verified"] }]} note="Sample data for the gallery." />
      <Label>RouteEstimate</Label>
      <Container>
        <div className="grid gap-4 py-6 medium:grid-cols-2">
          <RouteEstimate origin="New York, NY" destination="Boston, MA" distance="215 mi" note="Example route. Carriers set the price in their bids." />
          <RouteEstimate origin="Los Angeles, CA" destination="Phoenix, AZ" distance="372 mi" />
        </div>
      </Container>
      <Label>ImageGallery</Label>
      <Container>
        <ImageGallery
          className="max-w-[640px] py-6"
          images={[
            { src: movingGallery1, alt: legacyAlt.movingGallery1 },
            { src: movingGallery5, alt: legacyAlt.movingGallery5 },
            { src: movingScreen2, alt: legacyAlt.movingScreen2 },
          ]}
        />
      </Container>
      <Label>TrustCompanies (hidden when there is no data)</Label>
      <TrustCompanies />
      <Label>ReadyToGetStarted</Label>
      <ReadyToGetStarted />
    </>
  );
}
