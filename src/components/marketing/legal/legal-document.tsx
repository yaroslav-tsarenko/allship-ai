import Link from "next/link";
import type { ReactNode } from "react";
import { Breadcrumbs } from "@/components/marketing/breadcrumbs";
import { Container } from "@/components/marketing/section";
import { Icon } from "@/components/ui/icon";
import { editNoteIcon } from "@/components/ui/icons.generated";
import { legalNav, site } from "@/content/site";
import { RevealText } from "@/components/motion/reveal-text";
import { enter } from "@/components/motion/enter";
import { SectionProgress } from "@/components/motion/scroll";

export type LegalSection = { id: string; title: string; body: ReactNode };

export const LEGAL_UPDATED = { iso: "2026-10-04", label: "October 4, 2026" };

type LegalDocumentProps = {
  path: string;
  title: string;
  crumb: string;
  summary: ReactNode;
  sections: LegalSection[];
  aside?: ReactNode;
};

export function LegalDocument({ path, title, crumb, summary, sections, aside }: LegalDocumentProps) {
  return (
    <>
      <div className="pointer-events-none sticky top-16 z-20 h-0.5">
        <SectionProgress target="#legal-body" />
      </div>
      <Container className="medium:pt-8 medium:pb-28 pt-6 pb-20">
        <Breadcrumbs items={[{ name: crumb, path }]} />

        <p
          className="bg-surface-container text-label-lg text-on-surface-variant mt-8 inline-flex items-center gap-2 rounded-sm px-3 py-1.5"
          role="note"
        >
          <Icon icon={editNoteIcon} size={18} />
          Draft — pending legal review
        </p>

        <header className="mt-5 max-w-[760px]">
          <h1 className="text-display-sm medium:text-display-md font-normal tracking-tight text-balance">
            <RevealText>{title}</RevealText>
          </h1>
          <p className="text-body-md text-on-surface-variant mt-4" {...enter(2)}>
            Last updated <time dateTime={LEGAL_UPDATED.iso}>{LEGAL_UPDATED.label}</time> · {site.legalName}
          </p>
          <div
            className="text-body-lg text-on-surface-variant medium:text-title-lg medium:font-normal mt-6 text-pretty"
            {...enter(3)}
          >
            {summary}
          </div>
        </header>

        <div
          className="large:mt-16 large:grid-cols-[260px_minmax(0,1fr)] large:gap-16 mt-12 grid gap-10"
          {...enter(4)}
        >
          <nav
            aria-label="On this page"
            className="large:sticky large:top-24 large:max-h-[calc(100dvh-7rem)] large:self-start large:overflow-y-auto"
          >
            <details className="m3-details group bg-surface-container-low large:hidden rounded-md">
              <summary className="text-title-sm text-on-surface flex min-h-12 cursor-pointer list-none items-center px-4 [&::-webkit-details-marker]:hidden">
                On this page · {sections.length} sections
              </summary>
              <TocList sections={sections} className="px-2 pb-3" />
            </details>
            <div className="large:block hidden">
              <p className="text-title-sm text-on-surface mb-3 px-3">On this page</p>
              <TocList sections={sections} />
              <div className="border-outline-variant mt-8 border-t px-3 pt-6">
                <p className="text-title-sm text-on-surface mb-3">Other policies</p>
                <ul className="flex flex-col gap-2">
                  {legalNav
                    .filter((l) => l.href !== path)
                    .map((l) => (
                      <li key={l.href}>
                        <Link
                          href={l.href}
                          className="text-body-md text-on-surface-variant hover:text-on-surface hover:underline"
                        >
                          {l.label}
                        </Link>
                      </li>
                    ))}
                </ul>
              </div>
            </div>
          </nav>

          <article id="legal-body" className="max-w-[760px] min-w-0">
            {aside}
            <ol className="flex flex-col">
              {sections.map((s, i) => (
                <li
                  key={s.id}
                  id={s.id}
                  className="border-outline-variant scroll-mt-24 border-t py-8 first:border-t-0 first:pt-0"
                >
                  <h2 className="text-headline-sm text-on-surface flex gap-4 font-normal">
                    <span className="text-title-lg text-on-surface-variant w-8 shrink-0 font-mono tabular-nums">
                      {i + 1}.
                    </span>
                    <span className="text-balance">{s.title}</span>
                  </h2>
                  <div className="text-body-lg text-on-surface-variant [&_a]:text-primary [&_h3]:text-title-md [&_h3]:text-on-surface [&_strong]:text-on-surface max-medium:pl-0 mt-4 pl-12 [&_a]:underline [&_h3]:mt-6 [&_li]:mt-2 [&_li]:pl-1 [&_ol]:mt-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mt-3 [&_p]:text-pretty [&_strong]:font-medium [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5">
                    {s.body}
                  </div>
                </li>
              ))}
            </ol>
            <footer className="border-outline-variant text-body-md text-on-surface-variant mt-4 border-t pt-8">
              <p>
                Questions about this policy? Write to{" "}
                <a href={`mailto:${site.email}`} className="text-primary underline">
                  {site.email}
                </a>{" "}
                or call{" "}
                <a href={site.phone.href} className="text-primary underline">
                  {site.phone.display}
                </a>
                .
              </p>
              <address className="mt-3 not-italic">
                {site.legalName}, {site.address.street}, {site.address.city}, {site.address.region}{" "}
                {site.address.postalCode}
              </address>
            </footer>
          </article>
        </div>
      </Container>
    </>
  );
}

function TocList({ sections, className }: { sections: LegalSection[]; className?: string }) {
  return (
    <ol className={className}>
      {sections.map((s, i) => (
        <li key={s.id}>
          <a
            href={`#${s.id}`}
            className="state-layer text-body-md text-on-surface-variant hover:text-on-surface flex gap-3 rounded-full px-3 py-2"
          >
            <span className="w-5 shrink-0 font-mono tabular-nums">{i + 1}</span>
            <span>{s.title}</span>
          </a>
        </li>
      ))}
    </ol>
  );
}
