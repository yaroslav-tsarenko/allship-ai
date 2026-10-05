import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { addIcon, chevronRightIcon } from "@/components/ui/icons.generated";
import { formatUsd } from "@/lib/money";
import { getActor } from "@/server/actor";
import { listShipperLoads } from "@/server/loads/service";

export async function ShipperSummary({ userId }: { userId: string }) {
  const actor = await getActor(userId);
  const [active, drafts] = await Promise.all([listShipperLoads(actor, "active"), listShipperLoads(actor, "drafts")]);
  const open = active.filter((l) => l.status === "open");
  const bidsWaiting = open.reduce((n, l) => n + Number(l.bids), 0);
  const needsPayment = active.filter((l) => l.status === "awaiting_payment");
  const withBids = open.filter((l) => Number(l.bids) > 0).sort((a, b) => Number(b.bids) - Number(a.bids))[0];
  const stats = [
    { label: "Active loads", value: active.length, href: "/app/loads" },
    { label: "Bids to review", value: bidsWaiting, href: withBids ? `/app/loads/${withBids.publicId}` : "/app/loads" },
    { label: "Drafts", value: drafts.length, href: "/app/loads?tab=drafts" },
  ];

  return (
    <Card as="section" data-tour="home-loads-summary" aria-labelledby="loads-summary-title" variant="filled" className="mb-6 overflow-hidden bg-surface-container-low">
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 pt-5">
        <h2 id="loads-summary-title" className="text-title-lg text-on-surface">
          Your loads
        </h2>
        <Button asChild size="md">
          <Link href="/app/loads/new" data-tour="home-post-load">
            <Icon icon={addIcon} size={20} />
            Post a load
          </Link>
        </Button>
      </div>
      <dl className="grid grid-cols-3 gap-2 px-3 pt-3 pb-3">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="state-layer flex flex-col rounded-md px-3 py-3">
            <dt className="order-2 text-body-md text-on-surface-variant">{s.label}</dt>
            <dd className="order-1 text-headline-md text-on-surface tabular-nums">{s.value}</dd>
          </Link>
        ))}
      </dl>
      {(needsPayment[0] || withBids) && (
        <Link
          href={`/app/loads/${(needsPayment[0] ?? withBids)!.publicId}`}
          className="state-layer flex items-center gap-3 border-t border-outline-variant px-6 py-4 text-body-md text-on-surface"
        >
          <span className="min-w-0 flex-1">
            {needsPayment[0] ? (
              <>
                Finish paying for <span className="font-medium">{needsPayment[0].title}</span> to lock in your carrier.
              </>
            ) : (
              <>
                <span className="font-medium">{withBids!.title}</span> has {Number(withBids!.bids)} {Number(withBids!.bids) === 1 ? "bid" : "bids"}
                {withBids!.lowestBidCents !== null && <> from {formatUsd(withBids!.lowestBidCents, true)}</>}. Compare and pick one.
              </>
            )}
          </span>
          <Icon icon={chevronRightIcon} className="shrink-0 text-on-surface-variant" />
        </Link>
      )}
    </Card>
  );
}
