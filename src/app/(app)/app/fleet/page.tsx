import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { requireCarrierStaff } from "@/features/board/eligibility";
import { FleetView } from "@/features/fleet/fleet-view";
import { AddDriverButton } from "@/features/team/add-driver-dialog";
import { getActor } from "@/server/actor";
import { fleetSnapshot } from "@/server/fleet/queries";
import { isOnTrip } from "@/server/fleet/status";
import { getViewer } from "@/server/viewer/viewer";

export const metadata: Metadata = { title: "Fleet" };

export default async function FleetPage() {
  const viewer = await getViewer();
  const org = requireCarrierStaff(viewer);
  const snapshot = await fleetSnapshot(await getActor(viewer.user.id));
  const total = snapshot.drivers.length;
  const onRoad = snapshot.drivers.filter((d) => isOnTrip(d.status)).length;

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        title="Fleet"
        description={`${org.orgName} · ${total} ${total === 1 ? "driver" : "drivers"}${total ? `, ${onRoad} on the road` : ""}`}
        actions={<AddDriverButton />}
      />
      <FleetView initial={snapshot} canRemove={viewer.role === "owner"} />
    </div>
  );
}
