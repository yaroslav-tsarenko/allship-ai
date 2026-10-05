import type { ComponentType } from "react";
import { Breadcrumbs } from "@/components/marketing/breadcrumbs";
import { NextTimeline, PriceBreakdown, StickyFunnelCta, TrustStrip } from "@/components/marketing/funnel";
import { Container } from "@/components/marketing/section";
import { FAQSection, type FaqEntry } from "@/components/sections";
import { FeatureSpotlight } from "@/components/theater";
import { CarCarrier, Dolly, Pallet, Truck, type IllustrationProps } from "@/components/theater/illustrations";
import { Icon } from "@/components/ui/icon";
import { callIcon } from "@/components/ui/icons.generated";
import { site } from "@/content/site";
import { env } from "@/env";
import { formatUsd } from "@/lib/money";
import { JsonLd, jsonLd } from "@/lib/seo";
import { formConfigs, type FormKind } from "./model";
import { PublicLoadForm } from "./public-load-form";

export type FormPageSeo = { name: string; description: string; serviceType: string; crumb: string };

const fee = `${site.platformFeePercent}%`;
const escrow = `You pay when you accept a bid: the carrier's price plus the ${fee} service fee. Stripe holds it, and the carrier is paid after you confirm delivery or ${site.autoConfirmHours} hours pass without a dispute.`;

type KindCopy = { art: ComponentType<IllustrationProps>; lead: string; example: number; faq: FaqEntry[] };

const copy: Record<FormKind, KindCopy> = {
  vehicle: {
    art: CarCarrier,
    lead: "Cars, motorcycles, boats, RVs, trailers and parts. Four short steps, then auto carriers on your route bid.",
    example: 94_000,
    faq: [
      {
        question: "How much does it cost to ship a vehicle?",
        answer: `It depends on distance, size, trailer type and whether it runs. You see each carrier's price in their bid, plus our ${fee} service fee, before you pay anything.`,
      },
      { question: "When do I pay?", answer: escrow },
      {
        question: "Can I ship a vehicle that doesn't run?",
        answer: "Yes. Mark it as inoperable so carriers with a winch or lift gate can bid.",
      },
      {
        question: "Open or enclosed trailer?",
        answer:
          "Open trailers are the usual, lower-cost choice. Enclosed trailers protect classic, exotic or freshly painted vehicles from weather and road debris. Choose either, or both, when you post.",
      },
    ],
  },
  moving: {
    art: Dolly,
    lead: "Homes, offices and single items. Tell movers what moves and how to reach it, and they bid on the whole job.",
    example: 186_000,
    faq: [
      {
        question: "Is it free to post a move?",
        answer: "Yes. Posting and receiving bids is free. You pay only if you accept a bid.",
      },
      {
        question: "Should I post for bids or use instant prices?",
        answer:
          "Instant prices on the moving page come from movers' published rates and work for standard home moves. Post here when your move has special items, tricky access or flexible dates, and let movers price it.",
      },
      {
        question: "What protection do I get?",
        answer:
          "Interstate movers must offer released value and full value protection. Ask for full value protection in your notes, and your payment stays in escrow until delivery.",
      },
      { question: "When do I pay?", answer: escrow },
    ],
  },
  heavy: {
    art: Truck,
    lead: "Excavators, tractors, loaders and oversize machinery. Size and weight decide the trailer, permits and escorts.",
    example: 320_000,
    faq: [
      {
        question: "Who arranges oversize permits and escorts?",
        answer:
          "The carrier. Include accurate dimensions and weight so bids cover the permits, escorts and routing each state requires.",
      },
      {
        question: "What trailers do carriers use?",
        answer:
          "Flatbeds and step-decks for smaller machines, lowboys or removable gooseneck trailers for tall or heavy equipment. Carriers state the trailer in their bid.",
      },
      {
        question: "Is the equipment insured in transit?",
        answer:
          "Carriers on AllShip must carry cargo insurance. Check the coverage limit with the carrier in chat before booking high-value machinery.",
      },
      { question: "When do I pay?", answer: escrow },
    ],
  },
  freight: {
    art: Pallet,
    lead: "Pallets, crates, LTL or a full truckload, without a freight account. Carriers who run your lane bid.",
    example: 145_000,
    faq: [
      {
        question: "Do I need a freight account?",
        answer:
          "No. Your free AllShip account is created when you post, and you pay by card, Apple Pay, Google Pay or bank transfer when you book.",
      },
      {
        question: "What if I don't know my freight class?",
        answer:
          "Describe the commodity and give dimensions and weight. The freight class calculator in Tools works it out from density.",
      },
      { question: "When is the carrier paid?", answer: escrow },
    ],
  },
  rent: {
    art: Truck,
    lead: "A box truck or cargo van with the carrier's driver, for a full day or longer. Carriers bid on your dates.",
    example: 68_000,
    faq: [
      {
        question: "What's included?",
        answer:
          "The truck and a professional driver for the dates you choose. Add helpers, a lift gate or equipment in the details so bids include them.",
      },
      {
        question: "Can I book by the hour?",
        answer: "For a few hours, use Truck with driver instead. Rent a truck is for full days or longer.",
      },
      { question: "When do I pay?", answer: escrow },
    ],
  },
};

export function PublicLoadPage({ kind, seo }: { kind: FormKind; seo: FormPageSeo }) {
  const config = formConfigs[kind];
  const meta = copy[kind];
  const Art = meta.art;
  const googleEnabled = Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
  return (
    <>
      <JsonLd
        data={jsonLd.service({
          name: seo.name,
          description: seo.description,
          path: config.path,
          serviceType: seo.serviceType,
        })}
      />
      <Container className="medium:pb-24 pt-6 pb-16">
        <Breadcrumbs items={[{ name: seo.crumb, path: config.path }]} />
        <div className="medium:mt-12 expanded:grid-cols-[minmax(0,300px)_minmax(0,1fr)] expanded:gap-16 large:grid-cols-[minmax(0,340px)_minmax(0,1fr)] large:gap-24 mt-8 grid gap-10">
          <aside
            className="expanded:sticky expanded:top-24 expanded:self-start flex flex-col gap-8"
            aria-label="About this form"
          >
            <div>
              <Art className="expanded:block mb-4 hidden w-28" />
              <h1 className="text-display-sm text-on-surface font-normal text-balance">{config.heading}</h1>
              <p className="text-body-lg text-on-surface-variant mt-3 text-pretty">
                {config.intro}. {meta.lead}
              </p>
            </div>
            <TrustStrip vertical compact reviews className="expanded:grid hidden" />
            <p className="text-body-md text-on-surface-variant expanded:block hidden">
              Rather talk it through?
              <a
                href={site.phone.href}
                data-track="click_to_call"
                className="text-title-md text-primary mt-1 flex items-center gap-2 underline-offset-4 hover:underline"
              >
                <Icon icon={callIcon} size={20} />
                {site.phone.display}
              </a>
            </p>
          </aside>
          <div id="load-form" className="min-w-0 scroll-mt-24">
            <PublicLoadForm kind={kind} googleEnabled={googleEnabled} />
            <div className="expanded:hidden mt-12">
              <TrustStrip compact reviews />
              <p className="text-body-md text-on-surface-variant mt-6 flex gap-3">
                <Icon icon={callIcon} size={20} className="text-primary mt-0.5 shrink-0" />
                <span>
                  Rather talk it through?{" "}
                  <a
                    href={site.phone.href}
                    data-track="click_to_call"
                    className="text-primary font-medium underline-offset-4 hover:underline"
                  >
                    {site.phone.display}
                  </a>
                </span>
              </p>
            </div>
          </div>
        </div>
      </Container>

      <NextTimeline
        tone="low"
        lead="Posting takes a few minutes. You confirm your email once, the load goes live and carriers can start bidding."
      />

      <section aria-label="Compare bids" className="medium:py-24 py-16">
        <Container>
          <FeatureSpotlight
            scene="bidsCompare"
            eyebrow="After you post"
            title="Bids land on your load. You choose."
            description="Sort by price or rating, read reviews from completed loads and check each carrier's FMCSA status before you accept. Demo data is illustrative."
          />
        </Container>
      </section>

      <PriceBreakdown
        exampleBidCents={meta.example}
        exampleLabel={`Example: a carrier bids ${formatUsd(meta.example, true)}`}
      />

      <FAQSection id={`${kind}-faq`} title={`${config.heading}: common questions`} items={meta.faq} />

      <StickyFunnelCta
        href="#load-form"
        label="Continue your load"
        note="Free to post · pay only when you book"
        hideWhileVisible="load-form"
        track={`${kind}_sticky`}
      />
    </>
  );
}
