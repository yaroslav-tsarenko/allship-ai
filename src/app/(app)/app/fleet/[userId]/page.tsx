import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import {
  arrowBackIcon,
  callIcon,
  chevronRightIcon,
  eastIcon,
  idCardIcon,
  mailIcon,
} from "@/components/ui/icons.generated";
import { StatusChip } from "@/components/ui/status-chip";
import { requireCarrierStaff } from "@/features/board/eligibility";
import { DetailActions } from "@/features/fleet/detail-actions";
import { DriverAvatar } from "@/features/fleet/driver-row";
import { DriverTrailMap } from "@/features/fleet/driver-trail-map";
import { statusMeta, stopLabel } from "@/features/fleet/presentation";
import { LoadStatusChip } from "@/features/loads/load-status-chip";
import { RoleChip } from "@/features/team/roles";
import { getActor } from "@/server/actor";
import type { LoadStatus } from "@/server/db/schema/enums";
import { driverDetail, type FleetDriver } from "@/server/fleet/queries";
import { isLiveTrip } from "@/server/fleet/status";
import { getViewer } from "@/server/viewer/viewer";

type Props = { params: Promise<{ userId: string }> };

export const metadata: Metadata = { title: "Driver" };

const dateFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });

export default async function DriverPage({ params }: Props) {
  const { userId } = await params;
  const viewer = await getViewer();
  requireCarrierStaff(viewer);
  const detail = await driverDetail(await getActor(viewer.user.id), decodeURIComponent(userId));
  if (!detail) notFound();
  const { profile, status, trip, trail, recent, stats, generatedAt } = detail;
  const meta = statusMeta[status];
  const last = trail.at(-1);
  const asFleetDriver: FleetDriver = {
    key: profile.userId,
    userId: profile.userId,
    memberId: profile.memberId,
    invitationId: null,
    role: profile.role,
    name: profile.name,
    email: profile.email,
    phone: profile.phone,
    status,
    trip,
    position: last
      ? {
          lat: last.lat,
          lng: last.lng,
          headingDeg: last.headingDeg,
          speedMph: last.speedMph,
          recordedAt: last.recordedAt,
        }
      : null,
    joinedAt: profile.joinedAt,
  };
  const onTimeRate = stats.judged > 0 ? Math.round((stats.onTime / stats.judged) * 100) : null;

  return (
    <div className="mx-auto max-w-[1100px]">
      <Button variant="text" asChild className="mt-2 -ml-3">
        <Link href="/app/fleet">
          <Icon icon={arrowBackIcon} size={20} />
          Fleet
        </Link>
      </Button>

      <header className="flex flex-wrap items-center gap-4 pt-3 pb-6">
        <DriverAvatar driver={asFleetDriver} now={generatedAt} size="lg" />
        <div className="min-w-0 flex-1">
          <h1 className="text-headline-md text-on-surface medium:text-headline-lg truncate">
            {profile.name}
          </h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <StatusChip tone={meta.tone} dot>
              {meta.label}
            </StatusChip>
            {profile.role !== "driver" && <RoleChip role={profile.role} size="md" />}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {profile.phone && (
            <Button variant="tonal" asChild>
              <a href={`tel:${profile.phone}`}>
                <Icon icon={callIcon} size={20} />
                Call
              </a>
            </Button>
          )}
          <DetailActions driver={asFleetDriver} canRemove={viewer.role === "owner"} />
        </div>
      </header>

      <Reveal stagger={0.06} className="expanded:grid-cols-[1fr_320px] grid gap-6">
        <div className="flex min-w-0 flex-col gap-6">
          <Card as="section" aria-labelledby="current-title" className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 px-5 pt-5">
              <h2 id="current-title" className="text-title-lg">
                Current trip
              </h2>
              {trip && (
                <Link
                  href={`/app/trips/${trip.publicId}`}
                  className="state-layer text-label-lg text-primary -mr-2 inline-flex h-9 items-center gap-1 rounded-full px-3"
                >
                  {trip.publicId}
                  <Icon icon={chevronRightIcon} size={18} />
                </Link>
              )}
            </div>
            {trip ? (
              <>
                <p className="text-body-lg text-on-surface flex flex-wrap items-center gap-x-1.5 px-5 pt-1">
                  <span>{stopLabel(trip.pickup)}</span>
                  <Icon icon={eastIcon} size={18} label="to" className="text-on-surface-variant" />
                  <span>{stopLabel(trip.dropoff)}</span>
                </p>
                {isLiveTrip(trip.status) ? (
                  <DriverTrailMap
                    driverKey={profile.userId}
                    name={profile.name}
                    trip={trip}
                    initialTrail={trail}
                    live
                  />
                ) : (
                  <p className="text-body-md text-on-surface-variant px-5 pt-2 pb-5">
                    Assigned and waiting to start. The live map turns on when {profile.name.split(" ")[0]}{" "}
                    heads to pickup.
                  </p>
                )}
              </>
            ) : (
              <p className="text-body-md text-on-surface-variant px-5 pt-1 pb-5">
                Not on a trip right now. Assign {profile.name.split(" ")[0]} from any booked load on the Trips
                page.
              </p>
            )}
          </Card>

          <Card as="section" aria-labelledby="recent-title" className="overflow-hidden">
            <h2 id="recent-title" className="text-title-lg px-5 pt-5 pb-3">
              Recent trips
            </h2>
            {recent.length === 0 ? (
              <p className="border-outline-variant text-body-md text-on-surface-variant border-t px-5 py-4">
                No trips yet.
              </p>
            ) : (
              <ul>
                {recent.map((r) => (
                  <li key={r.id} className="border-outline-variant border-t">
                    <Link
                      href={`/app/trips/${r.publicId}`}
                      className="state-layer flex items-center gap-3 px-5 py-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="text-title-sm text-on-surface truncate">{r.title}</span>
                          <LoadStatusChip status={r.status as LoadStatus} size="sm" />
                        </p>
                        <p className="text-body-sm text-on-surface-variant mt-0.5 truncate">
                          {r.publicId} · {stopLabel(r.pickup)} → {stopLabel(r.dropoff)}
                          {r.deliveredAt ? ` · Delivered ${dateFmt.format(new Date(r.deliveredAt))}` : ""}
                        </p>
                      </div>
                      <Icon icon={chevronRightIcon} className="text-on-surface-variant shrink-0" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card as="section" aria-labelledby="stats-title" className="p-5">
            <h2 id="stats-title" className="sr-only">
              Performance
            </h2>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-label-md text-on-surface-variant">Delivered trips</dt>
                <dd className="text-headline-sm text-on-surface mt-0.5 tabular-nums">{stats.delivered}</dd>
              </div>
              <div>
                <dt className="text-label-md text-on-surface-variant">On time</dt>
                <dd className="text-headline-sm text-on-surface mt-0.5 tabular-nums">
                  {onTimeRate == null ? "—" : `${onTimeRate}%`}
                </dd>
              </div>
            </dl>
            <p className="text-body-sm text-on-surface-variant mt-3">
              {stats.judged > 0
                ? `${stats.onTime} of ${stats.judged} deliveries arrived by the end of the delivery window.`
                : "On-time rate appears after a delivery with a scheduled window."}
            </p>
          </Card>

          <Card as="section" aria-labelledby="contact-title" className="p-5">
            <h2 id="contact-title" className="text-title-md mb-3">
              Contact and license
            </h2>
            <ul className="text-body-md flex flex-col gap-3">
              <li className="flex items-center gap-3">
                <Icon icon={mailIcon} size={20} className="text-on-surface-variant shrink-0" />
                <a
                  href={`mailto:${profile.email}`}
                  className="text-on-surface min-w-0 truncate rounded-xs hover:underline"
                >
                  {profile.email}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Icon icon={callIcon} size={20} className="text-on-surface-variant shrink-0" />
                {profile.phone ? (
                  <a href={`tel:${profile.phone}`} className="text-on-surface rounded-xs hover:underline">
                    {profile.phone}
                  </a>
                ) : (
                  <span className="text-on-surface-variant">No phone on file</span>
                )}
              </li>
              <li className="flex items-center gap-3">
                <Icon icon={idCardIcon} size={20} className="text-on-surface-variant shrink-0" />
                <span className={profile.cdl ? "text-on-surface" : "text-on-surface-variant"}>
                  {profile.cdl ? `CDL ${profile.cdl}` : "No CDL on file"}
                </span>
              </li>
            </ul>
            {profile.notes && (
              <p className="border-outline-variant text-body-md text-on-surface mt-4 border-t pt-3 whitespace-pre-line">
                {profile.notes}
              </p>
            )}
            <p className="text-body-sm text-on-surface-variant mt-4">
              On the team since {dateFmt.format(new Date(profile.joinedAt))}
              {status === "invited" ? " · hasn't opened the setup link yet" : ""}
            </p>
          </Card>
        </div>
      </Reveal>
    </div>
  );
}
