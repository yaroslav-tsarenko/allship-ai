import { CallLine, LpFaq, LpTheater, StickyCta, TrustRow } from "@/components/marketing/landing/lp-parts";
import {
  pickVariant,
  type HeadlineVariant,
  type SearchParams,
} from "@/components/marketing/landing/variants";
import { Media } from "@/components/marketing/media";
import { QuoteWidget } from "@/components/marketing/quote-widget";
import { Container } from "@/components/marketing/section";
import { buildMetadata } from "@/lib/seo";
import { RevealText } from "@/components/motion/reveal-text";
import { enter } from "@/components/motion/enter";

export const metadata = buildMetadata({
  title: "Get Moving Quotes from Verified Movers",
  description:
    "Post your move once and compare bids from FMCSA-verified movers. Your payment stays in escrow until delivery, and the 10% service fee is shown upfront.",
  path: "/lp/moving-quote",
  noindex: true,
});

const headlines = {
  default: {
    title: "Compare moving quotes from verified movers",
    lead: "Tell us where you're moving. Movers bid, you pick, and your money stays in escrow until delivery.",
    category: "long-distance-moving",
  },
  local: {
    title: "Local movers, priced by bids, not guesses",
    lead: "Post your move across town in two minutes and compare prices from verified local movers.",
    category: "local-moving",
  },
  "long-distance": {
    title: "Long-distance movers that get paid after delivery",
    lead: "Interstate movers bid on your move. Your payment is released only once your things arrive.",
    category: "long-distance-moving",
  },
} satisfies Record<string, HeadlineVariant>;

export default async function Page({ searchParams }: { searchParams: SearchParams }) {
  const { h } = await searchParams;
  const v = pickVariant(headlines, h);

  return (
    <>
      <section className="medium:pt-12 medium:pb-16 pt-6 pb-12">
        <Container className="expanded:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] expanded:items-center large:gap-16 grid gap-10">
          <div>
            <h1 className="text-headline-lg medium:text-display-md large:text-display-lg font-normal tracking-tight text-balance">
              <RevealText>{v.title}</RevealText>
            </h1>
            <p
              className="text-body-lg text-on-surface-variant medium:mt-4 medium:text-title-lg medium:font-normal mt-3 text-pretty"
              {...enter(2)}
            >
              {v.lead}
            </p>
            <div
              id="quote"
              className="bg-surface-container-low medium:mt-8 medium:p-6 mt-6 scroll-mt-24 rounded-lg p-4"
              {...enter(3)}
            >
              <QuoteWidget
                layout="stack"
                defaultCategory={v.category}
                source="lp-moving-quote"
                submitLabel="Get moving quotes"
                tone="container"
              />
            </div>
            <CallLine className="mt-4" />
          </div>
          <Media
            src="/images/movers-ramp.jpg"
            alt="Movers rolling boxes up a ramp into a truck"
            width={661}
            height={455}
            className="expanded:block hidden"
            enter={4}
            sizes="(min-width: 840px) 45vw, 0px"
          />
        </Container>
      </section>

      <section aria-label="Why AllShip" className="border-outline-variant medium:py-12 border-y py-10">
        <Container>
          <TrustRow />
        </Container>
      </section>

      <LpTheater
        id="how"
        title="How booking a move works"
        lead="No phone tag with call centers. Movers see your details and price the job themselves."
        steps={[
          {
            title: "Describe your move",
            text: "Home size, dates, stairs or elevators, and anything bulky like a piano. Posting is free.",
          },
          {
            title: "Compare bids",
            text: "Each bid shows the mover's price, dates, FMCSA status and reviews from completed moves.",
          },
          {
            title: "Book and pay into escrow",
            text: "You pay the bid plus a 10% service fee. The mover is paid after you confirm delivery.",
          },
        ]}
      />

      <LpFaq
        items={[
          {
            question: "Is it free to get moving quotes?",
            answer: "Yes. Posting a move and receiving bids is free. You pay only if you accept a bid.",
          },
          {
            question: "How are movers checked?",
            answer:
              "Before a mover can bid, we check its USDOT number and operating authority against FMCSA records, and it must set up verified payouts through Stripe.",
          },
          {
            question: "What if something goes wrong?",
            answer:
              "Open a dispute within 72 hours of delivery. The mover's payout is frozen while we review photos, paperwork and messages from both sides.",
          },
          {
            question: "Can I cancel?",
            answer:
              "Free before booking and up to 48 hours before pickup. Later cancellations include a small fee for the mover who held your date.",
          },
        ]}
      />

      <StickyCta href="#quote" label="Get moving quotes" note="Free to post · pay only if you book" />
    </>
  );
}
