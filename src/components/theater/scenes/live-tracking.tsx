import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import {
  checkCircleIcon,
  checkIcon,
  eastIcon,
  localShippingIcon,
  paymentsIcon,
  scheduleIcon,
} from "@/components/ui/icons.generated";
import { StatusChip } from "@/components/ui/status-chip";
import { cn } from "@/lib/cn";
import { defineScene } from "../define";
import type { SceneViewProps } from "../types";
import { demoLoad } from "./data";
import { AppShell } from "./kit";
import { gridStyle, labelClass, pathOf, pointAt, Vehicle, type Pt } from "./route-map";

type S = { p: number; phase: number; events: number; confirmed: boolean };

const route: Pt[] = [
  [470, 292],
  [452, 250],
  [404, 226],
  [338, 196],
  [300, 160],
  [262, 118],
  [214, 92],
  [168, 60],
];

const stepLabels = ["Booked", "Driver assigned", "On the way", "Picked up", "Delivered", "Completed"];
const stepTimes = [
  "Oct 12, 4:10 PM",
  "Oct 13, 9:02 AM",
  "Oct 14, 7:42 AM",
  "Oct 14, 8:15 AM",
  "Oct 15, 7:05 PM",
  "Oct 15, 7:20 PM",
];
const feed = [
  { title: "Trip started", detail: "Marcus T. is on the way to pickup", at: "7:42 AM" },
  { title: "Pickup confirmed", detail: "6 photos added", at: "8:15 AM" },
  { title: "Delivery confirmed", detail: "Signed by Emily C. · 4 photos", at: "Oct 15, 7:05 PM" },
];

function eta(p: number) {
  const miles = Math.round(demoLoad.miles * (1 - p));
  const minutes = Math.round((miles / 58) * 60);
  return { miles, h: Math.floor(minutes / 60), m: minutes % 60 };
}

function Progress({ phase }: { phase: number }) {
  return (
    <ol data-demo="progress" className="flex flex-col">
      {stepLabels.map((label, i) => {
        const done = i < phase || (i === phase && i === stepLabels.length - 1);
        const on = i === phase && !done;
        const last = i === stepLabels.length - 1;
        return (
          <li key={label} className="relative flex min-w-0 gap-3 pb-4 last:pb-0">
            {!last && (
              <span
                className={cn(
                  "absolute top-7 bottom-1 left-[11px] w-0.5 rounded-full transition-colors duration-500",
                  i < phase ? "bg-primary" : "bg-outline-variant",
                )}
              />
            )}
            <span
              className={cn(
                "relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full transition-colors duration-300",
                done && "bg-primary text-on-primary",
                on && "bg-primary-container ring-primary ring-2",
                !done && !on && "border-outline-variant bg-surface border-2",
              )}
            >
              {done && <Icon icon={checkIcon} size={16} />}
              {on && <span className="bg-primary size-2 rounded-full" />}
            </span>
            <span className="min-w-0">
              <span
                className={cn(
                  "text-label-lg block",
                  done || on ? "text-on-surface" : "text-on-surface-variant",
                )}
              >
                {label}
              </span>
              <span className="text-body-sm text-on-surface-variant block tabular-nums">
                {i <= phase ? stepTimes[i] : "—"}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function View({ s }: SceneViewProps<S>) {
  const pos = pointAt(route, s.p);
  const e = eta(s.p);
  const delivered = s.phase >= 4;
  return (
    <AppShell role="shipper" active="loads">
      <div data-demo-scroll="main" className="h-full overflow-hidden px-4 pb-6 @3xl:pr-8 @3xl:pl-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 pt-2 pb-4 @3xl:pt-4">
          <h2 className="text-headline-sm text-on-surface">{demoLoad.title}</h2>
          <span className="text-label-lg text-on-surface-variant font-mono">{demoLoad.publicId}</span>
          {s.confirmed ? (
            <StatusChip tone="secondary" icon={checkCircleIcon}>
              Completed
            </StatusChip>
          ) : delivered ? (
            <StatusChip tone="success" icon={checkCircleIcon}>
              Delivered
            </StatusChip>
          ) : (
            <StatusChip tone="tertiary" icon={localShippingIcon}>
              {s.phase >= 3 ? "In transit" : "On the way to pickup"}
            </StatusChip>
          )}
        </div>
        <div className="grid gap-5 @5xl:grid-cols-[minmax(0,1fr)_320px]">
          <div
            className="border-outline-variant bg-surface-container-low overflow-hidden rounded-md border"
            style={gridStyle}
          >
            <svg viewBox="0 0 600 340" className="block h-auto w-full" preserveAspectRatio="xMidYMid meet">
              <path
                d={pathOf(route)}
                fill="none"
                className="stroke-outline"
                strokeWidth="2"
                strokeDasharray="2 8"
                strokeLinecap="round"
              />
              <path
                d={pathOf(route)}
                fill="none"
                pathLength={1}
                strokeDasharray={`${s.p} 1`}
                className="stroke-primary"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle
                cx={route[0]![0]}
                cy={route[0]![1]}
                r="8"
                className="fill-surface stroke-primary"
                strokeWidth="4"
              />
              <text x={route[0]![0]} y={route[0]![1] + 28} textAnchor="middle" className={labelClass}>
                Dallas, TX
              </text>
              <g transform={`translate(${route[7]![0]} ${route[7]![1]})`}>
                <path
                  d="M0 0 c-2-6-10-11-10-18a10 10 0 1 1 20 0c0 7-8 12-10 18z"
                  className="fill-tertiary stroke-surface"
                  strokeWidth="2"
                />
                <circle cy="-18" r="3.5" className="fill-on-tertiary" />
              </g>
              <text x={route[7]![0] + 16} y={route[7]![1] + 18} className={labelClass}>
                Denver, CO
              </text>
              <text
                x={route[4]![0] + 16}
                y={route[4]![1] + 4}
                className="fill-on-surface-variant text-[12px]"
              >
                Amarillo
              </text>
              {!delivered && <Vehicle {...pos} />}
            </svg>
            <div
              data-demo="eta"
              className="border-outline-variant bg-surface flex flex-wrap items-center gap-x-6 gap-y-1 border-t px-4 py-3"
            >
              <span className="text-title-md text-on-surface inline-flex items-center gap-2 tabular-nums">
                <Icon icon={scheduleIcon} size={20} className="text-primary" />
                {delivered
                  ? "Delivered Oct 15, 7:05 PM"
                  : `Arrives in ${e.h} h ${String(e.m).padStart(2, "0")} min`}
              </span>
              {!delivered && (
                <span className="text-body-md text-on-surface-variant tabular-nums">
                  {e.miles} mi to go · updated just now
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-5">
            <section className="border-outline-variant rounded-md border p-4">
              <h3 className="text-title-md text-on-surface mb-3">Trip progress</h3>
              <Progress phase={s.phase} />
            </section>
            <section className="flex flex-col gap-3">
              {feed.slice(0, s.events).map((f) => (
                <p key={f.title} className="text-body-md animate-message-in flex items-start gap-3">
                  <span className="bg-primary mt-1.5 size-2.5 shrink-0 rounded-full" />
                  <span className="min-w-0">
                    <span className="text-on-surface block">{f.title}</span>
                    <span className="text-body-sm text-on-surface-variant block">
                      {f.detail} · {f.at}
                    </span>
                  </span>
                </p>
              ))}
            </section>
            {delivered && (
              <div className="bg-surface-container animate-enter flex flex-col gap-3 rounded-md p-4">
                {s.confirmed ? (
                  <p className="text-body-md text-on-surface flex items-start gap-2">
                    <Icon icon={paymentsIcon} className="text-success shrink-0" />
                    Payment released to Lone Star Auto Haul. Leave a review when you&rsquo;re ready.
                  </p>
                ) : (
                  <>
                    <p className="text-body-md text-on-surface-variant">
                      Check the photos and signature, then confirm. Otherwise it completes in 72 hours.
                    </p>
                    <Button data-demo="confirm" trailing={<Icon icon={eastIcon} size={18} />}>
                      Confirm delivery
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export const liveTracking = defineScene<S>({
  id: "liveTracking",
  title: "Live tracking",
  summary:
    "The shipper follows the truck from Dallas to Denver while the ETA and trip timeline update, then confirms delivery to release payment.",
  url: `/app/loads/${demoLoad.publicId}`,
  device: "desktop",
  initial: { p: 0, phase: 2, events: 1, confirmed: false },
  View,
  script: ({ caption, click, tween, set, wait, highlight, scroll }) => [
    caption("Every milestone lands on the trip timeline"),
    wait(700),
    set({ phase: 3, events: 2 }),
    highlight("progress", "Pickup confirmed by the driver, with photos"),
    scroll("main", 0, { ms: 400 }),
    caption("Follow the truck. Position and ETA refresh about every 20 seconds"),
    tween("p", 0.55, 4200, { ease: "linear" }),
    highlight("eta", "ETA comes from the driver's live location"),
    tween("p", 1, 3200, { ease: "linear" }),
    set({ phase: 4, events: 3 }),
    wait(600),
    caption("Confirm delivery to release the payment"),
    click("confirm", { confirmed: true, phase: 5 }),
    wait(2000),
  ],
});
