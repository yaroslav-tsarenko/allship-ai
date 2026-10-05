import { Icon } from "@/components/ui/icon";
import { checkIcon } from "@/components/ui/icons.generated";
import { cn } from "@/lib/cn";
import { formatDateTime } from "./presentation";

export type TripStep = { label: string; at: Date | null };

export function buildTripSteps(input: {
  status: string;
  bookedAt: Date | null;
  assignedAt: Date | null;
  startedAt: Date | null;
  pickedUpAt: Date | null;
  deliveredAt: Date | null;
  completedAt: Date | null;
}) {
  const steps: TripStep[] = [
    { label: "Booked", at: input.bookedAt },
    { label: "Driver assigned", at: input.assignedAt },
    { label: "On the way", at: input.startedAt },
    { label: "Picked up", at: input.pickedUpAt },
    { label: "Delivered", at: input.deliveredAt },
    { label: "Completed", at: input.completedAt },
  ];
  const order = ["booked", "assigned", "en_route_to_pickup", "in_transit", "delivered", "completed"];
  const byStatus = order.indexOf(input.status);
  const byTime = steps.reduce((last, s, i) => (s.at ? i : last), 0);
  return { steps, current: Math.max(byStatus, byTime) };
}

export function TripProgress({ steps, current, halted }: { steps: TripStep[]; current: number; halted?: string }) {
  return (
    <ol aria-label="Trip progress" className="flex flex-col medium:flex-row">
      {steps.map((step, i) => {
        const done = i < current || (i === current && i === steps.length - 1);
        const isCurrent = i === current && !done;
        const last = i === steps.length - 1;
        return (
          <li key={step.label} aria-current={isCurrent ? "step" : undefined} className="relative flex min-w-0 gap-3 pb-5 last:pb-0 medium:flex-1 medium:flex-col medium:gap-2 medium:pb-0">
            {!last && (
              <span
                aria-hidden="true"
                className={cn(
                  "absolute top-7 bottom-1 left-[11px] w-0.5 rounded-full medium:top-[11px] medium:right-2 medium:bottom-auto medium:left-9 medium:h-0.5 medium:w-auto",
                  i < current ? "bg-primary" : "bg-outline-variant",
                )}
              />
            )}
            <span
              aria-hidden="true"
              className={cn(
                "relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full",
                done && "bg-primary text-on-primary",
                isCurrent && (halted ? "bg-error-container ring-2 ring-error" : "bg-primary-container ring-2 ring-primary"),
                !done && !isCurrent && "border-2 border-outline-variant bg-surface",
              )}
            >
              {done && <Icon icon={checkIcon} size={16} />}
              {isCurrent && <span className={cn("size-2 rounded-full", halted ? "bg-error" : "bg-primary")} />}
            </span>
            <span className="min-w-0 pr-2">
              <span className={cn("block text-label-lg", done || isCurrent ? "text-on-surface" : "text-on-surface-variant")}>
                {step.label}
                <span className="sr-only">{done ? ", done" : isCurrent ? ", current" : ", upcoming"}</span>
              </span>
              <span className="block text-body-sm text-on-surface-variant tabular-nums">{step.at ? formatDateTime(step.at) : isCurrent && halted ? halted : "—"}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
