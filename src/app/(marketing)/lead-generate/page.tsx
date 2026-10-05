import { Breadcrumbs } from "@/components/marketing/breadcrumbs";
import { Container, Section } from "@/components/marketing/section";
import { FeatureSpotlight } from "@/components/theater";
import { leadGenerate, leadGenerateNote } from "@/components/pages/lead-generate/content";
import { PlatformNote } from "@/components/pages/time-schedule/platform-note";
import { Description, ReadyToGetStarted } from "@/components/sections";
import { authLinks } from "@/content/site";
import { buildMetadata } from "@/lib/seo";

const path = "/lead-generate";

export const metadata = buildMetadata({
  title: "Lead Generation for Carriers and Movers",
  description: "How AI improves lead generation in transportation, and how carriers and movers find paid moving, vehicle and freight loads on AllShip AI.",
  path,
});

export default function LeadGeneratePage() {
  return (
    <>
      <Container className="pt-6 medium:pt-8">
        <Breadcrumbs items={[{ name: "Lead Generation", path }]} />
      </Container>
      <Description as="h1" id="lead-generation" title={leadGenerate.title} description={leadGenerate.description} className="pb-10 medium:pb-14" />
      <Section tone="low" labelledBy="lead-generation-product">
        <FeatureSpotlight
          scene="carrierBoard"
          eyebrow="On AllShip AI"
          title={<span id="lead-generation-product">Paid loads, filtered to your lanes</span>}
          description="Shippers post the loads, so carriers don’t chase leads. Filter the board by what you haul and where, open a load and bid with a clear breakdown of what you receive."
        />
      </Section>
      <Description title="How AI improves lead generation" sections={leadGenerate.sections} aside={<PlatformNote {...leadGenerateNote} />} />
      <ReadyToGetStarted
        title="Bid on loads in your lanes"
        description="No subscription to bid. Carriers keep 100% of their bid and get paid after delivery is confirmed."
        ctas={[
          { label: "Become a carrier", href: authLinks.carrierSignUp.href, variant: "filled" },
          { label: "Partner with us", href: "/partners", variant: "outlined" },
        ]}
      />
    </>
  );
}
