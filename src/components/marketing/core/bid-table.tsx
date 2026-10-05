import { Icon } from "@/components/ui/icon";
import { verifiedIcon } from "@/components/ui/icons.generated";
import { cn } from "@/lib/cn";
import { feeBreakdown, formatUsd } from "./money";
import { ExampleTag } from "./status-chip";

const bids = [
  { carrier: "Carrier 3", bid: 118000, pickup: "Oct 14–15", delivery: "Oct 19", note: "Enclosed 26 ft truck, 2 movers" },
  { carrier: "Carrier 1", bid: 124000, pickup: "Oct 14", delivery: "Oct 17", note: "Dedicated truck, no stops" },
  { carrier: "Carrier 2", bid: 109500, pickup: "Oct 16–18", delivery: "Oct 23", note: "Shared load, flexible dates" },
];

export function BidTable({ className, caption = "Bids on a Columbus, OH to Charlotte, NC household load" }: { className?: string; caption?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-xl border border-outline-variant bg-surface", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant px-5 py-4">
        <p className="text-title-sm text-on-surface">{caption}</p>
        <ExampleTag />
      </div>
      <ul className="divide-y divide-outline-variant medium:hidden">
        {bids.map((b, i) => (
          <li key={b.carrier} className={cn("px-5 py-4", i === 0 && "bg-surface-container-low")}>
            <div className="flex items-baseline justify-between gap-4">
              <span className="flex items-center gap-1.5 text-title-sm text-on-surface">
                {b.carrier}
                <Icon icon={verifiedIcon} size={16} className="text-primary" label="FMCSA verified" />
              </span>
              <span className="font-mono text-title-sm text-on-surface">{formatUsd(b.bid)}</span>
            </div>
            <p className="mt-1 text-body-sm text-on-surface-variant">{b.note}</p>
            <p className="mt-2 flex flex-wrap justify-between gap-x-4 text-body-sm text-on-surface-variant">
              <span>Pickup {b.pickup} · Delivery by {b.delivery}</span>
              <span className="font-mono">You pay {formatUsd(feeBreakdown(b.bid).total)}</span>
            </p>
          </li>
        ))}
      </ul>
      <div className="hidden overflow-x-auto medium:block">
        <table className="w-full min-w-[440px] text-left text-body-md">
          <thead className="text-label-md text-on-surface-variant">
            <tr className="border-b border-outline-variant">
              <th scope="col" className="px-5 py-3 font-medium">Carrier</th>
              <th scope="col" className="px-3 py-3 text-right font-medium">Bid</th>
              <th scope="col" className="px-3 py-3 text-right font-medium">You pay</th>
              <th scope="col" className="px-5 py-3 font-medium">Dates</th>
            </tr>
          </thead>
          <tbody>
            {bids.map((b, i) => (
              <tr key={b.carrier} className={cn("border-b border-outline-variant last:border-b-0", i === 0 && "bg-surface-container-low")}>
                <th scope="row" className="px-5 py-4 font-normal">
                  <span className="flex items-center gap-1.5 text-title-sm text-on-surface">
                    {b.carrier}
                    <Icon icon={verifiedIcon} size={16} className="text-primary" label="FMCSA verified" />
                  </span>
                  <span className="block text-body-sm text-on-surface-variant">{b.note}</span>
                </th>
                <td className="px-3 py-4 text-right font-mono text-on-surface">{formatUsd(b.bid)}</td>
                <td className="px-3 py-4 text-right font-mono text-on-surface">{formatUsd(feeBreakdown(b.bid).total)}</td>
                <td className="px-5 py-4 text-body-sm whitespace-nowrap text-on-surface-variant">
                  <span className="block">Pickup {b.pickup}</span>
                  <span className="block">Delivery by {b.delivery}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
