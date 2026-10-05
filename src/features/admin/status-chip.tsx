import { cn } from "@/lib/cn";

export type Tone = "success" | "warning" | "danger" | "info" | "neutral";

const tones: Record<Tone, string> = {
  success: "bg-success-container text-on-success-container",
  warning: "bg-warning-container text-on-warning-container",
  danger: "bg-error-container text-on-error-container",
  info: "bg-secondary-container text-on-secondary-container",
  neutral: "bg-surface-container-highest text-on-surface-variant",
};

const dots: Record<Tone, string> = {
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-error",
  info: "bg-primary",
  neutral: "bg-outline",
};

const toneByStatus: Record<string, Tone> = {
  verified: "success",
  completed: "success",
  succeeded: "success",
  paid: "success",
  delivered: "success",
  accepted: "success",
  converted: "success",
  pending: "warning",
  manual_review: "warning",
  awaiting_payment: "warning",
  processing: "warning",
  requires_payment: "warning",
  scheduled: "warning",
  held: "warning",
  partially_refunded: "warning",
  new: "info",
  open: "info",
  active: "info",
  booked: "info",
  assigned: "info",
  en_route_to_pickup: "info",
  in_transit: "info",
  failed: "danger",
  cancelled: "danger",
  canceled: "danger",
  disputed: "danger",
  reversed: "danger",
  banned: "danger",
};

export function toneFor(status: string): Tone {
  return toneByStatus[status] ?? "neutral";
}

export function StatusChip({ label, tone, className }: { label: string; tone: Tone; className?: string }) {
  return (
    <span className={cn("inline-flex h-6 items-center gap-1.5 rounded-xs px-2 text-label-md font-medium whitespace-nowrap", tones[tone], className)}>
      <span aria-hidden="true" className={cn("size-1.5 rounded-full", dots[tone])} />
      {label}
    </span>
  );
}
