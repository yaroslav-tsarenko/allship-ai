import { Icon } from "@/components/ui/icon";
import { eastIcon } from "@/components/ui/icons.generated";
import { feeBreakdown, formatUsd } from "@/components/marketing/core/money";
import { site } from "@/content/site";
import { cn } from "@/lib/cn";

export function PayoutLedger({ bidCents, route, className, compact = false }: { bidCents: number; route?: [string, string]; className?: string; compact?: boolean }) {
  const { bid, fee, total } = feeBreakdown(bidCents);
  return (
    <figure className={cn("rounded-lg bg-surface-container-lowest p-5 text-on-surface shadow-elevation-2 ring-1 ring-outline-variant", className)}>
      <figcaption className="flex items-center justify-between gap-3 text-label-lg text-on-surface-variant">
        <span className="font-medium">Example bid</span>
        {route && (
          <span className="flex items-center gap-1 truncate">
            {route[0]}
            <Icon icon={eastIcon} size={16} label="to" />
            {route[1]}
          </span>
        )}
      </figcaption>
      <dl className={cn("mt-4 grid grid-cols-[1fr_auto] gap-x-6 font-mono tabular-nums", compact ? "gap-y-2 text-body-md" : "gap-y-3 text-body-lg")}>
        <dt className="font-sans text-on-surface-variant">Your bid</dt>
        <dd className="text-right">{formatUsd(bid)}</dd>
        <dt className="font-sans text-on-surface-variant">Service fee {site.platformFeePercent}%, paid by the shipper</dt>
        <dd className="text-right text-on-surface-variant">+{formatUsd(fee)}</dd>
        <dt className="font-sans text-on-surface-variant">Shipper pays into escrow</dt>
        <dd className="text-right text-on-surface-variant">{formatUsd(total)}</dd>
        <dt className={cn("border-t border-outline-variant pt-3 font-sans text-on-surface", compact ? "text-title-md" : "text-title-lg")}>You receive</dt>
        <dd className={cn("border-t border-outline-variant pt-3 text-right text-primary", compact ? "text-title-md" : "text-title-lg")}>{formatUsd(bid)}</dd>
      </dl>
    </figure>
  );
}
