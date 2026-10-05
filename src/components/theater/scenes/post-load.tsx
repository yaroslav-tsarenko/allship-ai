import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import {
  airportShuttleIcon,
  arrowBackIcon,
  arrowForwardIcon,
  calendarMonthIcon,
  checkIcon,
  directionsBoatIcon,
  directionsCarIcon,
  eastIcon,
  gavelIcon,
  locationOnIcon,
  rvHookupIcon,
  sailingIcon,
  searchIcon,
  tripOriginIcon,
  twoWheelerIcon,
} from "@/components/ui/icons.generated";
import { StatusChip } from "@/components/ui/status-chip";
import { cn } from "@/lib/cn";
import { defineScene } from "../define";
import type { SceneViewProps } from "../types";
import { demoLoad } from "./data";
import { AppShell, Field, PageTitle, Snackbar } from "./kit";

type S = {
  step: number;
  category: string | null;
  year: string;
  make: string;
  model: string;
  pickupCity: string;
  pickupState: string;
  pickupZip: string;
  dropoffCity: string;
  dropoffState: string;
  dropoffZip: string;
  date: string;
  posting: boolean;
  posted: boolean;
};

const steps = ["Category", "Details", "Route", "Review"];
const headings = ["What you're moving", "Details", "Pickup and delivery", "Review and post"];
const leads = [
  "Pick the closest match. You can change it later.",
  "The more carriers know, the closer their bids are to the final price.",
  "Exact addresses stay private until you book a carrier.",
  "Check everything once more. Carriers can bid as soon as you post.",
];

const vehicles = [
  {
    key: "car",
    name: "Car or light truck",
    summary: "Sedans, SUVs and pickups on open or enclosed trailers.",
    icon: directionsCarIcon,
  },
  {
    key: "moto",
    name: "Motorcycle",
    summary: "Street bikes, cruisers and dirt bikes.",
    icon: twoWheelerIcon,
  },
  {
    key: "boat",
    name: "Powerboat",
    summary: "On their own trailer or a hydraulic boat trailer.",
    icon: directionsBoatIcon,
  },
  {
    key: "sail",
    name: "Sailboat",
    summary: "Mast stepped down, transported on a cradle.",
    icon: sailingIcon,
  },
  {
    key: "rv",
    name: "RV",
    summary: "Motorhomes, travel trailers and fifth wheels.",
    icon: airportShuttleIcon,
  },
  { key: "trailer", name: "Trailer", summary: "Utility, cargo, horse and car trailers.", icon: rvHookupIcon },
];

function Stepper({ current }: { current: number }) {
  return (
    <div className="mb-6">
      <div className="@3xl:hidden">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-title-md text-on-surface">{steps[current]}</p>
          <p className="text-label-lg text-on-surface-variant tabular-nums">
            Step {current + 1} of {steps.length}
          </p>
        </div>
        <div className="bg-secondary-container mt-3 h-1 overflow-hidden rounded-full">
          <div
            className="bg-primary h-full rounded-full transition-[width] duration-500"
            style={{ width: `${Math.max((current / 3) * 100, 4)}%` }}
          />
        </div>
      </div>
      <ol className="hidden items-center @3xl:flex">
        {steps.map((label, i) => {
          const done = i < current;
          const on = i === current;
          return (
            <li key={label} className={cn("flex min-w-0 items-center", i < steps.length - 1 && "flex-1")}>
              <span className="flex min-w-0 items-center gap-3 py-1">
                <span
                  className={cn(
                    "text-label-lg flex size-8 shrink-0 items-center justify-center rounded-full font-medium transition-colors duration-200",
                    done && "bg-primary text-on-primary",
                    on && "bg-primary-container text-on-primary-container ring-primary ring-2",
                    !done && !on && "border-outline text-on-surface-variant border",
                  )}
                >
                  {done ? <Icon icon={checkIcon} size={18} /> : i + 1}
                </span>
                <span
                  className={cn("text-label-lg truncate", on ? "text-on-surface" : "text-on-surface-variant")}
                >
                  {label}
                </span>
              </span>
              {i < steps.length - 1 && (
                <span className="bg-outline-variant mx-3 h-px min-w-6 flex-1 overflow-hidden">
                  <span
                    className={cn(
                      "bg-primary block h-full origin-left transition-transform duration-500",
                      done ? "scale-x-100" : "scale-x-0",
                    )}
                  />
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function CategoryStep({ s }: { s: S }) {
  return (
    <div className="flex flex-col gap-5">
      <Field
        label="Search categories"
        value=""
        leading={<Icon icon={searchIcon} />}
        className="max-w-[480px]"
      />
      <section>
        <h3 className="text-title-sm text-on-surface-variant mb-3">Vehicles</h3>
        <ul className="grid grid-cols-1 gap-2 @3xl:grid-cols-2 @6xl:grid-cols-3">
          {vehicles.map((c) => {
            const on = s.category === c.key;
            return (
              <li key={c.key}>
                <span
                  data-demo={`cat-${c.key}`}
                  className={cn(
                    "state-layer flex h-full w-full items-start gap-3 rounded-md border p-3 text-left transition-colors duration-150",
                    on
                      ? "border-primary bg-primary-container text-on-primary-container"
                      : "border-outline-variant bg-surface text-on-surface",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-sm",
                      on
                        ? "bg-primary text-on-primary"
                        : "bg-secondary-container text-on-secondary-container",
                    )}
                  >
                    <Icon icon={c.icon} />
                  </span>
                  <span className="min-w-0">
                    <span className="text-title-sm block">{c.name}</span>
                    <span
                      className={cn(
                        "text-body-sm mt-0.5 line-clamp-2 block",
                        on ? "text-on-primary-container/80" : "text-on-surface-variant",
                      )}
                    >
                      {c.summary}
                    </span>
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function DetailsStep({ s, focus }: { s: S; focus: string | null }) {
  return (
    <div className="flex flex-col gap-7">
      <section>
        <h3 className="text-title-md text-on-surface">Vehicle</h3>
        <div className="mt-4 grid gap-x-4 gap-y-5 @3xl:grid-cols-2">
          <Field demo="year" label="Year *" value={s.year} focused={focus === "year"} />
          <Field demo="make" label="Make *" value={s.make} focused={focus === "make"} />
          <Field demo="model" label="Model *" value={s.model} focused={focus === "model"} />
          <Field label="Condition *" value="Runs and drives" select />
        </div>
      </section>
      <section>
        <h3 className="text-title-md text-on-surface">Transport</h3>
        <div className="mt-4 grid gap-x-4 gap-y-5 @3xl:grid-cols-2">
          <Field label="Trailer *" value="Open trailer" select />
        </div>
      </section>
    </div>
  );
}

function RouteStep({ s, focus }: { s: S; focus: string | null }) {
  const stop = (prefix: "pickup" | "dropoff") => {
    const pickup = prefix === "pickup";
    return (
      <fieldset className="flex flex-col gap-4">
        <legend className="text-title-md text-on-surface mb-3 flex items-center gap-2">
          <Icon
            icon={pickup ? tripOriginIcon : locationOnIcon}
            size={20}
            filled
            className={pickup ? "text-primary" : "text-tertiary"}
          />
          {pickup ? "Pickup" : "Delivery"}
        </legend>
        <div className="grid gap-x-4 gap-y-4 @3xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_140px]">
          <Field
            demo={`${prefix}City`}
            label="City *"
            value={pickup ? s.pickupCity : s.dropoffCity}
            focused={focus === `${prefix}City`}
          />
          <Field
            demo={`${prefix}State`}
            label="State *"
            value={pickup ? s.pickupState : s.dropoffState}
            select
          />
          <Field
            demo={`${prefix}Zip`}
            label="ZIP code *"
            value={pickup ? s.pickupZip : s.dropoffZip}
            focused={focus === `${prefix}Zip`}
          />
        </div>
        {pickup && (
          <div className="grid gap-x-4 gap-y-4 @3xl:grid-cols-2">
            <Field
              demo="date"
              label="Earliest pickup *"
              value={s.date}
              trailing={<Icon icon={calendarMonthIcon} size={20} />}
            />
            <Field
              label="Latest pickup"
              value={s.date ? "10/16/2026" : ""}
              trailing={<Icon icon={calendarMonthIcon} size={20} />}
            />
          </div>
        )}
      </fieldset>
    );
  };
  return (
    <div className="flex flex-col gap-7">
      {stop("pickup")}
      <div className="border-outline-variant border-t" />
      {stop("dropoff")}
    </div>
  );
}

function ReviewStep({ s }: { s: S }) {
  return (
    <div className="grid gap-6 @6xl:grid-cols-[minmax(0,1fr)_minmax(0,360px)]">
      <div className="flex flex-col gap-5">
        <Field label="Title *" value={`${s.year} ${s.make} ${s.model}`.trim()} />
        <div className="grid gap-x-4 gap-y-5 @3xl:grid-cols-2">
          <Field label="Target price" value="" leading={<span className="text-body-lg">$</span>} />
          <Field label="Accept bids for *" value="3 days" select />
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <section className="bg-surface-container-low rounded-md p-4">
          <h3 className="text-title-sm text-on-surface-variant mb-2">Load</h3>
          <p className="text-title-md text-on-surface flex items-center gap-2">
            <Icon icon={directionsCarIcon} size={20} className="text-on-surface-variant" />
            Car or light truck
          </p>
        </section>
        <section data-demo="review-route" className="bg-surface-container-low rounded-md p-4">
          <h3 className="text-title-sm text-on-surface-variant mb-2">Route</h3>
          <div className="text-body-md flex flex-col gap-2">
            <p className="flex items-start gap-2">
              <Icon icon={tripOriginIcon} size={18} filled className="text-primary mt-0.5 shrink-0" />
              <span>
                <span className="text-on-surface block">
                  {s.pickupCity}, {s.pickupState} {s.pickupZip}
                </span>
                <span className="text-on-surface-variant block">Oct 14 – Oct 16</span>
              </span>
            </p>
            <p className="flex items-start gap-2">
              <Icon icon={locationOnIcon} size={18} filled className="text-tertiary mt-0.5 shrink-0" />
              <span className="text-on-surface block">
                {s.dropoffCity}, {s.dropoffState} {s.dropoffZip}
              </span>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

function Posted() {
  return (
    <div className="flex flex-col gap-6 pt-2 @3xl:pt-4">
      <div>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 className="text-headline-sm text-on-surface @3xl:text-headline-md">{demoLoad.title}</h2>
          <span className="text-label-lg text-on-surface-variant font-mono">{demoLoad.publicId}</span>
        </div>
        <p className="text-body-lg text-on-surface mt-1 flex items-center gap-1.5">
          {demoLoad.from}
          <Icon icon={eastIcon} size={18} className="text-on-surface-variant" />
          {demoLoad.to}
          <span className="text-body-md text-on-surface-variant ml-1">{demoLoad.miles} mi</span>
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <StatusChip tone="primary" icon={gavelIcon}>
            Open for bids
          </StatusChip>
          <span className="text-body-md text-on-surface-variant">Bidding closes in 3 days</span>
        </div>
      </div>
      <section className="border-outline-variant rounded-md border">
        <h3 className="text-title-lg text-on-surface px-5 pt-4">Bids</h3>
        <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
          <span className="bg-secondary-container text-on-secondary-container flex size-12 items-center justify-center rounded-full">
            <Icon icon={gavelIcon} />
          </span>
          <p className="text-title-md text-on-surface">No bids yet</p>
          <p className="text-body-md text-on-surface-variant max-w-[44ch]">
            Verified carriers usually bid within a few hours. We&rsquo;ll email you as soon as one comes in.
          </p>
        </div>
      </section>
    </div>
  );
}

function View({ s, focus }: SceneViewProps<S>) {
  const step = s.step;
  return (
    <AppShell role="shipper" active="loads">
      <div data-demo-scroll="main" className="h-full overflow-hidden px-4 pb-6 @3xl:pr-8 @3xl:pl-2">
        {s.posted ? (
          <Posted />
        ) : (
          <>
            <PageTitle title="Post a load" />
            <Stepper current={step} />
            <h2 className="text-headline-sm text-on-surface mb-1">{headings[step]}</h2>
            <p className="text-body-lg text-on-surface-variant mb-6">{leads[step]}</p>
            {step === 0 && <CategoryStep s={s} />}
            {step === 1 && <DetailsStep s={s} focus={focus} />}
            {step === 2 && <RouteStep s={s} focus={focus} />}
            {step === 3 && <ReviewStep s={s} />}
            <div className="border-outline-variant mt-8 flex items-center gap-2 border-t py-3">
              {step > 0 ? (
                <Button variant="text" leading={<Icon icon={arrowBackIcon} size={20} />}>
                  Back
                </Button>
              ) : (
                <span />
              )}
              <span className="flex-1" />
              {step >= 2 && <Button variant={step === 3 ? "outlined" : "text"}>Save draft</Button>}
              {step === 3 ? (
                <Button data-demo="post" loading={s.posting}>
                  Post load
                </Button>
              ) : (
                (step > 0 || s.category) && (
                  <Button data-demo="continue" trailing={<Icon icon={arrowForwardIcon} size={20} />}>
                    Continue
                  </Button>
                )
              )}
            </div>
          </>
        )}
      </div>
      <Snackbar show={s.posted}>Posted. {demoLoad.publicId} is open for bids.</Snackbar>
    </AppShell>
  );
}

export const postLoad = defineScene<S>({
  id: "postLoad",
  title: "Post a load",
  summary:
    "A shipper posts a car from Dallas to Denver in four steps, and the load goes live for verified carriers.",
  url: (s) => (s.posted ? `/app/loads/${demoLoad.publicId}` : "/app/loads/new"),
  device: "desktop",
  initial: {
    step: 0,
    category: null,
    year: "",
    make: "",
    model: "",
    pickupCity: "",
    pickupState: "",
    pickupZip: "",
    dropoffCity: "",
    dropoffState: "",
    dropoffZip: "",
    date: "",
    posting: false,
    posted: false,
  },
  View,
  script: ({ caption, click, type, set, wait, highlight, scroll }) => [
    caption("Pick what you're shipping from 23 categories"),
    click("cat-car", { category: "car" }),
    click("continue", { step: 1 }),
    scroll("main", 0, { ms: 300 }),
    caption("Add the details carriers price on"),
    type("year", "2021"),
    type("make", "Toyota"),
    type("model", "RAV4"),
    click("continue", { step: 2 }),
    scroll("main", 0, { ms: 300 }),
    caption("Enter the route: Dallas, TX to Denver, CO"),
    type("pickupCity", "Dallas"),
    click("pickupState", { pickupState: "TX" }),
    type("pickupZip", "75201"),
    click("date", { date: "10/14/2026" }),
    type("dropoffCity", "Denver"),
    click("dropoffState", { dropoffState: "CO" }),
    type("dropoffZip", "80202"),
    click("continue", { step: 3 }),
    scroll("main", 0),
    caption("Review and post. Carriers can bid right away"),
    highlight(
      "review-route",
      "Bidders see the city and ZIP area. Street addresses stay private until you book",
    ),
    click("post", { posting: true }),
    wait(700),
    set({ posting: false, posted: true }),
    wait(1600),
  ],
});
