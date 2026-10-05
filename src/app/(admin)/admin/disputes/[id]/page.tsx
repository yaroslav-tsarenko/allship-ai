import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { BackLink, Fields, Panel, Timeline } from "@/features/admin/detail";
import { formatDateTime, formatPlace, humanize } from "@/features/admin/format";
import { ResolveDisputeForm } from "@/features/admin/resolve-dispute-form";
import { StatusChip, toneFor } from "@/features/admin/status-chip";
import { disputeReasonLabels, disputeStatusLabels, type DisputeReasonValue } from "@/features/disputes/reasons";
import { LazyLiveMap } from "@/features/tracking/lazy-live-map";
import { MediaGallery } from "@/features/tracking/media-gallery";
import { serializePoints, signKeys, signMedia } from "@/features/tracking/media";
import { cn } from "@/lib/cn";
import { formatUsd } from "@/lib/money";
import { getActor } from "@/server/actor";
import { getDisputeDetail, getLoadTrackingAndMedia } from "@/server/admin/queries";
import { requireAdmin } from "@/server/auth/session";
import { conversationForLoad, getConversation } from "@/server/chat/service";
import { statusLabels } from "@/server/loads/transitions";

export const metadata: Metadata = { title: "Dispute" };

const sideLabels: Record<string, string> = { shipper: "Shipper", carrier: "Carrier", driver: "Driver" };

export default async function DisputeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  const { id } = await params;
  const data = await getDisputeDetail(id);
  if (!data) notFound();
  const d = data.dispute;
  const l = data.load;
  const actor = await getActor(session.user.id);
  const [trackingData, evidence, chat] = await Promise.all([
    getLoadTrackingAndMedia(l.id),
    signKeys(d.evidence, "Evidence"),
    conversationForLoad(actor, l.id)
      .then((c) => (c ? getConversation(actor, c.id, { limit: 100 }) : null))
      .catch(() => null),
  ]);
  const media = await signMedia(trackingData.media);
  const paid = data.payments.find((p) => ["succeeded", "partially_refunded", "refunded"].includes(p.status)) ?? null;
  const payoutRow = data.payouts[0] ?? null;
  const open = d.status === "open";

  return (
    <div>
      <BackLink href="/admin/disputes" label="Disputes" />
      <PageHeader
        title={`${disputeReasonLabels[d.reason as DisputeReasonValue]}`}
        description={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Link href={`/admin/loads/${l.publicId}`} className="font-mono text-body-md text-primary underline-offset-2 hover:underline">
              {l.publicId}
            </Link>
            <StatusChip label={disputeStatusLabels[d.status] ?? d.status} tone={open ? "danger" : d.status === "withdrawn" ? "neutral" : "success"} />
            <span>
              Opened by the {d.openedByRole} {formatDateTime(d.createdAt)}
            </span>
          </span>
        }
      />

      <div className="grid gap-4 large:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <div className="flex min-w-0 flex-col gap-4">
          <Panel title="What was reported">
            <p className="text-body-md text-on-surface-variant">
              {data.openerName} ({d.openedByRole}) · {data.openerEmail}
            </p>
            <blockquote className="mt-3 border-l-2 border-outline-variant pl-4 text-body-lg whitespace-pre-line text-on-surface">{d.details}</blockquote>
            {evidence.length > 0 ? (
              <div className="mt-5">
                <h3 className="mb-2 text-title-sm text-on-surface">Evidence</h3>
                <MediaGallery items={evidence} label="Evidence" />
              </div>
            ) : (
              <p className="mt-4 text-body-sm text-on-surface-variant">No evidence attached.</p>
            )}
          </Panel>

          <Panel title="Load">
            <Fields
              items={[
                { label: "Title", value: l.title },
                { label: "Load status", value: <StatusChip label={statusLabels[l.status]} tone={toneFor(l.status)} /> },
                { label: "Before dispute", value: humanize(d.previousStatus) },
                { label: "Route", value: `${formatPlace(l.pickup)} → ${formatPlace(l.dropoff)}` },
                { label: "Shipper", value: <>{data.shipperName}<span className="block text-body-md text-on-surface-variant">{data.shipperEmail}</span></> },
                {
                  label: "Carrier",
                  value: l.carrierOrgId ? (
                    <Link className="text-primary underline-offset-2 hover:underline" href={`/admin/carriers/${l.carrierOrgId}`}>
                      {data.carrierName}
                    </Link>
                  ) : null,
                },
                { label: "Driver", value: data.driver ? <>{data.driver.name}<span className="block text-body-md text-on-surface-variant">{data.driver.phone ?? data.driver.email}</span></> : null },
                { label: "Picked up", value: l.pickedUpAt ? formatDateTime(l.pickedUpAt) : null },
                { label: "Delivered", value: l.deliveredAt ? formatDateTime(l.deliveredAt) : null },
                { label: "Received by", value: l.podRecipientName },
              ]}
            />
          </Panel>

          <Panel title="Tracking" flush description={trackingData.points.length ? undefined : "No location was shared for this trip."}>
            <LazyLiveMap loadId={l.id} status={l.status} pickup={l.pickup} dropoff={l.dropoff} initialPoints={serializePoints(trackingData.points)} driverName={data.driver?.name ?? null} />
          </Panel>

          {media.length > 0 && (
            <Panel title="Pickup and delivery photos">
              <MediaGallery items={media} label="Load photos" />
            </Panel>
          )}

          <Panel title="Conversation" description="Read-only. Messages between the shipper and carrier on this load." flush>
            {chat && chat.messages.length > 0 ? (
              <ol className="flex max-h-[520px] flex-col gap-3 overflow-y-auto border-t border-outline-variant px-6 py-4">
                {chat.messages.map((m) => (
                  <li key={m.id} className={cn("max-w-[85%] rounded-md px-4 py-2.5", m.senderSide === "shipper" ? "self-start bg-surface-container-high" : "self-end bg-secondary-container text-on-secondary-container")}>
                    <p className="text-label-md opacity-80">
                      {m.senderName} · {sideLabels[m.senderSide] ?? m.senderSide} · {formatDateTime(new Date(m.createdAt))}
                    </p>
                    {m.body && <p className="mt-0.5 text-body-md whitespace-pre-line">{m.body}</p>}
                    {m.attachments.length > 0 && <p className="mt-1 text-body-sm opacity-80">{m.attachments.length === 1 ? "1 attachment" : `${m.attachments.length} attachments`}</p>}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="px-6 pb-6 text-body-md text-on-surface-variant">No messages on this load.</p>
            )}
          </Panel>
        </div>

        <div className="flex min-w-0 flex-col gap-4 large:sticky large:top-32 large:self-start">
          <Panel title={open ? "Resolve" : "Resolution"}>
            {open && paid && l.carrierOrgId ? (
              <ResolveDisputeForm
                disputeId={d.id}
                carrierName={data.carrierName ?? "the carrier"}
                shipperName={data.shipperName}
                totalCents={paid.amountCents}
                carrierAmountCents={paid.carrierAmountCents}
                refundedCents={paid.refundedCents}
              />
            ) : open ? (
              <p className="text-body-md text-on-surface-variant">There&rsquo;s no captured payment on this load, so there&rsquo;s nothing to release or refund.</p>
            ) : (
              <div className="flex flex-col gap-2">
                <p className="text-title-md text-on-surface">{disputeStatusLabels[d.status] ?? d.status}</p>
                {d.refundCents ? <p className="text-body-md text-on-surface-variant">Refunded {formatUsd(d.refundCents)} to the shipper.</p> : null}
                {d.resolution && <p className="text-body-md whitespace-pre-line text-on-surface">{d.resolution}</p>}
                <p className="text-body-sm text-on-surface-variant">
                  {data.resolverName ?? "Unknown"} · {formatDateTime(d.resolvedAt)}
                </p>
              </div>
            )}
          </Panel>

          <Panel title="Money">
            {paid ? (
              <Fields
                items={[
                  { label: "Shipper paid", value: formatUsd(paid.amountCents), mono: true },
                  { label: "Carrier price", value: formatUsd(paid.carrierAmountCents), mono: true },
                  { label: "Platform fee", value: formatUsd(paid.platformFeeCents), mono: true },
                  { label: "Refunded", value: paid.refundedCents ? formatUsd(paid.refundedCents) : "—", mono: true },
                  { label: "Payment", value: <StatusChip label={humanize(paid.status)} tone={toneFor(paid.status)} /> },
                  { label: "Payout", value: payoutRow ? <StatusChip label={`${humanize(payoutRow.status)} · ${formatUsd(payoutRow.amountCents)}`} tone={toneFor(payoutRow.status)} /> : "Not created" },
                  { label: "Transfer", value: payoutRow?.stripeTransferId ?? null, mono: true },
                  { label: "Payment intent", value: paid.stripePaymentIntentId ?? "Simulated", mono: true },
                ]}
              />
            ) : (
              <p className="text-body-md text-on-surface-variant">No captured payment.</p>
            )}
            {payoutRow?.failureReason && <p className="mt-3 text-body-sm text-error">Last transfer error: {payoutRow.failureReason}</p>}
          </Panel>

          <Panel title="Timeline">
            <Timeline
              empty="No events recorded."
              items={data.events.slice(0, 20).map((e) => ({
                id: e.id,
                title: e.type === "status_changed" && e.toStatus ? statusLabels[e.toStatus] : humanize(e.type),
                meta: `${e.actorName ?? "System"} · ${formatDateTime(e.createdAt)}`,
                body: typeof e.payload.reason === "string" ? <q>{humanize(e.payload.reason)}</q> : undefined,
              }))}
            />
          </Panel>

          {data.history.length > 0 && (
            <Panel title="Earlier disputes on this load">
              <ul className="flex flex-col gap-2 text-body-md">
                {data.history.map((h) => (
                  <li key={h.id}>
                    <Link href={`/admin/disputes/${h.id}`} className="text-primary underline-offset-2 hover:underline">
                      {disputeReasonLabels[h.reason as DisputeReasonValue]}
                    </Link>{" "}
                    <span className="text-on-surface-variant">
                      · {disputeStatusLabels[h.status]} · {formatDateTime(h.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}
