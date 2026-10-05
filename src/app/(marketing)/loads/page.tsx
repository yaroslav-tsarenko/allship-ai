import Link from "next/link";
import { CtaBand } from "@/components/marketing/cta-band";
import { StickyCta } from "@/components/marketing/landing/lp-parts";
import { Container, Section, SectionHeading } from "@/components/marketing/section";
import { Breadcrumbs } from "@/components/marketing/breadcrumbs";
import { enter } from "@/components/motion/enter";
import { RevealText } from "@/components/motion/reveal-text";
import { LoadBoard, type BoardRow } from "@/components/pages/loads/load-board";
import { PayoutLedger } from "@/components/pages/partners/payout-ledger";
import { FeatureSpotlight } from "@/components/theater";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { eastIcon, inventoryIcon } from "@/components/ui/icons.generated";
import { categories, categoryGroups } from "@/content/categories";
import { formatDay, place } from "@/features/board/format";
import { currentPublicLoads } from "@/features/board/public-loads";
import { buildMetadata } from "@/lib/seo";
import { categoryLabel } from "@/server/loads/service";

const path = "/loads";

export const revalidate = 300;

export const metadata = buildMetadata({
  title: "Load Board: Open Loads for Verified Carriers",
  description: "The AllShip AI load board lists open moves, vehicle, freight and equipment loads from US shippers. Verified carriers bid and get paid after delivery.",
  path,
});

const shown = [
  { term: "Route", detail: "Pickup and delivery city and state" },
  { term: "What", detail: "Category and the details carriers need to price it, such as size, weight or vehicle type" },
  { term: "Pickup", detail: "The first day the shipper can hand the load over" },
  { term: "Bids", detail: "How many carriers have bid so far" },
];

const hidden = ["Street addresses", "The shipper's name, email and phone"];

const groupOf = new Map(categories.map((c) => [c.key as string, c.group as string]));
const number = new Intl.NumberFormat("en-US");

function time(value: string | null) {
  if (!value) return Number.MAX_SAFE_INTEGER;
  const t = new Date(value.length === 10 ? `${value}T12:00:00Z` : value).getTime();
  return Number.isNaN(t) ? Number.MAX_SAFE_INTEGER : t;
}

function Empty() {
  return (
    <div role="status" className="flex flex-col items-center rounded-md border border-outline-variant px-6 py-16 text-center medium:py-24">
      <Icon icon={inventoryIcon} size={48} className="text-on-surface-variant" />
      <p className="mt-5 text-headline-sm font-normal text-on-surface">No open loads to show right now</p>
      <p className="mt-3 max-w-[520px] text-body-lg text-pretty text-on-surface-variant">New loads appear here as shippers post them. Carriers who sign up and get verified can also see matching loads in their account.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link href="/quote">Post a load</Link>
        </Button>
        <Button asChild variant="tonal">
          <Link href="/sign-up?type=carrier">Sign up as a carrier</Link>
        </Button>
      </div>
    </div>
  );
}

export default async function LoadsPage() {
  const open = await currentPublicLoads();
  const rows: BoardRow[] = open.map((l) => ({
    id: l.id,
    title: l.title,
    category: categoryLabel(l.category),
    group: groupOf.get(l.category) ?? "freight",
    from: place({ city: l.pickupCity, state: l.pickupState }),
    to: place({ city: l.dropoffCity, state: l.dropoffState }),
    pickupState: l.pickupState,
    pickup: formatDay(l.pickupDate) ?? "Flexible",
    pickupAt: time(l.pickupDate),
    bids: l.bids,
    closes: formatDay(l.biddingClosesAt) ?? "Open",
    closesAt: time(l.biddingClosesAt),
  }));
  const groups = Object.entries(categoryGroups).map(([key, g]) => ({ key, label: g.label }));
  const noBids = open.filter((l) => l.bids === 0).length;

  return (
    <>
      <header className="pt-6 pb-10 medium:pt-8 medium:pb-12">
        <Container>
          <Breadcrumbs items={[{ name: "Load board", path }]} />
          <div className="mt-10 grid gap-8 expanded:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] expanded:items-end expanded:gap-16 medium:mt-12">
            <div>
              <p className="mb-4 text-title-sm font-medium text-primary" {...enter(0)}>
                Public load board
              </p>
              <h1 className="text-display-sm font-normal tracking-tight text-balance medium:text-display-md">
                <RevealText>Open loads</RevealText>
              </h1>
              <p className="mt-5 max-w-[640px] text-body-lg text-pretty text-on-surface-variant medium:text-title-lg medium:font-normal" {...enter(3)}>
                Loads posted by shippers on AllShip AI appear here while bidding is open. Anyone can look. Verified carriers can bid and keep 100% of their bid.
              </p>
              <div className="mt-7 flex flex-wrap gap-3" {...enter(4)}>
                <Button asChild size="lg" data-magnetic="">
                  <Link href="/sign-up?type=carrier" data-track="loads_hero_signup">
                    Sign up to bid
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outlined">
                  <Link href="/quote">Post a load</Link>
                </Button>
              </div>
            </div>
            {open.length > 0 && (
              <dl className="grid grid-cols-2 border-t border-outline-variant" {...enter(5)}>
                <div className="border-r border-outline-variant py-5 pr-6">
                  <dt className="text-body-md text-on-surface-variant">Open for bids</dt>
                  <dd className="mt-1 flex items-center gap-2 text-display-sm text-on-surface tabular-nums">
                    <span aria-hidden="true" className="relative inline-flex size-2.5">
                      <span className="absolute inset-0 rounded-full bg-success motion-safe:animate-ping motion-safe:[animation-duration:2.4s]" />
                      <span className="relative size-2.5 rounded-full bg-success" />
                    </span>
                    {number.format(open.length)}
                  </dd>
                </div>
                <div className="py-5 pl-6">
                  <dt className="text-body-md text-on-surface-variant">Still waiting for a first bid</dt>
                  <dd className="mt-1 text-display-sm text-primary tabular-nums">{number.format(noBids)}</dd>
                </div>
              </dl>
            )}
          </div>
        </Container>
      </header>

      <Section spacing="none" className="pb-16 medium:pb-24" labelledBy="board-heading">
        <h2 id="board-heading" className="sr-only">
          Open loads list
        </h2>
        <LoadBoard rows={rows} groups={groups} arrow={<Icon icon={eastIcon} size={18} className="text-on-surface-variant" label="to" />} empty={<Empty />} />
      </Section>

      <Section tone="low" labelledBy="bid-heading">
        <FeatureSpotlight
          scene="carrierBoard"
          eyebrow="After you are verified"
          title={<span id="bid-heading">Carriers: from listing to payout</span>}
          description="Inside your account the same board shows full load details, filters by load type and state, and a bid form that tells you exactly what you receive. If the shipper accepts, they pay into escrow and the load is yours."
        >
          <div className="flex flex-col gap-3 text-title-md">
            <Link href="/partners" className="rounded-xs text-primary underline-offset-4 hover:underline">
              How bidding and payouts work
            </Link>
            <Link href="/partners#requirements" className="rounded-xs text-primary underline-offset-4 hover:underline">
              What you need to get verified
            </Link>
            <Link href="/drivers" className="rounded-xs text-primary underline-offset-4 hover:underline">
              What your drivers do on a trip
            </Link>
          </div>
        </FeatureSpotlight>
      </Section>

      <Section labelledBy="privacy-heading">
        <div className="grid gap-12 expanded:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] expanded:gap-20">
          <div>
            <SectionHeading id="privacy-heading">What a load listing shows</SectionHeading>
            <dl className="mt-8 border-t border-outline-variant">
              {shown.map((s) => (
                <div key={s.term} className="grid gap-1 border-b border-outline-variant py-4 medium:grid-cols-[150px_1fr] medium:gap-6">
                  <dt className="text-title-md text-on-surface">{s.term}</dt>
                  <dd className="text-body-lg text-pretty text-on-surface-variant">{s.detail}</dd>
                </div>
              ))}
            </dl>
            <h3 className="mt-12 text-headline-sm font-normal text-on-surface">What it never shows</h3>
            <ul className="mt-5 flex flex-col gap-3">
              {hidden.map((h) => (
                <li key={h} className="flex gap-3 text-body-lg text-on-surface">
                  <span aria-hidden="true" className="mt-2.5 size-1.5 shrink-0 rounded-full bg-on-surface-variant" />
                  {h}
                </li>
              ))}
            </ul>
            <p className="mt-6 text-body-lg text-pretty text-on-surface-variant">
              Exact addresses and contact details go only to the carrier the shipper books. Read more on{" "}
              <Link href="/safety" className="text-primary underline-offset-4 hover:underline">
                safety and privacy
              </Link>
              .
            </p>
          </div>
          <div className="expanded:pt-16">
            <p className="text-title-sm font-medium text-primary">What you are paid</p>
            <p className="mt-3 max-w-[460px] text-headline-sm font-normal text-balance text-on-surface">The fee is added to the shipper&apos;s total. Your bid is what lands in your account.</p>
            <PayoutLedger bidCents={78_000} route={["Dallas, TX", "Tulsa, OK"]} className="mt-8 max-w-[440px]" />
          </div>
        </div>
      </Section>

      <CtaBand
        title="Have something to ship?"
        description="Post it here. Verified carriers bid, you compare and choose, and your payment waits in escrow until delivery."
        primary={{ label: "Post a load", href: "/quote" }}
        secondary={{ label: "Haul with AllShip", href: "/partners" }}
      />
      <StickyCta href="/sign-up?type=carrier" label="Sign up to bid" note={open.length ? `${number.format(open.length)} loads open for bids` : "Free for verified carriers"} />
    </>
  );
}
