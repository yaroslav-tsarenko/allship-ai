"use client";

import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { forwardRef, useId, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type CheckboxProps = Omit<CheckboxPrimitive.CheckboxProps, "children"> & { label: ReactNode; error?: string };

export const Checkbox = forwardRef<HTMLButtonElement, CheckboxProps>(function Checkbox({ label, error, className, id, ...rest }, ref) {
  const autoId = useId();
  const cid = id ?? autoId;
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div className="flex items-start gap-1">
        <CheckboxPrimitive.Root
          ref={ref}
          id={cid}
          aria-invalid={error ? true : undefined}
          className="group/cb state-layer -m-2.5 flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-on-surface-variant data-[state=checked]:text-primary"
          {...rest}
        >
          <span
            className={cn(
              "flex size-[18px] items-center justify-center rounded-[2px] border-2 transition-[background-color,border-color,scale] duration-(--duration-short4) ease-standard group-active/cb:scale-90",
              error ? "border-error" : "border-current",
              "in-data-[state=checked]:border-primary in-data-[state=checked]:bg-primary",
            )}
          >
            <CheckboxPrimitive.Indicator forceMount className="flex">
              <svg viewBox="0 0 14 14" width={14} height={14} aria-hidden="true" className="text-on-primary">
                <path
                  d="M1.5 7.25 5.25 11 12.5 3.25"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="square"
                  pathLength={1}
                  className="[stroke-dasharray:1] [stroke-dashoffset:1] transition-[stroke-dashoffset] duration-(--duration-short3) ease-(--ease-emphasized-accelerate) in-data-[state=checked]:[stroke-dashoffset:0] in-data-[state=checked]:delay-(--duration-short1) in-data-[state=checked]:duration-(--duration-medium2) in-data-[state=checked]:ease-(--ease-emphasized-decelerate)"
                />
              </svg>
            </CheckboxPrimitive.Indicator>
          </span>
        </CheckboxPrimitive.Root>
        <label htmlFor={cid} className="cursor-pointer pt-0 pl-3 text-body-md text-on-surface">
          {label}
        </label>
      </div>
      {error && (
        <p key={error} className="animate-message-in pl-8 text-body-sm text-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
});
