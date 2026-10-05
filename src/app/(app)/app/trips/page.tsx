import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { calendarMonthIcon, localShippingIcon, taskAltIcon } from "@/components/ui/icons.generated";
import { PageHeader } from "@/components/ui/page-header";
import { LinkTabs } from "@/components/ui/tabs";
import { tripCounts, type TripFilter } from "@/features/trips/queries";
import { TripRow } from "@/features/trips/trip-row";
import { getActor } from "@/server/actor";
import { getViewer } from "@/server/viewer/viewer";

export const metadata: Metadata = { title: "Trips" };

const tabs: { key: TripFilter; label: string }[] = [
  { key: "upcoming", label: "Upcoming" },
  { key: "active", label: "Active" },
  { key: "done", label: "Done" },
];

export default async function TripsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const viewer = await getViewer();
  if (viewer.role === "shipper" || !viewer.org) redirect("/app");
  const isDriver = viewer.role === "driver";
  const actor = await getActor(viewer.user.id);
  const lists = await tripCounts(actor);
  const { tab: rawTab } = await searchParams;
  const fallback: TripFilter = lists.active.length > 0 ? "active" : "upcoming";
  const tab = tabs.find((t) => t.key === rawTab)?.key ?? fallback;
  const rows = lists[tab];

  const empty: Record<TripFilter, { title: string; description: string }> = {
    upcoming: {
      title: "No upcoming trips",
      description: isDriver ? "When your dispatcher assigns you a load, it shows up here with the pickup address and window." : "Loads you win show up here. Assign a driver before the pickup window.",
    },
    active: { title: "Nothing on the road", description: isDriver ? "Start a trip from the Upcoming tab when you head to pickup." : "Trips appear here once a driver starts heading to pickup." },
    done: { title: "No finished trips yet", description: "Completed and cancelled trips are kept here for your records." },
  };

  return (
    <div className="mx-auto max-w-[960px]">
      <PageHeader
        title="Trips"
        description={isDriver ? "Your assigned loads, pickup to delivery." : `Every booked load for ${viewer.org.orgName}.`}
        actions={
          !isDriver ? (
            <Button variant="tonal" asChild>
              <Link href="/app/board">Find loads</Link>
            </Button>
          ) : undefined
        }
      />
      <LinkTabs
        label="Trip status"
        className="mb-4"
        items={tabs.map((t) => ({ href: `/app/trips?tab=${t.key}`, label: t.label, count: t.key === "done" ? undefined : lists[t.key].length, active: t.key === tab }))}
      />
      {rows.length === 0 ? (
        <EmptyState
          icon={tab === "upcoming" ? calendarMonthIcon : tab === "active" ? localShippingIcon : taskAltIcon}
          title={empty[tab].title}
          description={empty[tab].description}
          action={
            !isDriver && tab === "upcoming" ? (
              <Button asChild>
                <Link href="/app/board">Browse open loads</Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <Card data-tour="trips-list" className="overflow-hidden">
          <Reveal as="ul" stagger={0.03} y={8} key={tab} aria-label={`${tabs.find((t) => t.key === tab)?.label} trips`}>
            {rows.map((row) => (
              <li key={row.id} className="border-t border-outline-variant first:border-t-0">
                <TripRow row={row} showDriver={!isDriver} />
              </li>
            ))}
          </Reveal>
        </Card>
      )}
    </div>
  );
}
