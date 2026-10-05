"use client";

import { useId, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export function FlipPanel({
  front,
  back,
  openLabel,
  closeLabel,
  openText,
  closeText,
  icon,
  buttonClassName,
  className,
}: {
  front: ReactNode;
  back: ReactNode;
  openLabel: string;
  closeLabel: string;
  openText?: string;
  closeText?: string;
  icon?: ReactNode;
  buttonClassName?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div className={cn("relative flex flex-1 flex-col", className)}>
      <div id={`${id}-front`} hidden={open} className="flex flex-1 flex-col motion-safe:animate-fade-in">
        {front}
      </div>
      <div id={`${id}-back`} hidden={!open} className="flex flex-1 flex-col motion-safe:animate-fade-in">
        {back}
      </div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={`${id}-front ${id}-back`}
        aria-label={open ? closeLabel : openLabel}
        title={open ? closeLabel : openLabel}
        onClick={() => setOpen((v) => !v)}
        data-open={open ? "" : undefined}
        className={buttonClassName}
      >
        {icon}
        {(openText || closeText) && <span>{open ? closeText : openText}</span>}
      </button>
    </div>
  );
}
