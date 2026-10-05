import { Icon } from "@/components/ui/icon";
import type { IconData } from "@/components/ui/icons.generated";
import { cn } from "@/lib/cn";

export type PipelineStage = { icon: IconData; title: string; body: string; gate?: boolean };

export function Pipeline({ stages, label, className, endLabel }: { stages: PipelineStage[]; label: string; className?: string; endLabel: string }) {
  return (
    <div className={className}>
      <ol aria-label={label} className="grid gap-0 expanded:grid-flow-col expanded:auto-cols-fr">
        {stages.map((s, i) => (
          <li key={s.title} className="relative flex gap-4 pb-8 expanded:flex-col expanded:gap-0 expanded:pr-6 expanded:pb-0">
            <div className="relative flex flex-col items-center expanded:flex-row">
              <span
                className={cn(
                  "relative z-10 flex size-12 shrink-0 items-center justify-center rounded-full",
                  s.gate ? "bg-primary text-on-primary" : "bg-primary-container text-on-primary-container",
                )}
              >
                <Icon icon={s.icon} />
              </span>
              <span aria-hidden="true" className={cn("absolute top-12 bottom-[-2rem] left-1/2 w-0.5 -translate-x-1/2 bg-primary/30 expanded:top-1/2 expanded:right-[-1.5rem] expanded:bottom-auto expanded:left-12 expanded:h-0.5 expanded:w-auto expanded:translate-x-0 expanded:-translate-y-1/2", i === stages.length - 1 && "expanded:hidden")} />
            </div>
            <div className="pt-2 expanded:pt-5">
              <h3 className="text-title-lg font-normal text-on-surface">{s.title}</h3>
              <p className="mt-1.5 text-body-md text-pretty text-on-surface-variant medium:text-body-lg">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-2 inline-flex items-center gap-2 rounded-sm bg-success-container px-3 py-1.5 text-label-lg text-on-success-container expanded:mt-8">{endLabel}</p>
    </div>
  );
}
