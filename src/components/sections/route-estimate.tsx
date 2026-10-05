import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { tripOriginIcon, locationOnIcon } from "@/components/ui/icons.generated";

export type RouteEstimateProps = { origin: string; destination: string; distance?: string; priceLabel?: string; note?: string; cta?: { label: string; href: string } };

export function RouteEstimate({ origin, destination, distance, priceLabel, note, cta = { label: "Rent Truck", href: "/rent-truck" } }: RouteEstimateProps) {
  return (
    <article className="flex flex-col rounded-lg bg-surface-container-low p-5" aria-label={`${origin} to ${destination}`}>
      <ol className="relative flex flex-col gap-5 pl-9">
        <span aria-hidden="true" className="absolute top-3 bottom-3 left-[11px] border-l-2 border-dashed border-outline" />
        <li className="relative">
          <Icon icon={tripOriginIcon} size={24} className="absolute top-0 -left-9 bg-surface-container-low text-primary" />
          <span className="block text-label-md text-on-surface-variant">From</span>
          <span className="block text-title-md text-on-surface">{origin}</span>
        </li>
        <li className="relative">
          <Icon icon={locationOnIcon} filled size={24} className="absolute top-0 -left-9 bg-surface-container-low text-primary" />
          <span className="block text-label-md text-on-surface-variant">To</span>
          <span className="block text-title-md text-on-surface">{destination}</span>
        </li>
      </ol>
      {(distance || priceLabel) && (
        <dl className="mt-5 flex flex-wrap gap-x-6 gap-y-2 border-t border-outline-variant pt-4">
          {distance && (
            <div>
              <dt className="text-label-md text-on-surface-variant">Distance</dt>
              <dd className="text-title-md text-on-surface">{distance}</dd>
            </div>
          )}
          {priceLabel && (
            <div>
              <dt className="text-label-md text-on-surface-variant">Price</dt>
              <dd className="text-title-md text-on-surface">{priceLabel}</dd>
            </div>
          )}
        </dl>
      )}
      {note && <p className="mt-3 text-body-sm text-on-surface-variant">{note}</p>}
      <Button asChild variant="tonal" className="mt-5 self-start">
        <Link href={cta.href}>{cta.label}</Link>
      </Button>
    </article>
  );
}
