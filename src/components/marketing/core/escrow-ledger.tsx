import { site } from "@/content/site";
import { cn } from "@/lib/cn";
import { feeBreakdown, formatUsd } from "./money";
import { ExampleTag, StatusChip, type LoadStatusTone } from "./status-chip";

type Entry = { label: string; detail: string; tone: LoadStatusTone; status: string; amount?: string };

export function EscrowLedger({ bidCents = 120000, loadLabel = "Household goods, 2 bedrooms", className }: { bidCents?: number; loadLabel?: string; className?: string }) {
  const { bid, fee, total } = feeBreakdown(bidCents);
  const entries: Entry[] = [
    { label: "Bid accepted, card charged", detail: "Stripe holds the full amount", tone: "booked", status: "Held in escrow", amount: formatUsd(total) },
    { label: "Picked up", detail: "Driver uploads pickup photos", tone: "in_transit", status: "In transit" },
    { label: "Delivered", detail: "Proof of delivery photo and signature", tone: "delivered", status: "Delivered" },
    { label: "Confirmed", detail: `By you, or automatically after ${site.autoConfirmHours} hours`, tone: "completed", status: "Completed" },
    { label: "Released to carrier", detail: "Transfer to the carrier's Stripe account", tone: "completed", status: "Paid out", amount: formatUsd(bid) },
  ];

  return (
    <div className={cn("rounded-xl bg-surface-container-low p-5 medium:p-7", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-label-md text-on-surface-variant">LOAD AS-20481</p>
          <p className="mt-1 text-title-md text-on-surface">{loadLabel}</p>
        </div>
        <ExampleTag />
      </div>
      <dl className="mt-6 grid grid-cols-[1fr_auto] gap-x-6 gap-y-2 border-b border-outline-variant pb-5 text-body-lg">
        <dt className="text-on-surface-variant">Carrier&rsquo;s bid</dt>
        <dd className="text-right font-mono text-on-surface">{formatUsd(bid)}</dd>
        <dt className="text-on-surface-variant">AllShip service fee ({site.platformFeePercent}%)</dt>
        <dd className="text-right font-mono text-on-surface">{formatUsd(fee)}</dd>
        <dt className="text-title-md text-on-surface">You pay</dt>
        <dd className="text-right font-mono text-title-md text-on-surface">{formatUsd(total)}</dd>
      </dl>
      <ol className="mt-5 flex flex-col">
        {entries.map((e, i) => (
          <li key={e.label} className="relative grid grid-cols-[20px_1fr] gap-x-4 pb-5 last:pb-0">
            <span aria-hidden className="relative flex justify-center">
              <span className={cn("mt-1.5 size-2.5 rounded-full", i === entries.length - 1 ? "bg-success" : "bg-primary")} />
              {i < entries.length - 1 && <span className="absolute top-5 bottom-[-4px] w-px bg-outline-variant" />}
            </span>
            <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
              <div className="min-w-0">
                <p className="text-title-sm text-on-surface">{e.label}</p>
                <p className="text-body-md text-on-surface-variant">{e.detail}</p>
              </div>
              <div className="flex items-center gap-3">
                {e.amount && <span className="font-mono text-label-lg text-on-surface">{e.amount}</span>}
                <StatusChip tone={e.tone}>{e.status}</StatusChip>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
