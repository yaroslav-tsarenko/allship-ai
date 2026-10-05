import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Reveal } from "@/components/motion/reveal";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { arrowBackIcon, callIcon, gavelIcon, timerIcon } from "@/components/ui/icons.generated";
import { StatusChip } from "@/components/ui/status-chip";
import { env } from "@/env";
import { BidForm } from "@/features/board/bid-form";
import { carrierStanding } from "@/features/board/eligibility";
import { formatDay, place, timeLeft } from "@/features/board/format";
import { DetailSections, ManageTripLink, RouteBlock } from "@/features/board/load-detail";
import { shipperTrackRecord } from "@/features/board/queries";
import { StandingBanner } from "@/features/board/standing-banner";
import { cn } from "@/lib/cn";
import { formatUsd } from "@/lib/money";
import { getActor } from "@/server/actor";
import { categoryLabel, getLoadForCarrier } from "@/server/loads/service";
import { getViewer } from "@/server/viewer/viewer";

type Props = { params: Promise<{ publicId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { publicId } = await params;
  return { title: publicId };
}

const lapsedCopy: Record<string, string> = {
  withdrawn: "You withdrew your earlier bid. You can bid again while the load is open.",
  declined: "Your earlier bid wasn't accepted. You can bid again while the load is open.",
  expired: "Your earlier bid expired.",
};

export default async function CarrierLoadPage({ params }: Props) {
  const { publicId } = await params;
  const viewer = await getViewer();
  const standing = carrierStanding(viewer);
  const actor = await getActor(viewer.user.id);
  const data = await getLoadForCarrier(actor, publicId);
  if (!data) notFound();
  const { load, booked, myBid, bidCount, shipper } = data;
  const track = await shipperTrackRecord(load.id);
  const left = timeLeft(load.biddingClosesAt);
  const details = (load.details ?? {}) as Record<string, unknown>;
  const activeBid = myBid?.status === "active" ? myBid : null;
  const disabledReason = standing.canBid
    ? null
    : standing.fmcsaStatus === "failed"
      ? "We couldn't verify your company with FMCSA, so bidding is turned off. Review your company details in Settings or contact support."
      : "Bidding opens once we've verified your USDOT and MC numbers with FMCSA. You'll get an email when it's done.";
  const futureOr = (d?: string) => {
    const t = new Date().toISOString().slice(0, 10);
    return d && d.slice(0, 10) >= t ? d.slice(0, 10) : t;
  };

  return (
    <div className="mx-auto max-w-[1120px]">
      <Link href="/app/board" className="state-layer -ml-3 inline-flex h-10 items-center gap-2 rounded-full pr-4 pl-3 text-label-lg text-on-surface-variant">
        <Icon icon={arrowBackIcon} size={20} />
        Find loads
      </Link>

      <header className="pt-2 pb-6">
        <p className="text-label-lg text-on-surface-variant">
          {categoryLabel(load.category)} · {load.publicId}
        </p>
        <h1 className="mt-1 text-headline-sm text-on-surface medium:text-headline-md">{load.title}</h1>
        <p className="mt-2 text-title-md font-normal text-on-surface-variant">
          {place(load.pickup)} to {place(load.dropoff)}
          {load.distanceMiles ? ` · ${Math.round(load.distanceMiles).toLocaleString("en-US")} mi` : ""}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {booked ? (
            <StatusChip tone="success" dot>
              Booked by your company
            </StatusChip>
          ) : (
            <>
              <StatusChip tone={left.urgent ? "error" : "neutral"} icon={timerIcon}>
                {left.label}
              </StatusChip>
              <StatusChip icon={gavelIcon}>{bidCount === 0 ? "No bids yet" : `${bidCount} ${bidCount === 1 ? "bid" : "bids"}`}</StatusChip>
              {load.targetPriceCents ? <StatusChip tone="primary">Target {formatUsd(load.targetPriceCents, true)}</StatusChip> : null}
            </>
          )}
        </div>
      </header>

      {!booked && <StandingBanner standing={standing} className="mb-6" />}

      <div className="grid gap-6 expanded:grid-cols-[minmax(0,1fr)_380px] large:grid-cols-[minmax(0,1fr)_420px]">
        <Reveal stagger={0.06} className="flex min-w-0 flex-col gap-6">
          <Card as="section" data-tour="board-route" aria-labelledby="route-title" className="p-5 medium:p-6">
            <h2 id="route-title" className="mb-4 text-title-lg">
              Route and dates
            </h2>
            <RouteBlock pickup={load.pickup} dropoff={load.dropoff} booked={booked} />
          </Card>
          <Card as="section" aria-labelledby="details-title" className="p-5 medium:p-6">
            <h2 id="details-title" className="mb-4 text-title-lg">
              What&apos;s being shipped
            </h2>
            <DetailSections category={load.category} details={details} />
          </Card>
          <Card as="section" aria-labelledby="shipper-title" className="p-5 medium:p-6">
            <h2 id="shipper-title" className="text-title-lg">
              Shipper
            </h2>
            {booked && shipper ? (
              <div className="mt-3 flex flex-col gap-1 text-body-md">
                <p className="text-title-md text-on-surface">{shipper.name}</p>
                {shipper.phone && (
                  <a href={`tel:${shipper.phone}`} className="inline-flex items-center gap-2 self-start rounded-xs text-primary underline-offset-4 hover:underline">
                    <Icon icon={callIcon} size={18} />
                    {shipper.phone}
                  </a>
                )}
              </div>
            ) : (
              <p className="mt-1 text-body-md text-on-surface-variant">Name and contact details are shared once you&apos;re booked.</p>
            )}
            {track && (
              <dl className="mt-4 grid grid-cols-3 gap-4 border-t border-outline-variant pt-4">
                <div>
                  <dt className="text-body-sm text-on-surface-variant">Loads posted</dt>
                  <dd className="text-title-lg text-on-surface tabular-nums">{track.posted}</dd>
                </div>
                <div>
                  <dt className="text-body-sm text-on-surface-variant">Completed</dt>
                  <dd className="text-title-lg text-on-surface tabular-nums">{track.completed}</dd>
                </div>
                <div>
                  <dt className="text-body-sm text-on-surface-variant">On AllShip since</dt>
                  <dd className="text-title-md text-on-surface">{formatDay(track.memberSince, true)}</dd>
                </div>
              </dl>
            )}
          </Card>
        </Reveal>

        <aside className="expanded:sticky expanded:top-20 expanded:self-start" aria-label="Bid">
          <Card data-tour="bid-panel" className={cn("p-5 medium:p-6", !booked && "bg-surface-container-low")}>
            {booked ? (
              <div className="flex flex-col gap-2">
                <h2 className="text-title-lg text-on-surface">You&apos;re booked</h2>
                <p className="text-body-md text-on-surface-variant">
                  The shipper paid into escrow{myBid ? ` for your ${formatUsd(myBid.amountCents)} bid` : ""}. Full addresses and contact details are unlocked on this page. You&apos;re paid after the shipper confirms delivery.
                </p>
                <ManageTripLink publicId={load.publicId} className="mt-2 self-start" />
              </div>
            ) : (
              <BidForm
                loadId={load.id}
                feeBps={env.PLATFORM_FEE_BPS}
                disabledReason={disabledReason}
                lapsed={myBid && myBid.status !== "active" ? (lapsedCopy[myBid.status] ?? null) : null}
                defaults={{ pickup: futureOr(load.pickup.windowStart), delivery: load.dropoff.windowStart ? futureOr(load.dropoff.windowStart) : "" }}
                activeBid={
                  activeBid
                    ? {
                        id: activeBid.id,
                        amountCents: activeBid.amountCents,
                        estimatedPickupAt: activeBid.estimatedPickupAt?.toISOString() ?? "",
                        estimatedDeliveryAt: activeBid.estimatedDeliveryAt?.toISOString() ?? "",
                        message: activeBid.message,
                        createdAt: activeBid.createdAt.toISOString(),
                      }
                    : null
                }
              />
            )}
          </Card>
        </aside>
      </div>
    </div>
  );
}
