import type { ReactNode, SVGProps } from "react";
import { cn } from "@/lib/cn";

export type IllustrationProps = Omit<SVGProps<SVGSVGElement>, "children"> & { title?: string };

export const ink = "stroke-on-surface";
export const line = {
  fill: "none",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

export function Spot({
  title,
  className,
  viewBox = "0 0 160 120",
  children,
  ...rest
}: IllustrationProps & { children: ReactNode }) {
  return (
    <svg
      viewBox={viewBox}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
      className={cn("h-auto w-full", className)}
      {...rest}
    >
      {children}
    </svg>
  );
}
