import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import {
  addIcon,
  calendarMonthIcon,
  checkCircleIcon,
  chevronRightIcon,
  directionsCarIcon,
  draftIcon,
  eastIcon,
  gavelIcon,
  houseIcon,
  localShippingIcon,
  palletIcon,
  starIcon,
  type IconData,
} from "@/components/ui/icons.generated";
import { StatusChip, type StatusTone } from "@/components/ui/status-chip";
import { formatUsd } from "@/lib/money";
import { defineScene } from "../define";
import type { SceneViewProps } from "../types";
import { demoBids, demoLoad } from "./data";
import { AppShell } from "./kit";

type S = { open: boolean };

type Row = {
  id: string;
  title: string;
  icon: IconData;
  category: string;
  from: string;
  to: string;
  pickup: string;
  status: string;
  tone: StatusTone;
  statusIcon: IconData;
  bids?: string;
};

const rows: Row[] = [
  {
    id: demoLoad.publicId,
    title: demoLoad.title,
    icon: directionsCarIcon,
    category: "Car or light truck",
    from: demoLoad.from,
    to: demoLoad.to,
    pickup: "Oct 14 – Oct 16",
    status: "Open for bids",
    tone: "primary",
    statusIcon: gavelIcon,
    bids: "4 bids · from $865",
  },
  {
    id: "AS-3HV8LC",
    title: "2-bedroom apartment",
    icon: houseIcon,
    category: "Long-distance moving",
    from: "Houston, TX",
    to: "Memphis, TN",
    pickup: "Oct 20",
    status: "In transit",
    tone: "tertiary",
    statusIcon: localShippingIcon,
  },
  {
    id: "AS-1WQ6TR",
    title: "4 pallets of tile",
    icon: palletIcon,
    category: "Freight",
    from: "Dallas, TX",
    to: "Tulsa, OK",
    pickup: "Sep 28",
    status: "Completed",
    tone: "secondary",
    statusIcon: checkCircleIcon,
  },
  {
    id: "AS-7NC0EJ",
    title: "Vintage dresser",
    icon: draftIcon,
    category: "Household items",
    from: "Austin, TX",
    to: "",
    pickup: "Not set",
    status: "Draft",
    tone: "neutral",
    statusIcon: draftIcon,
  },
];

function List() {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 pb-4 @3xl:pt-4">
        <h2 className="text-headline-sm text-on-surface @3xl:text-headline-md">Loads</h2>
        <Button leading={<Icon icon={addIcon} size={20} />}>Post a load</Button>
      </div>
      <ul className="divide-outline-variant border-outline-variant divide-y rounded-md border">
        {rows.map((r) => (
          <li key={r.id}>
            <div
              data-demo={`row-${r.id}`}
              className="state-layer flex items-start gap-4 px-4 py-4 @3xl:items-center @3xl:px-6"
            >
              <span className="bg-secondary-container text-on-secondary-container mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-md @3xl:size-12">
                <Icon icon={r.icon} />
              </span>
              <span className="grid min-w-0 flex-1 gap-1 @3xl:grid-cols-[minmax(0,1fr)_auto] @3xl:gap-x-6">
                <span className="min-w-0">
                  <span className="flex flex-wrap items-baseline gap-x-2">
                    <span className="text-title-md text-on-surface truncate">{r.title}</span>
                    <span className="text-label-md text-on-surface-variant font-mono">{r.id}</span>
                  </span>
                  <span className="text-body-md text-on-surface mt-0.5 flex flex-wrap items-center gap-x-1.5">
                    {r.from}
                    <Icon icon={eastIcon} size={16} className="text-on-surface-variant" />
                    {r.to || <span className="text-on-surface-variant">Not set</span>}
                  </span>
                  <span className="text-body-sm text-on-surface-variant mt-0.5 flex flex-wrap items-center gap-x-3">
                    <span className="hidden @xl:inline">{r.category}</span>
                    <span className="inline-flex items-center gap-1">
                      <Icon icon={calendarMonthIcon} size={14} />
                      Pickup {r.pickup}
                    </span>
                  </span>
                </span>
                <span className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 @3xl:mt-0 @3xl:flex-col @3xl:items-end @3xl:gap-1.5">
                  <StatusChip tone={r.tone} icon={r.statusIcon} size="sm">
                    {r.status}
                  </StatusChip>
                  {r.bids && (
                    <span className="text-body-md text-on-surface-variant tabular-nums">{r.bids}</span>
                  )}
                </span>
              </span>
              <Icon icon={chevronRightIcon} className="text-on-surface-variant hidden shrink-0 @3xl:block" />
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

function Detail() {
  const sorted = [...demoBids].sort((a, b) => a.cents - b.cents);
  return (
    <div className="animate-enter pt-2">
      <div className="flex flex-wrap items-baseline gap-x-3">
        <h2 className="text-headline-sm text-on-surface">{demoLoad.title}</h2>
        <span className="text-label-lg text-on-surface-variant font-mono">{demoLoad.publicId}</span>
      </div>
      <div className="mt-3">
        <StatusChip tone="primary" icon={gavelIcon}>
          Open for bids
        </StatusChip>
      </div>
      <ul className="divide-outline-variant border-outline-variant mt-5 divide-y rounded-md border">
        {sorted.map((b) => (
          <li key={b.id} className="flex items-center justify-between gap-3 px-4 py-3">
            <span className="min-w-0">
              <span className="text-title-sm text-on-surface block truncate">{b.carrier}</span>
              <span className="text-body-sm text-on-surface-variant inline-flex items-center gap-1">
                <Icon icon={starIcon} size={14} filled className="text-warning" />
                {b.rating.toFixed(1)} · Pickup {b.pickup}
              </span>
            </span>
            <span className="text-title-md text-on-surface tabular-nums">{formatUsd(b.cents, true)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function View({ s }: SceneViewProps<S>) {
  return (
    <AppShell role="shipper" active="loads">
      <div className="h-full overflow-hidden px-4 pb-6 @3xl:pr-8 @3xl:pl-2">
        {s.open ? <Detail /> : <List />}
      </div>
    </AppShell>
  );
}

export const adaptive = defineScene<S>({
  id: "adaptive",
  title: "Desktop, tablet and phone",
  summary:
    "The same loads page reflows from a desktop browser to a tablet and a phone without losing anything.",
  url: (s) => (s.open ? `/app/loads/${demoLoad.publicId}` : "/app/loads"),
  device: "desktop",
  initial: { open: false },
  View,
  script: ({ caption, click, move, device, wait }) => [
    caption("Your loads on a desktop"),
    move(`row-${demoLoad.publicId}`),
    wait(900),
    caption("The same account on a tablet"),
    device("tablet"),
    wait(1400),
    caption("And on your phone, every action still one tap away"),
    device("phone"),
    wait(600),
    click(`row-${demoLoad.publicId}`, { open: true }),
    wait(2000),
  ],
});
