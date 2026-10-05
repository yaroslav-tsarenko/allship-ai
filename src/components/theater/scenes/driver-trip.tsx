import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import {
  addPhotoAlternateIcon,
  checkCircleIcon,
  directionsCarIcon,
  directionsIcon,
  inventoryIcon,
  locationOnIcon,
  myLocationIcon,
  navigationIcon,
  shareLocationIcon,
  taskAltIcon,
  tripOriginIcon,
} from "@/components/ui/icons.generated";
import { StatusChip } from "@/components/ui/status-chip";
import { cn } from "@/lib/cn";
import { defineScene } from "../define";
import type { SceneViewProps } from "../types";
import { demoLoad } from "./data";
import { AppShell, Field, Sheet, Snackbar } from "./kit";

type Stage = "ready" | "started" | "picked" | "delivered";
type S = {
  stage: Stage;
  sharing: boolean;
  sheet: "none" | "pickup" | "delivery";
  photos: number;
  podPhotos: number;
  recipient: string;
  sig: number;
  toast: string;
};

const next: Record<
  Exclude<Stage, "delivered">,
  { label: string; hint: string; icon: typeof navigationIcon }
> = {
  ready: { label: "Start trip", hint: "Tap when you're heading to pickup", icon: navigationIcon },
  started: { label: "Confirm pickup", hint: "Photos of the shipment as loaded", icon: inventoryIcon },
  picked: { label: "Confirm delivery", hint: "Recipient name, photos and signature", icon: taskAltIcon },
};

const statusChip: Record<Stage, { label: string; tone: "success" | "tertiary" }> = {
  ready: { label: "Driver assigned", tone: "success" },
  started: { label: "On the way to pickup", tone: "tertiary" },
  picked: { label: "In transit", tone: "tertiary" },
  delivered: { label: "Delivered", tone: "success" },
};

const signature =
  "M8 62c10-22 18-44 22-40 4 5-12 40-6 42 6 2 14-26 20-24 5 2-2 20 4 20s10-16 16-14c5 2 0 14 6 13 7-1 9-12 15-11 6 2-3 14 4 14 8 0 14-24 22-22 6 2-5 22 2 22 9-1 17-30 24-26 6 3-8 28-1 28 10 0 26-20 40-18";

function Photos({ count, demo }: { count: number; demo: string }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className={cn(
            "text-on-tertiary-container animate-pop-in flex aspect-square items-center justify-center rounded-md",
            i % 2 ? "bg-tertiary-container" : "bg-secondary-container",
          )}
        >
          <Icon icon={directionsCarIcon} size={28} />
        </span>
      ))}
      <span
        data-demo={demo}
        className="state-layer border-outline text-primary flex aspect-square flex-col items-center justify-center gap-1 rounded-md border border-dashed"
      >
        <Icon icon={addPhotoAlternateIcon} />
        <span className="text-label-sm">Add</span>
      </span>
    </div>
  );
}

function View({ s, focus }: SceneViewProps<S>) {
  const step = s.stage === "delivered" ? null : next[s.stage];
  const chip = statusChip[s.stage];
  return (
    <AppShell role="driver" active="trips" user="Marcus T.">
      <div className="flex h-full flex-col">
        <div className="min-h-0 flex-1 overflow-hidden px-4 @3xl:pr-8 @3xl:pl-2">
          <div className="pt-2 pb-4">
            <p className="text-label-md text-on-surface-variant font-mono">{demoLoad.publicId}</p>
            <h2 className="text-headline-sm text-on-surface">{demoLoad.title}</h2>
            <div className="mt-2">
              <StatusChip tone={chip.tone} size="sm">
                {chip.label}
              </StatusChip>
            </div>
          </div>
          <ol className="mb-4">
            {[
              {
                kind: "Pickup",
                line1: "1420 Elm St",
                line2: "Dallas, TX 75201",
                when: "Oct 14 · 8:00–10:00 AM",
                notes: "Gate code 4471. Park on the street.",
                icon: tripOriginIcon,
                current: s.stage === "ready" || s.stage === "started",
              },
              {
                kind: "Delivery",
                line1: "2210 Larimer St",
                line2: "Denver, CO 80205",
                when: "Oct 15 · after 4:00 PM",
                notes: "",
                icon: locationOnIcon,
                current: s.stage === "picked",
              },
            ].map((stop) => (
              <li key={stop.kind} className="relative flex gap-4 pb-5 last:pb-0">
                {stop.kind === "Pickup" && (
                  <span className="bg-outline-variant absolute top-7 bottom-0 left-[13px] w-0.5" />
                )}
                <span
                  className={cn(
                    "relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full",
                    stop.current ? "bg-primary text-on-primary" : "bg-surface text-primary",
                  )}
                >
                  <Icon icon={stop.icon} size={18} filled />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-label-lg text-on-surface-variant">
                    {stop.kind}
                    {stop.current && <span className="text-primary"> · Next stop</span>}
                  </p>
                  <p className="text-title-md text-on-surface mt-0.5">{stop.line1}</p>
                  <p className="text-body-lg text-on-surface">{stop.line2}</p>
                  <p className="text-body-md text-on-surface-variant mt-1">{stop.when}</p>
                  {stop.notes && stop.current && (
                    <p className="bg-surface-container text-body-md text-on-surface mt-2 rounded-md px-3 py-2">
                      {stop.notes}
                    </p>
                  )}
                  {stop.current && (
                    <span className="border-outline-variant text-label-lg text-on-surface mt-2 inline-flex h-8 items-center gap-1.5 rounded-sm border px-3 font-medium">
                      <Icon icon={directionsIcon} size={18} className="text-primary" />
                      Directions
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ol>
          {s.stage !== "ready" && s.stage !== "delivered" && (
            <section
              className={cn(
                "animate-enter rounded-lg border p-4 transition-colors duration-300",
                s.sharing
                  ? "border-primary bg-primary-container/35"
                  : "border-outline-variant bg-surface-container-low",
              )}
            >
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    "mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full",
                    s.sharing
                      ? "bg-primary text-on-primary"
                      : "bg-surface-container-highest text-on-surface-variant",
                  )}
                >
                  <Icon icon={s.sharing ? myLocationIcon : shareLocationIcon} size={22} />
                </span>
                <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
                  <span className="min-w-0">
                    <span className="text-body-lg text-on-surface block">Share live location</span>
                    <span className="text-body-md text-on-surface-variant block">
                      {s.sharing
                        ? "On. Updated just now · Screen stays on"
                        : "Off. The shipper won't see where you are."}
                    </span>
                  </span>
                  <span
                    data-demo="share"
                    className={cn(
                      "relative inline-flex h-8 w-[52px] shrink-0 items-center rounded-full border-2 transition-colors duration-200",
                      s.sharing ? "border-primary bg-primary" : "border-outline bg-surface-container-highest",
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-1/2 -translate-y-1/2 rounded-full transition-all duration-200",
                        s.sharing ? "bg-on-primary left-[22px] size-6" : "bg-outline left-[6px] size-4",
                      )}
                    />
                  </span>
                </div>
              </div>
            </section>
          )}
          {s.stage === "delivered" && (
            <section className="bg-success-container text-on-success-container animate-enter flex items-start gap-3 rounded-lg p-4">
              <Icon icon={checkCircleIcon} className="mt-0.5 shrink-0" />
              <p className="text-body-md">
                <span className="font-medium">Delivered.</span> Photos and signature are on the trip. Lone
                Star Auto Haul is paid after the shipper confirms, or automatically in 72 hours.
              </p>
            </section>
          )}
        </div>
        {step && (
          <div className="border-outline-variant bg-surface flex shrink-0 items-center gap-3 border-t px-4 py-3 @3xl:pr-8 @3xl:pl-2">
            <p className="text-body-md text-on-surface-variant hidden min-w-0 flex-1 @3xl:block">
              {step.hint}
            </p>
            <Button
              data-demo="next"
              size="lg"
              className="w-full @3xl:w-auto"
              leading={<Icon icon={step.icon} size={22} />}
            >
              {step.label}
            </Button>
          </div>
        )}
      </div>
      <Sheet
        open={s.sheet === "pickup"}
        title="Confirm pickup"
        description="Add photos of the shipment as loaded. The shipper sees them right away."
        actions={
          <>
            <Button variant="text">Cancel</Button>
            <Button data-demo="confirm-pickup">Confirm pickup</Button>
          </>
        }
      >
        <p className="text-title-sm text-on-surface mb-2">Pickup photos</p>
        <Photos count={s.photos} demo="add-photo" />
      </Sheet>
      <Sheet
        open={s.sheet === "delivery"}
        title="Confirm delivery"
        scroll="pod"
        actions={
          <>
            <Button variant="text">Cancel</Button>
            <Button data-demo="confirm-delivery">Confirm delivery</Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Field demo="recipient" label="Received by *" value={s.recipient} focused={focus === "recipient"} />
          <Photos count={s.podPhotos} demo="add-pod" />
          <div className="flex flex-col gap-2">
            <p className="text-title-sm text-on-surface">Recipient signature</p>
            <div
              data-demo="signature"
              className="border-outline relative h-32 overflow-hidden rounded-md border bg-white"
            >
              <svg
                viewBox="0 0 280 90"
                className="absolute inset-0 h-full w-full"
                preserveAspectRatio="xMidYMid meet"
              >
                <path
                  d={signature}
                  pathLength={1}
                  fill="none"
                  stroke="#1b1f27"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="1 1"
                  strokeDashoffset={1 - s.sig}
                />
              </svg>
              <span className="text-body-sm pointer-events-none absolute inset-x-6 bottom-5 border-b border-dashed border-neutral-400 pb-1 text-neutral-500">
                Sign here
              </span>
            </div>
          </div>
        </div>
      </Sheet>
      <Snackbar show={Boolean(s.toast)}>{s.toast}</Snackbar>
    </AppShell>
  );
}

export const driverTrip = defineScene<S>({
  id: "driverTrip",
  title: "Run the trip from a phone",
  summary:
    "A driver starts the trip, shares live location, confirms pickup with photos and delivery with a signature.",
  url: `/app/trips/${demoLoad.publicId}`,
  device: "phone",
  initial: {
    stage: "ready",
    sharing: false,
    sheet: "none",
    photos: 0,
    podPhotos: 0,
    recipient: "",
    sig: 0,
    toast: "",
  },
  View,
  script: ({ caption, click, type, tween, wait, scroll }) => [
    caption("Start the trip when you head to pickup"),
    click("next", { stage: "started", toast: "Trip started. The shipper knows you're on the way." }),
    wait(900),
    caption("Share live location with the shipper"),
    click("share", { sharing: true, toast: "" }),
    wait(800),
    caption("Confirm pickup with photos"),
    click("next", { sheet: "pickup" }),
    click("add-photo", { photos: 1 }),
    click("add-photo", { photos: 2 }),
    click("add-photo", { photos: 3 }),
    click("confirm-pickup", { sheet: "none", stage: "picked", toast: "Pickup confirmed" }),
    wait(900),
    caption("Deliver with the recipient's name, photos and signature"),
    click("next", { sheet: "delivery", toast: "" }),
    type("recipient", "Emily C."),
    click("add-pod", { podPhotos: 1 }),
    scroll("pod", "signature"),
    tween("sig", 1, 1500, { ease: "inOut" }),
    click("confirm-delivery", { sheet: "none", stage: "delivered", toast: "Delivery confirmed" }),
    wait(1800),
  ],
});
