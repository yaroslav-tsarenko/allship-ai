"use client";

import { forwardRef, useId, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "./icon";
import { checkIcon } from "./icons.generated";

type SwitchProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onChange" | "value"> & {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: ReactNode;
  description?: ReactNode;
};

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(function Switch(
  { checked, onCheckedChange, label, description, className, id, disabled, ...rest },
  ref,
) {
  const autoId = useId();
  const switchId = id ?? autoId;
  const descId = description ? `${switchId}-desc` : undefined;

  const control = (
    <button
      ref={ref}
      id={switchId}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-describedby={descId}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "group relative inline-flex h-8 w-[52px] shrink-0 cursor-pointer items-center rounded-full border-2 transition-colors duration-200 ease-standard",
        "disabled:cursor-not-allowed disabled:opacity-38",
        checked ? "border-primary bg-primary" : "border-outline bg-surface-container-highest",
      )}
      {...rest}
    >
      <span
        aria-hidden="true"
        className={cn(
          "absolute top-1/2 flex -translate-y-1/2 items-center justify-center rounded-full transition-all duration-200 ease-emphasized-decelerate",
          "before:absolute before:-inset-2 before:rounded-full before:bg-current before:opacity-0 before:transition-opacity group-hover:before:opacity-8 group-focus-visible:before:opacity-10 group-active:before:opacity-10",
          checked ? "left-[22px] size-6 bg-on-primary text-primary" : "left-[6px] size-4 bg-outline text-on-surface-variant group-active:left-[2px] group-active:size-7",
        )}
      >
        {checked && <Icon icon={checkIcon} size={16} className="relative text-on-primary-container" />}
      </span>
    </button>
  );

  if (!label) return <span className={className}>{control}</span>;

  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      <span className="min-w-0">
        <label htmlFor={switchId} className="block cursor-pointer text-body-lg text-on-surface">
          {label}
        </label>
        {description && (
          <span id={descId} className="block text-body-md text-on-surface-variant">
            {description}
          </span>
        )}
      </span>
      {control}
    </div>
  );
});
