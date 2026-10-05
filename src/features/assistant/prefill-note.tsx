"use client";

import { IconButton } from "@/components/ui/icon-button";
import { closeIcon } from "@/components/ui/icons.generated";
import { cn } from "@/lib/cn";
import { SparkIcon } from "./spark-icon";

export function AiPrefillNote({ onDismiss, className }: { onDismiss: () => void; className?: string }) {
  return (
    <div
      role="status"
      className={cn(
        "animate-banner-in bg-primary-container text-on-primary-container flex items-center gap-3 rounded-md py-1.5 pr-1 pl-3",
        className,
      )}
    >
      <SparkIcon size={20} className="shrink-0" />
      <p className="text-body-md min-w-0 flex-1">Filled in by AllShip AI. Review before posting.</p>
      <IconButton
        icon={closeIcon}
        label="Dismiss"
        onClick={onDismiss}
        className="text-on-primary-container"
      />
    </div>
  );
}
