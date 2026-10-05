import type { ReactNode } from "react";
import { Container } from "@/components/marketing/section";
import { SectionProgress } from "@/components/motion/scroll";
import { Icon } from "@/components/ui/icon";
import {
  editNoteIcon,
  gavelIcon,
  lockClockIcon,
  nearMeIcon,
  taskAltIcon,
  type IconData,
} from "@/components/ui/icons.generated";
import { site } from "@/content/site";
import { cn } from "@/lib/cn";

export type TimelineStep = { icon: IconData; when: string; title: string; body: string };

export const shipperTimeline: TimelineStep[] = [
  {
    icon: editNoteIcon,
    when: "Today, about 3 minutes",
    title: "You post the load",
    body: "Route, dates and what is moving. Free, and you can edit it until you book.",
  },
  {
    icon: gavelIcon,
    when: "Usually within hours",
    title: "Verified carriers bid",
    body: "Each bid shows the carrier's price, dates, FMCSA status and reviews. Ask questions in chat first.",
  },
  {
    icon: lockClockIcon,
    when: "When you choose",
    title: "Accept and pay into escrow",
    body: `You pay the bid plus the ${site.platformFeePercent}% service fee. Stripe holds it; the carrier is not paid yet.`,
  },
  {
    icon: nearMeIcon,
    when: "On the day",
    title: "Follow the trip",
    body: "The driver starts the trip, confirms pickup with photos and shares a live location.",
  },
  {
    icon: taskAltIcon,
    when: "After delivery",
    title: "Confirm, then the carrier is paid",
    body: `Delivery comes with photos and a signature. Confirm it, or it auto-confirms after ${site.autoConfirmHours} hours with no dispute.`,
  },
];

export function NextTimeline({
  id = "what-next",
  title = "What happens next",
  lead,
  steps = shipperTimeline,
  tone = "surface",
  aside,
}: {
  id?: string;
  title?: string;
  lead?: ReactNode;
  steps?: TimelineStep[];
  tone?: "surface" | "low";
  aside?: ReactNode;
}) {
  return (
    <section
      aria-labelledby={id}
      data-progress-scope=""
      className={cn("medium:py-24 py-16", tone === "low" ? "bg-surface-container-low" : "bg-surface")}
    >
      <Container>
        <div className="expanded:flex-row expanded:items-end expanded:justify-between flex flex-col gap-4">
          <div className="max-w-[640px]">
            <h2
              id={id}
              className="text-headline-lg text-on-surface medium:text-display-sm font-normal text-balance"
            >
              {title}
            </h2>
            {lead && <p className="text-body-lg text-on-surface-variant mt-3 text-pretty">{lead}</p>}
          </div>
          {aside}
        </div>
        <div className="relative mt-12">
          <div
            aria-hidden="true"
            className="bg-outline-variant large:block absolute top-5 right-0 left-0 hidden h-0.5"
          />
          <SectionProgress className="large:block absolute top-5 right-0 left-0 hidden" />
          <ol className="large:grid-cols-5 large:gap-8 relative grid gap-0">
            {steps.map((step, i) => (
              <li
                key={step.title}
                className="large:block large:pb-0 relative grid grid-cols-[40px_minmax(0,1fr)] gap-x-5 pb-8 last:pb-0"
              >
                {i < steps.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="bg-outline-variant large:hidden absolute top-11 bottom-1 left-5 w-0.5 -translate-x-1/2"
                  />
                )}
                <span
                  className={cn(
                    "relative z-10 flex size-10 items-center justify-center rounded-full",
                    i === 0
                      ? "bg-primary text-on-primary"
                      : "border-outline-variant bg-surface text-primary border-2",
                  )}
                >
                  <Icon icon={step.icon} size={20} />
                </span>
                <div className="large:mt-5">
                  <p className="text-label-md text-on-surface-variant font-mono tracking-wide uppercase">
                    {step.when}
                  </p>
                  <h3 className="text-title-lg text-on-surface mt-1">{step.title}</h3>
                  <p className="text-body-md text-on-surface-variant mt-2 text-pretty">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </Container>
    </section>
  );
}
