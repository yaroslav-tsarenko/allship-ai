import Link from "next/link";
import { CheckList } from "@/components/marketing/check-list";
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
  title: "Freight Quotes for LTL and Full Truckload",
  description:
    "Post pallets, crates or a full truckload and compare bids from FMCSA-verified freight carriers. Payment is held in escrow until delivery is confirmed.",
  path: "/lp/freight-quote",
  noindex: true,
});

const headlines = {
  default: {
    title: "Freight quotes from carriers who run your lane",
    lead: "Post your freight once. Verified carriers bid, and you pay into escrow when you book.",
  },
  ltl: {
    title: "LTL quotes for a few pallets",
    lead: "Ship one pallet or six without a freight account. Compare bids from verified carriers.",
  },
  ftl: {
    title: "Full truckload, booked from carrier bids",
    lead: "Dry van, flatbed or reefer. Post the load and pick the bid that fits your dates.",
  },
} satisfies Record<string, HeadlineVariant>;

export default async function Page({ searchParams }: { searchParams: SearchParams }) {
  const { h } = await searchParams;
  const v = pickVariant(headlines, h);

  return (
    <>
      <section className="medium:pt-12 medium:pb-16 pt-6 pb-12">
        <Container className="expanded:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] large:gap-16 grid gap-10">
          <div className="expanded:order-2">
            <h1 className="text-headline-lg medium:text-display-md font-normal tracking-tight text-balance">
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
                defaultCategory="freight"
                source="lp-freight-quote"
                submitLabel="Get freight quotes"
                tone="container"
              />
            </div>
            <CallLine className="mt-4" />
          </div>
          <div className="expanded:order-1 expanded:block hidden">
            <Media
              src="/images/pallets-in-trailer.jpg"
              alt="Wrapped pallets loaded in a trailer"
              width={960}
              height={1280}
              className="expanded:block hidden aspect-[4/3] overflow-hidden rounded-xl"
              enter={4}
              imgClassName="h-full"
              sizes="(min-width: 840px) 45vw, 0px"
            />
          </div>
        </Container>
      </section>

      <section aria-label="Why AllShip" className="border-outline-variant medium:py-12 border-y py-10">
        <Container>
          <TrustRow />
        </Container>
      </section>

      <section aria-labelledby="details" className="medium:py-20 py-14">
        <Container className="large:grid-cols-2 large:gap-20 grid gap-8">
          <div>
            <h2 id="details" className="text-headline-md medium:text-headline-lg font-normal text-balance">
              What carriers need to price it
            </h2>
            <p className="text-body-lg text-on-surface-variant mt-3">
              Accurate details get you accurate bids and no reclass charges at delivery. Not sure of your
              class?{" "}
              <Link href="/tools/freight-class-calculator" className="text-primary underline">
                Work it out from density
              </Link>
              .
            </p>
          </div>
          <CheckList
            items={[
              "Number of pallets or crates, with length, width and height in inches",
              "Weight per piece, including the pallet",
              "Freight class or commodity description",
              "Dock or liftgate at pickup and delivery",
              "Pickup and delivery dates and hours",
              "Stackable or not, and any hazmat",
            ]}
          />
        </Container>
      </section>

      <LpTheater title="From post to booked carrier" />

      <LpFaq
        items={[
          {
            question: "Do I need a freight account?",
            answer:
              "No. Create a free AllShip account, post the load and pay by card, Apple Pay, Google Pay or bank transfer when you book.",
          },
          {
            question: "How are freight carriers verified?",
            answer:
              "We check each carrier's USDOT number and operating authority against FMCSA records before they can bid, and re-check over time.",
          },
          {
            question: "When is the carrier paid?",
            answer:
              "After delivery. You have 72 hours after the carrier marks the load delivered to confirm or open a dispute.",
          },
        ]}
      />

      <StickyCta href="#quote" label="Get freight quotes" />
    </>
  );
}
