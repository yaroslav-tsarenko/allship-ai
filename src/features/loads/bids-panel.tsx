"use client";

import { useAction } from "next-safe-action/hooks";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Chip, ChipSet } from "@/components/ui/chip";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { calendarMonthIcon, gavelIcon, localShippingIcon, lockClockIcon, starIcon, verifiedIcon } from "@/components/ui/icons.generated";
import { StatusChip } from "@/components/ui/status-chip";
import { feeFor, formatUsd } from "@/lib/money";
import { resumePaymentAction } from "@/server/actions/payments";
import { acceptBidAction } from "@/server/actions/marketplace";
import type { LoadStatus } from "@/server/db/schema/enums";
import { PaymentStep, PriceBreakdown, type PaymentInfo } from "./payment-step";
import { formatDay } from "./presentation";

export type BidView = {
  id: string;
  amountCents: number;
  estimatedPickupAt: Date | null;
  estimatedDeliveryAt: Date | null;
  message: string;
  status: string;
  carrierName: string;
  fmcsaStatus: string | null;
  usdot: string | null;
  rating: number | null;
  reviews: number;
  completedLoads: number;
  createdAt: Date;
  origin?: string;
};

type Sort = "price" | "rating" | "pickup";

const sorters: Record<Sort, (a: BidView, b: BidView) => number> = {
  price: (a, b) => a.amountCents - b.amountCents,
  rating: (a, b) => (b.rating ?? 0) - (a.rating ?? 0) || b.completedLoads - a.completedLoads || a.amountCents - b.amountCents,
  pickup: (a, b) => (a.estimatedPickupAt ? new Date(a.estimatedPickupAt).getTime() : Infinity) - (b.estimatedPickupAt ? new Date(b.estimatedPickupAt).getTime() : Infinity) || a.amountCents - b.amountCents,
};

function BidCard({ bid, lowest, canAccept, resuming, highlighted, onAccept }: { bid: BidView; lowest: boolean; canAccept: boolean; resuming: boolean; highlighted: boolean; onAccept: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const long = bid.message.length > 220;
  const verified = bid.fmcsaStatus === "verified";
  return (
    <article
      data-tour="bid-card"
      id={`bid-${bid.id}`}
      data-highlighted={highlighted || undefined}
      className={`flex scroll-mt-24 flex-col gap-4 p-4 medium:flex-row medium:gap-6 medium:p-5 ${highlighted ? "bg-primary-container/40 shadow-[inset_4px_0_0_var(--md-primary)]" : ""}`}
      aria-label={`${bid.carrierName}, ${formatUsd(bid.amountCents, true)}${highlighted ? ", your chosen instant quote" : ""}`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
          <h3 className="text-title-md text-on-surface">{bid.carrierName}</h3>
          {verified ? (
            <StatusChip tone="success" icon={verifiedIcon} size="sm">
              FMCSA verified
            </StatusChip>
          ) : (
            <StatusChip tone="neutral" size="sm">
              Authority not verified
            </StatusChip>
          )}
          {lowest && (
            <StatusChip tone="primary" size="sm">
              Lowest bid
            </StatusChip>
          )}
          {bid.origin === "instant_quote" && (
            <StatusChip tone="neutral" size="sm">
              {highlighted ? "Your instant quote" : "Instant quote"}
            </StatusChip>
          )}
        </div>
        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-body-md text-on-surface-variant">
          {bid.rating !== null ? (
            <span className="inline-flex items-center gap-1">
              <Icon icon={starIcon} size={16} filled className="text-warning" />
              <span className="text-on-surface">{bid.rating.toFixed(1)}</span>
              <span>
                ({bid.reviews} {bid.reviews === 1 ? "review" : "reviews"})
              </span>
            </span>
          ) : (
            <span>No reviews yet</span>
          )}
          <span>
            {bid.completedLoads} {bid.completedLoads === 1 ? "load" : "loads"} completed
          </span>
          {bid.usdot && <span className="font-mono text-body-sm">USDOT {bid.usdot}</span>}
        </p>
        <p className={`mt-3 text-body-md whitespace-pre-line text-on-surface ${!expanded && long ? "line-clamp-3" : ""}`}>{bid.message}</p>
        {long && (
          <button type="button" onClick={() => setExpanded((v) => !v)} className="mt-1 cursor-pointer text-label-lg font-medium text-primary" aria-expanded={expanded}>
            {expanded ? "Show less" : "Read more"}
          </button>
        )}
        <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-body-sm text-on-surface-variant">
          <span className="inline-flex items-center gap-1">
            <Icon icon={calendarMonthIcon} size={16} />
            Pickup by {formatDay(bid.estimatedPickupAt)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Icon icon={localShippingIcon} size={16} />
            Delivered by {formatDay(bid.estimatedDeliveryAt)}
          </span>
        </p>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-outline-variant pt-3 medium:w-40 medium:flex-col medium:items-end medium:justify-start medium:border-t-0 medium:pt-0">
        <p className="text-right">
          <span className="block text-headline-sm text-on-surface tabular-nums">{formatUsd(bid.amountCents, true)}</span>
          <span className="block text-body-sm text-on-surface-variant">carrier&rsquo;s price</span>
        </p>
        {canAccept && (
          <Button data-tour="bid-accept" onClick={onAccept} variant={resuming || highlighted || lowest ? "filled" : "tonal"}>
            {resuming ? "Resume payment" : highlighted ? "Accept and pay" : "Accept"}
          </Button>
        )}
      </div>
    </article>
  );
}

export function BidsPanel({
  loadId,
  publicId,
  status,
  acceptedBidId,
  bids,
  feeBps,
  pending,
  highlightBidId = null,
}: {
  loadId: string;
  publicId: string;
  status: LoadStatus;
  acceptedBidId: string | null;
  bids: BidView[];
  feeBps: number;
  pending: PaymentInfo | null;
  highlightBidId?: string | null;
}) {
  const router = useRouter();
  const [sort, setSort] = useState<Sort>("price");
  const [selected, setSelected] = useState<BidView | null>(null);
  const [payment, setPayment] = useState<PaymentInfo | null>(null);
  const accept = useAction(acceptBidAction);
  const resume = useAction(resumePaymentAction);

  const visible = useMemo(() => bids.filter((b) => b.status === "active").sort(sorters[sort]), [bids, sort]);
  const lowestId = useMemo(() => [...visible].sort(sorters.price)[0]?.id, [visible]);
  const awaiting = status === "awaiting_payment";
  const open = selected !== null;

  const startAccept = async (bid: BidView) => {
    setSelected(bid);
    if (awaiting && bid.id === acceptedBidId) {
      if (pending) return setPayment(pending);
      const res = await resume.executeAsync({ loadId });
      if (res?.serverError) {
        toast.error(res.serverError);
        setSelected(null);
        return;
      }
      if (res?.data) setPayment(res.data);
    } else {
      setPayment(null);
    }
  };

  const confirmAccept = async () => {
    if (!selected) return;
    const res = await accept.executeAsync({ bidId: selected.id });
    if (res?.serverError) return void toast.error(res.serverError);
    if (!res?.data) return void toast.error("Something went wrong. Try again.");
    setPayment({ ...res.data, carrierName: selected.carrierName });
    router.refresh();
  };

  const close = (next: boolean) => {
    if (next) return;
    setSelected(null);
    setPayment(null);
  };

  const preview = selected ? feeFor(selected.amountCents, feeBps) : null;
  const feePct = `${(feeBps / 100).toLocaleString("en-US")}%`;

  if (visible.length === 0) {
    return (
      <EmptyState
        compact
        headingLevel={3}
        icon={gavelIcon}
        title={status === "open" ? "No bids yet" : "No active bids"}
        description={
          status === "open"
            ? "Verified carriers usually bid within a few hours. We'll email you as soon as one comes in."
            : "Bids appear here while the load is open."
        }
      />
    );
  }

  return (
    <>
      <div data-tour="bids-sort" className="flex flex-wrap items-center justify-between gap-3 px-4 pb-3 medium:px-5">
        <ChipSet label="Sort bids">
          <Chip variant="filter" label="Lowest price" selected={sort === "price"} onClick={() => setSort("price")} />
          <Chip variant="filter" label="Top rated" selected={sort === "rating"} onClick={() => setSort("rating")} />
          <Chip variant="filter" label="Earliest pickup" selected={sort === "pickup"} onClick={() => setSort("pickup")} />
        </ChipSet>
      </div>
      <ul className="border-t border-outline-variant">
        {visible.map((b) => (
          <li key={b.id} className="border-b border-outline-variant last:border-b-0">
            <BidCard
              bid={b}
              lowest={b.id === lowestId && visible.length > 1}
              canAccept={status === "open" || (awaiting && b.id === acceptedBidId)}
              resuming={awaiting && b.id === acceptedBidId}
              highlighted={b.id === highlightBidId}
              onAccept={() => void startAccept(b)}
            />
          </li>
        ))}
      </ul>

      <Dialog
        open={open}
        onOpenChange={close}
        title={payment ? "Pay to book" : `Accept ${selected?.carrierName ?? "this bid"}?`}
        description={
          payment
            ? `Your payment is held in escrow and released to ${payment.carrierName ?? selected?.carrierName ?? "the carrier"} after delivery.`
            : "You'll pay now to lock in this carrier. Other carriers are notified once payment goes through."
        }
        actions={
          payment ? undefined : (
            <>
              <Button variant="text" onClick={() => close(false)}>
                Cancel
              </Button>
              <Button onClick={confirmAccept} loading={accept.isPending || resume.isPending}>
                Continue to payment
              </Button>
            </>
          )
        }
      >
        {payment ? (
          <PaymentStep info={payment} publicId={publicId} onDone={() => close(false)} />
        ) : preview ? (
          <div className="flex flex-col gap-4">
            <PriceBreakdown carrierCents={preview.carrierAmountCents} feeCents={preview.platformFeeCents} totalCents={preview.shipperTotalCents} feeLabel={`AllShip service fee (${feePct})`} />
            <p className="flex items-start gap-2 rounded-sm bg-surface-container p-3 text-body-sm text-on-surface-variant">
              <Icon icon={lockClockIcon} size={18} className="mt-px shrink-0" />
              We hold the load for you for 30 minutes while you pay. If payment isn&rsquo;t finished by then, the load reopens for bids.
            </p>
          </div>
        ) : null}
      </Dialog>
    </>
  );
}
