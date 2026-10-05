import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { addIcon, chevronRightIcon, closeIcon, shieldLockIcon } from "@/components/ui/icons.generated";
import { cn } from "@/lib/cn";
import { defineScene } from "../define";
import type { SceneViewProps } from "../types";
import { AppShell, PageTitle } from "./kit";

type S = { step: number };

const tour = [
  { title: "Hi, I'm your AllShip AI assistant", body: "Let me show you around. It takes about a minute, and you can stop any time with Esc." },
  { title: "Your loads at a glance", body: "Active loads, bids waiting for you and drafts. Select a number to jump straight to that list." },
  { title: "Post a load", body: "Tell us what you're shipping and where. Verified carriers usually start bidding within a few hours." },
  { title: "Finish setting up", body: "Turn on 2-Step Verification to protect your payments. It takes two minutes." },
  { title: "I'm always one tap away", body: "Ask me to draft a load, check your bids or explain a fee. You review everything before it's posted." },
];

function Popover({ step, className }: { step: number; className?: string }) {
  const t = tour[step]!;
  const last = step === tour.length - 1;
  return (
    <div
      key={step}
      className={cn(
        "bg-surface-container-high text-on-surface shadow-elevation-3 animate-enter absolute z-50 w-[300px] max-w-[calc(100cqw-32px)] rounded-[28px] px-6 pt-5 pb-4",
        className,
      )}
    >
      <span className="text-on-surface-variant absolute top-2 right-2 inline-flex size-10 items-center justify-center rounded-full">
        <Icon icon={closeIcon} size={20} />
      </span>
      <p className="text-label-md text-primary pr-8 font-medium tracking-wide">AllShip AI tour</p>
      <p className="text-title-md mt-1 pr-8">{t.title}</p>
      <p className="text-body-md text-on-surface-variant mt-1">{t.body}</p>
      <div className="mt-5 flex items-center gap-2">
        <span className="text-label-md text-on-surface-variant font-medium tabular-nums">
          {step + 1} of {tour.length}
        </span>
        <span className="flex-1" />
        {step > 0 && <span className="text-label-lg text-primary inline-flex h-10 items-center px-3 font-medium">Back</span>}
        <span
          data-demo="tour-next"
          className="bg-primary text-on-primary text-label-lg inline-flex h-10 items-center rounded-full px-4 font-medium"
        >
          {last ? "Done" : "Next"}
        </span>
      </div>
    </div>
  );
}

function Spot({ on, children, className }: { on: boolean; children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "relative rounded-md transition-shadow duration-300",
        on && "bg-surface z-40 shadow-[0_0_0_6px_var(--md-surface),0_0_0_8px_var(--md-primary)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

function View({ s }: SceneViewProps<S>) {
  const step = s.step;
  const active = step >= 0 && step < tour.length;
  return (
    <div
      className={cn(
        "relative h-full",
        step === 4 &&
          "[&_[data-demo=assistant-btn]]:bg-surface [&_[data-demo=assistant-btn]]:relative [&_[data-demo=assistant-btn]]:z-40 [&_[data-demo=assistant-btn]]:shadow-[0_0_0_4px_var(--md-surface),0_0_0_6px_var(--md-primary)]",
      )}
    >
      <AppShell role="shipper" active="home">
        <div className="h-full overflow-hidden px-4 pb-6 @3xl:pr-8 @3xl:pl-2">
          <PageTitle title="Welcome, Emily" sub="Here's where your shipments live." />
          <Spot on={step === 1}>
            <div data-demo="summary" className="border-outline-variant divide-outline-variant grid grid-cols-3 divide-x rounded-md border">
              {[
                ["Active", "1"],
                ["Bids waiting", "4"],
                ["Drafts", "0"],
              ].map(([k, v]) => (
                <div key={k} className="px-4 py-4">
                  <p className="text-body-md text-on-surface-variant">{k}</p>
                  <p className="text-headline-md text-on-surface mt-1 tabular-nums">{v}</p>
                </div>
              ))}
            </div>
            {step === 1 && <Popover step={1} className="top-full left-0 mt-4" />}
          </Spot>
          <div className="mt-6 flex flex-wrap items-start gap-2">
            <Spot on={step === 2} className="rounded-full">
              <Button data-demo="post" leading={<Icon icon={addIcon} size={20} />}>
                Post a load
              </Button>
              {step === 2 && <Popover step={2} className="top-full left-0 mt-4" />}
            </Spot>
            <Button variant="outlined">Instant moving prices</Button>
          </div>
          <Spot on={step === 3} className="mt-6">
            <div className="border-outline-variant flex items-center gap-3 rounded-md border px-4 py-3">
              <Icon icon={shieldLockIcon} className="text-primary shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-title-sm text-on-surface">Turn on 2-Step Verification</p>
                <p className="text-body-md text-on-surface-variant truncate">Protects payments and payouts</p>
              </div>
              <Icon icon={chevronRightIcon} className="text-on-surface-variant shrink-0" />
            </div>
            {step === 3 && <Popover step={3} className="bottom-full left-0 mb-4" />}
          </Spot>
        </div>
      </AppShell>
      <div
        className={cn(
          "bg-scrim/50 pointer-events-none absolute inset-0 z-30 transition-opacity duration-300",
          active ? "opacity-100" : "opacity-0",
        )}
      />
      {step === 0 && <Popover step={0} className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />}
      {step === 4 && <Popover step={4} className="top-16 right-3" />}
    </div>
  );
}

export const guidedTour = defineScene<S>({
  id: "guidedTour",
  title: "Guided tours",
  summary:
    "The assistant walks a new shipper through the dashboard one element at a time, using the same tour that runs in the app.",
  url: "/app",
  device: "desktop",
  initial: { step: 0 },
  end: { step: 5 },
  View,
  script: ({ caption, click, wait }) => [
    caption("New accounts get a one-minute tour"),
    wait(1400),
    click("tour-next", { step: 1 }),
    caption("Each step points at the real control"),
    wait(1600),
    click("tour-next", { step: 2 }),
    wait(1600),
    click("tour-next", { step: 3 }),
    caption("Tours exist for posting, comparing bids, the load board and trips"),
    wait(1600),
    click("tour-next", { step: 4 }),
    wait(1600),
    caption("Restart any tour later from Settings or by asking the assistant"),
    click("tour-next", { step: 5 }),
    wait(1500),
  ],
});
