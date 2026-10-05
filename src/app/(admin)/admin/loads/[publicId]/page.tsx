import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, EmptyRow, Mono, Td, Th, Tr } from "@/features/admin/data-table";
import { BackLink, Fields, Panel, Timeline } from "@/features/admin/detail";
import { formatDate, formatDateTime, formatPlace, humanize } from "@/features/admin/format";
import { StatusChip, toneFor } from "@/features/admin/status-chip";
import { formatUsd } from "@/lib/money";
import { CancelRefundButton } from "@/features/admin/trip-admin-actions";
import { disputeReasonLabels, disputeStatusLabels, type DisputeReasonValue } from "@/features/disputes/reasons";
import { LazyLiveMap } from "@/features/tracking/lazy-live-map";
import { MediaGallery } from "@/features/tracking/media-gallery";
import { serializePoints, signMedia } from "@/features/tracking/media";
import { getLoadDetail, getLoadTrackingAndMedia } from "@/server/admin/queries";
import { disputesForLoad } from "@/server/disputes/service";
import { requireAdmin } from "@/server/auth/session";
import type { LoadStop } from "@/server/db/schema/loads";
import { categoryLabel } from "@/server/loads/service";
import { statusLabels } from "@/server/loads/transitions";

export async function generateMetadata({ params }: { params: Promise<{ publicId: string }> }): Promise<Metadata> {
  const { publicId } = await params;
  return { title: decodeURIComponent(publicId) };
}

function Stop({ label, stop }: { label: string; stop: LoadStop }) {
  const window = stop.windowStart ? [stop.windowStart, stop.windowEnd].filter(Boolean).join(" – ") : null;
  return (
    <div className="min-w-0">
      <p className="text-label-md text-on-surface-variant">{label}</p>
      <p className="mt-0.5 text-body-lg text-on-surface">{formatPlace(stop)}</p>
      <p className="text-body-md break-words text-on-surface-variant">{stop.address}</p>
      {window && <p className="text-body-sm text-on-surface-variant">{window}</p>}
    </div>
  );
}

function eventTitle(e: { type: string; fromStatus: keyof typeof statusLabels | null; toStatus: keyof typeof statusLabels | null }) {
  if (e.type === "status_changed" && e.toStatus) return e.fromStatus ? `${statusLabels[e.fromStatus]} → ${statusLabels[e.toStatus]}` : statusLabels[e.toStatus];
  return humanize(e.type);
}

export default async function LoadDetailPage({ params }: { params: Promise<{ publicId: string }> }) {
  await requireAdmin();
  const { publicId } = await params;
  const data = await getLoadDetail(decodeURIComponent(publicId));
  if (!data) notFound();
  const l = data.load;
  const [tracking, disputes] = await Promise.all([getLoadTrackingAndMedia(l.id), disputesForLoad(l.id)]);
  const media = await signMedia(tracking.media);
  const paid = data.payments.find((p) => p.status === "succeeded") ?? null;
  const tripStarted = ["en_route_to_pickup", "in_transit", "delivered", "completed", "disputed"].includes(l.status) || tracking.points.length > 0;

  return (
    <div>
      <BackLink href="/admin/loads" label="Loads" />
      <PageHeader
        title={l.title}
        description={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="font-mono text-body-md">{l.publicId}</span>
            <StatusChip label={statusLabels[l.status]} tone={toneFor(l.status)} />
            <span>{categoryLabel(l.category)}</span>
          </span>
        }
        actions={["booked", "assigned"].includes(l.status) ? <CancelRefundButton loadId={l.id} totalCents={paid?.amountCents ?? null} carrierAmountCents={paid?.carrierAmountCents ?? null} /> : undefined}
      />

      <div className="grid gap-4 large:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <div className="flex min-w-0 flex-col gap-4">
          <Panel title="Shipment">
            <div className="mb-5 grid gap-4 border-b border-outline-variant pb-5 medium:grid-cols-2">
              <Stop label="Pickup" stop={l.pickup} />
              <Stop label="Drop-off" stop={l.dropoff} />
            </div>
            <Fields
              items={[
                { label: "Shipper", value: <>{data.shipperName}<span className="block text-body-md text-on-surface-variant">{data.shipperEmail}</span></> },
                { label: "Carrier", value: data.carrierName && l.carrierOrgId ? <Link className="text-primary underline-offset-2 hover:underline" href={`/admin/carriers/${l.carrierOrgId}`}>{data.carrierName}</Link> : null },
                { label: "Distance", value: l.distanceMiles ? `${l.distanceMiles.toLocaleString("en-US")} mi` : null },
                { label: "Est. volume", value: l.estimatedVolumeCuFt ? `${l.estimatedVolumeCuFt.toLocaleString("en-US")} cu ft` : null },
                { label: "Target price", value: l.targetPriceCents ? formatUsd(l.targetPriceCents) : null },
                { label: "Source", value: humanize(l.source) },
                { label: "Published", value: l.publishedAt ? formatDateTime(l.publishedAt) : null },
                { label: "Bidding closes", value: l.biddingClosesAt ? formatDateTime(l.biddingClosesAt) : null },
                { label: "Created", value: formatDateTime(l.createdAt) },
                { label: "Cancel reason", value: l.cancelledReason },
              ]}
            />
          </Panel>

          {disputes.length > 0 && (
            <Panel title="Disputes" flush>
              <ul>
                {disputes.map((d) => (
                  <li key={d.id} className="border-t border-outline-variant">
                    <Link href={`/admin/disputes/${d.id}`} className="state-layer flex flex-wrap items-center gap-x-4 gap-y-1 px-6 py-3">
                      <span className="min-w-0 flex-1 text-body-lg text-on-surface">{disputeReasonLabels[d.reason as DisputeReasonValue]}</span>
                      <StatusChip label={disputeStatusLabels[d.status] ?? d.status} tone={d.status === "open" ? "danger" : d.status === "withdrawn" ? "neutral" : "success"} />
                      <span className="text-body-sm text-on-surface-variant">{formatDateTime(d.createdAt)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Panel>
          )}

          {tripStarted && (
            <Panel title="Tracking" flush>
              <LazyLiveMap loadId={l.id} status={l.status} pickup={l.pickup} dropoff={l.dropoff} initialPoints={serializePoints(tracking.points)} />
            </Panel>
          )}

          {media.length > 0 && (
            <Panel title="Pickup and delivery photos" description={l.podRecipientName ? `Received by ${l.podRecipientName}` : undefined}>
              <MediaGallery items={media} label="Load photos" />
            </Panel>
          )}

          <DataTable label="Bids" minWidth={500} toolbar={<h2 className="px-6 pt-5 pb-3 text-title-lg">Bids · {data.bids.length}</h2>}>
            <thead>
              <tr>
                <Th>Carrier</Th>
                <Th numeric>Amount</Th>
                <Th>Status</Th>
                <Th>Placed</Th>
              </tr>
            </thead>
            <tbody>
              {data.bids.map((b) => (
                <Tr key={b.id} className={b.id === l.acceptedBidId ? "bg-success-container/40" : undefined}>
                  <Td className="max-w-[320px]">
                    <Link href={`/admin/carriers/${b.orgId}`} className="text-on-surface underline-offset-2 hover:underline">
                      {b.orgName}
                    </Link>
                    <span className="block truncate text-body-sm text-on-surface-variant" title={b.message}>
                      {b.aiAssisted ? "AI-assisted · " : ""}
                      {b.message}
                    </span>
                  </Td>
                  <Td numeric className="font-mono">{formatUsd(b.amountCents)}</Td>
                  <Td>
                    <StatusChip label={humanize(b.status)} tone={toneFor(b.status)} />
                  </Td>
                  <Td className="whitespace-nowrap text-on-surface-variant">{formatDate(b.createdAt)}</Td>
                </Tr>
              ))}
              {data.bids.length === 0 && <EmptyRow colSpan={4} title="No bids" />}
            </tbody>
          </DataTable>

          <DataTable label="Payments" minWidth={560} toolbar={<h2 className="px-6 pt-5 pb-3 text-title-lg">Payments</h2>}>
            <thead>
              <tr>
                <Th>Status</Th>
                <Th numeric>Charged</Th>
                <Th numeric>Carrier</Th>
                <Th numeric>Fee</Th>
                <Th numeric>Refunded</Th>
                <Th>Stripe ID</Th>
              </tr>
            </thead>
            <tbody>
              {data.payments.map((p) => (
                <Tr key={p.id}>
                  <Td>
                    <StatusChip label={humanize(p.status)} tone={toneFor(p.status)} />
                  </Td>
                  <Td numeric>{formatUsd(p.amountCents)}</Td>
                  <Td numeric>{formatUsd(p.carrierAmountCents)}</Td>
                  <Td numeric>{formatUsd(p.platformFeeCents)}</Td>
                  <Td numeric>{p.refundedCents ? formatUsd(p.refundedCents) : "—"}</Td>
                  <Td>
                    <Mono>{p.stripePaymentIntentId ?? "simulated"}</Mono>
                  </Td>
                </Tr>
              ))}
              {data.payouts.map((po) => (
                <Tr key={po.id}>
                  <Td>
                    <StatusChip label={`Payout ${humanize(po.status).toLowerCase()}`} tone={toneFor(po.status)} />
                  </Td>
                  <Td numeric>—</Td>
                  <Td numeric>{formatUsd(po.amountCents)}</Td>
                  <Td numeric>—</Td>
                  <Td numeric>—</Td>
                  <Td>
                    <Mono className="block">{po.stripeTransferId ?? "No transfer yet"}</Mono>
                    {po.failureReason && <span className="block text-body-sm text-error">{po.failureReason}</span>}
                    <span className="text-body-sm text-on-surface-variant">{po.paidAt ? `Paid ${formatDate(po.paidAt)}` : po.releaseAfter ? `Releases ${formatDate(po.releaseAfter)}` : null}</span>
                  </Td>
                </Tr>
              ))}
              {data.payments.length === 0 && <EmptyRow colSpan={6} title="No payments" detail="A payment is created when the shipper accepts a bid." />}
            </tbody>
          </DataTable>
        </div>

        <Panel title="Activity" className="self-start">
          <Timeline
            empty="No events recorded."
            items={data.events.map((e) => ({
              id: e.id,
              title: eventTitle(e),
              meta: `${e.actorName ?? "System"} · ${formatDateTime(e.createdAt)}`,
              body: typeof e.payload.reason === "string" ? <q>{e.payload.reason}</q> : undefined,
            }))}
          />
        </Panel>
      </div>
    </div>
  );
}
