import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "./icon";
import { checkIcon, closeIcon, type IconData } from "./icons.generated";

type ChipVariant = "assist" | "filter" | "suggestion" | "input";

export type ChipProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  label: ReactNode;
  variant?: ChipVariant;
  selected?: boolean;
  icon?: IconData;
  elevated?: boolean;
  onRemove?: () => void;
  removeLabel?: string;
};

export const Chip = forwardRef<HTMLButtonElement, ChipProps>(function Chip(
  { label, variant = "assist", selected = false, icon, elevated, onRemove, removeLabel, className, type = "button", ...rest },
  ref,
) {
  const isSelected = (variant === "filter" || variant === "input") && selected;
  const showCheck = variant === "filter" && selected;
  const leadingIcon = showCheck ? checkIcon : icon;

  const chip = (
    <button
      ref={ref}
      type={type}
      aria-pressed={variant === "filter" ? selected : undefined}
      className={cn(
        "state-layer inline-flex h-8 shrink-0 cursor-pointer items-center gap-2 rounded-sm text-label-lg font-medium whitespace-nowrap transition-[background-color,border-color,box-shadow] duration-150 ease-standard select-none",
        "disabled:cursor-not-allowed disabled:border-on-surface/12 disabled:text-on-surface/38",
        leadingIcon ? "pl-2" : "pl-4",
        onRemove ? "pr-1" : "pr-4",
        isSelected
          ? "border border-transparent bg-secondary-container text-on-secondary-container"
          : elevated
            ? "border border-transparent bg-surface-container-low text-on-surface-variant shadow-elevation-1"
            : "border border-outline-variant bg-transparent text-on-surface-variant",
        variant === "assist" && !isSelected && "text-on-surface",
        className,
      )}
      {...rest}
    >
      {leadingIcon && (
        <Icon icon={leadingIcon} size={18} className={cn(isSelected ? "text-on-secondary-container" : variant === "assist" ? "text-primary" : "text-on-surface-variant")} />
      )}
      <span>{label}</span>
      {onRemove && <span className="size-6" aria-hidden="true" />}
    </button>
  );

  if (!onRemove) return chip;

  return (
    <span className="relative inline-flex">
      {chip}
      <button
        type="button"
        onClick={onRemove}
        aria-label={removeLabel ?? "Remove"}
        className="state-layer absolute top-1/2 right-1 inline-flex size-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-on-surface-variant"
      >
        <Icon icon={closeIcon} size={18} />
      </button>
    </span>
  );
});

export function ChipSet({ label, children, className }: { label?: string; children: ReactNode; className?: string }) {
  return (
    <div role={label ? "group" : undefined} aria-label={label} className={cn("flex flex-wrap gap-2", className)}>
      {children}
    </div>
  );
}
