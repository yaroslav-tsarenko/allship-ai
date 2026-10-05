import { Icon } from "@/components/ui/icon";
import { calendarMonthIcon, pinDropIcon, tripOriginIcon } from "@/components/ui/icons.generated";
import { cn } from "@/lib/cn";

export function BidPreview({ className }: { className?: string }) {
  return (
    <figure className={cn("m-0", className)}>
      <div className="rounded-xl border border-outline-variant bg-surface p-5 shadow-elevation-1 medium:p-7" aria-hidden="true">
        <div className="flex items-center justify-between gap-4">
          <span className="rounded-sm bg-primary-container px-2.5 py-1 text-label-md text-on-primary-container">Open</span>
          <span className="font-mono text-label-md text-on-surface-variant">Household move</span>
        </div>
        <ol className="mt-5 flex flex-col gap-3">
          <li className="flex items-center gap-3 text-title-md text-on-surface">
            <Icon icon={tripOriginIcon} size={20} className="text-primary" />
            Columbus, OH
          </li>
          <li className="flex items-center gap-3 text-title-md text-on-surface">
            <Icon icon={pinDropIcon} size={20} className="text-primary" />
            Nashville, TN
          </li>
          <li className="flex items-center gap-3 text-body-md text-on-surface-variant">
            <Icon icon={calendarMonthIcon} size={20} />
            Pickup window set by the shipper
          </li>
        </ol>
        <div className="mt-6 grid gap-3 border-t border-outline-variant pt-6 medium:grid-cols-2">
          <div className="rounded-xs border border-outline px-4 py-2.5">
            <span className="block text-body-sm text-on-surface-variant">Your price</span>
            <span className="block font-mono text-body-lg text-on-surface">$ —</span>
          </div>
          <div className="rounded-xs border border-outline px-4 py-2.5">
            <span className="block text-body-sm text-on-surface-variant">Estimated delivery</span>
            <span className="block text-body-lg text-on-surface">Date and time</span>
          </div>
          <div className="rounded-xs border border-outline px-4 py-2.5 medium:col-span-2">
            <span className="block text-body-sm text-on-surface-variant">Message to the shipper</span>
            <span className="block text-body-lg text-on-surface-variant">Equipment, crew size, what is included…</span>
          </div>
        </div>
        <div className="mt-5 flex justify-end">
          <span className="inline-flex h-10 items-center rounded-full bg-primary px-6 text-label-lg font-medium text-on-primary">Submit bid</span>
        </div>
      </div>
      <figcaption className="mt-3 text-body-sm text-on-surface-variant">The bid form on an open load. Route and category are sample values.</figcaption>
    </figure>
  );
}
