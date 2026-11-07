import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { arrowBackIcon, callIcon, chatIcon, editIcon, gavelIcon, localShippingIcon, locationOnIcon, personIcon, tripOriginIcon, verifiedIcon } from "@/components/ui/icons.generated";
import { env } from "@/env";
import { OpenChatButton } from "@/features/chat/open-chat-button";
import { DisputeDialog } from "@/features/disputes/dispute-dialog";
import { WithdrawDisputeButton } from "@/features/disputes/dispute-card";
import { disputeReasonLabels, disputeStatusLabels, type DisputeReasonValue } from "@/features/disputes/reasons";
import { BidsPanel } from "@/features/loads/bids-panel";
import { AutoReleaseCountdown, ConfirmDeliveryActions } from "@/features/loads/delivery-actions";
import { requireShipper } from "@/features/loads/guard";
import { LoadLiveRefresh } from "@/features/loads/live-refresh";
import { CancelLoadButton, RelistButton, ResumePaymentCard } from "@/features/loads/load-actions";
import { LoadStatusChip } from "@/features/loads/load-status-chip";
import { getPostBooking, postBookingStatuses } from "@/features/loads/post-booking";
import { categoryIcons, eventLabels, formatDateTime, formatWindow, timeLeft } from "@/features/loads/presentation";
import { ReviewForm, Stars } from "@/features/loads/review-form";
import { detailSections } from "@/features/loads/spec";
import { buildTripSteps, TripProgress } from "@/features/loads/trip-progress";
import { LazyLiveMap } from "@/features/tracking/lazy-live-map";
import { MediaGallery } from "@/features/tracking/media-gallery";
import { WelcomeNotice } from "@/features/public-load/welcome-notice";
import { cn } from "@/lib/cn";
import { formatUsd } from "@/lib/money";
import { categoryLabel, getShipperLoad } from "@/server/loads/service";
import { statusLabels } from "@/server/loads/transitions";
import { getPendingPayment } from "@/server/payments/queries";
import { AUTO_COMPLETE_HOURS } from "@/server/trips/service";

type Props = { params: Promise<{ publicId: string }>; searchParams: Promise<{ payment?: string; redirect_status?: string; bid?: string; welcome?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { publicId } = await params;
  return { title: publicId };
}

type Stop = { address?: string; city?: string; state?: string; postalCode?: string; windowStart?: string; windowEnd?: string; notes?: string };

function StopBlock({ stop, kind }: { stop: Stop; kind: "pickup" | "dropoff" }) {
  const pickup = kind === "pickup";
  return (
    <div className="relative flex gap-3">
      <Icon icon={pickup ? tripOriginIcon : locationOnIcon} filled size={20} className={pickup ? "mt-0.5 shrink-0 text-primary" : "mt-0.5 shrink-0 text-tertiary"} />
      <div className="min-w-0">
        <p className="text-label-lg text-on-surface-variant">{pickup ? "Pickup" : "Delivery"}</p>
        <p className="text-body-lg text-on-surface">{stop.address}</p>
        <p className="text-body-md text-on-surface">
          {stop.city}, {stop.state} {stop.postalCode}
        </p>
        <p className="mt-0.5 text-body-md text-on-surface-variant">{formatWindow(stop)}</p>
        {stop.notes && <p className="mt-1 text-body-sm text-on-surface-variant">{stop.notes}</p>}
      </div>
    </div>
  );
}

const shortDate = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });

function paymentNote(status: string, paid: { refundedCents: number; amountCents: number }, payout: { status: string; amountCents: number; paidAt: Date | null } | null, carrierName: string) {
  if (payout?.status === "paid") return `${formatUsd(payout.amountCents)} released to ${carrierName}${payout.paidAt ? ` on ${shortDate.format(payout.paidAt)}` : ""}.`;
  if (payout && (payout.status === "pending" || payout.status === "held")) return `Released to ${carrierName}. The transfer is being processed.`;
  if (status === "disputed") return "Held in escrow until the dispute is resolved.";
  if (status === "cancelled") return paid.refundedCents >= paid.amountCents ? "Refunded in full. It can take 5–10 business days to show on your statement." : paid.refundedCents > 0 ? "Partially refunded. The rest went to the carrier." : "Cancelled.";
  if (status === "delivered") return "Held in escrow until you confirm delivery.";
  return "Held safely in escrow. The carrier is paid after delivery.";
}

export default async function LoadDetailPage({ params, searchParams }: Props) {
  const [{ publicId }, sp] = await Promise.all([params, searchParams]);
  const { actor } = await requireShipper(publicId);
  const data = await getShipperLoad(actor, publicId);
  if (!data) notFound();
  const { load: l, bids, events, carrier, payments } = data;
  const pending = l.status === "awaiting_payment" ? await getPendingPayment(actor, l.id) : null;
  const paid = payments.find((p) => ["succeeded", "partially_refunded", "refunded"].includes(p.status)) ?? null;
  const post = postBookingStatuses.includes(l.status) || (l.status === "cancelled" && paid) ? await getPostBooking(actor, l) : null;
  const pickup = l.pickup as Stop;
  const dropoff = l.dropoff as Stop;
  const { notes, ...details } = (l.details ?? {}) as Record<string, unknown>;
  const detailRows = detailSections(l.category, details);
  const activeBids = bids.filter((b) => b.status === "active");
  const instantBidId = (details.instantQuote as { bidId?: string } | undefined)?.bidId;
  const highlightBidId = activeBids.find((b) => b.id === sp.bid || b.id === instantBidId)?.id ?? null;
  const accepted = bids.find((b) => b.id === l.acceptedBidId);
  const booked = ["booked", "assigned", "en_route_to_pickup", "in_transit", "delivered", "completed", "disputed"].includes(l.status);
  const closing = l.status === "open" ? timeLeft(l.biddingClosesAt) : null;
  const returning = sp.payment === "return" && sp.redirect_status === "succeeded";
  const showBids = l.status === "open" || l.status === "awaiting_payment" || (l.status === "expired" && activeBids.length > 0);
  const carrierName = carrier?.name ?? accepted?.carrierName ?? "your carrier";
  const statusAt = (status: string) => events.find((e) => e.type === "status_changed" && e.toStatus === status)?.createdAt ?? null;
  const trip = buildTripSteps({
    status: l.status === "disputed" ? (post?.dispute?.previousStatus ?? "booked") : l.status,
    bookedAt: statusAt("booked"),
    assignedAt: l.assignedAt,
    startedAt: statusAt("en_route_to_pickup"),
    pickedUpAt: l.pickedUpAt,
    deliveredAt: l.deliveredAt,
    completedAt: l.completedAt,
  });
  const tracking = ["en_route_to_pickup", "in_transit"].includes(l.status);
  const showRoute = tracking || (Boolean(post?.points.length) && ["delivered", "completed", "disputed"].includes(l.status));
  const canReport = ["booked", "assigned", "en_route_to_pickup", "in_transit"].includes(l.status);
  const releaseAt = l.deliveredAt ? new Date(l.deliveredAt.getTime() + AUTO_COMPLETE_HOURS * 3_600_000).toISOString() : null;
  const dispute = post?.dispute ?? null;
  const liveStatuses = ["booked", "assigned", "en_route_to_pickup", "in_transit", "delivered", "disputed"];

  return (
    <div className="mx-auto max-w-[1200px]">
      <div className="flex flex-wrap items-start gap-x-4 gap-y-3 pt-2 pb-6 medium:pt-4">
        <Link href="/app/loads" aria-label="Back to loads" className="state-layer -ml-2 inline-flex size-10 shrink-0 items-center justify-center rounded-full text-on-surface-variant">
          <Icon icon={arrowBackIcon} />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <LoadStatusChip status={l.status} />
            <span className="font-mono text-label-lg text-on-surface-variant">{l.publicId}</span>
            {closing && <span className="text-label-lg text-on-surface-variant">· {closing}</span>}
          </div>
          <h1 className="mt-2 text-headline-sm text-on-surface medium:text-headline-md">{l.title}</h1>
          <p className="mt-1 flex items-center gap-2 text-body-lg text-on-surface-variant">
            <Icon icon={categoryIcons[l.category]} size={20} />
            {categoryLabel(l.category)}
            {l.targetPriceCents ? <span>· Target {formatUsd(l.targetPriceCents, true)}</span> : null}
          </p>
        </div>
        <div className="flex w-full flex-wrap gap-2 medium:w-auto">
          {l.status === "draft" && (
            <Button asChild>
              <Link href={`/app/loads/${l.publicId}/edit`}>
                <Icon icon={editIcon} size={20} />
                Finish and post
              </Link>
            </Button>
          )}
          {l.status === "expired" && <RelistButton loadId={l.id} />}
          {["draft", "open", "awaiting_payment"].includes(l.status) && <CancelLoadButton loadId={l.id} isDraft={l.status === "draft"} />}
          {canReport && <DisputeDialog loadId={l.id} role="shipper" />}
        </div>
      </div>
      {post && <LoadLiveRefresh loadId={l.id} active={liveStatuses.includes(l.status)} />}

      <div className="grid gap-6 expanded:grid-cols-[minmax(0,1fr)_340px] large:grid-cols-[minmax(0,1fr)_380px]">
        <Reveal className="flex min-w-0 flex-col gap-6" stagger={0.06} y={12}>
          {sp.welcome && <WelcomeNotice userId={actor.userId} count={sp.welcome} open={l.status === "open"} />}
          {pending && <ResumePaymentCard info={pending} publicId={l.publicId} returning={returning} />}

          {l.status === "draft" && (
            <Card variant="filled" className="bg-surface-container-low p-5">
              <h2 className="text-title-md text-on-surface">Carriers can&rsquo;t see this yet</h2>
              <p className="mt-1 text-body-md text-on-surface-variant">Finish the draft and post it to start getting bids.</p>
            </Card>
          )}

          {post && l.status !== "cancelled" && (
            <Card as="section" aria-labelledby="progress-title" className="p-5">
              <h2 id="progress-title" className="sr-only">
                Trip progress
              </h2>
              <TripProgress steps={trip.steps} current={trip.current} halted={l.status === "disputed" ? "In dispute" : undefined} />
            </Card>
          )}

          {l.status === "delivered" && (
            <Card as="section" variant="filled" aria-labelledby="confirm-title" className="bg-secondary-container p-5 text-on-secondary-container medium:p-6">
              <h2 id="confirm-title" className="text-title-lg">
                Delivered. Is everything there?
              </h2>
              <p className="mt-1 max-w-[60ch] text-body-md">
                {l.podRecipientName ? `Signed for by ${l.podRecipientName}${l.deliveredAt ? ` on ${formatDateTime(l.deliveredAt)}` : ""}. ` : ""}
                Confirming releases {paid ? formatUsd(paid.carrierAmountCents) : "the payment"} from escrow to {carrierName}. If something&rsquo;s wrong, report it before payment releases.
              </p>
              {releaseAt && (
                <p className="mt-3 text-label-lg">
                  Payment releases automatically <AutoReleaseCountdown deadline={releaseAt} />
                </p>
              )}
              <div className="mt-5">
                <ConfirmDeliveryActions loadId={l.id} carrierName={carrierName} amountLabel={paid ? formatUsd(paid.carrierAmountCents) : "The payment"} />
              </div>
            </Card>
          )}

          {dispute && (l.status === "disputed" || dispute.status !== "withdrawn") && (
            <Card as="section" aria-labelledby="dispute-title" className={cn("overflow-hidden", dispute.status === "open" && "border-error")}>
              <div className="flex flex-col gap-3 p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Icon icon={gavelIcon} size={20} className={dispute.status === "open" ? "text-error" : "text-on-surface-variant"} />
                  <h2 id="dispute-title" className="text-title-lg text-on-surface">
                    {dispute.status === "open" ? "Problem reported" : "Dispute closed"}
                  </h2>
                  <span className={cn("rounded-xs px-2 py-0.5 text-label-md", dispute.status === "open" ? "bg-error-container text-on-error-container" : "bg-surface-container-highest text-on-surface-variant")}>
                    {disputeStatusLabels[dispute.status] ?? dispute.status}
                  </span>
                </div>
                <p className="text-body-md text-on-surface-variant">
                  {dispute.openedBy === actor.userId ? "You" : carrierName} reported &ldquo;{disputeReasonLabels[dispute.reason as DisputeReasonValue]}&rdquo; on {formatDateTime(dispute.createdAt)}.
                </p>
                <blockquote className="border-l-2 border-outline-variant pl-3 text-body-md whitespace-pre-line text-on-surface">{dispute.details}</blockquote>
                {post && post.disputeEvidence.length > 0 && <MediaGallery items={post.disputeEvidence} label="Evidence" />}
                {dispute.status === "open" ? (
                  <p className="text-body-md text-on-surface-variant">
                    The payment stays in escrow while our team reviews both sides. We&rsquo;ll message you here and by email, usually within one business day.
                  </p>
                ) : (
                  dispute.resolution && (
                    <div className="rounded-md bg-surface-container-low p-4">
                      <p className="text-label-lg text-on-surface-variant">Our decision{dispute.resolvedAt ? ` · ${formatDateTime(dispute.resolvedAt)}` : ""}</p>
                      <p className="mt-1 text-body-md whitespace-pre-line text-on-surface">{dispute.resolution}</p>
                    </div>
                  )
                )}
                {dispute.status === "open" && dispute.openedBy === actor.userId && (
                  <div>
                    <WithdrawDisputeButton disputeId={dispute.id} />
                  </div>
                )}
              </div>
            </Card>
          )}

          {l.status === "completed" && post && (
            <Card as="section" aria-labelledby="review-title" id="review" className="scroll-mt-24 p-5">
              <h2 id="review-title" className="text-title-lg text-on-surface">
                {post.review ? "Your review" : `Review ${carrierName}`}
              </h2>
              {post.review ? (
                <div className="mt-3 flex flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <Stars rating={post.review.rating} />
                    <span className="text-body-sm text-on-surface-variant">{formatDateTime(post.review.createdAt)}</span>
                  </div>
                  {post.review.body && <p className="text-body-lg whitespace-pre-line text-on-surface">{post.review.body}</p>}
                  {post.review.carrierReply && (
                    <div className="rounded-md bg-surface-container-low p-4">
                      <p className="text-label-lg text-on-surface-variant">
                        Reply from {carrierName}
                        {post.review.carrierRepliedAt ? ` · ${formatDateTime(post.review.carrierRepliedAt)}` : ""}
                      </p>
                      <p className="mt-1 text-body-md whitespace-pre-line text-on-surface">{post.review.carrierReply}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-3">
                  <ReviewForm loadId={l.id} carrierName={carrierName} />
                </div>
              )}
            </Card>
          )}

          {post && showRoute && (
            <Card as="section" aria-labelledby="tracking-title" className="overflow-hidden">
              <div className="flex items-center gap-2 px-5 pt-5">
                <Icon icon={localShippingIcon} size={20} className="text-on-surface-variant" />
                <h2 id="tracking-title" className="text-title-lg text-on-surface">
                  {tracking ? (l.status === "en_route_to_pickup" ? "Driver heading to pickup" : "On the road") : "Trip route"}
                </h2>
              </div>
              <LazyLiveMap loadId={l.id} status={l.status} pickup={pickup} dropoff={dropoff} initialPoints={post.points} driverName={post.driver?.name ?? null} />
            </Card>
          )}

          {post && (post.pickupMedia.length > 0 || post.deliveryMedia.length > 0) && (
            <Card as="section" aria-labelledby="photos-title" className="p-5">
              <h2 id="photos-title" className="text-title-lg text-on-surface">
                Photos
              </h2>
              {post.pickupMedia.length > 0 && (
                <div className="mt-4">
                  <h3 className="mb-2 text-title-sm text-on-surface">
                    At pickup{l.pickedUpAt ? <span className="text-body-sm text-on-surface-variant"> · {formatDateTime(l.pickedUpAt)}</span> : null}
                  </h3>
                  <MediaGallery items={post.pickupMedia} label="Pickup photos" />
                </div>
              )}
              {post.deliveryMedia.length > 0 && (
                <div className="mt-5">
                  <h3 className="mb-2 text-title-sm text-on-surface">
                    Proof of delivery{l.deliveredAt ? <span className="text-body-sm text-on-surface-variant"> · {formatDateTime(l.deliveredAt)}</span> : null}
                  </h3>
                  {l.podRecipientName && <p className="mb-2 text-body-md text-on-surface-variant">Received by {l.podRecipientName}</p>}
                  <MediaGallery items={post.deliveryMedia} label="Proof of delivery" />
                </div>
              )}
            </Card>
          )}

          {booked && (
            <Card as="section" aria-labelledby="carrier-title" className="overflow-hidden">
              <div className="flex flex-col gap-1 p-5">
                <p className="text-label-lg text-on-surface-variant">Your carrier</p>
                <h2 id="carrier-title" className="flex flex-wrap items-center gap-2 text-title-lg text-on-surface">
                  {carrier?.name ?? accepted?.carrierName ?? "Carrier"}
                  {accepted?.fmcsaStatus === "verified" && <Icon icon={verifiedIcon} size={20} filled className="text-success" label="FMCSA verified" />}
                </h2>
                <p className="flex flex-wrap gap-x-4 text-body-md text-on-surface-variant">
                  {carrier?.usdot && <span className="font-mono">USDOT {carrier.usdot}</span>}
                  {accepted && <span>Booked at {formatUsd(accepted.amountCents, true)}</span>}
                </p>
                <p className="mt-2 flex items-center gap-2 text-body-md text-on-surface">
                  <Icon icon={personIcon} size={18} className="text-on-surface-variant" />
                  {post?.driver ? <>Driver: {post.driver.name}</> : <span className="text-on-surface-variant">The carrier hasn&rsquo;t assigned a driver yet</span>}
                </p>
                {carrier?.phone && (
                  <Button asChild variant="tonal" className="mt-3 self-start">
                    <a href={`tel:${carrier.phone}`}>
                      <Icon icon={callIcon} size={20} />
                      Call {carrier.phone}
                    </a>
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3 border-t border-outline-variant bg-surface-container-low p-5">
                <Icon icon={chatIcon} className="shrink-0 text-on-surface-variant" />
                <p className="min-w-0 flex-1 basis-48 text-body-md text-on-surface-variant">Questions about access, timing or items? Message the carrier and driver here.</p>
                <OpenChatButton loadId={l.id} label="Message carrier" />
              </div>
            </Card>
          )}

          {showBids && (
            <Card as="section" data-tour="bids-panel" aria-labelledby="bids-title" id="bids" className="overflow-hidden">
              <div className="flex items-baseline justify-between gap-3 px-4 pt-5 pb-3 medium:px-5">
                <h2 id="bids-title" className="text-title-lg text-on-surface">
                  Bids
                </h2>
                {activeBids.length > 0 && (
                  <p className="text-body-md text-on-surface-variant tabular-nums">
                    {activeBids.length} {activeBids.length === 1 ? "bid" : "bids"} · from {formatUsd(Math.min(...activeBids.map((b) => b.amountCents)), true)}
                  </p>
                )}
              </div>
              <BidsPanel
                loadId={l.id}
                publicId={l.publicId}
                status={l.status}
                acceptedBidId={l.acceptedBidId}
                bids={bids}
                feeBps={env.PLATFORM_FEE_BPS}
                pending={pending}
                highlightBidId={highlightBidId}
              />
            </Card>
          )}

          {l.status === "cancelled" && l.cancelledReason && (
            <Card variant="filled" className="bg-surface-container-low p-5">
              <h2 className="text-title-md text-on-surface">Cancelled</h2>
              <p className="mt-1 text-body-md text-on-surface-variant">{l.cancelledReason}</p>
            </Card>
          )}
        </Reveal>

        <Reveal as="aside" className="flex min-w-0 flex-col gap-6" stagger={0.06} delay={0.08} y={12} aria-label="Load summary">
          {paid && post && (
            <Card as="section" aria-labelledby="payment-title" className="p-5">
              <h2 id="payment-title" className="text-title-md text-on-surface">
                Payment
              </h2>
              <dl className="mt-3 flex flex-col gap-1.5 text-body-md">
                <div className="flex justify-between gap-4">
                  <dt className="text-on-surface-variant">Carrier price</dt>
                  <dd className="text-on-surface tabular-nums">{formatUsd(paid.carrierAmountCents)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-on-surface-variant">Service fee</dt>
                  <dd className="text-on-surface tabular-nums">{formatUsd(paid.platformFeeCents)}</dd>
                </div>
                <div className="flex justify-between gap-4 border-t border-outline-variant pt-1.5">
                  <dt className="text-on-surface">Total paid</dt>
                  <dd className="font-medium text-on-surface tabular-nums">{formatUsd(paid.amountCents)}</dd>
                </div>
                {paid.refundedCents > 0 && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-on-surface-variant">Refunded to you</dt>
                    <dd className="text-success tabular-nums">−{formatUsd(paid.refundedCents)}</dd>
                  </div>
                )}
              </dl>
              <p className="mt-4 rounded-sm bg-surface-container-low px-3 py-2 text-body-md text-on-surface-variant">{paymentNote(l.status, paid, post.payout, carrierName)}</p>
            </Card>
          )}

          <Card as="section" aria-labelledby="route-title" className="p-5">
            <h2 id="route-title" className="mb-4 text-title-md text-on-surface">
              Route
            </h2>
            <div className="relative flex flex-col gap-5">
              <span aria-hidden="true" className="absolute top-7 bottom-12 left-[9px] w-0.5 rounded-full bg-outline-variant" />
              <StopBlock stop={pickup} kind="pickup" />
              <StopBlock stop={dropoff} kind="dropoff" />
            </div>
            {l.distanceMiles ? <p className="mt-4 text-body-md text-on-surface-variant">About {l.distanceMiles.toLocaleString("en-US")} miles</p> : null}
          </Card>

          <Card as="section" aria-labelledby="details-title" className="p-5">
            <h2 id="details-title" className="text-title-md text-on-surface">
              Details
            </h2>
            {detailRows.map((s) =>
              s.rows.length ? (
                <div key={s.title} className="mt-4">
                  <h3 className="mb-2 text-label-lg text-on-surface-variant">{s.title}</h3>
                  <dl className="flex flex-col gap-1.5 text-body-md">
                    {s.rows.map((r) => (
                      <div key={r.label} className="flex justify-between gap-4">
                        <dt className="text-on-surface-variant">{r.label}</dt>
                        <dd className="text-right text-on-surface">{r.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ) : null,
            )}
            {typeof notes === "string" && notes && (
              <div className="mt-4 border-t border-outline-variant pt-4">
                <h3 className="mb-1 text-label-lg text-on-surface-variant">Notes for carriers</h3>
                <p className="text-body-md whitespace-pre-line text-on-surface">{notes}</p>
              </div>
            )}
          </Card>

          <Card as="section" aria-labelledby="activity-title" className="p-5">
            <h2 id="activity-title" className="mb-4 text-title-md text-on-surface">
              Activity
            </h2>
            <ol className="flex flex-col">
              {[...events].reverse().map((e, i, arr) => (
                <li key={e.id} className="relative flex gap-3 pb-4 last:pb-0">
                  {i < arr.length - 1 && <span aria-hidden="true" className="absolute top-4 bottom-0 left-[5px] w-px bg-outline-variant" />}
                  <span aria-hidden="true" className={`relative mt-1.5 size-[11px] shrink-0 rounded-full border-2 ${i === 0 ? "border-primary bg-primary" : "border-outline bg-surface"}`} />
                  <div className="min-w-0">
                    <p className="text-body-md text-on-surface">
                      {e.type === "status_changed" && e.toStatus ? statusLabels[e.toStatus] : (eventLabels[e.type] ?? e.type.replace(/_/g, " "))}
                      {(e.type === "bid_placed" || e.type === "bid_updated") && typeof e.payload.amountCents === "number" && (
                        <span className="text-on-surface-variant"> · {formatUsd(e.payload.amountCents, true)}</span>
                      )}
                    </p>
                    <p className="text-body-sm text-on-surface-variant">{formatDateTime(e.createdAt)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        </Reveal>
      </div>
    </div>
  );
}
