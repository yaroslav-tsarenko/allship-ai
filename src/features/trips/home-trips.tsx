import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { chevronRightIcon, warningIcon } from "@/components/ui/icons.generated";
import { getActor } from "@/server/actor";
import type { Viewer } from "@/server/viewer/viewer";
import { tripCounts } from "./queries";
import { TripRow } from "./trip-row";

export async function HomeTrips({ viewer }: { viewer: Viewer }) {
  if (viewer.role === "shipper" || !viewer.org) return null;
  const isDriver = viewer.role === "driver";
  const actor = await getActor(viewer.user.id);
  const { upcoming, active } = await tripCounts(actor);
  const unassigned = upcoming.filter((t) => !t.driverId).length;
  const focus = [...active, ...upcoming].slice(0, isDriver ? 4 : 3);

  if (focus.length === 0) {
    if (!isDriver) return null;
    return (
      <Card as="section" aria-labelledby="today-title" className="mb-6 p-5 medium:p-6">
        <h2 id="today-title" className="text-title-lg">
          Today
        </h2>
        <p className="mt-1 text-body-md text-on-surface-variant">No trips assigned to you yet. You&apos;ll get a notification when your dispatcher assigns one.</p>
      </Card>
    );
  }

  return (
    <Card as="section" aria-labelledby="today-title" className="mb-6 overflow-hidden">
      <div className="flex flex-wrap items-end justify-between gap-2 px-5 pt-5 pb-3 medium:px-6">
        <div>
          <h2 id="today-title" className="text-title-lg">
            Today
          </h2>
          <p className="text-body-md text-on-surface-variant">
            {active.length} on the road · {upcoming.length} upcoming
          </p>
        </div>
        <Button variant="text" asChild>
          <Link href="/app/trips">All trips</Link>
        </Button>
      </div>
      {!isDriver && unassigned > 0 && (
        <Link href="/app/trips?tab=upcoming" className="state-layer flex items-center gap-3 border-t border-outline-variant bg-warning-container/60 px-5 py-3 text-on-warning-container medium:px-6">
          <Icon icon={warningIcon} size={20} />
          <span className="min-w-0 flex-1 text-body-md">
            {unassigned} {unassigned === 1 ? "trip needs" : "trips need"} a driver
          </span>
          <Icon icon={chevronRightIcon} size={20} />
        </Link>
      )}
      <ul>
        {focus.map((row) => (
          <li key={row.id} className="border-t border-outline-variant">
            <TripRow row={row} showDriver={!isDriver} />
          </li>
        ))}
      </ul>
    </Card>
  );
}
