import type { ReactNode } from "react";
import { Breadcrumbs, type Crumb } from "@/components/marketing/breadcrumbs";
import { QuoteWidget } from "@/components/marketing/quote-widget";
import { Container, DisplayHeading, Eyebrow, Lead } from "@/components/marketing/section";
import { enter } from "@/components/motion/enter";
import { cn } from "@/lib/cn";

type PageHeroProps = {
  crumbs: Crumb[];
  eyebrow?: ReactNode;
  title: ReactNode;
  lead: ReactNode;
  category?: string;
  source: string;
  quoteLabel?: string;
  submitLabel?: string;
  aside?: ReactNode;
  children?: ReactNode;
  asideAlign?: "end" | "center" | "start";
};

export function PageHero({ crumbs, eyebrow, title, lead, category, source, quoteLabel = "Where is it going?", submitLabel, aside, children, asideAlign = "end" }: PageHeroProps) {
  return (
    <section className="bg-surface pt-6 pb-12 medium:pt-8 medium:pb-16">
      <Container>
        <Breadcrumbs items={crumbs} />
        <div
          className={cn(
            "mt-8 grid gap-10 medium:mt-12",
            aside && "large:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] large:gap-16",
            asideAlign === "end" && "large:items-end",
            asideAlign === "center" && "large:items-center",
            asideAlign === "start" && "large:items-start",
          )}
        >
          <div className="min-w-0">
            {eyebrow && <Eyebrow enter={0}>{eyebrow}</Eyebrow>}
            <DisplayHeading className="mt-3" enter={1}>
              {title}
            </DisplayHeading>
            <Lead className="mt-5 max-w-[640px]" enter={3}>
              {lead}
            </Lead>
            {children && <div {...enter(4)}>{children}</div>}
          </div>
          {aside && (
            <div className="min-w-0" {...enter(4)}>
              {aside}
            </div>
          )}
        </div>
        <div id="hero-quote" className="mt-10 scroll-mt-24 rounded-lg bg-surface-container-low p-4 medium:mt-12 medium:p-6" {...enter(5)}>
          <p className="mb-4 text-title-md text-on-surface">{quoteLabel}</p>
          <QuoteWidget defaultCategory={category} source={source} tone="container" submitLabel={submitLabel} />
        </div>
      </Container>
    </section>
  );
}
