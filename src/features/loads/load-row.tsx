import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { calendarMonthIcon, chevronRightIcon, eastIcon } from "@/components/ui/icons.generated";
import { formatUsd } from "@/lib/money";
import type { LoadCategory, LoadStatus } from "@/server/db/schema/enums";
import { categoryLabel } from "@/server/loads/service";
import { LoadStatusChip } from "./load-status-chip";
import { categoryIcons, cityState, formatWindow, timeLeft } from "./presentation";

type Stop = { city?: string; state?: string; windowStart?: string; windowEnd?: string };

export type LoadRowData = {
  publicId: string;
  title: string;
  category: LoadCategory;
  status: LoadStatus;
  pickup: Stop;
  dropoff: Stop;
  biddingClosesAt: Date | null;
  bids: number;
  lowestBidCents: number | null;
};

export function LoadRow({ row }: { row: LoadRowData }) {
  const href = row.status === "draft" ? `/app/loads/${row.publicId}/edit` : `/app/loads/${row.publicId}`;
  const closing = row.status === "open" ? timeLeft(row.biddingClosesAt) : null;
  return (
    <Link href={href} className="state-layer group flex items-start gap-4 px-4 py-4 medium:items-center medium:px-6">
      <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-md bg-secondary-container text-on-secondary-container medium:mt-0 medium:size-12">
        <Icon icon={categoryIcons[row.category]} />
      </span>
      <span className="grid min-w-0 flex-1 gap-1 medium:grid-cols-[minmax(0,1fr)_auto] medium:gap-x-6">
        <span className="min-w-0">
          <span className="flex flex-wrap items-baseline gap-x-2">
            <span className="truncate text-title-md text-on-surface">{row.title}</span>
            <span className="font-mono text-label-md text-on-surface-variant">{row.publicId}</span>
          </span>
          <span className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-body-md text-on-surface-variant">
            <span className="text-on-surface">{cityState(row.pickup)}</span>
            <Icon icon={eastIcon} size={16} className="shrink-0" />
            <span className="text-on-surface">{cityState(row.dropoff)}</span>
          </span>
          <span className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-body-sm text-on-surface-variant">
            <span>{categoryLabel(row.category)}</span>
            <span className="inline-flex items-center gap-1">
              <Icon icon={calendarMonthIcon} size={14} />
              Pickup {formatWindow(row.pickup)}
            </span>
            {closing && <span>{closing}</span>}
          </span>
        </span>
        <span className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 medium:mt-0 medium:flex-col medium:items-end medium:gap-1.5">
          <LoadStatusChip status={row.status} size="sm" />
          {(row.status === "open" || row.status === "awaiting_payment" || row.status === "expired") && (
            <span className="text-body-md text-on-surface-variant tabular-nums">
              {row.bids === 0 ? (
                "No bids yet"
              ) : (
                <>
                  <span className="text-on-surface">{row.bids}</span> {row.bids === 1 ? "bid" : "bids"}
                  {row.lowestBidCents !== null && (
                    <>
                      {" "}
                      · from <span className="font-medium text-on-surface">{formatUsd(row.lowestBidCents, true)}</span>
                    </>
                  )}
                </>
              )}
            </span>
          )}
        </span>
      </span>
      <Icon icon={chevronRightIcon} className="mt-2.5 hidden shrink-0 text-on-surface-variant medium:mt-0 medium:block" />
    </Link>
  );
}
