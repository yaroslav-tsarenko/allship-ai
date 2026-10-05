"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { IconButton } from "@/components/ui/icon-button";
import { callIcon, closeIcon, myLocationIcon } from "@/components/ui/icons.generated";
import { StatusChip } from "@/components/ui/status-chip";
import type { FleetDriver } from "@/server/fleet/queries";
import { DriverAvatar, lastSeen, TripSummary } from "./driver-row";
import { statusMeta } from "./presentation";

export function DriverSheet({
  driver,
  now,
  onClose,
  onLocate,
}: {
  driver: FleetDriver;
  now: number;
  onClose: () => void;
  onLocate: () => void;
}) {
  const meta = statusMeta[driver.status];
  const seen = lastSeen(driver, now);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <section
      aria-label={`${driver.name} details`}
      className="animate-banner-in bg-surface-container-low shadow-elevation-3 medium:bottom-0 expanded:hidden fixed inset-x-0 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-30 max-h-[60dvh] overflow-y-auto rounded-t-xl px-4 pt-2 pb-4"
    >
      <span aria-hidden="true" className="bg-on-surface-variant/40 mx-auto mb-2 block h-1 w-8 rounded-full" />
      <div className="flex items-start gap-3">
        <DriverAvatar driver={driver} now={now} />
        <div className="min-w-0 flex-1">
          <h2 className="text-title-lg text-on-surface truncate">{driver.name}</h2>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <StatusChip size="sm" tone={meta.tone} dot>
              {meta.label}
            </StatusChip>
          </div>
          {seen && <p className="text-body-sm text-on-surface-variant mt-1 tabular-nums">{seen}</p>}
        </div>
        <IconButton icon={closeIcon} label="Close" onClick={onClose} />
      </div>
      <TripSummary driver={driver} className="mt-3" />
      <div className="mt-3 flex flex-wrap gap-2">
        {driver.phone && (
          <Button variant="tonal" asChild>
            <a href={`tel:${driver.phone}`}>
              <Icon icon={callIcon} size={20} />
              Call
            </a>
          </Button>
        )}
        {driver.position && (
          <Button variant="tonal" leading={<Icon icon={myLocationIcon} size={20} />} onClick={onLocate}>
            Locate
          </Button>
        )}
        {driver.userId && (
          <Button variant="text" asChild>
            <Link href={`/app/fleet/${driver.userId}`}>View profile</Link>
          </Button>
        )}
      </div>
    </section>
  );
}
