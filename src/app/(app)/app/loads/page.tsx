import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { addIcon, draftIcon, inventory2Icon, receiptLongIcon } from "@/components/ui/icons.generated";
import { PageHeader } from "@/components/ui/page-header";
import { LinkTabs } from "@/components/ui/tabs";
import { LoadRow } from "@/features/loads/load-row";
import { requireShipper } from "@/features/loads/guard";
import { listShipperLoads, type ShipperLoadFilter } from "@/server/loads/service";

export const metadata: Metadata = { title: "Loads" };

const tabs: { key: ShipperLoadFilter; label: string }[] = [
  { key: "active", label: "Active" },
  { key: "drafts", label: "Drafts" },
  { key: "past", label: "Past" },
];

const empty: Record<ShipperLoadFilter, { title: string; description: string; icon: typeof inventory2Icon }> = {
  active: {
    title: "No active loads",
    description: "Post a load and verified carriers start bidding, usually within a few hours.",
    icon: inventory2Icon,
  },
  drafts: { title: "No drafts", description: "Loads you save without posting show up here so you can finish them later.", icon: draftIcon },
  past: { title: "Nothing here yet", description: "Completed, cancelled and expired loads move here.", icon: receiptLongIcon },
};

export default async function LoadsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { actor } = await requireShipper();
  const { tab: rawTab } = await searchParams;
  const tab: ShipperLoadFilter = rawTab === "drafts" || rawTab === "past" ? rawTab : "active";
  const [active, drafts, past] = await Promise.all([listShipperLoads(actor, "active"), listShipperLoads(actor, "drafts"), listShipperLoads(actor, "past")]);
  const lists = { active, drafts, past };
  const rows = lists[tab];
  const e = empty[tab];

  return (
    <div className="mx-auto max-w-[1040px]">
      <PageHeader
        title="Loads"
        description="Everything you've posted, with bids as they come in."
        actions={
          <Button asChild className="hidden medium:inline-flex">
            <Link href="/app/loads/new">
              <Icon icon={addIcon} size={20} />
              Post a load
            </Link>
          </Button>
        }
      />
      <LinkTabs
        label="Load status"
        className="mb-4"
        items={tabs.map((t) => ({
          href: t.key === "active" ? "/app/loads" : `/app/loads?tab=${t.key}`,
          label: t.label,
          count: t.key === "past" ? undefined : lists[t.key].length,
          active: t.key === tab,
        }))}
      />
      {rows.length === 0 ? (
        <Card variant="filled" className="bg-surface-container-low">
          <EmptyState
            icon={e.icon}
            title={e.title}
            description={e.description}
            action={
              tab !== "past" ? (
                <Button asChild>
                  <Link href="/app/loads/new">
                    <Icon icon={addIcon} size={20} />
                    Post a load
                  </Link>
                </Button>
              ) : undefined
            }
          />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <Reveal as="ul" stagger={0.04} y={8} aria-label={`${tabs.find((t) => t.key === tab)?.label} loads`}>
            {rows.map((row) => (
              <li key={row.id} className="border-t border-outline-variant first:border-t-0">
                <LoadRow row={row} />
              </li>
            ))}
          </Reveal>
        </Card>
      )}
      <Link
        href="/app/loads/new"
        className="state-layer fixed right-4 bottom-24 z-30 inline-flex h-14 items-center gap-3 rounded-lg bg-primary-container pr-5 pl-4 text-label-lg font-medium text-on-primary-container shadow-elevation-3 medium:hidden"
      >
        <Icon icon={addIcon} />
        Post a load
      </Link>
    </div>
  );
}
