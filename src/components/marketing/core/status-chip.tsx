import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type LoadStatusTone = "open" | "awaiting_payment" | "booked" | "in_transit" | "delivered" | "completed" | "neutral";

const tones: Record<LoadStatusTone, string> = {
  open: "bg-primary-container text-on-primary-container",
  awaiting_payment: "bg-warning-container text-on-warning-container",
  booked: "bg-secondary-container text-on-secondary-container",
  in_transit: "bg-primary text-on-primary",
  delivered: "bg-success-container text-on-success-container",
  completed: "bg-success-container text-on-success-container",
  neutral: "bg-surface-container-highest text-on-surface-variant",
};

export function StatusChip({ tone, children, className }: { tone: LoadStatusTone; children: ReactNode; className?: string }) {
  return <span className={cn("inline-flex h-7 items-center rounded-sm px-3 text-label-lg font-medium whitespace-nowrap", tones[tone], className)}>{children}</span>;
}

export function ExampleTag({ children = "Example", className }: { children?: ReactNode; className?: string }) {
  return <span className={cn("inline-flex h-6 items-center rounded-xs border border-outline-variant px-2 text-label-md text-on-surface-variant", className)}>{children}</span>;
}
