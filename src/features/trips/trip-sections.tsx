import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { callIcon, directionsIcon, locationOnIcon, pictureAsPdfIcon, tripOriginIcon } from "@/components/ui/icons.generated";
import { formatWindow, place } from "@/features/board/format";
import type { LoadStop } from "@/server/db/schema/loads";
import { statusLabels } from "@/server/loads/transitions";
import type { Trip } from "./queries";

export function directionsUrl(stop: LoadStop) {
  const text = [stop.address, stop.city, [stop.state, stop.postalCode].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  const destination = text || (stop.lat != null && stop.lng != null ? `${stop.lat},${stop.lng}` : place(stop));
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=driving`;
}

function fullAddress(stop: LoadStop) {
  const line2 = [stop.city, [stop.state, stop.postalCode].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  return { line1: stop.address || place(stop), line2: stop.address ? line2 : "" };
}

function StopBlock({ kind, stop, current, contact }: { kind: "Pickup" | "Delivery"; stop: LoadStop; current: boolean; contact?: { name: string; phone: string | null } | null }) {
  const address = fullAddress(stop);
  const extras = [stop.floor != null ? `Floor ${stop.floor}` : null, stop.hasElevator === true ? "Elevator" : stop.hasElevator === false && stop.floor ? "No elevator" : null].filter(Boolean);
  return (
    <li className="relative flex gap-4 pb-6 last:pb-0">
      {kind === "Pickup" && <span aria-hidden="true" className="absolute top-7 bottom-0 left-[13px] w-0.5 bg-outline-variant" />}
      <span className={`relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full ${current ? "bg-primary text-on-primary" : "bg-surface text-primary"}`}>
        <Icon icon={kind === "Pickup" ? tripOriginIcon : locationOnIcon} size={current ? 18 : 22} filled={kind === "Delivery"} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-label-lg text-on-surface-variant">
          {kind}
          {current && <span className="text-primary"> · Next stop</span>}
        </p>
        <p className="mt-0.5 text-title-md text-on-surface">{address.line1}</p>
        {address.line2 && <p className="text-body-lg text-on-surface">{address.line2}</p>}
        <p className="mt-1 text-body-md text-on-surface-variant">
          {formatWindow(stop.windowStart, stop.windowEnd)}
          {extras.length ? ` · ${extras.join(" · ")}` : ""}
        </p>
        {stop.notes && <p className="mt-2 rounded-md bg-surface-container px-3 py-2 text-body-md whitespace-pre-line text-on-surface">{stop.notes}</p>}
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant={current ? "filled" : "outlined"} asChild>
            <a href={directionsUrl(stop)} target="_blank" rel="noopener noreferrer">
              <Icon icon={directionsIcon} size={20} />
              Navigate
            </a>
          </Button>
          {contact?.phone && (
            <Button variant="outlined" asChild>
              <a href={`tel:${contact.phone}`} aria-label={`Call ${contact.name} at ${contact.phone}`}>
                <Icon icon={callIcon} size={20} />
                Call {contact.name.split(" ")[0]}
              </a>
            </Button>
          )}
        </div>
      </div>
    </li>
  );
}

export function TripStops({ trip }: { trip: Trip }) {
  const { load, shipper } = trip;
  const toDropoff = ["in_transit", "delivered", "completed"].includes(load.status);
  const active = !["completed", "cancelled", "delivered"].includes(load.status);
  const contact = shipper ? { name: shipper.name, phone: shipper.phone } : null;
  return (
    <ol>
      <StopBlock kind="Pickup" stop={load.pickup} current={active && !toDropoff} contact={contact} />
      <StopBlock kind="Delivery" stop={load.dropoff} current={active && toDropoff} contact={contact} />
    </ol>
  );
}

const mediaLabels: Record<string, string> = {
  pickup_photo: "At pickup",
  pod_photo: "At delivery",
  pod_signature: "Signature",
  photo: "Photos",
  document: "Documents",
};

const mediaOrder = ["pickup_photo", "pod_photo", "pod_signature", "photo", "document"];

export function TripMedia({ media }: { media: Trip["media"] }) {
  if (media.length === 0) return <p className="text-body-md text-on-surface-variant">Pickup and delivery photos appear here.</p>;
  const groups = mediaOrder.map((kind) => ({ kind, items: media.filter((m) => m.kind === kind) })).filter((g) => g.items.length > 0);
  return (
    <div className="flex flex-col gap-5">
      {groups.map((g) => (
        <section key={g.kind}>
          <h3 className="mb-2 text-title-sm text-on-surface">
            {mediaLabels[g.kind] ?? "Files"} <span className="text-on-surface-variant">({g.items.length})</span>
          </h3>
          <ul className="grid grid-cols-3 gap-2 medium:grid-cols-4">
            {g.items.map((m, i) => (
              <li key={m.id} className={g.kind === "pod_signature" ? "col-span-2" : undefined}>
                <a
                  href={m.url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`relative block overflow-hidden rounded-md bg-surface-container-highest ${g.kind === "pod_signature" ? "aspect-[2/1] bg-white" : "aspect-square"}`}
                  aria-label={`Open ${mediaLabels[g.kind] ?? "file"} ${i + 1}`}
                >
                  {m.isPdf ? (
                    <span className="flex size-full flex-col items-center justify-center gap-1 text-on-surface-variant">
                      <Icon icon={pictureAsPdfIcon} size={28} />
                      <span className="text-label-md">PDF</span>
                    </span>
                  ) : (
                    <Image src={m.url!} alt="" fill unoptimized sizes="(min-width: 600px) 200px, 33vw" className={g.kind === "pod_signature" ? "object-contain" : "object-cover"} />
                  )}
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

const eventFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
const hiddenStatuses = new Set(["draft", "open", "awaiting_payment", "expired"]);

function describe(e: Trip["events"][number]) {
  const p = e.payload ?? {};
  if (e.type === "driver_reassigned") return { title: "Driver changed", detail: null };
  if (e.type === "payout_sent") return { title: "Payout sent", detail: null };
  if (e.type === "payout_failed") return { title: "Payout failed", detail: "We're looking into it." };
  if (e.type === "dispute_withdrawn") return { title: "Dispute withdrawn", detail: null };
  if (e.type !== "status_changed" || !e.toStatus || hiddenStatuses.has(e.toStatus)) return null;
  const note = typeof p.note === "string" && p.note ? `“${p.note}”` : null;
  if (e.toStatus === "in_transit") return { title: "Picked up", detail: [typeof p.photos === "number" ? `${p.photos} ${p.photos === 1 ? "photo" : "photos"}` : null, note].filter(Boolean).join(" · ") || null };
  if (e.toStatus === "delivered") return { title: "Delivered", detail: [typeof p.recipientName === "string" ? `Received by ${p.recipientName}` : null, note].filter(Boolean).join(" · ") || null };
  if (e.toStatus === "en_route_to_pickup") return { title: "Trip started", detail: null };
  if (e.toStatus === "booked") return { title: "Booked", detail: "The shipper paid into escrow." };
  return { title: statusLabels[e.toStatus], detail: null };
}

export function TripTimeline({ events }: { events: Trip["events"] }) {
  const rows = events.map((e) => ({ e, d: describe(e) })).filter((r): r is { e: Trip["events"][number]; d: { title: string; detail: string | null } } => r.d !== null);
  if (rows.length === 0) return <p className="text-body-md text-on-surface-variant">No updates yet.</p>;
  return (
    <ol className="flex flex-col">
      {rows
        .slice()
        .reverse()
        .map(({ e, d }, i) => (
          <li key={e.id} className="relative flex gap-4 pb-5 last:pb-0">
            {i < rows.length - 1 && <span aria-hidden="true" className="absolute top-3 bottom-0 left-[5px] w-0.5 bg-outline-variant" />}
            <span aria-hidden="true" className={`relative mt-1.5 size-3 shrink-0 rounded-full ${i === 0 ? "bg-primary" : "bg-outline"}`} />
            <div className="min-w-0">
              <p className="text-body-lg text-on-surface">{d.title}</p>
              <p className="text-body-sm text-on-surface-variant">
                <time dateTime={e.createdAt.toISOString()}>{eventFmt.format(e.createdAt)}</time>
                {e.actorName ? ` · ${e.actorName}` : ""}
              </p>
              {d.detail && <p className="mt-0.5 text-body-md text-on-surface-variant">{d.detail}</p>}
            </div>
          </li>
        ))}
    </ol>
  );
}
