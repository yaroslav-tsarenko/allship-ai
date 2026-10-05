"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  actions,
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-scrim/32 data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in" />
        <DialogPrimitive.Content
          className={cn(
            "fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-48px)] w-[calc(100vw-48px)] max-w-[560px] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 overflow-y-auto rounded-xl bg-surface-container-high p-6 text-on-surface shadow-elevation-3 [--field-bg:var(--md-surface-container-high)] outline-none data-[state=closed]:animate-dialog-out data-[state=open]:animate-dialog-in",
            className,
          )}
        >
          <DialogPrimitive.Title className="text-headline-sm">{title}</DialogPrimitive.Title>
          {description ? (
            <DialogPrimitive.Description className="text-body-md text-on-surface-variant">{description}</DialogPrimitive.Description>
          ) : (
            <DialogPrimitive.Description className="sr-only">{title}</DialogPrimitive.Description>
          )}
          {children}
          {actions && <div className="flex flex-wrap justify-end gap-2 pt-2">{actions}</div>}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
