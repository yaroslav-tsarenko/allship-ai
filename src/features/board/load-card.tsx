import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { calendarMonthIcon, checkCircleIcon, eastIcon, gavelIcon, timerIcon } from "@/components/ui/icons.generated";
import { StatusChip } from "@/components/ui/status-chip";
import { cn } from "@/lib/cn";
import { formatUsd } from "@/lib/money";
import { categoryLabel } from "@/server/loads/service";
import { formatWindow, keyDetails, place, timeLeft } from "./format";
import type { BoardLoad } from "./queries";

export function LoadCard({ load, now }: { load: BoardLoad; now: Date }) {
  const left = timeLeft(load.biddingClosesAt, now);
  const details = keyDetails(load.category, load.details);
  const from = place({ city: load.pickupCity, state: load.pickupState });
  const to = place({ city: load.dropoffCity, state: load.dropoffState });

  return (
    <article data-tour="board-load-card" className="relative h-full rounded-md border border-outline-variant bg-surface transition-colors duration-150 hover:border-outline focus-within:border-outline">
      <div className="flex flex-col gap-3 p-4 medium:p-5">
        <div className="flex items-center gap-2 text-label-md text-on-surface-variant">
          <span className="truncate">{categoryLabel(load.category)}</span>
          <span aria-hidden="true">·</span>
          <span className="shrink-0 tabular-nums">{load.publicId}</span>
          <span className={cn("ml-auto inline-flex shrink-0 items-center gap-1", left.urgent ? "text-error" : "text-on-surface-variant")}>
            <Icon icon={timerIcon} size={16} />
            {left.label}
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <h2 className="text-title-md text-on-surface">
            <Link href={`/app/board/${load.publicId}`} className="rounded-xs outline-none after:absolute after:inset-0 after:rounded-md focus-visible:after:outline-2 focus-visible:after:outline-primary">
              {load.title}
            </Link>
          </h2>
          <p className="flex flex-wrap items-center gap-x-2 text-body-lg text-on-surface">
            <span>{from}</span>
            <Icon icon={eastIcon} size={18} className="text-on-surface-variant" label="to" />
            <span>{to}</span>
            {load.distanceMiles ? <span className="text-body-md text-on-surface-variant">{Math.round(load.distanceMiles).toLocaleString("en-US")} mi</span> : null}
          </p>
        </div>

        <p className="inline-flex items-center gap-2 text-body-md text-on-surface-variant">
          <Icon icon={calendarMonthIcon} size={18} />
          Pickup {formatWindow(load.pickupStart, load.pickupEnd)}
        </p>

        {details.length > 0 && (
          <dl className="flex flex-wrap gap-x-5 gap-y-1 text-body-sm">
            {details.map((d) => (
              <div key={d.label} className="flex min-w-0 gap-1.5">
                <dt className="text-on-surface-variant">{d.label}</dt>
                <dd className="truncate text-on-surface">{d.value}</dd>
              </div>
            ))}
          </dl>
        )}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-outline-variant pt-3">
          {load.targetPriceCents ? (
            <p className="text-body-md text-on-surface-variant">
              Target <span className="text-title-md text-on-surface tabular-nums">{formatUsd(load.targetPriceCents, true)}</span>
            </p>
          ) : (
            <p className="text-body-md text-on-surface-variant">Open to offers</p>
          )}
          <p className="inline-flex items-center gap-1.5 text-body-md text-on-surface-variant">
            <Icon icon={gavelIcon} size={16} />
            {load.bids === 0 ? "No bids yet" : `${load.bids} ${load.bids === 1 ? "bid" : "bids"}`}
          </p>
          {load.myBidCents !== null && (
            <StatusChip tone="secondary" size="sm" icon={checkCircleIcon} className="ml-auto tabular-nums">
              Your bid {formatUsd(load.myBidCents, true)}
            </StatusChip>
          )}
        </div>
      </div>
    </article>
  );
}
