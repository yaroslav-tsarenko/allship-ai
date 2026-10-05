import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { chevronRightIcon } from "@/components/ui/icons.generated";
import type { Viewer } from "@/server/viewer/viewer";
import { carrierBoardSummary } from "./queries";

export async function CarrierHomeSummary({ viewer }: { viewer: Viewer }) {
  if ((viewer.role !== "owner" && viewer.role !== "dispatcher") || !viewer.org?.orgId) return null;
  const s = await carrierBoardSummary(viewer.org.orgId);
  const items = [
    { href: "/app/board", label: "Open loads", value: s.openLoads, hint: "Find loads" },
    { href: "/app/bids", label: "Active bids", value: s.activeBids, hint: "Waiting on shippers" },
    { href: "/app/bids?tab=won", label: "Won", value: s.wonBids, hint: "Booked with your company" },
  ];
  return (
    <Card as="section" data-tour="home-marketplace" aria-labelledby="carrier-summary-title" className="mb-6 overflow-hidden">
      <h2 id="carrier-summary-title" className="px-6 pt-5 pb-2 text-title-lg">
        Your marketplace
      </h2>
      <ul className="grid medium:grid-cols-3">
        {items.map((i) => (
          <li key={i.href} className="border-t border-outline-variant medium:border-l medium:first:border-l-0">
            <Link href={i.href} className="state-layer flex items-center gap-3 px-6 py-4">
              <span className="min-w-0 flex-1">
                <span className="block text-body-md text-on-surface-variant">{i.label}</span>
                <span className="block text-headline-sm text-on-surface tabular-nums">{i.value}</span>
                <span className="block truncate text-body-sm text-on-surface-variant">{i.hint}</span>
              </span>
              <Icon icon={chevronRightIcon} className="text-on-surface-variant" />
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
