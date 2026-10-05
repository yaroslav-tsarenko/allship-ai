import Link from "next/link";
import type { ReactNode } from "react";
import { lifecycle } from "@/components/marketing/core/lifecycle";
import { feeBreakdown, formatUsd } from "@/components/marketing/core/money";
import { StatusChip } from "@/components/marketing/core/status-chip";
import { UiFrame } from "@/components/marketing/core/ui-frame";
import { Breadcrumbs } from "@/components/marketing/breadcrumbs";
import { CtaBand } from "@/components/marketing/cta-band";
import { Faq, type FaqItem } from "@/components/marketing/faq";
import { Media } from "@/components/marketing/media";
import { Container, Eyebrow, Lead, Section, SectionHeading } from "@/components/marketing/section";
import { Icon } from "@/components/ui/icon";
import { localShippingIcon, arrowForwardIcon, checkIcon, drawIcon, lockIcon, personIcon, photoCameraIcon } from "@/components/ui/icons.generated";
import { TheaterTabs } from "@/components/theater";
import { RoutePin, Truck, VerifiedBadge } from "@/components/theater/illustrations";
import { site } from "@/content/site";
import { buildMetadata, JsonLd, jsonLd } from "@/lib/seo";
import { RevealText } from "@/components/motion/reveal-text";

const title = "How AllShip Works: Bids, Escrow and Delivery";
const description =
  "See every step of an AllShip load: post it, get bids from FMCSA-verified carriers, pay into Stripe escrow, track pickup and delivery, then release payment.";

export const metadata = buildMetadata({ title, description, path: "/how-it-works" });

const example = feeBreakdown(118000);

const fragments: Record<string, ReactNode> = {
  post: (
    <Sketch art={<RoutePin />} lines={["23 shipment types, each with its own form", "Bidders see city and ZIP area only", "Or describe it to the assistant and review its draft"]} />
  ),
  bids: (
    <Sketch art={<VerifiedBadge />} lines={["USDOT and MC checked with the FMCSA", "Insurance and a Stripe payouts account required", "Every bid shows price, dates, rating and a message"]} />
  ),
  pay: (
    <UiFrame title="Checkout" aside={<StatusChip tone="awaiting_payment">Awaiting payment</StatusChip>}>
      <dl className="grid grid-cols-[1fr_auto] gap-y-2 text-body-lg [&_dd]:pl-6">
        <dt className="text-on-surface-variant">Carrier 3, bid</dt>
        <dd className="text-right font-mono">{formatUsd(example.bid)}</dd>
        <dt className="text-on-surface-variant">Service fee ({site.platformFeePercent}%)</dt>
        <dd className="text-right font-mono">{formatUsd(example.fee)}</dd>
        <dt className="border-t border-outline-variant pt-2 text-title-md">Total</dt>
        <dd className="border-t border-outline-variant pt-2 text-right font-mono text-title-md">{formatUsd(example.total)}</dd>
      </dl>
      <p className="mt-5 flex items-start gap-2 text-body-md text-on-surface-variant">
        <Icon icon={lockIcon} size={18} className="mt-0.5 shrink-0 text-primary" />
        Card, Apple Pay, Google Pay or bank account through Stripe. The other bids are declined once payment succeeds.
      </p>
    </UiFrame>
  ),
  pickup: (
    <Sketch art={<Truck />} lines={["The carrier assigns one of its drivers", "Live location while the trip is active", "Pickup photos record the load's condition"]} />
  ),
  delivery: (
    <UiFrame title="Proof of delivery" aside={<StatusChip tone="delivered">Delivered</StatusChip>}>
      <div className="grid grid-cols-[96px_1fr] gap-4 medium:grid-cols-[120px_1fr]">
        <Media src="/images/household-load-strapped.jpg" alt="Delivered household goods, still strapped in the truck" width={842} height={1280} radius="md" sizes="120px" className="aspect-[3/4]" />
        <div className="flex flex-col gap-3 text-body-md">
          <p className="flex items-center gap-2 text-on-surface">
            <Icon icon={photoCameraIcon} size={18} className="text-on-surface-variant" />
            Delivery photo
          </p>
          <p className="flex items-center gap-2 text-on-surface">
            <Icon icon={drawIcon} size={18} className="text-on-surface-variant" />
            Signed at drop-off
          </p>
          <p className="text-on-surface-variant">Oct 17, 2:40 PM · Charlotte, NC</p>
        </div>
      </div>
    </UiFrame>
  ),
  release: (
    <UiFrame title="Confirm delivery" aside={<StatusChip tone="completed">Completed</StatusChip>}>
      <p className="text-body-lg text-on-surface">Everything arrived as described?</p>
      <p className="mt-1 text-body-md text-on-surface-variant">If you don&rsquo;t answer, the load is confirmed automatically on Oct 20 at 2:40 PM, {site.autoConfirmHours} hours after delivery.</p>
      <div className="mt-5 flex flex-wrap gap-2" aria-hidden>
        <span className="inline-flex h-10 items-center rounded-full bg-primary px-6 text-label-lg font-medium text-on-primary">Confirm delivery</span>
        <span className="inline-flex h-10 items-center rounded-full border border-outline px-6 text-label-lg font-medium text-primary">Report a problem</span>
      </div>
      <p className="mt-5 border-t border-outline-variant pt-4 font-mono text-body-md text-on-surface-variant">
        Transfer to Carrier 3: {formatUsd(example.bid)}
      </p>
    </UiFrame>
  ),
};

function Sketch({ art, lines }: { art: ReactNode; lines: string[] }) {
  return (
    <figure className="grid items-center gap-6 border-y border-outline-variant py-6 medium:grid-cols-[180px_1fr]">
      <div className="mx-auto w-40 medium:w-full">{art}</div>
      <figcaption>
        <ul className="flex flex-col divide-y divide-outline-variant">
          {lines.map((l) => (
            <li key={l} className="flex items-start gap-3 py-2.5 text-body-lg text-on-surface">
              <Icon icon={checkIcon} size={20} className="mt-0.5 shrink-0 text-primary" />
              {l}
            </li>
          ))}
        </ul>
      </figcaption>
    </figure>
  );
}

const stepBody: Record<string, ReactNode> = {
  post: "Pick one of 23 shipment types and fill in the form for it. A car asks for year, make, model and whether it runs; a move asks for home size and access; freight asks for pallet count, dimensions and weight. You can also describe the job to the AllShip AI assistant and let it fill in a draft for you.",
  bids: "Carriers who serve your lanes and shipment type see the load and send a price with their pickup and delivery dates. Before any carrier can bid, AllShip checks their USDOT and MC numbers with the FMCSA, confirms their insurance and requires a Stripe payouts account. You can message carriers with questions, and the assistant can rank bids by price, dates, reviews and authority status.",
  pay: `When you accept a bid you pay it in full, plus the ${site.platformFeePercent}% AllShip service fee. The money is held by Stripe and is not sent to the carrier yet. If payment isn't completed within 30 minutes, the load goes back to open and the bids stay available.`,
  pickup: "The carrier assigns a driver, who updates the trip from their phone. At pickup the driver photographs the load, so there is a record of its condition before it leaves.",
  delivery: "At drop-off the driver takes a delivery photo and collects a signature. You get a notification with both.",
  release: `Check everything, then confirm. If you don't respond within ${site.autoConfirmHours} hours, the load confirms automatically. Only then is the bid amount transferred to the carrier. After a completed load you can leave a review, which is the only way reviews appear on AllShip.`,
};

const faq: FaqItem[] = [
  {
    question: "Do I pay anything to post a load?",
    answer: `No. Posting and receiving bids is free. You pay only when you accept a bid: the bid amount plus a ${site.platformFeePercent}% service fee.`,
  },
  {
    question: "What if no carrier bids on my load?",
    answer: "You pay nothing. Bidding closes on the date you set. You can then repost with wider dates or more details, which makes a load easier for carriers to price.",
  },
  {
    question: "What happens if my shipment arrives damaged?",
    answer:
      "Report a problem instead of confirming delivery. That opens a dispute and freezes the payout while AllShip reviews the pickup and delivery photos with both sides. The money stays in escrow until the dispute is resolved.",
  },
  {
    question: "Can I cancel after I accept a bid?",
    answer: "Yes. Refunds follow the cancellation policy, which depends on how close to pickup you cancel. Read the cancellation and refund policy for the exact terms before you book.",
  },
  {
    question: "Why does delivery confirm itself after 72 hours?",
    answer: "So carriers are not left unpaid when a shipper forgets to confirm. You can report a problem at any time before the 72 hours end.",
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <JsonLd data={jsonLd.service({ name: "AllShip AI shipping marketplace", description, path: "/how-it-works", serviceType: "Freight and moving marketplace" })} />
      <Section spacing="none" className="pt-6 pb-12 medium:pb-16">
        <Breadcrumbs items={[{ name: "How it works", path: "/how-it-works" }]} />
        <div className="mt-10 grid gap-8 large:mt-14 large:grid-cols-[1.3fr_1fr] large:items-end">
          <h1 className="text-display-sm font-normal tracking-tight text-balance medium:text-display-md large:text-display-lg">
            <RevealText>One load, start to finish</RevealText>
          </h1>
          <Lead enter={2}>
            Here is what happens between posting a shipment and the carrier getting paid, with the screens you will see along the way.
          </Lead>
        </div>
      </Section>

      <Section tone="low" labelledBy="tour-shippers" spacing="lg">
        <div className="grid gap-4 large:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] large:items-end large:gap-16">
          <div>
            <Eyebrow className="mb-3">If you&apos;re shipping</Eyebrow>
            <SectionHeading id="tour-shippers">Post, compare, pay, track</SectionHeading>
          </div>
          <p className="text-body-xl text-pretty text-on-surface-variant">The same screens you&apos;ll use, played with sample data. Pick a tab or let it run.</p>
        </div>
        <TheaterTabs
          className="mt-10"
          label="Shipper tour"
          tabs={[
            { scene: "postLoad", label: "Post" },
            { scene: "bidsCompare", label: "Compare" },
            { scene: "escrowFlow", label: "Pay" },
            { scene: "liveTracking", label: "Track" },
          ]}
        />
      </Section>

      <Section labelledBy="tour-carriers" spacing="lg">
        <div className="grid gap-4 large:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] large:items-end large:gap-16">
          <div>
            <Eyebrow className="mb-3">If you&apos;re hauling</Eyebrow>
            <SectionHeading id="tour-carriers">Find, bid, drive, get paid</SectionHeading>
          </div>
          <p className="text-body-xl text-pretty text-on-surface-variant">Owners and dispatchers work the load board and the fleet map. Drivers run the trip from a phone.</p>
        </div>
        <TheaterTabs
          className="mt-10"
          label="Carrier tour"
          tabs={[
            { scene: "carrierBoard", label: "Find and bid" },
            { scene: "driverTrip", label: "Drive" },
            { scene: "fleet", label: "Fleet" },
            { scene: "chat", label: "Messages" },
          ]}
        />
      </Section>

      <section aria-label="The six steps" className="border-t border-outline-variant">
        <Container className="pt-14 medium:pt-20">
          <SectionHeading>Every step, in detail</SectionHeading>
        </Container>
        <Container className="grid gap-10 py-12 medium:py-16 large:grid-cols-[240px_1fr] large:gap-16">
          <nav aria-label="Steps" className="hidden large:block">
            <ol className="sticky top-24 flex flex-col gap-1">
              {lifecycle.map((s, i) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="state-layer flex items-baseline gap-3 rounded-full px-4 py-2.5 text-body-lg text-on-surface-variant hover:text-on-surface">
                    <span className="font-mono text-label-lg text-primary">{String(i + 1).padStart(2, "0")}</span>
                    {s.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
          <ol className="flex flex-col gap-20 large:gap-28">
            {lifecycle.map((s, i) => (
              <li key={s.id} id={s.id} className="scroll-mt-24">
                <article className="grid gap-8 expanded:grid-cols-[1fr_1.15fr] expanded:gap-12">
                  <div>
                    <p className="flex items-center gap-3 text-label-lg text-on-surface-variant">
                      <span className="font-mono text-headline-md text-primary">{String(i + 1).padStart(2, "0")}</span>
                      <span className="inline-flex items-center gap-1.5">
                        <Icon icon={s.who === "Carriers" ? localShippingIcon : personIcon} size={16} />
                        {s.who}
                      </span>
                    </p>
                    <h2 className="mt-4 text-headline-md font-normal text-on-surface medium:text-headline-lg">{s.title}</h2>
                    <p className="mt-4 text-body-lg text-pretty text-on-surface-variant">{stepBody[s.id]}</p>
                  </div>
                  <div className="min-w-0">{fragments[s.id]}</div>
                </article>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <Section tone="low" labelledBy="money-title">
        <div className="max-w-[760px]">
          <SectionHeading id="money-title">Where your money is at each moment</SectionHeading>
          <p className="mt-4 text-body-lg text-pretty text-on-surface-variant">Using the {formatUsd(example.bid)} bid from the example above.</p>
        </div>
        <ol className="mt-12 grid gap-4 expanded:grid-cols-[1fr_auto_1.2fr_auto_1fr] expanded:items-stretch">
          <li className="rounded-lg bg-surface p-6">
            <p className="text-label-lg text-on-surface-variant">You pay</p>
            <p data-count="" className="mt-2 font-mono text-headline-md text-on-surface tabular-nums">
              {formatUsd(example.total)}
            </p>
            <p className="mt-3 text-body-md text-on-surface-variant">Once, when you accept the bid.</p>
          </li>
          <li aria-hidden className="hidden items-center text-outline expanded:flex">
            <Icon icon={arrowForwardIcon} />
          </li>
          <li className="rounded-lg bg-primary-container p-6 text-on-primary-container">
            <p className="text-label-lg">Held in escrow by Stripe</p>
            <p data-count="" className="mt-2 font-mono text-headline-md tabular-nums">
              {formatUsd(example.total)}
            </p>
            <p className="mt-3 text-body-md">From booking until delivery is confirmed, or for as long as a dispute is open.</p>
          </li>
          <li aria-hidden className="hidden items-center text-outline expanded:flex">
            <Icon icon={arrowForwardIcon} />
          </li>
          <li className="flex flex-col gap-4 rounded-lg bg-surface p-6">
            <div>
              <p className="text-label-lg text-on-surface-variant">Carrier receives</p>
              <p data-count="" className="mt-2 font-mono text-headline-md text-on-surface tabular-nums">
                {formatUsd(example.bid)}
              </p>
            </div>
            <div className="border-t border-outline-variant pt-4">
              <p className="text-label-lg text-on-surface-variant">AllShip keeps</p>
              <p className="mt-1 font-mono text-title-lg text-on-surface">{formatUsd(example.fee)}</p>
            </div>
          </li>
        </ol>
        <p className="mt-8 text-body-md text-on-surface-variant">
          Read the <Link href="/pricing" className="text-primary underline-offset-2 hover:underline">pricing page</Link> for what the fee covers, and the{" "}
          <Link href="/legal/cancellation-refunds" className="text-primary underline-offset-2 hover:underline">cancellation and refund policy</Link> for cancellations.
        </p>
      </Section>

      <Section labelledBy="others-title" spacing="md">
        <h2 id="others-title" className="sr-only">For carriers and drivers</h2>
        <div className="grid gap-px overflow-hidden rounded-xl bg-outline-variant medium:grid-cols-2">
          <Link href="/partners" className="group state-layer bg-surface p-8 medium:p-10">
            <p className="text-label-lg text-on-surface-variant">Carriers</p>
            <p className="mt-2 text-headline-sm text-on-surface">Same steps, other side: find loads, bid, get paid after delivery</p>
            <span className="mt-6 inline-flex items-center gap-2 text-label-lg font-medium text-primary">
              How hauling works <Icon icon={arrowForwardIcon} size={18} />
            </span>
          </Link>
          <Link href="/drivers" className="group state-layer bg-surface p-8 medium:p-10">
            <p className="text-label-lg text-on-surface-variant">Drivers</p>
            <p className="mt-2 text-headline-sm text-on-surface">Pickup photos, delivery proof and next steps, all from a phone</p>
            <span className="mt-6 inline-flex items-center gap-2 text-label-lg font-medium text-primary">
              What drivers do <Icon icon={arrowForwardIcon} size={18} />
            </span>
          </Link>
        </div>
      </Section>

      <Section labelledBy="faq-title" spacing="md" width="narrow">
        <SectionHeading id="faq-title" className="mb-8 text-headline-md medium:text-headline-lg">
          Common questions
        </SectionHeading>
        <Faq items={faq} />
      </Section>

      <CtaBand title="Post your first load" description="It takes a few minutes. Bids arrive in your account and by email." secondary={{ label: "Ask the assistant", href: "/ai" }} />
    </>
  );
}
