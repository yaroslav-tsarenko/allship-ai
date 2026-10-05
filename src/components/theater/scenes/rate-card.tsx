import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { boltIcon, checkCircleIcon } from "@/components/ui/icons.generated";
import { formatUsd } from "@/lib/money";
import { cn } from "@/lib/cn";
import { priceMove, type RateTier } from "@/features/moving/pricing";
import { defineScene } from "../define";
import type { SceneViewProps } from "../types";
import { split } from "./data";
import { AppShell, Field, PageTitle, Snackbar } from "./kit";

type S = { on: boolean; rate: string; miles: string; saved: boolean };

const baseTiers: [number, number, number][] = [
  [0, 150, 260],
  [151, 1500, 0],
];

const volume = 600;

function tiersFor(rate: string): RateTier[] {
  const cents = Math.round(Number(rate || "0") * 100);
  return baseTiers.map(([fromMiles, toMiles, r], i) => ({ fromMiles, toMiles, ratePerCuFtCents: i === 1 ? cents : r }));
}

function Toggle({ on }: { on: boolean }) {
  return (
    <span
      data-demo="iq-switch"
      className={cn(
        "relative inline-flex h-8 w-[52px] shrink-0 items-center rounded-full border-2 transition-colors duration-200",
        on ? "border-primary bg-primary" : "border-outline bg-surface-container-highest",
      )}
    >
      <span
        className={cn(
          "absolute flex items-center justify-center rounded-full transition-all duration-200",
          on ? "bg-on-primary text-primary left-[22px] size-6" : "bg-outline left-1.5 size-4",
        )}
      >
        {on && <Icon icon={checkCircleIcon} size={16} filled />}
      </span>
    </span>
  );
}

function Preview({ s }: { s: S }) {
  const miles = Number(s.miles || "0");
  const q = priceMove(tiersFor(s.rate), null, { volumeCuFt: volume, miles, packing: "none", unpacking: false, storageMonths: 0 });
  const m = q ? split(q.carrierCents) : null;
  return (
    <section data-demo="preview" className="bg-surface-container-low rounded-md p-4 @3xl:p-5">
      <h3 className="text-title-md text-on-surface">Preview</h3>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <Field label="Home size" value="2 bedrooms · 600 ft³" select className="[--field-bg:var(--md-surface-container-low)]" />
        <Field demo="miles" label="Distance, mi" value={s.miles} focused={false} className="[--field-bg:var(--md-surface-container-low)]" />
      </div>
      <p className="text-body-md text-on-surface mt-4 text-pretty @3xl:text-body-lg">
        {!q || !m
          ? "No range covers this distance yet, so this move gets no instant quote from you."
          : `A 2-bedroom move of ${miles.toLocaleString("en-US")} miles would quote ${formatUsd(m.carrier)}. You receive all of it; the shipper pays ${formatUsd(m.total)} with the 10% service fee.`}
      </p>
    </section>
  );
}

function View({ s, focus }: SceneViewProps<S>) {
  const tiers = tiersFor(s.rate);
  return (
    <AppShell role="owner" active="settings" user="Rita M.">
      <div className="h-full overflow-hidden px-4 pb-6 @3xl:pr-8 @3xl:pl-2">
        <PageTitle title="Instant quote rates" />
        <div className="flex flex-col gap-3 @3xl:gap-4">
          <section className="border-outline-variant flex items-start gap-4 rounded-md border p-4">
            <span className="min-w-0 flex-1">
              <span className="text-title-md text-on-surface flex items-center gap-2">
                <Icon icon={boltIcon} size={20} className="text-primary" />
                Show my instant quotes
              </span>
              <span className="text-body-sm text-on-surface-variant mt-1 block">
                Shippers see your price next to other movers, sorted by total.
              </span>
            </span>
            <Toggle on={s.on} />
          </section>
          <section className={cn("border-outline-variant rounded-md border p-4 transition-opacity duration-300", s.on ? "opacity-100" : "opacity-50")}>
            <h3 className="text-title-md text-on-surface">Rate per cubic foot by distance</h3>
            <div className="mt-3 flex flex-col gap-2">
              {tiers.map((t, i) => (
                <div key={t.fromMiles} className="grid grid-cols-[1fr_1fr_1.2fr] gap-2">
                  <Field label="From, mi" value={String(t.fromMiles)} />
                  <Field label="To, mi" value={t.toMiles.toLocaleString("en-US")} />
                  <Field
                    demo={i === 1 ? "rate" : undefined}
                    label="Rate per ft³"
                    leading="$"
                    value={i === 1 ? s.rate : (t.ratePerCuFtCents / 100).toFixed(2)}
                    focused={i === 1 && focus === "rate"}
                  />
                </div>
              ))}
            </div>
          </section>
          <Preview s={s} />
          <div className="flex justify-end">
            <Button data-demo="save" size="lg">
              Save rates
            </Button>
          </div>
        </div>
      </div>
      <Snackbar show={s.saved}>
        <Icon icon={checkCircleIcon} size={20} />
        Rates saved. Shippers can book you instantly.
      </Snackbar>
    </AppShell>
  );
}

export const rateCard = defineScene<S>({
  id: "rateCard",
  title: "Instant quote rates",
  summary:
    "A carrier turns on instant quotes, sets a rate per cubic foot by distance and previews what a move would pay before saving.",
  url: "/app/settings/pricing",
  device: "desktop",
  initial: { on: false, rate: "", miles: "640", saved: false },
  View,
  script: ({ caption, click, type, wait, highlight }) => [
    caption("Turn on instant quotes for the moving page"),
    click("iq-switch", { on: true }),
    wait(500),
    caption("Set your rate per cubic foot for each distance range"),
    type("rate", "3.10"),
    wait(400),
    caption("Preview exactly what a move would pay you"),
    highlight("preview", "You receive the full quote. The shipper pays the 10% fee on top"),
    caption("Save. Shippers can book you at that price"),
    click("save", { saved: true }),
    wait(1800),
  ],
});
