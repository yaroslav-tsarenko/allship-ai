import Image from "next/image";
import { CallLine, LpFaq, LpTheater, StickyCta, TrustRow } from "@/components/marketing/landing/lp-parts";
import {
  pickVariant,
  type HeadlineVariant,
  type SearchParams,
} from "@/components/marketing/landing/variants";
import { QuoteWidget } from "@/components/marketing/quote-widget";
import { Container } from "@/components/marketing/section";
import { buildMetadata } from "@/lib/seo";
import { RevealText } from "@/components/motion/reveal-text";
import { enter } from "@/components/motion/enter";

export const metadata = buildMetadata({
  title: "Car Shipping Quotes from Verified Carriers",
  description:
    "Ship your car on an open or enclosed trailer. Verified auto carriers bid on your route, and your payment stays in escrow until the car is delivered.",
  path: "/lp/car-shipping",
  noindex: true,
});

const headlines = {
  default: {
    title: "Ship your car with a carrier you choose",
    lead: "Enter your route. Auto carriers bid, and you pay only when you book.",
  },
  "cross-country": {
    title: "Cross-country car shipping, paid after delivery",
    lead: "Coast to coast or state to state. Compare bids from verified auto carriers.",
  },
  enclosed: {
    title: "Enclosed car transport for cars that need it",
    lead: "Classic, exotic or freshly restored. Get bids from enclosed carriers on your route.",
  },
} satisfies Record<string, HeadlineVariant>;

export default async function Page({ searchParams }: { searchParams: SearchParams }) {
  const { h } = await searchParams;
  const v = pickVariant(headlines, h);

  return (
    <>
      <section className="medium:pt-12 medium:pb-16 pt-6 pb-12">
        <Container>
          <div className="max-w-[880px]">
            <h1 className="text-headline-lg medium:text-display-md large:text-display-lg font-normal tracking-tight text-balance">
              <RevealText>{v.title}</RevealText>
            </h1>
            <p
              className="text-body-lg text-on-surface-variant medium:mt-4 medium:text-title-lg medium:font-normal mt-3 text-pretty"
              {...enter(2)}
            >
              {v.lead}
            </p>
          </div>
          <div
            id="quote"
            className="bg-surface-container-low medium:mt-8 medium:p-6 mt-6 scroll-mt-24 rounded-lg p-4"
            {...enter(3)}
          >
            <QuoteWidget
              defaultCategory="car-or-light-truck"
              source="lp-car-shipping"
              submitLabel="Get car shipping quotes"
              tone="container"
            />
          </div>
          <CallLine className="mt-4" />
        </Container>
      </section>

      <section aria-label="Why AllShip" className="medium:py-12 py-10">
        <Container>
          <TrustRow />
        </Container>
      </section>

      <section aria-labelledby="trailers" className="bg-surface-container-low medium:py-20 py-14">
        <Container>
          <div className="expanded:grid-cols-[minmax(0,1fr)_auto] expanded:items-end grid gap-8">
            <h2 id="trailers" className="text-headline-md medium:text-headline-lg font-normal text-balance">
              Open or enclosed?
            </h2>
            <Image
              src="/images/categories/car.webp"
              alt=""
              width={281}
              height={187}
              className="expanded:block hidden h-auto w-[220px]"
            />
          </div>
          <div className="border-outline-variant medium:grid-cols-2 mt-8 grid gap-0 border-t">
            <div className="border-outline-variant medium:border-r medium:pr-8 border-b py-6">
              <h3 className="text-title-lg text-on-surface">Open trailer</h3>
              <p className="text-body-lg text-on-surface-variant mt-2">
                The usual choice for everyday cars. Multi-car trailers run on most routes, so pickup dates are
                more flexible and prices lower.
              </p>
            </div>
            <div className="border-outline-variant medium:pl-8 border-b py-6">
              <h3 className="text-title-lg text-on-surface">Enclosed trailer</h3>
              <p className="text-body-lg text-on-surface-variant mt-2">
                Covered from weather and road debris. Worth it for classic, exotic or freshly painted cars.
                Fewer trucks, so it costs more.
              </p>
            </div>
          </div>
          <p className="text-body-md text-on-surface-variant mt-6">
            Choose either, or both, when you post. Carriers bid with the trailer type they run.
          </p>
        </Container>
      </section>

      <LpTheater
        title="Booking a car carrier, start to finish"
        lead="No phone tag with brokers. Carriers see your vehicle and route and price it themselves."
      />

      <LpFaq
        items={[
          {
            question: "How much does it cost to ship a car?",
            answer:
              "It depends on distance, vehicle size, trailer type and whether the car runs. You see each carrier's price in their bid, plus our 10% service fee, before you pay.",
          },
          {
            question: "When do I pay?",
            answer:
              "When you accept a bid. Stripe holds the payment, and it is released to the carrier after you confirm delivery or 72 hours pass without a dispute.",
          },
          {
            question: "Can I ship a car that doesn't run?",
            answer: "Yes. Mark it as inoperable so carriers with a winch or lift can bid.",
          },
        ]}
      />

      <StickyCta href="#quote" label="Get car shipping quotes" />
    </>
  );
}
