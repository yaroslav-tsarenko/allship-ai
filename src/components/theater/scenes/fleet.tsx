import { Chip } from "@/components/ui/chip";
import { Icon } from "@/components/ui/icon";
import { callIcon, eastIcon, searchIcon, speedIcon } from "@/components/ui/icons.generated";
import { StatusChip } from "@/components/ui/status-chip";
import { cn } from "@/lib/cn";
import { defineScene } from "../define";
import type { SceneViewProps } from "../types";
import { demoDrivers } from "./data";
import { AppShell, Avatar } from "./kit";
import { gridStyle, labelClass, pathOf, pointAt, Vehicle, type Pt } from "./route-map";

type S = { t: number; selected: string | null; filter: "all" | "on_trip" | "idle" };

const routes: Record<string, { pts: Pt[]; start: number; speed: number }> = {
  marcus: {
    pts: [
      [420, 330],
      [380, 290],
      [330, 250],
      [292, 200],
      [250, 150],
      [200, 110],
    ],
    start: 0.35,
    speed: 0.4,
  },
  ana: {
    pts: [
      [470, 370],
      [488, 320],
      [500, 270],
      [522, 210],
      [548, 160],
    ],
    start: 0.05,
    speed: 0.5,
  },
};
const idle: Pt = [372, 214];

function position(id: string, t: number) {
  const r = routes[id];
  if (!r) return { x: idle[0], y: idle[1], angle: 0 };
  return pointAt(r.pts, Math.min(1, r.start + t * r.speed));
}

function FleetMap({ s }: { s: S }) {
  const sel = s.selected ? position(s.selected, s.t) : null;
  const driver = demoDrivers.find((d) => d.id === s.selected);
  return (
    <div className="bg-surface-container-low relative h-full min-h-0 overflow-hidden" style={gridStyle}>
      <svg
        viewBox="0 0 600 420"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
      >
        {Object.entries(routes).map(([id, r]) => (
          <g key={id}>
            <path
              d={pathOf(r.pts)}
              fill="none"
              className="stroke-outline"
              strokeWidth="2"
              strokeDasharray="2 8"
              strokeLinecap="round"
            />
            <path
              d={pathOf(r.pts)}
              fill="none"
              pathLength={1}
              strokeDasharray={`${Math.min(1, r.start + s.t * r.speed)} 1`}
              className={cn(id === s.selected ? "stroke-primary" : "stroke-primary/45")}
              strokeWidth="4"
              strokeLinecap="round"
            />
          </g>
        ))}
        <text x="210" y="96" className={labelClass}>
          Denver
        </text>
        <text x="430" y="352" className={labelClass}>
          Dallas
        </text>
        <text x="482" y="398" className={labelClass}>
          Houston
        </text>
        <text x="320" y="238" className="fill-on-surface-variant text-[12px]">
          Oklahoma City
        </text>
        {demoDrivers.map((d) => {
          const p = position(d.id, s.t);
          if (!routes[d.id])
            return (
              <g key={d.id} transform={`translate(${p.x} ${p.y})`}>
                <circle r={s.selected === d.id ? 22 : 10} className="fill-outline" fillOpacity="0.16" />
                <circle r="8" className="fill-outline stroke-surface" strokeWidth="3" />
              </g>
            );
          return <Vehicle key={d.id} {...p} selected={s.selected === d.id} />;
        })}
      </svg>
      {sel && driver && (
        <div className="bg-surface shadow-elevation-2 animate-enter absolute top-3 left-3 flex items-center gap-3 rounded-md px-3 py-2">
          <Avatar name={driver.name} size={28} />
          <span>
            <span className="text-label-lg text-on-surface block">{driver.name}</span>
            <span className="text-body-sm text-on-surface-variant flex items-center gap-1">
              <Icon icon={speedIcon} size={14} />
              {driver.speed} {driver.heading} · updated 12s ago
            </span>
          </span>
        </div>
      )}
    </div>
  );
}

function View({ s }: SceneViewProps<S>) {
  const shown = demoDrivers.filter(
    (d) => s.filter === "all" || (s.filter === "idle" ? d.trip === null : d.trip !== null),
  );
  return (
    <AppShell role="owner" active="fleet" user="Rita M.">
      <div className="flex h-full flex-col px-4 pb-4 @3xl:pr-8 @3xl:pl-2">
        <h2 className="text-headline-sm text-on-surface @3xl:text-headline-md shrink-0 pt-2 pb-4 @3xl:pt-4">
          Fleet
        </h2>
        <div className="border-outline-variant bg-surface-container-low flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border @5xl:grid @5xl:grid-cols-[360px_1fr]">
          <div className="border-outline-variant h-[230px] shrink-0 border-b @5xl:order-2 @5xl:h-auto @5xl:border-b-0 @5xl:border-l">
            <FleetMap s={s} />
          </div>
          <section className="bg-surface flex min-h-0 flex-1 flex-col @5xl:order-1">
            <div className="flex flex-col gap-3 px-4 pt-4 pb-3">
              <span className="bg-surface-container-high text-on-surface-variant flex h-12 items-center gap-3 rounded-full px-4">
                <Icon icon={searchIcon} />
                <span className="text-body-lg">Search drivers</span>
              </span>
              <div className="flex gap-2">
                <Chip variant="filter" label="All" selected={s.filter === "all"} />
                <Chip
                  variant="filter"
                  label="On trip"
                  selected={s.filter === "on_trip"}
                  data-demo="filter-ontrip"
                />
                <Chip variant="filter" label="Idle" selected={s.filter === "idle"} />
              </div>
            </div>
            <ul className="border-outline-variant min-h-0 flex-1 overflow-hidden border-t">
              {shown.map((d) => {
                const on = s.selected === d.id;
                return (
                  <li
                    key={d.id}
                    className={cn(
                      "border-outline-variant border-b transition-colors duration-300",
                      on && "bg-secondary-container/50",
                    )}
                  >
                    <div
                      data-demo={`driver-${d.id}`}
                      className="state-layer flex items-start gap-3 px-4 py-3"
                    >
                      <Avatar name={d.name} size={40} />
                      <span className="min-w-0 flex-1">
                        <span className="text-title-md text-on-surface block truncate">{d.name}</span>
                        <span className="mt-1 flex flex-wrap items-center gap-2">
                          <StatusChip tone={d.tone} size="sm" dot>
                            {d.status}
                          </StatusChip>
                        </span>
                        <span className="text-body-sm text-on-surface-variant mt-1 flex items-center gap-1 truncate">
                          {d.trip ? (
                            <>
                              {d.trip} · {d.from}
                              <Icon icon={eastIcon} size={14} />
                              {d.to}
                            </>
                          ) : (
                            `Last seen in ${d.from}`
                          )}
                        </span>
                      </span>
                      <span className="text-on-surface-variant inline-flex size-10 shrink-0 items-center justify-center rounded-full">
                        <Icon icon={callIcon} size={20} />
                      </span>
                    </div>
                    {on && d.trip && (
                      <div className="animate-message-in px-4 pb-3 pl-[68px]">
                        <span
                          data-demo="open-trip"
                          className="text-label-lg text-primary ring-outline-variant inline-flex h-9 items-center rounded-full px-3 font-medium ring-1"
                        >
                          Open trip {d.trip}
                        </span>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      </div>
    </AppShell>
  );
}

export const fleet = defineScene<S>({
  id: "fleet",
  title: "Fleet map",
  summary: "A carrier owner sees every driver on one map, locates one, and opens their trip.",
  url: "/app/fleet",
  device: "desktop",
  initial: { t: 0, selected: null, filter: "all" },
  View,
  script: ({ caption, click, tween, wait, highlight }) => [
    caption("Every driver on one map, moving live"),
    tween("t", 1, 15000, { parallel: true, ease: "linear" }),
    wait(2000),
    caption("Locate a driver in one click"),
    click("driver-marcus", { selected: "marcus" }),
    wait(800),
    highlight("open-trip", "Open the trip with its live route, photos and timeline"),
    caption("Filter to drivers on a trip"),
    click("filter-ontrip", { filter: "on_trip" }),
    wait(2500),
  ],
});
