import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { travelExploreIcon } from "@/components/ui/icons.generated";
import { PageHeader } from "@/components/ui/page-header";
import { BoardFilters } from "@/features/board/board-filters";
import { carrierStanding, requireCarrierStaff } from "@/features/board/eligibility";
import { parseBoardFilters } from "@/features/board/filters";
import { LoadCard } from "@/features/board/load-card";
import { listBoardLoads } from "@/features/board/queries";
import { StandingBanner } from "@/features/board/standing-banner";
import { getViewer } from "@/server/viewer/viewer";

export const metadata: Metadata = { title: "Find loads" };

export default async function BoardPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const viewer = await getViewer();
  const org = requireCarrierStaff(viewer);
  const standing = carrierStanding(viewer);
  const filters = parseBoardFilters(await searchParams);
  const loads = await listBoardLoads(filters, org.orgId);
  const now = new Date();
  const filtered = filters.categories.length > 0 || Boolean(filters.from || filters.to);

  return (
    <div className="mx-auto max-w-[1120px]">
      <PageHeader title="Find loads" description="Open loads from US shippers. Addresses are shared once you're booked." />
      <StandingBanner standing={standing} className="mb-6" />
      <BoardFilters filters={filters} total={loads.length} />
      {loads.length === 0 ? (
        <EmptyState
          icon={travelExploreIcon}
          title={filtered ? "No loads match these filters" : "No open loads right now"}
          description={filtered ? "Try another state or add more categories. New loads are posted throughout the day." : "New loads are posted throughout the day. Check back soon."}
          action={
            filtered ? (
              <Button variant="tonal" asChild>
                <Link href="/app/board">Clear filters</Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <Reveal as="ul" stagger={0.04} y={12} key={JSON.stringify(filters)} className="mt-2 grid gap-3 expanded:grid-cols-2" aria-label="Open loads">
          {loads.map((l) => (
            <li key={l.id}>
              <LoadCard load={l} now={now} />
            </li>
          ))}
        </Reveal>
      )}
    </div>
  );
}
