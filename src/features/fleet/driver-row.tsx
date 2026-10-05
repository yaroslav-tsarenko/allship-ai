"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { IconButton } from "@/components/ui/icon-button";
import { callIcon, chevronRightIcon, eastIcon, myLocationIcon } from "@/components/ui/icons.generated";
import { StatusChip } from "@/components/ui/status-chip";
import { relativeTime } from "@/features/tracking/geo";
import { initials } from "@/features/team/roles";
import { cn } from "@/lib/cn";
import type { FleetDriver } from "@/server/fleet/queries";
import { isOnTrip, isStale } from "@/server/fleet/status";
import { DriverMenu } from "./driver-menu";
import { headingLabel, speedLabel, statusMeta, stopLabel } from "./presentation";

export function DriverAvatar({
  driver,
  now,
  size = "md",
}: {
  driver: Pick<FleetDriver, "name" | "status" | "position" | "invitationId">;
  now: number;
  size?: "md" | "lg";
}) {
  const live = isOnTrip(driver.status) && driver.position && !isStale(driver.position.recordedAt, now);
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative flex shrink-0 items-center justify-center rounded-full",
        size === "lg" ? "text-title-lg size-14" : "text-title-sm size-10",
        driver.invitationId
          ? "border-outline text-on-surface-variant border border-dashed"
          : isOnTrip(driver.status)
            ? "bg-primary-container text-on-primary-container"
            : "bg-surface-container-highest text-on-surface-variant",
      )}
    >
      {driver.invitationId ? "@" : initials(driver.name)}
      {isOnTrip(driver.status) && (
        <span
          className={cn(
            "border-surface-container-low absolute -right-0.5 -bottom-0.5 size-3.5 rounded-full border-2",
            live ? "bg-primary" : "bg-outline",
          )}
        />
      )}
    </span>
  );
}

export function lastSeen(driver: FleetDriver, now: number) {
  if (!isOnTrip(driver.status)) return null;
  if (!driver.position) return "No location yet";
  const stale = isStale(driver.position.recordedAt, now);
  const parts = [`${stale ? "Last seen" : "Updated"} ${relativeTime(driver.position.recordedAt, now)}`];
  if (!stale) {
    const speed = speedLabel(driver.position.speedMph);
    const heading = speed !== "Stopped" ? headingLabel(driver.position.headingDeg) : null;
    if (speed) parts.push(heading ? `${speed} ${heading}` : speed);
  }
  return parts.join(" · ");
}

export function TripSummary({ driver, className }: { driver: FleetDriver; className?: string }) {
  if (!driver.trip) return null;
  return (
    <Link
      href={`/app/trips/${driver.trip.publicId}`}
      className={cn(
        "state-layer border-outline-variant flex items-center gap-3 rounded-md border px-3 py-2.5",
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="text-label-md text-on-surface-variant">{driver.trip.publicId}</p>
        <p className="text-body-md text-on-surface flex flex-wrap items-center gap-x-1.5">
          <span>{stopLabel(driver.trip.pickup)}</span>
          <Icon icon={eastIcon} size={16} label="to" className="text-on-surface-variant" />
          <span>{stopLabel(driver.trip.dropoff)}</span>
        </p>
      </div>
      <span className="text-label-lg text-primary">Open trip</span>
    </Link>
  );
}

export function DriverRow({
  driver,
  now,
  selected,
  canRemove,
  onSelect,
  onLocate,
  onChanged,
}: {
  driver: FleetDriver;
  now: number;
  selected: boolean;
  canRemove: boolean;
  onSelect: () => void;
  onLocate: () => void;
  onChanged: () => void;
}) {
  const meta = statusMeta[driver.status];
  const seen = lastSeen(driver, now);
  const stale = driver.position ? isStale(driver.position.recordedAt, now) : false;
  return (
    <li
      className={cn(
        "border-outline-variant border-t first:border-t-0",
        selected && "bg-secondary-container/40",
      )}
    >
      <div className="flex items-start gap-1 pr-2">
        <button
          type="button"
          onClick={onSelect}
          aria-pressed={selected}
          className="state-layer focus-visible:outline-primary flex min-w-0 flex-1 items-start gap-3 py-3 pl-4 text-left outline-none focus-visible:outline-2 focus-visible:-outline-offset-2"
        >
          <DriverAvatar driver={driver} now={now} />
          <span className="min-w-0 flex-1">
            <span className="text-title-md text-on-surface block truncate">{driver.name}</span>
            <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
              <StatusChip size="sm" tone={meta.tone} dot>
                {meta.label}
              </StatusChip>
            </span>
            {driver.trip && (
              <span className="text-body-sm text-on-surface-variant mt-1 block truncate">
                {driver.trip.publicId} · {stopLabel(driver.trip.pickup)} → {stopLabel(driver.trip.dropoff)}
              </span>
            )}
            {seen && (
              <span
                className={cn(
                  "text-body-sm block tabular-nums",
                  stale || !driver.position ? "text-on-surface-variant" : "text-primary",
                )}
              >
                {seen}
              </span>
            )}
            {driver.status === "invited" && (
              <span className="text-body-sm text-on-surface-variant block truncate">
                {driver.invitationId ? "Invitation sent" : driver.email}
              </span>
            )}
          </span>
        </button>
        <div className="flex shrink-0 items-center pt-2">
          {driver.phone && (
            <a
              href={`tel:${driver.phone}`}
              aria-label={`Call ${driver.name} at ${driver.phone}`}
              title={`Call ${driver.phone}`}
              className="state-layer text-on-surface-variant focus-visible:outline-primary inline-flex size-10 items-center justify-center rounded-full outline-none focus-visible:outline-2"
            >
              <Icon icon={callIcon} size={22} />
            </a>
          )}
          {driver.position && (
            <IconButton icon={myLocationIcon} label={`Locate ${driver.name} on the map`} onClick={onLocate} />
          )}
          <DriverMenu driver={driver} canRemove={canRemove} onChanged={onChanged} />
        </div>
      </div>
      {selected && (
        <div className="expanded:flex hidden flex-col gap-2 px-4 pb-4">
          {driver.phone && (
            <a
              href={`tel:${driver.phone}`}
              className="text-body-md text-on-surface-variant hover:text-on-surface w-fit rounded-xs"
            >
              {driver.phone}
            </a>
          )}
          <TripSummary driver={driver} />
          {driver.userId && (
            <Link
              href={`/app/fleet/${driver.userId}`}
              className="state-layer text-label-lg text-primary -ml-3 inline-flex h-10 w-fit items-center gap-1 rounded-full px-3"
            >
              Driver profile and trip history
              <Icon icon={chevronRightIcon} size={18} />
            </Link>
          )}
        </div>
      )}
    </li>
  );
}
