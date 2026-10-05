import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Icon } from "@/components/ui/icon";
import {
  calendarMonthIcon,
  checkCircleIcon,
  eastIcon,
  gavelIcon,
  lockClockIcon,
  lockIcon,
  starIcon,
  verifiedIcon,
} from "@/components/ui/icons.generated";
import { StatusChip } from "@/components/ui/status-chip";
import { formatUsd } from "@/lib/money";
import { cn } from "@/lib/cn";
import { defineScene } from "../define";
import type { SceneViewProps } from "../types";
import { demoBids, demoLoad, split, type DemoBid } from "./data";
import { AppShell, Sheet, Snackbar } from "./kit";

type Sort = "price" | "rating" | "pickup";
type S = { count: number; sort: Sort; dialog: "none" | "confirm" | "pay"; paying: boolean; paid: boolean };

const sorters: Record<Sort, (a: DemoBid, b: DemoBid) => number> = {
  price: (a, b) => a.cents - b.cents,
  rating: (a, b) => b.rating - a.rating,
  pickup: (a, b) => a.pickup.localeCompare(b.pickup) || a.cents - b.cents,
};

const chosen = demoBids[1]!;
const money = split(chosen.cents);

export function PriceBreakdown({ carrier, fee, total }: { carrier: number; fee: number; total: number }) {
  return (
    <dl className="text-body-lg flex flex-col gap-2">
      <div className="flex justify-between gap-4">
        <dt className="text-on-surface-variant">Carrier&rsquo;s bid</dt>
        <dd className="text-on-surface tabular-nums">{formatUsd(carrier)}</dd>
      </div>
      <div className="flex justify-between gap-4">
        <dt className="text-on-surface-variant">AllShip service fee (10%)</dt>
        <dd className="text-on-surface tabular-nums">{formatUsd(fee)}</dd>
      </div>
      <div className="border-outline-variant mt-1 flex justify-between gap-4 border-t pt-3">
        <dt className="text-title-md text-on-surface">Total due now</dt>
        <dd className="text-title-lg text-on-surface tabular-nums">{formatUsd(total)}</dd>
      </div>
    </dl>
  );
}

function BidRow({
  bid,
  lowest,
  index,
  booked,
}: {
  bid: DemoBid;
  lowest: boolean;
  index: number;
  booked: boolean;
}) {
  return (
    <li
      className="border-outline-variant animate-enter absolute inset-x-0 border-b transition-[top] duration-500 ease-[cubic-bezier(0.2,0,0,1)]"
      style={{ top: `calc(${index} * var(--row))`, height: "var(--row)" }}
    >
      <article className="flex h-full flex-col justify-center gap-2 px-4 @3xl:flex-row @3xl:items-center @3xl:gap-6 @3xl:px-5">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
            <h3 className="text-title-md text-on-surface">{bid.carrier}</h3>
            <StatusChip tone="success" icon={verifiedIcon} size="sm">
              FMCSA verified
            </StatusChip>
            {lowest && (
              <StatusChip tone="primary" size="sm">
                Lowest bid
              </StatusChip>
            )}
          </div>
          <p className="text-body-md text-on-surface-variant mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
            <span className="inline-flex items-center gap-1">
              <Icon icon={starIcon} size={16} filled className="text-warning" />
              <span className="text-on-surface">{bid.rating.toFixed(1)}</span>({bid.reviews} reviews)
            </span>
            <span className="hidden @3xl:inline">{bid.loads} loads completed</span>
            <span className="inline-flex items-center gap-1">
              <Icon icon={calendarMonthIcon} size={16} />
              Pickup by {bid.pickup}
            </span>
          </p>
        </div>
        <div className="flex items-center justify-between gap-3 @3xl:w-44 @3xl:flex-col @3xl:items-end">
          <p className="@3xl:text-right">
            <span className="text-headline-sm text-on-surface block tabular-nums">
              {formatUsd(bid.cents, true)}
            </span>
            <span className="text-body-sm text-on-surface-variant block">carrier&rsquo;s price</span>
          </p>
          {!booked && (
            <Button data-demo={`accept-${bid.id}`} variant={lowest ? "filled" : "tonal"} size="sm">
              Accept
            </Button>
          )}
        </div>
      </article>
    </li>
  );
}

function View({ s }: SceneViewProps<S>) {
  const visible = demoBids.slice(0, s.count);
  const ordered = [...visible].sort(sorters[s.sort]);
  const lowestId = [...visible].sort(sorters.price)[0]?.id;
  return (
    <AppShell role="shipper" active="loads" unread={s.count}>
      <div data-demo-scroll="main" className="h-full overflow-hidden px-4 pb-6 @3xl:pr-8 @3xl:pl-2">
        <div className="pt-2 pb-5 @3xl:pt-4">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 className="text-headline-sm text-on-surface @3xl:text-headline-md">{demoLoad.title}</h2>
            <span className="text-label-lg text-on-surface-variant font-mono">{demoLoad.publicId}</span>
          </div>
          <p className="text-body-lg text-on-surface mt-1 flex items-center gap-1.5">
            {demoLoad.from}
            <Icon icon={eastIcon} size={18} className="text-on-surface-variant" />
            {demoLoad.to}
          </p>
          <div className="mt-3">
            {s.paid ? (
              <StatusChip tone="success" icon={checkCircleIcon}>
                Booked
              </StatusChip>
            ) : (
              <StatusChip tone="primary" icon={gavelIcon}>
                Open for bids
              </StatusChip>
            )}
          </div>
        </div>
        {s.paid && (
          <div
            data-demo="escrow-banner"
            className="bg-success-container text-on-success-container animate-enter mb-5 flex items-start gap-3 rounded-md px-4 py-3"
          >
            <Icon icon={lockIcon} className="mt-0.5 shrink-0" />
            <p className="text-body-md">
              <span className="font-medium">Paid into escrow.</span> {formatUsd(money.total)} is held until
              you confirm delivery. {chosen.carrier} then receives {formatUsd(money.carrier)}.
            </p>
          </div>
        )}
        <section className="border-outline-variant rounded-md border">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 pt-4 pb-3 @3xl:px-5">
            <h3 className="text-title-lg text-on-surface">
              Bids <span className="text-on-surface-variant tabular-nums">({s.count})</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              <Chip
                variant="filter"
                label="Lowest price"
                selected={s.sort === "price"}
                data-demo="sort-price"
              />
              <Chip
                variant="filter"
                label="Top rated"
                selected={s.sort === "rating"}
                data-demo="sort-rating"
              />
              <Chip
                variant="filter"
                label="Earliest pickup"
                selected={s.sort === "pickup"}
                className="hidden @3xl:inline-flex"
              />
            </div>
          </div>
          {s.count === 0 ? (
            <p className="border-outline-variant text-body-md text-on-surface-variant border-t px-5 py-10 text-center">
              Verified carriers usually bid within a few hours.
            </p>
          ) : (
            <ul
              className="border-outline-variant relative border-t [--row:150px] @3xl:[--row:104px]"
              style={{ height: `calc(${s.count} * var(--row))` }}
            >
              {visible.map((b) => (
                <BidRow
                  key={b.id}
                  bid={b}
                  index={ordered.indexOf(b)}
                  lowest={b.id === lowestId && visible.length > 1}
                  booked={s.paid}
                />
              ))}
            </ul>
          )}
        </section>
      </div>
      <Sheet
        open={s.dialog === "confirm"}
        title={`Accept ${chosen.carrier}?`}
        description="You'll pay now to lock in this carrier. Other carriers are notified once payment goes through."
        actions={
          <>
            <Button variant="text">Cancel</Button>
            <Button data-demo="continue-pay">Continue to payment</Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div data-demo="breakdown">
            <PriceBreakdown {...money} />
          </div>
          <p className="bg-surface-container text-body-sm text-on-surface-variant flex items-start gap-2 rounded-sm p-3">
            <Icon icon={lockClockIcon} size={18} className="mt-px shrink-0" />
            We hold the load for you for 30 minutes while you pay.
          </p>
        </div>
      </Sheet>
      <Sheet
        open={s.dialog === "pay"}
        title="Pay to book"
        description={`Your payment is held in escrow and released to ${chosen.carrier} after delivery.`}
      >
        <div className="flex flex-col gap-4">
          <div className="border-outline-variant flex items-center justify-between rounded-md border px-4 py-3">
            <span className="text-body-md text-on-surface-variant">Card</span>
            <span className="text-body-md text-on-surface font-mono">•••• 4242 · 12/28</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-title-md text-on-surface">Total due now</span>
            <span className="text-title-lg text-on-surface tabular-nums">{formatUsd(money.total)}</span>
          </div>
          <Button data-demo="pay" size="lg" loading={s.paying} className={cn("w-full")}>
            Pay {formatUsd(money.total)}
          </Button>
        </div>
      </Sheet>
      <Snackbar show={s.paid}>Booked. {chosen.carrier} is notified.</Snackbar>
    </AppShell>
  );
}

export const bidsCompare = defineScene<S>({
  id: "bidsCompare",
  title: "Compare bids and book",
  summary:
    "Bids from verified carriers arrive on the load. The shipper sorts them, accepts one and pays into escrow.",
  url: `/app/loads/${demoLoad.publicId}`,
  device: "desktop",
  initial: { count: 0, sort: "price", dialog: "none", paying: false, paid: false },
  View,
  script: ({ caption, click, set, wait, highlight }) => [
    caption("Bids from verified carriers arrive on your load"),
    wait(500),
    set({ count: 1 }),
    wait(900),
    set({ count: 2 }),
    wait(900),
    set({ count: 3 }),
    wait(900),
    set({ count: 4 }),
    wait(800),
    caption("Sort by price or by rating"),
    click("sort-rating", { sort: "rating" }),
    wait(1100),
    caption("Accept: the carrier's bid plus a 10% service fee"),
    click(`accept-${chosen.id}`, { dialog: "confirm" }),
    wait(400),
    highlight("breakdown", "The carrier keeps 100% of the bid. The 10% fee is the only thing you pay on top"),
    click("continue-pay", { dialog: "pay" }),
    wait(500),
    caption("Pay into escrow. The load is booked"),
    click("pay", { paying: true }),
    wait(800),
    set({ dialog: "none", paying: false, paid: true }),
    wait(400),
    highlight("escrow-banner", "Money waits in escrow until delivery is confirmed"),
  ],
});
