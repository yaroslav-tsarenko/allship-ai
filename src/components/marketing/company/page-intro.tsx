import type { ReactNode } from "react";
import { Breadcrumbs, type Crumb } from "@/components/marketing/breadcrumbs";
import { Container, DisplayHeading, Eyebrow, Lead } from "@/components/marketing/section";
import { enter } from "@/components/motion/enter";
import { cn } from "@/lib/cn";

export function PageIntro({
  crumbs,
  eyebrow,
  title,
  lead,
  actions,
  aside,
  className,
}: {
  crumbs: Crumb[];
  eyebrow?: string;
  title: ReactNode;
  lead?: ReactNode;
  actions?: ReactNode;
  aside?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("pt-6 pb-12 medium:pt-8 medium:pb-16", className)}>
      <Container>
        <Breadcrumbs items={crumbs} />
        <div className={cn("mt-10 medium:mt-14", aside && "grid gap-10 expanded:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] expanded:items-end expanded:gap-16")}>
          <div className="max-w-[860px]">
            {eyebrow && (
              <Eyebrow className="mb-4" enter={0}>
                {eyebrow}
              </Eyebrow>
            )}
            <DisplayHeading enter={1}>{title}</DisplayHeading>
            {lead && (
              <Lead className="mt-6 max-w-[680px]" enter={3}>
                {lead}
              </Lead>
            )}
            {actions && (
              <div className="mt-8 flex flex-wrap gap-3" {...enter(4)}>
                {actions}
              </div>
            )}
          </div>
          {aside && <div {...enter(5)}>{aside}</div>}
        </div>
      </Container>
    </header>
  );
}
