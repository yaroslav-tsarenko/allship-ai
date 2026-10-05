import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function CountUp({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span data-count="" className={cn("tabular-nums", className)}>
      {children}
    </span>
  );
}
