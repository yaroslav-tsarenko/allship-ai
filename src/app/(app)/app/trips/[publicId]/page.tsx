import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { arrowBackIcon, personIcon } from "@/components/ui/icons.generated";
import { StatusChip } from "@/components/ui/status-chip";
import { place } from "@/features/board/format";
import { DetailSections } from "@/features/board/load-detail";
import { OpenChatButton } from "@/features/chat/open-chat-button";
import { DisputeDialog } from "@/features/disputes/dispute-dialog";
import { LoadStatusChip } from "@/features/loads/load-status-chip";
import { LazyLiveMap } from "@/features/tracking/lazy-live-map";
import { AssignDriver } from "@/features/trips/assign-driver";
import { LocationShare } from "@/features/trips/location-share";
import { getTrip } from "@/features/trips/queries";
import { TripNextStep, type NextStep } from "@/features/trips/trip-actions";
import { TripLive } from "@/features/trips/trip-live";
import { TripMedia, TripStops, TripTimeline } from "@/features/trips/trip-sections";
import { ActionError } from "@/server/actions/safe-action";
import { getActor } from "@/server/actor";
import { categoryLabel } from "@/server/loads/service";
import { getViewer } from "@/server/viewer/viewer";

type Props = { params: Promise<{ publicId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { publicId } = await params;
  return { title: `Trip ${publicId}` };
}

const nextStepFor: Partial<Record<string, NextStep>> = { assigned: "start", en_route_to_pickup: "pickup", in_transit: "delivery" };
const liveStatuses = ["en_route_to_pickup", "in_transit"];
const disputable = ["booked", "assigned", "en_route_to_pickup", "in_transit"];

const waiting: Partial<Record<string, string>> = {
  booked: "Assign a driver to get this trip moving.",
  delivered: "Waiting for the shipper to confirm. Payment releases automatically after 72 hours if they don't respond.",
  completed: "Trip complete. Payment has been released.",
  cancelled: "This trip was cancelled.",
  disputed: "This trip is in dispute. Our team will reach out and resolve it.",
};

export default async function TripPage({ params }: Props) {
  const { publicId } = await params;
  const viewer = await getViewer();
  if (viewer.role === "shipper" || !viewer.org) redirect(`/app/loads/${publicId}`);
  const actor = await getActor(viewer.user.id);
  const trip = await getTrip(actor, publicId).catch((error) => {
    if (error instanceof ActionError) return null;
    throw error;
  });
  if (!trip) notFound();
  const { load, isStaff, isAssignedDriver, driver } = trip;
  const step = nextStepFor[load.status];
  const canAct = Boolean(step) && (isAssignedDriver || isStaff);
  const live = liveStatuses.includes(load.status);
  const details = (load.details ?? {}) as Record<string, unknown>;
  const canAssign = isStaff && ["booked", "assigned"].includes(load.status);
  const canDispute = trip.role === "carrier" && disputable.includes(load.status);
  const stepNote = waiting[load.status] ?? (step && !canAct ? "Waiting on the assigned driver." : null);

  return (
    <div className="mx-auto max-w-[1120px]">
      <TripLive loadId={load.id} />
      <Link href="/app/trips" className="state-layer -ml-3 inline-flex h-10 items-center gap-2 rounded-full pr-4 pl-3 text-label-lg text-on-surface-variant">
        <Icon icon={arrowBackIcon} size={20} />
        Trips
      </Link>

      <header className="pt-2 pb-5">
        <p className="text-label-lg text-on-surface-variant">
          {categoryLabel(load.category)} · {load.publicId}
        </p>
        <h1 className="mt-1 text-headline-sm text-on-surface medium:text-headline-md">{load.title}</h1>
        <p className="mt-1 text-title-md font-normal text-on-surface-variant">
          {place(load.pickup)} to {place(load.dropoff)}
          {load.distanceMiles ? ` · ${Math.round(load.distanceMiles).toLocaleString("en-US")} mi` : ""}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <LoadStatusChip status={load.status} />
          {isStaff && (
            <StatusChip tone={driver ? "neutral" : "warning"} icon={personIcon}>
              {driver ? (driver.id === viewer.user.id ? "You're driving" : driver.name) : "No driver"}
            </StatusChip>
          )}
        </div>
      </header>

      <div className="grid gap-6 expanded:grid-cols-[minmax(0,1fr)_360px] large:grid-cols-[minmax(0,1fr)_400px]">
        <Reveal stagger={0.06} className="flex min-w-0 flex-col gap-6">
          {live && isAssignedDriver && <LocationShare loadId={load.id} />}
          {live && isStaff && !isAssignedDriver && (
            <Card as="section" aria-label="Live location" className="overflow-hidden">
              <LazyLiveMap loadId={load.id} status={load.status} pickup={load.pickup} dropoff={load.dropoff} initialPoints={trip.points} driverName={driver?.name} />
            </Card>
          )}
          <Card as="section" data-tour="trip-stops" aria-labelledby="stops-title" className="p-5 medium:p-6">
            <h2 id="stops-title" className="mb-4 text-title-lg">
              Stops
            </h2>
            <TripStops trip={trip} />
            {trip.shipper && (
              <p className="mt-5 border-t border-outline-variant pt-4 text-body-md text-on-surface-variant">
                Shipper: <span className="text-on-surface">{trip.shipper.name}</span>
                {trip.shipper.phone ? (
                  <>
                    {" · "}
                    <a href={`tel:${trip.shipper.phone}`} className="rounded-xs text-primary underline-offset-4 hover:underline">
                      {trip.shipper.phone}
                    </a>
                  </>
                ) : (
                  " · no phone on file, use chat"
                )}
              </p>
            )}
          </Card>
          <Card as="section" aria-labelledby="details-title" className="p-5 medium:p-6">
            <h2 id="details-title" className="mb-4 text-title-lg">
              What you&apos;re hauling
            </h2>
            <DetailSections category={load.category} details={details} />
          </Card>
          <Card as="section" data-tour="trip-photos" aria-labelledby="media-title" className="p-5 medium:p-6">
            <h2 id="media-title" className="mb-4 text-title-lg">
              Photos and proof of delivery
            </h2>
            {load.podRecipientName && <p className="-mt-2 mb-4 text-body-md text-on-surface-variant">Received by {load.podRecipientName}</p>}
            <TripMedia media={trip.media} />
          </Card>
          <Card as="section" aria-labelledby="timeline-title" className="p-5 medium:p-6">
            <h2 id="timeline-title" className="mb-4 text-title-lg">
              Activity
            </h2>
            <TripTimeline events={trip.events} />
          </Card>
        </Reveal>

        <aside className="flex flex-col gap-6 expanded:sticky expanded:top-20 expanded:self-start" aria-label="Trip actions">
          <Card data-tour="trip-next-step" className="hidden bg-surface-container-low p-5 expanded:block">
            <h2 className="text-title-lg text-on-surface">Next step</h2>
            {canAct && step ? (
              <TripNextStep loadId={load.id} step={step} className="mt-3 flex-col items-stretch [&>p]:block" />
            ) : (
              <p className="mt-1 text-body-md text-on-surface-variant">{stepNote ?? "Nothing to do right now."}</p>
            )}
          </Card>

          {isStaff && (
            <Card as="section" aria-labelledby="driver-title" className="p-5">
              <h2 id="driver-title" className="text-title-lg text-on-surface">
                Driver
              </h2>
              {canAssign ? (
                <>
                  <p className="mt-1 mb-4 text-body-md text-on-surface-variant">
                    {driver ? "You can switch drivers until the trip starts." : "Pick a driver, or assign yourself. They'll get the full addresses and pickup window."}
                  </p>
                  <AssignDriver loadId={load.id} people={trip.drivers} currentDriverId={load.driverId} selfId={viewer.user.id} />
                  {trip.drivers.every((p) => p.role !== "driver") && (
                    <p className="mt-3 text-body-sm text-on-surface-variant">
                      No drivers on your team yet.{" "}
                      <Link href="/app/team" className="font-medium text-primary hover:underline">
                        Invite one
                      </Link>
                    </p>
                  )}
                </>
              ) : driver ? (
                <div className="mt-2 text-body-md">
                  <p className="text-title-md text-on-surface">{driver.name}</p>
                  {driver.phone && (
                    <a href={`tel:${driver.phone}`} className="rounded-xs text-primary underline-offset-4 hover:underline">
                      {driver.phone}
                    </a>
                  )}
                </div>
              ) : (
                <p className="mt-1 text-body-md text-on-surface-variant">No driver was assigned.</p>
              )}
            </Card>
          )}

          <Card as="section" data-tour="trip-help" aria-labelledby="help-title" className="p-5">
            <h2 id="help-title" className="text-title-lg text-on-surface">
              Need help?
            </h2>
            <p className="mt-1 mb-4 text-body-md text-on-surface-variant">
              {canDispute ? "Message the shipper, or report a problem if something went wrong." : isStaff ? "Message the shipper about this load." : "Message your dispatcher or the shipper."}
            </p>
            <div className="flex flex-wrap gap-2">
              <OpenChatButton loadId={load.id} label="Open chat" />
              <Button variant="text" asChild>
                <Link href="/app/messages">All messages</Link>
              </Button>
              {canDispute && <DisputeDialog loadId={load.id} role="carrier" />}
            </div>
          </Card>
        </aside>
      </div>

      {canAct && step && (
        <div data-tour="trip-next-step" className="sticky bottom-[calc(80px+env(safe-area-inset-bottom))] z-20 -mx-4 mt-6 border-t border-outline-variant bg-surface-container px-4 py-3 medium:bottom-0 medium:mx-0 medium:rounded-t-lg medium:border-x expanded:hidden">
          <TripNextStep loadId={load.id} step={step} />
        </div>
      )}
    </div>
  );
}
