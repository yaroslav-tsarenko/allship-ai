import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type CardProps = HTMLAttributes<HTMLElement> & { variant?: "filled" | "outlined" | "elevated"; as?: "div" | "section" | "article" };

export function Card({ variant = "outlined", as: Tag = "div", className, ...rest }: CardProps) {
  return (
    <Tag
      className={cn(
        "rounded-md",
        variant === "filled" && "bg-surface-container-highest",
        variant === "outlined" && "border border-outline-variant bg-surface",
        variant === "elevated" && "bg-surface-container-low shadow-elevation-1",
        className,
      )}
      {...rest}
    />
  );
}
