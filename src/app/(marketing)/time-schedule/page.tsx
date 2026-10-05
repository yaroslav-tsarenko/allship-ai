import { Breadcrumbs } from "@/components/marketing/breadcrumbs";
import { Container, Section } from "@/components/marketing/section";
import { FeatureSpotlight } from "@/components/theater";
import { timeSchedule, timeScheduleNote } from "@/components/pages/time-schedule/content";
import { PlatformNote } from "@/components/pages/time-schedule/platform-note";
import { Description, ReadyToGetStarted } from "@/components/sections";
import { authLinks } from "@/content/site";
import { buildMetadata } from "@/lib/seo";

const path = "/time-schedule";

export const metadata = buildMetadata({
  title: "Time Schedule: AI Scheduling for Pickups and Deliveries",
  description: "How AI scheduling plans pickups and deliveries with real-time updates, predictive analytics and automation, and how pickup and delivery dates work on AllShip AI.",
  path,
});

export default function TimeSchedulePage() {
  return (
    <>
      <Container className="pt-6 medium:pt-8">
        <Breadcrumbs items={[{ name: "Time Schedule", path }]} />
      </Container>
      <Description as="h1" id="time-schedule" title={timeSchedule.title} description={timeSchedule.description} className="pb-10 medium:pb-14" />
      <Section tone="low" labelledBy="time-schedule-product">
        <FeatureSpotlight
          scene="liveTracking"
          eyebrow="On AllShip AI"
          title={<span id="time-schedule-product">Dates you pick, a trip you can follow</span>}
          description="You set the pickup window when you post. Carriers bid with dates they can meet, and once the trip starts every milestone and the truck’s position land on one timeline."
        />
      </Section>
      <Description title="How AI scheduling works" sections={timeSchedule.sections} aside={<PlatformNote {...timeScheduleNote} />} />
      <ReadyToGetStarted
        title="Set your dates, compare carrier bids"
        description="Post a load with the pickup and delivery dates you need. Verified carriers bid, and your payment stays in escrow until delivery."
        ctas={[
          { label: "Get a quote", href: "/quote", variant: "filled" },
          { label: "Create an account", href: authLinks.signUp.href, variant: "outlined" },
        ]}
      />
    </>
  );
}
