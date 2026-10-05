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
  title: "Heavy Equipment Transport Quotes",
  description:
    "Get bids to haul excavators, tractors, loaders and oversize machinery from FMCSA-verified carriers. Payment stays in escrow until delivery is confirmed.",
  path: "/lp/heavy-equipment",
  noindex: true,
});

const headlines = {
  default: {
    title: "Heavy equipment transport, priced by carriers who haul it",
    lead: "Tell us the machine and the route. Lowboy, step-deck and flatbed carriers bid.",
  },
  excavator: {
    title: "Move your excavator without calling around",
    lead: "Post the model, weight and route once. Verified heavy haulers send bids.",
  },
  oversize: {
    title: "Oversize loads with permits handled by the carrier",
    lead: "Wide or tall machinery? Carriers who run permitted loads price the whole move.",
  },
} satisfies Record<string, HeadlineVariant>;

const specs = [
  { label: "Machine", value: "Make, model and year" },
  { label: "Size", value: "Length, width and height in transport position" },
  { label: "Weight", value: "Operating weight, with attachments" },
  { label: "Loading", value: "Runs and drives, or needs a crane or forklift" },
  { label: "Sites", value: "Ground conditions, access roads, loading ramps" },
];

export default async function Page({ searchParams }: { searchParams: SearchParams }) {
  const { h } = await searchParams;
  const v = pickVariant(headlines, h);

  return (
    <>
      <section className="bg-surface-container-low medium:pt-12 medium:pb-16 pt-6 pb-12">
        <Container className="large:grid-cols-[minmax(0,1fr)_420px] large:items-end large:gap-16 grid gap-10">
          <div>
            <h1 className="text-headline-lg medium:text-display-md large:text-display-lg font-normal tracking-tight text-balance">
              <RevealText>{v.title}</RevealText>
            </h1>
            <p
              className="text-body-lg text-on-surface-variant medium:mt-4 medium:text-title-lg medium:font-normal mt-3 max-w-[640px] text-pretty"
              {...enter(2)}
            >
              {v.lead}
            </p>
          </div>
          <div
            id="quote"
            className="bg-surface shadow-elevation-1 medium:p-6 scroll-mt-24 rounded-lg p-4"
            {...enter(3)}
          >
            <QuoteWidget
              layout="stack"
              defaultCategory="heavy-equipment"
              source="lp-heavy-equipment"
              submitLabel="Get hauling quotes"
            />
            <CallLine className="mt-4" />
          </div>
        </Container>
      </section>

      <section aria-label="Why AllShip" className="medium:py-12 py-10">
        <Container>
          <TrustRow />
        </Container>
      </section>

      <section aria-labelledby="specs" className="border-outline-variant medium:py-20 border-t py-14">
        <Container className="large:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] large:gap-20 grid gap-8">
          <div>
            <h2 id="specs" className="text-headline-md medium:text-headline-lg font-normal text-balance">
              Have these ready
            </h2>
            <p className="text-body-lg text-on-surface-variant mt-3">
              Size and weight decide the trailer, the permits and the escorts. The closer your numbers, the
              firmer the bids.
            </p>
          </div>
          <dl className="border-outline-variant border-t">
            {specs.map((s) => (
              <div
                key={s.label}
                className="border-outline-variant medium:grid-cols-[140px_minmax(0,1fr)] medium:gap-6 grid gap-1 border-b py-4"
              >
                <dt className="text-title-md text-on-surface">{s.label}</dt>
                <dd className="text-body-lg text-on-surface-variant">{s.value}</dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      <LpTheater title="Compare heavy haul bids side by side" />

      <LpFaq
        items={[
          {
            question: "Who arranges oversize permits and escorts?",
            answer:
              "The carrier. Include accurate dimensions and weight so bids cover the permits, escorts and routing each state requires.",
          },
          {
            question: "What trailers do carriers use?",
            answer:
              "Flatbeds and step-decks for smaller machines, and lowboys or removable gooseneck trailers for tall or heavy equipment. Carriers state the trailer in their bid.",
          },
          {
            question: "Is the equipment insured in transit?",
            answer:
              "Carriers on AllShip must carry cargo insurance. Check the coverage limit with the carrier before booking high-value machinery.",
          },
        ]}
      />

      <StickyCta href="#quote" label="Get hauling quotes" />
    </>
  );
}
