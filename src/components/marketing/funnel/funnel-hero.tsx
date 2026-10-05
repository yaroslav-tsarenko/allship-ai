import type { ReactNode } from "react";
import { Breadcrumbs, type Crumb } from "@/components/marketing/breadcrumbs";
import { Container } from "@/components/marketing/section";
import { enter } from "@/components/motion/enter";
import { RevealText } from "@/components/motion/reveal-text";
import { RouteField } from "@/components/webgl/route-field";
import { cn } from "@/lib/cn";

export function FunnelHero({
  id,
  crumbs,
  eyebrow,
  title,
  highlight,
  lead,
  children,
  aside,
  field = true,
}: {
  id: string;
  crumbs?: Crumb[];
  eyebrow?: ReactNode;
  title: string;
  highlight?: string;
  lead: ReactNode;
  children?: ReactNode;
  aside?: ReactNode;
  field?: boolean;
}) {
  return (
    <section aria-labelledby={id} className="relative isolate overflow-hidden">
      {field && (
        <>
          <RouteField variant="section" intensity={0.7} className="-z-10" />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,var(--md-surface)_30%,color-mix(in_srgb,var(--md-surface)_70%,transparent)_62%,color-mix(in_srgb,var(--md-surface)_30%,transparent)),linear-gradient(to_bottom,transparent_65%,var(--md-surface))]"
          />
        </>
      )}
      <Container className="medium:pt-8 medium:pb-20 pt-6 pb-14">
        {crumbs && <Breadcrumbs items={crumbs} />}
        <div
          className={cn(
            "medium:mt-12 mt-8 grid gap-12",
            aside && "large:grid-cols-[minmax(0,6fr)_minmax(0,6fr)] large:items-center large:gap-14",
          )}
        >
          <div data-out="0.25" className="min-w-0">
            {eyebrow && (
              <p className="text-title-sm text-primary font-medium" {...enter(0)}>
                {eyebrow}
              </p>
            )}
            <h1
              id={id}
              className="text-display-sm text-on-surface medium:text-display-md large:text-display-lg mt-3 max-w-[920px] font-normal tracking-tight text-balance"
            >
              <RevealText>{title}</RevealText>
              {highlight && (
                <>
                  {" "}
                  <span className="text-primary">
                    <RevealText delay={160}>{highlight}</RevealText>
                  </span>
                </>
              )}
            </h1>
            <p
              className="text-body-lg text-on-surface-variant medium:text-title-lg medium:font-normal mt-5 max-w-[640px] text-pretty"
              {...enter(3)}
            >
              {lead}
            </p>
            {children && (
              <div className="mt-8 max-w-[760px]" {...enter(4)}>
                {children}
              </div>
            )}
          </div>
          {aside && (
            <div className="min-w-0" {...enter(5)}>
              {aside}
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
