import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Icon } from "@/components/ui/icon";
import {
  calendarMonthIcon,
  checkCircleIcon,
  checkIcon,
  eastIcon,
  gavelIcon,
  keyboardArrowDownIcon,
  locationOnIcon,
  timerIcon,
  tripOriginIcon,
} from "@/components/ui/icons.generated";
import { StatusChip } from "@/components/ui/status-chip";
import { formatUsd } from "@/lib/money";
import { cn } from "@/lib/cn";
import { defineScene } from "../define";
import type { SceneViewProps } from "../types";
import { split } from "./data";
import { AppShell, Field, Snackbar } from "./kit";

type S = {
  menu: "none" | "vehicles" | "from";
  car: boolean;
  from: string;
  view: "board" | "detail";
  amount: string;
  placed: boolean;
};

type BoardLoad = {
  id: string;
  category: string;
  group: string;
  title: string;
  from: string;
  to: string;
  miles: number;
  pickup: string;
  target: number | null;
  bids: number;
  left: string;
  urgent?: boolean;
  details: [string, string][];
};

const loads: BoardLoad[] = [
  {
    id: "AS-9D4M2X",
    category: "Car or light truck",
    group: "car",
    title: "2019 Ford F-150",
    from: "Houston, TX",
    to: "Phoenix, AZ",
    miles: 1180,
    pickup: "Oct 15 – Oct 17",
    target: 120_000,
    bids: 2,
    left: "1d 4h left",
    details: [
      ["Condition", "Runs and drives"],
      ["Trailer", "Open trailer"],
    ],
  },
  {
    id: "AS-6TQ1WB",
    category: "Long-distance moving",
    group: "moving",
    title: "2-bedroom apartment move",
    from: "Austin, TX",
    to: "Atlanta, GA",
    miles: 920,
    pickup: "Oct 18",
    target: null,
    bids: 5,
    left: "2d left",
    details: [
      ["Bedrooms", "2"],
      ["Stairs", "2nd floor"],
    ],
  },
  {
    id: "AS-8RF3NC",
    category: "Motorcycle",
    group: "moto",
    title: "2020 Honda Gold Wing",
    from: "San Antonio, TX",
    to: "Nashville, TN",
    miles: 960,
    pickup: "Oct 16 – Oct 20",
    target: 65_000,
    bids: 1,
    left: "9h left",
    urgent: true,
    details: [
      ["Type", "Standard"],
      ["Crated", "No"],
    ],
  },
  {
    id: "AS-5MJ2QA",
    category: "Car or light truck",
    group: "car",
    title: "2022 Tesla Model Y",
    from: "Chicago, IL",
    to: "Dallas, TX",
    miles: 925,
    pickup: "Oct 14",
    target: 105_000,
    bids: 3,
    left: "1d left",
    details: [
      ["Condition", "Runs and drives"],
      ["Trailer", "Enclosed"],
    ],
  },
  {
    id: "AS-4PX9HV",
    category: "Freight",
    group: "freight",
    title: "6 pallets of floor tile",
    from: "Dallas, TX",
    to: "Tulsa, OK",
    miles: 257,
    pickup: "Oct 15",
    target: 78_000,
    bids: 4,
    left: "3d left",
    details: [
      ["Weight", "7,800 lb"],
      ["Pallets", "6"],
    ],
  },
  {
    id: "AS-2LZ7KD",
    category: "Heavy equipment",
    group: "heavy",
    title: "Kubota M7 tractor",
    from: "Wichita, KS",
    to: "Amarillo, TX",
    miles: 290,
    pickup: "Oct 21",
    target: null,
    bids: 0,
    left: "4d left",
    details: [
      ["Weight", "14,300 lb"],
      ["Trailer", "Step deck"],
    ],
  },
];

const chosen = loads[0]!;

function MenuChip({
  demo,
  label,
  selected,
  open,
  children,
}: {
  demo: string;
  label: string;
  selected: boolean;
  open: boolean;
  children: React.ReactNode;
}) {
  return (
    <span className="relative">
      <Chip
        variant="filter"
        selected={selected}
        data-demo={demo}
        label={
          <span className="inline-flex items-center gap-1">
            {label}
            <Icon icon={keyboardArrowDownIcon} size={18} className="-mr-2" />
          </span>
        }
      />
      <span
        className={cn(
          "bg-surface-container shadow-elevation-2 absolute top-10 left-0 z-20 min-w-[240px] origin-top rounded-xs py-2 transition-[opacity,transform] duration-200",
          open ? "scale-y-100 opacity-100" : "pointer-events-none scale-y-90 opacity-0",
        )}
      >
        {children}
      </span>
    </span>
  );
}

function MenuItem({ demo, label, meta, on }: { demo?: string; label: string; meta?: string; on: boolean }) {
  return (
    <span
      data-demo={demo}
      className="state-layer text-body-lg text-on-surface flex h-11 items-center gap-3 px-3"
    >
      <span className="flex size-6 items-center justify-center">
        {on && <Icon icon={checkIcon} size={20} className="text-primary" />}
      </span>
      <span className="flex-1">{label}</span>
      {meta && <span className="text-label-md text-on-surface-variant">{meta}</span>}
    </span>
  );
}

function Card({ load }: { load: BoardLoad }) {
  return (
    <article
      data-demo={`card-${load.id}`}
      className="border-outline-variant bg-surface animate-enter relative h-full rounded-md border"
    >
      <div className="flex flex-col gap-3 p-4">
        <div className="text-label-md text-on-surface-variant flex items-center gap-2">
          <span className="truncate">{load.category}</span>
          <span>·</span>
          <span className="shrink-0 tabular-nums">{load.id}</span>
          <span
            className={cn(
              "ml-auto inline-flex shrink-0 items-center gap-1",
              load.urgent ? "text-error" : "text-on-surface-variant",
            )}
          >
            <Icon icon={timerIcon} size={16} />
            {load.left}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <h3 className="text-title-md text-on-surface">{load.title}</h3>
          <p className="text-body-lg text-on-surface flex flex-wrap items-center gap-x-2">
            <span>{load.from}</span>
            <Icon icon={eastIcon} size={18} className="text-on-surface-variant" />
            <span>{load.to}</span>
            <span className="text-body-md text-on-surface-variant">
              {load.miles.toLocaleString("en-US")} mi
            </span>
          </p>
        </div>
        <p className="text-body-md text-on-surface-variant inline-flex items-center gap-2">
          <Icon icon={calendarMonthIcon} size={18} />
          Pickup {load.pickup}
        </p>
        <div className="border-outline-variant flex flex-wrap items-center gap-x-4 gap-y-2 border-t pt-3">
          {load.target ? (
            <p className="text-body-md text-on-surface-variant">
              Target{" "}
              <span className="text-title-md text-on-surface tabular-nums">
                {formatUsd(load.target, true)}
              </span>
            </p>
          ) : (
            <p className="text-body-md text-on-surface-variant">Open to offers</p>
          )}
          <p className="text-body-md text-on-surface-variant inline-flex items-center gap-1.5">
            <Icon icon={gavelIcon} size={16} />
            {load.bids === 0 ? "No bids yet" : `${load.bids} ${load.bids === 1 ? "bid" : "bids"}`}
          </p>
        </div>
      </div>
    </article>
  );
}

function Board({ s }: { s: S }) {
  const shown = loads.filter((l) => (!s.car || l.group === "car") && (!s.from || l.from.endsWith(s.from)));
  return (
    <>
      <h2 className="text-headline-sm text-on-surface @3xl:text-headline-md pt-2 pb-4 @3xl:pt-4">
        Find loads
      </h2>
      <div className="flex flex-wrap gap-2">
        <MenuChip demo="chip-vehicles" label="Vehicles" selected={s.car} open={s.menu === "vehicles"}>
          <span className="text-label-md text-on-surface-variant block px-3 pt-1 pb-2">Vehicles</span>
          <MenuItem demo="opt-car" label="Car or light truck" on={s.car} />
          <MenuItem label="Motorcycle" on={false} />
          <MenuItem label="RV" on={false} />
        </MenuChip>
        <Chip variant="filter" label="Moving" />
        <Chip variant="filter" label="Freight" className="hidden @3xl:inline-flex" />
        <span className="bg-outline-variant mx-1 hidden h-8 w-px @3xl:block" />
        <MenuChip
          demo="chip-from"
          label={s.from ? `From ${s.from}` : "From"}
          selected={Boolean(s.from)}
          open={s.menu === "from"}
        >
          <span className="text-label-md text-on-surface-variant block px-3 pt-1 pb-2">Pickup state</span>
          <MenuItem label="Oklahoma" meta="OK" on={false} />
          <MenuItem demo="opt-tx" label="Texas" meta="TX" on={s.from === "TX"} />
          <MenuItem label="Utah" meta="UT" on={false} />
        </MenuChip>
        <Chip variant="filter" label="To" className="hidden @3xl:inline-flex" />
      </div>
      <p className="text-body-md text-on-surface-variant mt-3 mb-4 flex min-h-10 items-center">
        {shown.length} {shown.length === 1 ? "load" : "loads"} open for bids
      </p>
      <ul className="grid gap-3 @3xl:grid-cols-2 @6xl:grid-cols-3">
        {shown.map((l) => (
          <li key={l.id}>
            <Card load={l} />
          </li>
        ))}
      </ul>
    </>
  );
}

function Detail({ s, focus }: { s: S; focus: string | null }) {
  const cents = Number(s.amount) > 0 ? Number(s.amount) * 100 : 0;
  const m = split(cents);
  return (
    <div className="grid gap-8 pt-2 @3xl:pt-4 @6xl:grid-cols-[minmax(0,1fr)_400px]">
      <div className="min-w-0">
        <p className="text-label-md text-on-surface-variant">
          {chosen.category} · {chosen.id}
        </p>
        <h2 className="text-headline-sm text-on-surface mt-1">{chosen.title}</h2>
        <ol className="mt-5">
          {[
            ["Pickup", chosen.from, "ZIP 770xx · Street address shared after booking", chosen.pickup],
            ["Delivery", chosen.to, "ZIP 850xx · Street address shared after booking", "Flexible"],
          ].map(([kind, place, sub, when], i) => (
            <li key={kind} className="relative flex gap-4 pb-5 last:pb-0">
              {i === 0 && <span className="bg-outline-variant absolute top-6 bottom-0 left-[11px] w-0.5" />}
              <span className="bg-surface text-primary relative z-10 flex size-6 shrink-0 items-center justify-center">
                <Icon icon={i === 0 ? tripOriginIcon : locationOnIcon} size={20} filled={i === 1} />
              </span>
              <div className="min-w-0">
                <p className="text-label-lg text-on-surface-variant">{kind}</p>
                <p className="text-title-md text-on-surface">{place}</p>
                <p className="text-body-md text-on-surface-variant">{sub}</p>
                <p className="text-body-md text-on-surface-variant mt-1">{when}</p>
              </div>
            </li>
          ))}
        </ol>
        <dl className="divide-outline-variant border-outline-variant mt-6 divide-y border-y">
          {[["Year", "2019"], ["Make", "Ford"], ["Model", "F-150"], ...chosen.details].map(([k, v]) => (
            <div key={k} className="text-body-md grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-4 py-2.5">
              <dt className="text-on-surface-variant">{k}</dt>
              <dd className="text-on-surface">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="border-outline-variant rounded-md border p-5">
        {s.placed ? (
          <div className="animate-enter flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-title-lg text-on-surface">Your bid</h3>
              <StatusChip tone="secondary" size="sm" dot>
                Active
              </StatusChip>
            </div>
            <p className="text-display-sm text-on-surface tabular-nums">{formatUsd(cents, true)}</p>
            <p className="text-body-sm text-on-surface-variant">
              The shipper sees your price, dates and message, plus your company rating.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <h3 className="text-title-lg text-on-surface">Place a bid</h3>
            <Field
              demo="amount"
              label="Your price"
              value={s.amount}
              focused={focus === "amount"}
              leading={<span className="text-body-lg">$</span>}
            />
            <div data-demo="breakdown" className="bg-surface-container-low text-body-md rounded-sm px-4 py-3">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-on-surface-variant">You receive</span>
                <span className="text-title-md text-on-surface tabular-nums">
                  {formatUsd(m.carrier)} <span className="text-body-sm text-on-surface-variant">100%</span>
                </span>
              </div>
              <div className="mt-1 flex items-baseline justify-between gap-3">
                <span className="text-on-surface-variant">Shipper pays</span>
                <span className="text-on-surface-variant tabular-nums">
                  {formatUsd(m.carrier)} + 10% fee ={" "}
                  <span className="text-on-surface">{formatUsd(m.total)}</span>
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Pickup by" value="10/15/2026" />
              <Field label="Deliver by" value="10/18/2026" />
            </div>
            <Button data-demo="place-bid" size="lg">
              Place bid
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function View({ s, focus }: SceneViewProps<S>) {
  return (
    <AppShell role="owner" active="find" user="Rita M.">
      <div data-demo-scroll="main" className="h-full overflow-hidden px-4 pb-6 @3xl:pr-8 @3xl:pl-2">
        {s.view === "board" ? <Board s={s} /> : <Detail s={s} focus={focus} />}
      </div>
      <Snackbar show={s.placed}>
        <Icon icon={checkCircleIcon} size={20} />
        Bid placed. We&rsquo;ll notify you when the shipper decides.
      </Snackbar>
    </AppShell>
  );
}

export const carrierBoard = defineScene<S>({
  id: "carrierBoard",
  title: "Find loads and bid",
  summary:
    "A carrier filters the load board, opens a load on its lanes and bids with a live breakdown of what it receives.",
  url: (s) => (s.view === "detail" ? `/app/board/${chosen.id}` : "/app/board"),
  device: "desktop",
  initial: { menu: "none", car: false, from: "", view: "board", amount: "", placed: false },
  View,
  script: ({ caption, click, type, wait, highlight }) => [
    caption("Filter the load board by category and state"),
    click("chip-vehicles", { menu: "vehicles" }),
    click("opt-car", { car: true, menu: "none" }),
    click("chip-from", { menu: "from" }),
    click("opt-tx", { from: "TX", menu: "none" }),
    wait(600),
    caption("Open a load that fits your lanes"),
    click(`card-${chosen.id}`, { view: "detail" }),
    wait(500),
    caption("Set your price and see exactly what you receive"),
    type("amount", "1150"),
    highlight("breakdown", "You receive 100% of your bid. The shipper pays the 10% fee on top"),
    caption("Place the bid. The shipper is notified"),
    click("place-bid", { placed: true }),
    wait(1800),
  ],
});
