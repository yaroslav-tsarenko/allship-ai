import Link from "next/link";
import { Breadcrumbs } from "@/components/marketing/breadcrumbs";
import { Container, DisplayHeading, Eyebrow, Lead, Section, SectionHeading } from "@/components/marketing/section";
import { enter } from "@/components/motion/enter";
import { InviteFlow } from "@/components/pages/drivers/invite-flow";
import { Theater, TheaterTabs } from "@/components/theater";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { listAltIcon, locationOnIcon, mailIcon, photoCameraIcon, smartToyIcon } from "@/components/ui/icons.generated";
import { StatusChip } from "@/components/ui/status-chip";
import { buildMetadata } from "@/lib/seo";

const path = "/drivers";

export const metadata = buildMetadata({
  title: "For Drivers: Run Your Trips From Your Phone",
  description: "What drivers of AllShip AI carriers do on a trip: update status, take pickup and delivery photos, collect a signature and share location only while driving.",
  path,
});

const tripSteps = [
  { status: "Driver assigned", tone: "success", what: "Your carrier assigns you a booked load. You see the pickup and delivery locations, the time window and the load details." },
  { status: "On the way to pickup", tone: "tertiary", what: "Tap Start trip when you head out. Location sharing begins, and the shipper sees that you are on the way." },
  { status: "Picked up", tone: "tertiary", what: "Take photos of the load as you receive it. They are saved to the trip and protect you if questions come up later." },
  { status: "In transit", tone: "tertiary", what: "Drive. The shipper follows the trip status as it updates, so there is no need to call with progress reports." },
  { status: "Delivered", tone: "success", what: "Take a delivery photo and have the receiver sign on your screen. Location sharing stops when you mark the trip delivered." },
] as const;

const facts = [
  { icon: mailIcon, title: "You join by invitation", body: "Your carrier invites you by email. You open the link and set up your sign-in. There is no separate driver sign-up." },
  { icon: locationOnIcon, title: "Location only while a trip is active", body: "Your phone shares location from the moment you start a trip until you mark it delivered, and not at any other time." },
  { icon: photoCameraIcon, title: "Photos and signature are your record", body: "Pickup photos, the delivery photo and the receiver's signature are attached to the trip for your carrier and the shipper." },
  { icon: listAltIcon, title: "You see your trips, nothing else", body: "Drivers see only the loads assigned to them. Bids, prices and company settings stay with the owner and dispatchers." },
];

export default function DriversPage() {
  return (
    <>
      <header className="overflow-hidden pt-6 pb-16 medium:pt-8 medium:pb-24">
        <Container>
          <Breadcrumbs items={[{ name: "For drivers", path }]} />
          <div className="mt-10 grid gap-12 expanded:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] expanded:items-center expanded:gap-16 medium:mt-14">
            <div data-out="0.3">
              <Eyebrow className="mb-4" enter={0}>
                For drivers of AllShip carriers
              </Eyebrow>
              <DisplayHeading enter={1}>Your whole trip, five taps on your phone</DisplayHeading>
              <Lead enter={3} className="mt-6 max-w-[600px]">
                AllShip AI runs in your phone&apos;s browser. No app to install, no paperwork to scan later. Start the trip, photograph the pickup, collect a signature at the door.
              </Lead>
              <div className="mt-8 flex flex-wrap gap-3" {...enter(4)}>
                <Button asChild size="lg">
                  <Link href="/sign-in">Open my trips</Link>
                </Button>
                <Button asChild size="lg" variant="outlined">
                  <Link href="/partners">I run a carrier company</Link>
                </Button>
              </div>
            </div>
            <div className="mx-auto w-full max-w-[380px]" {...enter(5)}>
              <Theater scene="driverTrip" device="phone" steps caption="Illustrative demo of the driver trip screen with sample data." />
            </div>
          </div>
        </Container>
      </header>

      <Section tone="low" labelledBy="trip-heading">
        <div className="grid gap-10 large:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] large:gap-20">
          <div>
            <SectionHeading id="trip-heading">What happens at each step</SectionHeading>
            <p className="mt-4 max-w-[480px] text-body-lg text-pretty text-on-surface-variant">
              These are the statuses the shipper and your carrier see on the trip, in this order. Each one changes when you tap the next step.
            </p>
          </div>
          <ol className="border-t border-outline-variant">
            {tripSteps.map((s, i) => (
              <li key={s.status} className="grid gap-3 border-b border-outline-variant py-6 medium:grid-cols-[48px_220px_1fr] medium:items-baseline medium:gap-6">
                <span className="font-mono text-title-md text-on-surface-variant">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="text-title-md font-normal">
                  <StatusChip tone={s.tone} dot>
                    {s.status}
                  </StatusChip>
                </h3>
                <p className="max-w-[560px] text-body-lg text-pretty text-on-surface-variant">{s.what}</p>
              </li>
            ))}
          </ol>
        </div>
      </Section>

      <Section labelledBy="location-heading">
        <div className="grid gap-6 large:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] large:gap-16">
          <div>
            <Eyebrow className="mb-3">Location sharing and messages</Eyebrow>
            <SectionHeading id="location-heading">What the shipper sees while you drive</SectionHeading>
          </div>
          <div className="flex flex-col gap-4 text-body-lg text-pretty text-on-surface-variant">
            <p>Your position and the trip timeline, refreshed about every 20 seconds, only between Start trip and Delivered. The shipper confirms delivery from the same screen, which is what releases payment to your carrier.</p>
            <p>Gate codes, elevators, where to park: the shipper and your carrier talk in one thread per load, and you can send a photo from the road.</p>
          </div>
        </div>
        <TheaterTabs
          className="mt-12"
          label="Shipper view"
          caption="Illustrative demo of the shipper side with sample data."
          tabs={[
            { scene: "liveTracking", label: "Live trip" },
            { scene: "chat", label: "Messages" },
          ]}
        />
      </Section>

      <Section tone="low" labelledBy="join-heading">
        <div className="max-w-[720px]">
          <Eyebrow className="mb-3">How drivers join</Eyebrow>
          <SectionHeading id="join-heading">From an invitation to your first trip</SectionHeading>
        </div>
        <div className="mt-12">
          <InviteFlow />
        </div>
      </Section>

      <Section labelledBy="facts-heading">
        <div className="grid gap-12 expanded:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] expanded:gap-20">
          <div>
            <SectionHeading id="facts-heading">Good to know before your first trip</SectionHeading>
            <p className="mt-4 text-body-lg text-pretty text-on-surface-variant">Your carrier company is the account holder. Pay, schedules and which loads you take are between you and your carrier.</p>
          </div>
          <dl className="grid gap-x-10 gap-y-10 medium:grid-cols-2">
            {facts.map((f) => (
              <div key={f.title}>
                <dt className="flex items-start gap-3 text-title-lg font-normal text-on-surface">
                  <Icon icon={f.icon} className="mt-0.5 shrink-0 text-primary" />
                  {f.title}
                </dt>
                <dd className="mt-2 pl-9 text-body-lg text-pretty text-on-surface-variant">{f.body}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Section>

      <Section tone="low" spacing="md" labelledBy="assistant-heading">
        <div className="flex flex-col gap-6 medium:flex-row medium:items-center medium:justify-between">
          <div className="flex gap-4">
            <Icon icon={smartToyIcon} size={32} className="shrink-0 text-primary" />
            <div>
              <h2 id="assistant-heading" className="text-headline-sm font-normal text-on-surface">
                Not sure what to do next?
              </h2>
              <p className="mt-2 max-w-[620px] text-body-lg text-pretty text-on-surface-variant">Ask the AllShip AI assistant on your trip screen. It knows your active trip and tells you the next step.</p>
            </div>
          </div>
          <Button asChild variant="tonal">
            <Link href="/ai">About the assistant</Link>
          </Button>
        </div>
      </Section>

      <Section tone="inverse" spacing="md" labelledBy="no-invite-heading">
        <div className="grid gap-6 expanded:grid-cols-[minmax(0,1.4fr)_auto] expanded:items-center expanded:gap-16">
          <div>
            <h2 id="no-invite-heading" className="text-headline-md font-normal">
              Did not get an invitation?
            </h2>
            <p className="mt-3 max-w-[720px] text-body-lg text-pretty text-inverse-on-surface/80">
              Ask your carrier&apos;s owner or dispatcher to invite the email address you use on your phone, and check your spam folder. If your company is not on AllShip AI yet, send them to the carriers page. Bidding is free and they keep 100% of every bid.
            </p>
          </div>
          <Button asChild size="lg" variant="outlined" className="border-inverse-on-surface/70 text-inverse-on-surface">
            <Link href="/partners">Show my carrier the carriers page</Link>
          </Button>
        </div>
      </Section>
    </>
  );
}
