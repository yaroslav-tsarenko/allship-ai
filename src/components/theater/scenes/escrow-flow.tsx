import type { CSSProperties, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { checkCircleIcon, personIcon, taskAltIcon } from "@/components/ui/icons.generated";
import { formatUsd } from "@/lib/money";
import { cn } from "@/lib/cn";
import { defineScene } from "../define";
import { EscrowShield } from "../illustrations/shield";
import { Truck } from "../illustrations/truck";
import type { SceneViewProps } from "../types";
import { demoBids, split } from "./data";

type S = { pay: number; held: boolean; delivered: boolean; release: number; paid: boolean };

const bid = demoBids[1]!;
const m = split(bid.cents);

function Node({
  demo,
  art,
  title,
  line,
  active,
  children,
}: {
  demo?: string;
  art: ReactNode;
  title: string;
  line: string;
  active: boolean;
  children?: ReactNode;
}) {
  return (
    <div
      data-demo={demo}
      className={cn(
        "flex w-full max-w-[300px] flex-col items-center gap-2 rounded-lg p-4 text-center transition-colors duration-500 @3xl:w-[300px] @3xl:gap-3",
        active ? "bg-surface" : "bg-transparent",
      )}
    >
      <div className="flex h-[88px] items-center justify-center @3xl:h-[200px]">{art}</div>
      <p className="text-title-lg text-on-surface @3xl:text-headline-md">{title}</p>
      <p className="text-body-md text-on-surface-variant @3xl:text-body-xl tabular-nums">{line}</p>
      {children}
    </div>
  );
}

function Wire({ p, label, done }: { p: number; label: string; done: boolean }) {
  return (
    <div
      className="relative h-10 w-0.5 shrink-0 @3xl:h-0.5 @3xl:w-auto @3xl:flex-1"
      style={{ "--p": String(p) } as CSSProperties}
    >
      <span className="bg-outline-variant absolute inset-0" />
      <span className="bg-primary absolute top-0 left-0 h-[calc(var(--p)*100%)] w-full @3xl:h-full @3xl:w-[calc(var(--p)*100%)]" />
      {p > 0 && !done && (
        <span className="bg-primary text-label-lg text-on-primary shadow-elevation-2 absolute top-[calc(var(--p)*100%)] left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full px-3 py-1 font-medium whitespace-nowrap tabular-nums @3xl:top-1/2 @3xl:left-[calc(var(--p)*100%)]">
          {label}
        </span>
      )}
    </div>
  );
}

function View({ s }: SceneViewProps<S>) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-1 px-4 py-6 @3xl:flex-row @3xl:gap-0 @3xl:px-10">
      <Node
        active={s.pay < 1}
        title="Shipper"
        line={`Pays ${formatUsd(m.total)} when booking`}
        art={
          <span className="bg-secondary-container text-on-secondary-container flex size-16 items-center justify-center rounded-full @3xl:size-36">
            <Icon icon={personIcon} size={36} className="@3xl:size-16" />
          </span>
        }
      />
      <Wire p={s.pay} label={formatUsd(m.total)} done={s.held} />
      <Node
        demo="escrow"
        active={s.held && !s.paid}
        title="Escrow"
        line={
          s.paid
            ? `${formatUsd(m.fee)} service fee kept`
            : s.held
              ? `${formatUsd(m.total)} held during the trip`
              : "Waiting for payment"
        }
        art={<EscrowShield className="w-[96px] @3xl:w-[190px]" />}
      >
        {s.held && !s.delivered && (
          <Button
            data-demo="confirm"
            size="sm"
            variant="tonal"
            leading={<Icon icon={taskAltIcon} size={18} />}
            className="animate-enter mt-1"
          >
            Confirm delivery
          </Button>
        )}
        {s.delivered && (
          <span className="text-label-lg text-success animate-enter mt-1 inline-flex items-center gap-1.5">
            <Icon icon={checkCircleIcon} size={18} filled />
            Delivered · photos + signature
          </span>
        )}
      </Node>
      <Wire p={s.release} label={formatUsd(m.carrier)} done={s.paid} />
      <Node
        active={s.paid}
        title="Carrier"
        line={s.paid ? `Received ${formatUsd(m.carrier)}, 100% of the bid` : `Bid ${formatUsd(m.carrier)}`}
        art={<Truck className="w-[110px] @3xl:w-[230px]" />}
      />
    </div>
  );
}

export const escrowFlow = defineScene<S>({
  id: "escrowFlow",
  title: "How the money moves",
  summary:
    "The shipper pays the bid plus a 10% fee into escrow at booking. After delivery is confirmed, the carrier receives the full bid.",
  url: "",
  device: "desktop",
  frame: "bare",
  initial: { pay: 0, held: false, delivered: false, release: 0, paid: false },
  View,
  script: ({ caption, click, tween, set, wait, highlight }) => [
    caption("You pay the carrier's bid plus a 10% fee when you book"),
    wait(500),
    tween("pay", 1, 1600),
    set({ held: true }),
    caption("The money waits in escrow during the trip"),
    highlight("escrow", "Held with Stripe until delivery is confirmed. Neither side can take it early"),
    caption("Delivery is confirmed with photos and a signature"),
    click("confirm", { delivered: true }),
    wait(600),
    caption("The carrier receives 100% of their bid"),
    tween("release", 1, 1600),
    set({ paid: true }),
    wait(2200),
  ],
});
