import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { arrowForwardIcon, locationOnIcon, tripOriginIcon } from "@/components/ui/icons.generated";
import { describeDetail, loadSpecs } from "@/features/loads/spec";
import type { LoadCategory } from "@/server/db/schema/enums";
import type { LoadStop } from "@/server/db/schema/loads";
import { formatWindow, place } from "./format";

function Stop({ kind, stop, booked }: { kind: "Pickup" | "Delivery"; stop: LoadStop; booked: boolean }) {
  return (
    <li className="relative flex gap-4 pb-6 last:pb-0">
      {kind === "Pickup" && <span aria-hidden="true" className="absolute top-6 bottom-0 left-[11px] w-0.5 bg-outline-variant" />}
      <span className="relative z-10 flex size-6 shrink-0 items-center justify-center bg-surface text-primary">
        <Icon icon={kind === "Pickup" ? tripOriginIcon : locationOnIcon} size={20} filled={kind === "Delivery"} />
      </span>
      <div className="min-w-0">
        <p className="text-label-lg text-on-surface-variant">{kind}</p>
        <p className="text-title-md text-on-surface">{place(stop)}</p>
        {booked && stop.address ? (
          <p className="text-body-md text-on-surface">
            {stop.address}
            {stop.postalCode ? `, ${stop.postalCode}` : ""}
          </p>
        ) : (
          <p className="text-body-md text-on-surface-variant">{stop.postalCode ? `ZIP ${stop.postalCode}xx · ` : ""}Street address shared after booking</p>
        )}
        <p className="mt-1 text-body-md text-on-surface-variant">{formatWindow(stop.windowStart, stop.windowEnd)}</p>
        {booked && stop.notes && <p className="mt-1 text-body-md text-on-surface">{stop.notes}</p>}
      </div>
    </li>
  );
}

export function RouteBlock({ pickup, dropoff, booked }: { pickup: LoadStop; dropoff: LoadStop; booked: boolean }) {
  return (
    <ol>
      <Stop kind="Pickup" stop={pickup} booked={booked} />
      <Stop kind="Delivery" stop={dropoff} booked={booked} />
    </ol>
  );
}

export function DetailSections({ category, details }: { category: LoadCategory; details: Record<string, unknown> }) {
  const sections = loadSpecs[category]
    .map((s) => ({ title: s.title, rows: s.fields.map((f) => ({ label: f.label, value: describeDetail(f, details[f.name]) })).filter((r) => r.value !== null) }))
    .filter((s) => s.rows.length > 0);
  const notes = typeof details.notes === "string" && details.notes.trim() ? details.notes : null;
  if (!sections.length && !notes) return <p className="text-body-md text-on-surface-variant">The shipper didn&apos;t add extra details.</p>;
  return (
    <div className="flex flex-col gap-6">
      {sections.map((s) => (
        <section key={s.title}>
          <h3 className="text-title-sm text-on-surface">{s.title}</h3>
          <dl className="mt-2 divide-y divide-outline-variant border-y border-outline-variant">
            {s.rows.map((r) => (
              <div key={r.label} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-4 py-2.5 text-body-md">
                <dt className="text-on-surface-variant">{r.label}</dt>
                <dd className="text-on-surface">{r.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
      {notes && (
        <section>
          <h3 className="text-title-sm text-on-surface">Notes from the shipper</h3>
          <p className="mt-2 text-body-md whitespace-pre-line text-on-surface">{notes}</p>
        </section>
      )}
    </div>
  );
}

export function ManageTripLink({ publicId, className }: { publicId: string; className?: string }) {
  return (
    <Button size="lg" className={className} asChild>
      <Link href={`/app/trips/${publicId}`}>
        Manage trip
        <Icon icon={arrowForwardIcon} size={20} />
      </Link>
    </Button>
  );
}
