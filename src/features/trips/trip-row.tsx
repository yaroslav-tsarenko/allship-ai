import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { chevronRightIcon, eastIcon, personIcon } from "@/components/ui/icons.generated";
import { formatWindow, place } from "@/features/board/format";
import { LoadStatusChip } from "@/features/loads/load-status-chip";
import { categoryIcons } from "@/features/loads/presentation";
import type { TripListRow } from "./queries";

export function TripRow({ row, showDriver }: { row: TripListRow; showDriver: boolean }) {
  const nextStop = row.status === "in_transit" || row.status === "delivered" ? row.dropoff : row.pickup;
  const nextLabel = row.status === "in_transit" ? "Deliver" : row.status === "delivered" || row.status === "completed" ? "Delivered" : "Pickup";
  return (
    <Link href={`/app/trips/${row.publicId}`} className="state-layer flex items-center gap-4 px-4 py-4 medium:px-6">
      <span aria-hidden="true" className="hidden size-10 shrink-0 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container medium:flex">
        <Icon icon={categoryIcons[row.category]} size={22} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="truncate text-title-md text-on-surface">{row.title}</span>
          <LoadStatusChip status={row.status} size="sm" />
        </div>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-body-md text-on-surface">
          <span>{place(row.pickup)}</span>
          <Icon icon={eastIcon} size={16} label="to" className="text-on-surface-variant" />
          <span>{place(row.dropoff)}</span>
        </p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-body-sm text-on-surface-variant">
          <span>{row.publicId}</span>
          <span aria-hidden="true">·</span>
          <span>
            {nextLabel} {formatWindow(nextStop.windowStart, nextStop.windowEnd)}
          </span>
          {showDriver && (
            <>
              <span aria-hidden="true">·</span>
              <span className={row.driverName ? "inline-flex items-center gap-1" : "inline-flex items-center gap-1 font-medium text-error"}>
                <Icon icon={personIcon} size={14} />
                {row.driverName ?? "No driver yet"}
              </span>
            </>
          )}
        </p>
      </div>
      <Icon icon={chevronRightIcon} className="shrink-0 text-on-surface-variant" />
    </Link>
  );
}
