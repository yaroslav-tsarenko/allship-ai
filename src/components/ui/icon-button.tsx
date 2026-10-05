import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "./icon";
import type { IconData } from "./icons.generated";

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: IconData;
  label: string;
  variant?: "standard" | "filled" | "tonal" | "outlined";
  selected?: boolean;
};

const variants = {
  standard: "text-on-surface-variant",
  filled: "bg-primary text-on-primary",
  tonal: "bg-secondary-container text-on-secondary-container",
  outlined: "border border-outline text-on-surface-variant",
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { icon, label, variant = "standard", selected, className, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={selected}
      className={cn(
        "state-layer inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-[20px] transition-[color,background-color,border-radius] duration-(--duration-short4) ease-standard active:rounded-[12px]",
        "disabled:cursor-not-allowed disabled:text-on-surface/38",
        variants[variant],
        selected && variant === "standard" && "text-primary",
        className,
      )}
      {...rest}
    >
      <Icon icon={icon} filled={selected} size={24} />
    </button>
  );
});
