import { StatusChip, type StatusTone } from "@/components/ui/status-chip";
import { cn } from "@/lib/cn";

export const roleMeta: Record<"owner" | "dispatcher" | "driver", { label: string; tone: StatusTone; blurb: string }> = {
  owner: { label: "Owner", tone: "primary", blurb: "Full access, payouts and team" },
  dispatcher: { label: "Dispatcher", tone: "secondary", blurb: "Bids, assigns drivers, sees all trips" },
  driver: { label: "Driver", tone: "tertiary", blurb: "Sees assigned trips, updates status, shares location" },
};

export function RoleChip({ role, size = "sm" }: { role: keyof typeof roleMeta; size?: "sm" | "md" }) {
  return (
    <StatusChip tone={roleMeta[role].tone} size={size}>
      {roleMeta[role].label}
    </StatusChip>
  );
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? (parts.at(-1)?.[0] ?? "") : "")).toUpperCase() || "?";
}

export function Avatar({ name, className }: { name: string; className?: string }) {
  return (
    <span aria-hidden="true" className={cn("flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-container text-title-sm text-on-primary-container", className)}>
      {initials(name)}
    </span>
  );
}
