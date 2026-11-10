import Image from "next/image";
import {
  badgeAngi,
  badgeBbb,
  badgeGoogle,
  badgeHomeAdvisor,
  badgeThumbtack,
  badgeTrustpilot,
  badgeYellowPages,
  badgeYelp,
} from "@/assets/legacy";
import { NextTimeline, PriceBreakdown, type TimelineStep } from "@/components/marketing/funnel";
import { FeatureSpotlight } from "@/components/theater";
import { Container } from "@/components/marketing/section";
import { FAQSection } from "@/components/sections/faq-section";
import { SectionHeader } from "@/components/sections/section-header";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import {
  callIcon,
  checkIcon,
  editNoteIcon,
  infoIcon,
  locationOnIcon,
  lockClockIcon,
  receiptLongIcon,
  mailIcon,
  nearMeIcon,
  searchIcon,
  starIcon,
  supportAgentIcon,
  swapHorizIcon,
  taskAltIcon,
  tripOriginIcon,
  verifiedIcon,
} from "@/components/ui/icons.generated";
import { site, type ReviewProfile } from "@/content/site";
import { MovingBooking } from "@/features/moving/booking";
import { movingAdvantages, movingBenefits, movingFaq, movingGallery } from "@/features/moving/content";
import { FloatingQuoteButton } from "@/features/moving/floating-cta";
import { MovingGallery } from "@/features/moving/gallery";
import { HeroVideo } from "@/features/moving/hero-video";
import { buildMetadata, JsonLd, jsonLd } from "@/lib/seo";
import { getMovingProof, type MovingTestimonial } from "@/server/matcher/proof";

export const revalidate = 3600;

const path = "/moving";
const title = "Compare Moving Quotes from Verified Movers";
const description =
  "Enter your ZIP codes and home size to compare prices from FMCSA-checked movers for local and long-distance moves. No sign-up to see prices, and your payment stays in escrow until delivery.";

export const metadata = buildMetadata({ title, description, path });

const badges: Record<ReviewProfile["badge"], typeof badgeAngi> = {
  angi: badgeAngi,
  bbb: badgeBbb,
  google: badgeGoogle,
  homeAdvisor: badgeHomeAdvisor,
  thumbtack: badgeThumbtack,
  trustpilot: badgeTrustpilot,
  yellowPages: badgeYellowPages,
  yelp: badgeYelp,
};

const movingTimeline: TimelineStep[] = [
  {
    icon: editNoteIcon,
    when: "Now, under a minute",
    title: "See instant prices",
    body: "Enter your route and home size. Prices come from each mover's own published rates.",
  },
  {
    icon: supportAgentIcon,
    when: "Usually same day",
    title: "The mover confirms",
    body: "Send a booking request. The mover reviews your inventory and dates and confirms the job.",
  },
  {
    icon: lockClockIcon,
    when: "When you accept",
    title: "Pay into escrow",
    body: `You pay the mover's price plus the ${site.platformFeePercent}% service fee. Stripe holds it until delivery.`,
  },
  {
    icon: nearMeIcon,
    when: "Moving day",
    title: "Follow the truck",
    body: "Pickup photos, live location when the driver shares it, and chat with the crew.",
  },
  {
    icon: taskAltIcon,
    when: "After delivery",
    title: "Confirm, then the mover is paid",
    body: `Delivery comes with photos and a signature. It auto-confirms after ${site.autoConfirmHours} hours with no dispute.`,
  },
];

const valueProps = [
  {
    icon: verifiedIcon,
    title: "Checked movers only",
    body: "Every mover's USDOT and operating authority are checked against FMCSA records before they can quote.",
  },
  {
    icon: receiptLongIcon,
    title: "Itemized prices",
    body: `Transport, packing and storage line by line, with our ${site.platformFeePercent}% fee shown before you book.`,
  },
  {
    icon: lockClockIcon,
    title: "Paid after delivery",
    body: "Your payment waits in escrow and goes to the mover only after you confirm everything arrived.",
  },
];

const reviewDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-warning inline-flex" aria-label={`${rating} out of 5 stars`} role="img">
      {[1, 2, 3, 4, 5].map((i) => (
        <Icon key={i} icon={starIcon} size={18} filled={i <= Math.round(rating)} />
      ))}
    </span>
  );
}

function TestimonialQuote({ t, size = "md" }: { t: MovingTestimonial; size?: "md" | "lg" }) {
  return (
    <figure className="flex h-full flex-col gap-4">
      {t.rating ? <Stars rating={t.rating} /> : null}
      <blockquote
        className={
          size === "lg"
            ? "text-title-lg text-on-surface font-normal text-pretty"
            : "text-body-lg text-on-surface text-pretty"
        }
      >
        &ldquo;{t.quote}&rdquo;
      </blockquote>
      <figcaption className="text-body-md text-on-surface-variant mt-auto">
        <span className="text-title-sm text-on-surface block">{t.authorName}</span>
        {[t.authorDetail, t.reviewedAt ? reviewDate.format(new Date(`${t.reviewedAt}T00:00:00Z`)) : null]
          .filter(Boolean)
          .join(" · ")}
        {" · "}
        {t.sourceUrl ? (
          <a
            href={t.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline-offset-2 hover:underline"
          >
            {t.sourceLabel}
          </a>
        ) : (
          t.sourceLabel
        )}
      </figcaption>
    </figure>
  );
}

export default async function MovingPage() {
  const proof = await getMovingProof();
  const [heroQuote, ...moreQuotes] = proof.testimonials;
  const profiles = site.reviewProfiles as readonly ReviewProfile[];
  const showTrust = Boolean(proof.reviews) || profiles.length > 0;
  const icon = (i: Parameters<typeof Icon>[0]["icon"], size = 20) => <Icon icon={i} size={size} />;

  return (
    <>
      <JsonLd
        data={[
          jsonLd.breadcrumbs([{ name: "Moving", path }]),
          jsonLd.service({ name: "Moving quotes and booking", description, path, serviceType: "Moving" }),
        ]}
      />
      <FloatingQuoteButton targetId="moving-quote" />

      <section id="moving-quote" aria-labelledby="moving-title" className="relative isolate scroll-mt-16">
        <div className="bg-inverse-surface medium:h-[480px] absolute inset-x-0 top-0 -z-10 h-[420px] overflow-hidden">
          <HeroVideo src="/media/legacy/moving-hero.mp4" poster="/media/legacy/moving-hero-poster.jpg" />
          <div aria-hidden="true" className="bg-scrim/60 absolute inset-0" />
        </div>
        <Container className="medium:pt-20 medium:pb-20 pt-12 pb-14">
          <div className="max-w-[760px] text-white">
            <p className="text-title-md font-medium text-white/85">Local and long-distance moving</p>
            <h1
              id="moving-title"
              className="text-display-sm medium:text-display-md mt-3 font-normal tracking-tight text-balance"
            >
              Compare moving prices from verified movers
            </h1>
            <p className="text-body-lg medium:text-title-lg medium:font-normal mt-4 max-w-[600px] text-pretty text-white/85">
              Enter two ZIP codes and your home size. See what FMCSA-checked movers charge, book online, and
              pay only after your things arrive.
            </p>
          </div>
          <div className="medium:mt-10 mt-8">
            <MovingBooking
              feePercent={site.platformFeePercent}
              icons={{
                search: icon(searchIcon),
                from: icon(tripOriginIcon),
                to: icon(locationOnIcon),
                swap: icon(swapHorizIcon, 24),
                star: <Icon icon={starIcon} size={16} filled />,
                verified: <Icon icon={verifiedIcon} size={16} filled />,
                check: icon(checkIcon),
                info: icon(infoIcon),
                mail: icon(mailIcon),
              }}
            />
          </div>

          <ul className="medium:grid-cols-3 mt-12 grid gap-8" aria-label="Why book your move with AllShip AI">
            {valueProps.map((v) => (
              <li key={v.title} className="flex gap-4">
                <span className="bg-primary-container text-on-primary-container flex size-12 shrink-0 items-center justify-center rounded-md">
                  <Icon icon={v.icon} size={24} />
                </span>
                <span>
                  <span className="text-title-md text-on-surface block">{v.title}</span>
                  <span className="text-body-md text-on-surface-variant mt-1 block text-pretty">{v.body}</span>
                </span>
              </li>
            ))}
          </ul>
          {heroQuote && (
            <div className="border-primary mt-12 max-w-[760px] border-l-2 pl-6">
              <TestimonialQuote t={heroQuote} size="lg" />
            </div>
          )}
        </Container>
      </section>

      {showTrust && (
        <section
          aria-labelledby="moving-trust"
          className="border-outline-variant bg-surface-container-low medium:py-16 border-y py-12"
        >
          <Container>
            <div className="large:flex-row large:items-center large:justify-between flex flex-col gap-8">
              <h2
                id="moving-trust"
                className="text-headline-md text-on-surface max-w-[520px] font-normal text-balance"
              >
                Top carriers, rated by shippers after real moves
              </h2>
              <ul className="flex flex-wrap items-center gap-x-10 gap-y-6">
                {proof.reviews && (
                  <li className="flex items-center gap-4">
                    <span className="text-display-sm text-on-surface font-mono tabular-nums">
                      {proof.reviews.average.toFixed(1)}
                    </span>
                    <span className="flex flex-col gap-1">
                      <Stars rating={proof.reviews.average} />
                      <span className="text-body-md text-on-surface-variant">
                        {proof.reviews.count.toLocaleString("en-US")} AllShip reviews from completed loads
                      </span>
                    </span>
                  </li>
                )}
                {profiles.map((p) => (
                  <li key={p.href}>
                    <a
                      href={p.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="focus-visible:outline-primary block rounded-sm p-2 focus-visible:outline-2"
                    >
                      <Image src={badges[p.badge]} alt={`${p.name} profile`} className="h-10 w-auto" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </Container>
        </section>
      )}

      <NextTimeline
        id="moving-next"
        title="How booking a move works"
        steps={movingTimeline}
        lead="From search to delivery, this is what happens when you book through AllShip AI."
      />

      <section aria-labelledby="moving-benefits" className="medium:py-24 py-16">
        <Container>
          <SectionHeader
            id="moving-benefits"
            title="Choose the right US moving company"
            description="What you get when you book a mover through AllShip AI."
          />
          <div className="large:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] large:gap-16 mt-12 grid gap-10">
            <article className="large:sticky large:top-24 large:self-start flex flex-col gap-5">
              <Image
                src="/images/movers-ramp.jpg"
                alt="Movers rolling boxes up a ramp into a truck"
                width={661}
                height={455}
                sizes="(min-width: 1200px) 480px, 100vw"
                className="aspect-[4/3] h-auto w-full rounded-xl object-cover"
              />
              <h3 className="text-headline-sm text-on-surface flex items-center gap-3">
                <Icon icon={movingBenefits[0]!.icon} size={28} className="text-primary" />
                {movingBenefits[0]!.title}
              </h3>
              <p className="text-body-lg text-on-surface-variant text-pretty">
                {movingBenefits[0]!.description}
              </p>
              <p className="text-body-lg text-on-surface-variant text-pretty">{movingBenefits[0]!.more}</p>
            </article>
            <ul className="divide-outline-variant border-outline-variant divide-y border-y">
              {movingBenefits.slice(1).map((b) => (
                <li key={b.title} className="medium:gap-6 grid grid-cols-[48px_minmax(0,1fr)] gap-5 py-6">
                  <span className="bg-secondary-container text-on-secondary-container flex size-12 items-center justify-center rounded-md">
                    <Icon icon={b.icon} size={24} />
                  </span>
                  <div>
                    <h3 className="text-title-lg text-on-surface">{b.title}</h3>
                    <p className="text-body-lg text-on-surface-variant mt-1 text-pretty">{b.description}</p>
                    <details className="group mt-2">
                      <summary className="text-label-lg text-primary inline-flex cursor-pointer list-none font-medium [&::-webkit-details-marker]:hidden">
                        <span className="group-open:hidden">Learn more</span>
                        <span className="hidden group-open:inline">Show less</span>
                      </summary>
                      <p className="text-body-md text-on-surface-variant mt-2 text-pretty">{b.more}</p>
                    </details>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </section>

      <section aria-label="Instant prices" className="bg-surface-container-low medium:py-24 py-16">
        <Container>
          <FeatureSpotlight
            scene="instantQuote"
            eyebrow="An easy shipping platform"
            title="Real prices from movers' own rates"
            description="Movers publish their rates for each home size and distance. Enter your route and the price is worked out on the spot, itemized and with the fee included. Demo data is illustrative."
          />
        </Container>
      </section>
      <section aria-label="Track your move" className="medium:py-24 py-16">
        <Container>
          <FeatureSpotlight
            scene="liveTracking"
            reverse
            eyebrow="Start easy shipping"
            title="Your whole move on one page"
            description="Create your account, book or post your move, and follow it from one dashboard: pickup photos, the truck's position, messages with the crew and the delivery signature."
          />
        </Container>
      </section>
      <PriceBreakdown
        title="What your move costs, line by line"
        lead="The mover sets the price, from their published rates or their bid. You pay it plus our service fee into escrow, and the mover keeps 100% of their price."
      />

      <section aria-labelledby="moving-gallery" className="medium:py-24 py-16">
        <Container>
          <SectionHeader
            id="moving-gallery"
            title="Our highest standard in residential moving"
            description="Wrapped furniture, strapped loads and labeled boxes: what a careful move looks like from the inside of the truck."
          />
          <div className="mt-10">
            <MovingGallery items={movingGallery} />
          </div>
        </Container>
      </section>

      {moreQuotes.length > 0 && (
        <section aria-labelledby="moving-reviews" className="bg-surface-container-low medium:py-24 py-16">
          <Container>
            <SectionHeader id="moving-reviews" title="Featured reviews from our customers" />
            <ul className="medium:grid-cols-2 large:grid-cols-3 mt-10 grid gap-x-10 gap-y-12">
              {moreQuotes.map((t) => (
                <li key={t.id} className="border-outline-variant border-t pt-6">
                  <TestimonialQuote t={t} />
                </li>
              ))}
            </ul>
          </Container>
        </section>
      )}

      <section
        aria-labelledby="moving-advantages"
        className="bg-inverse-surface text-inverse-on-surface medium:py-24 py-16"
      >
        <Container>
          <div className="large:grid-cols-[minmax(0,1fr)_auto] large:items-end grid gap-8">
            <div>
              <h2
                id="moving-advantages"
                className="text-headline-md medium:text-display-sm max-w-[820px] font-normal text-balance"
              >
                Ready to see what your move costs?
              </h2>
              <p className="text-body-lg text-inverse-on-surface/80 mt-3 max-w-[60ch] text-pretty">
                It takes about a minute. Free, no sign-up to see prices, and nothing is charged until you accept
                a mover.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <a href="#moving-quote">Get my moving prices</a>
              </Button>
              <Button asChild size="lg" variant="text" className="text-inverse-on-surface">
                <a href={site.phone.href}>
                  <Icon icon={callIcon} size={20} />
                  {site.phone.display}
                </a>
              </Button>
            </div>
          </div>
          <ul className="medium:grid-cols-2 large:grid-cols-4 mt-12 grid gap-x-8 gap-y-5">
            {movingAdvantages.map((a) => (
              <li
                key={a}
                className="border-inverse-on-surface/20 text-body-lg flex items-start gap-3 border-t pt-4"
              >
                <Icon icon={checkIcon} size={22} className="text-inverse-primary mt-0.5 shrink-0" />
                {a}
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <FAQSection id="moving-faq" items={movingFaq} tone="low" />
    </>
  );
}
