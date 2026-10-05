import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { chevronRightIcon, eastIcon } from "@/components/ui/icons.generated";
import { StatusChip, type StatusTone } from "@/components/ui/status-chip";
import { formatDay, place } from "@/features/board/format";
import { formatUsd } from "@/lib/money";
import type { LoadStop } from "@/server/db/schema/loads";
import { categoryLabel } from "@/server/loads/service";

export type CarrierBidRow = {
  id: string;
  status: "active" | "accepted" | "withdrawn" | "declined" | "expired";
  amountCents: number;
  createdAt: Date;
  estimatedPickupAt: Date | null;
  loadPublicId: string;
  loadTitle: string;
  loadStatus: string;
  category: Parameters<typeof categoryLabel>[0];
  pickup: LoadStop;
  dropoff: LoadStop;
};

const bidStatus: Record<CarrierBidRow["status"], { label: string; tone: StatusTone }> = {
  active: { label: "Active", tone: "secondary" },
  accepted: { label: "Won", tone: "success" },
  withdrawn: { label: "Withdrawn", tone: "neutral" },
  declined: { label: "Not selected", tone: "neutral" },
  expired: { label: "Expired", tone: "neutral" },
};

function statusFor(row: CarrierBidRow) {
  if (row.status === "active" && row.loadStatus === "awaiting_payment") return { label: "Shipper is paying", tone: "tertiary" as const };
  return bidStatus[row.status];
}

export function BidRow({ row }: { row: CarrierBidRow }) {
  const status = statusFor(row);
  const linkable = row.status === "accepted" || row.loadStatus === "open" || row.loadStatus === "awaiting_payment";
  const body = (
    <>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="truncate text-title-md text-on-surface">{row.loadTitle}</span>
          <StatusChip tone={status.tone} size="sm">
            {status.label}
          </StatusChip>
        </div>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-body-md text-on-surface-variant">
          <span>{place(row.pickup)}</span>
          <Icon icon={eastIcon} size={16} label="to" />
          <span>{place(row.dropoff)}</span>
        </p>
        <p className="mt-0.5 text-body-sm text-on-surface-variant">
          {categoryLabel(row.category)} · {row.loadPublicId} · Bid {formatDay(row.createdAt)}
          {row.estimatedPickupAt ? ` · Pickup ${formatDay(row.estimatedPickupAt)}` : ""}
        </p>
      </div>
      <p className="shrink-0 text-title-md text-on-surface tabular-nums">{formatUsd(row.amountCents, true)}</p>
      {linkable && <Icon icon={chevronRightIcon} className="hidden shrink-0 text-on-surface-variant medium:block" />}
    </>
  );
  const cls = "flex items-center gap-4 px-4 py-4 medium:px-6";
  return linkable ? (
    <Link href={`/app/board/${row.loadPublicId}`} className={`state-layer ${cls}`}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}
