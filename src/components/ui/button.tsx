import { Slot } from "@radix-ui/react-slot";
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Spinner } from "./spinner";

type Variant = "filled" | "tonal" | "outlined" | "text" | "elevated" | "danger";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  filled: "bg-primary text-on-primary hover:shadow-elevation-1",
  tonal: "bg-secondary-container text-on-secondary-container hover:shadow-elevation-1",
  outlined: "border border-outline text-primary",
  text: "text-primary",
  elevated: "bg-surface-container-low text-primary shadow-elevation-1 hover:shadow-elevation-2",
  danger: "bg-error text-on-error hover:shadow-elevation-1",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 gap-1.5 text-label-lg rounded-[16px] active:rounded-[8px]",
  md: "h-10 px-6 gap-2 text-label-lg rounded-[20px] active:rounded-[12px]",
  lg: "h-14 px-8 gap-2.5 text-title-md rounded-[28px] active:rounded-[16px]",
};

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leading?: ReactNode;
  trailing?: ReactNode;
  asChild?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "filled", size = "md", loading = false, leading, trailing, asChild, className, children, disabled, ...rest },
  ref,
) {
  const classes = cn(
    "state-layer inline-flex shrink-0 cursor-pointer items-center justify-center font-medium whitespace-nowrap transition-[box-shadow,background-color,border-radius,color] duration-(--duration-short4) ease-standard select-none",
    "disabled:cursor-not-allowed disabled:bg-on-surface/12 disabled:text-on-surface/38 disabled:shadow-none",
    variant === "outlined" && "disabled:border-on-surface/12 disabled:bg-transparent",
    variant === "text" && "disabled:bg-transparent",
    variants[variant],
    sizes[size],
    (variant === "text") && "px-3",
    className,
  );

  if (asChild) {
    return (
      <Slot ref={ref} className={classes} {...rest}>
        {children}
      </Slot>
    );
  }

  return (
    <button ref={ref} className={classes} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {loading ? <Spinner size={18} /> : leading}
      {children}
      {!loading && trailing}
    </button>
  );
});
