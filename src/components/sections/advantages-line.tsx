import type { ReactNode } from "react";
import { Container } from "@/components/marketing/section";
import { Icon } from "@/components/ui/icon";
import { checkCircleIcon } from "@/components/ui/icons.generated";
import { sectionId } from "./types";

export type AdvantagePoint = string | { label: string; icon?: ReactNode };

export function AdvantagesLine({ title, description, points, children, id }: { title: string; description?: string; points: AdvantagePoint[]; children?: ReactNode; id?: string }) {
  const headingId = id ?? sectionId("adv", title);
  return (
    <section aria-labelledby={headingId} className="bg-inverse-surface py-14 text-inverse-on-surface medium:py-20">
      <Container>
        <div className="grid gap-10 large:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] large:gap-16">
          <div>
            <h2 id={headingId} className="text-headline-lg font-normal text-balance medium:text-display-sm">
              {title}
            </h2>
            {description && <p className="mt-4 text-body-lg text-pretty text-inverse-on-surface/80">{description}</p>}
            {children && <div className="mt-8">{children}</div>}
          </div>
          <ul className="grid gap-x-8 gap-y-5 medium:grid-cols-2">
            {points.map((point) => {
              const p = typeof point === "string" ? { label: point } : point;
              return (
                <li key={p.label} className="flex items-center gap-3 border-b border-inverse-on-surface/15 pb-5 text-title-md">
                  <span className="shrink-0 text-inverse-primary">{p.icon ?? <Icon icon={checkCircleIcon} size={24} />}</span>
                  {p.label}
                </li>
              );
            })}
          </ul>
        </div>
      </Container>
    </section>
  );
}
