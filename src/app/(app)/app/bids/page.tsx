import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { gavelIcon, handshakeIcon, listAltIcon } from "@/components/ui/icons.generated";
import { PageHeader } from "@/components/ui/page-header";
import { LinkTabs } from "@/components/ui/tabs";
import { requireCarrierStaff } from "@/features/board/eligibility";
import { BidRow } from "@/features/bids/bid-row";
import { getActor } from "@/server/actor";
import { listCarrierBids } from "@/server/bids/service";
import { getViewer } from "@/server/viewer/viewer";

export const metadata: Metadata = { title: "Bids" };

const tabs = [
  { key: "active", label: "Active" },
  { key: "won", label: "Won" },
  { key: "closed", label: "Lost and withdrawn" },
] as const;

type TabKey = (typeof tabs)[number]["key"];

const empty: Record<TabKey, { title: string; description: string }> = {
  active: { title: "No active bids", description: "Bids you place on open loads show up here until the shipper decides." },
  won: { title: "No won loads yet", description: "When a shipper accepts your bid and pays into escrow, the load moves here." },
  closed: { title: "Nothing here", description: "Bids you withdraw, or that weren't selected before bidding closed, are kept here for reference." },
};

export default async function BidsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const viewer = await getViewer();
  requireCarrierStaff(viewer);
  const { tab: rawTab } = await searchParams;
  const tab: TabKey = tabs.find((t) => t.key === rawTab)?.key ?? "active";
  const actor = await getActor(viewer.user.id);
  const [active, won, closed] = await Promise.all([listCarrierBids(actor, "active"), listCarrierBids(actor, "won"), listCarrierBids(actor, "closed")]);
  const rows = { active, won, closed }[tab];
  const counts: Record<TabKey, number | undefined> = { active: active.length, won: won.length, closed: undefined };

  return (
    <div className="mx-auto max-w-[960px]">
      <PageHeader
        title="Bids"
        description="Track every bid your company has placed."
        actions={
          <Button variant="tonal" asChild>
            <Link href="/app/board">Find loads</Link>
          </Button>
        }
      />
      <LinkTabs
        label="Bid status"
        className="mb-4"
        items={tabs.map((t) => ({ href: t.key === "active" ? "/app/bids" : `/app/bids?tab=${t.key}`, label: t.label, count: counts[t.key], active: t.key === tab }))}
      />
      {rows.length === 0 ? (
        <EmptyState
          icon={tab === "won" ? handshakeIcon : tab === "closed" ? listAltIcon : gavelIcon}
          title={empty[tab].title}
          description={empty[tab].description}
          action={
            tab === "active" ? (
              <Button asChild>
                <Link href="/app/board">Browse open loads</Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <Reveal as="ul" stagger={0.03} y={8} key={tab} aria-label={`${tabs.find((t) => t.key === tab)?.label} bids`}>
            {rows.map((row) => (
              <li key={row.id} className="border-t border-outline-variant first:border-t-0">
                <BidRow row={row} />
              </li>
            ))}
          </Reveal>
        </Card>
      )}
    </div>
  );
}
