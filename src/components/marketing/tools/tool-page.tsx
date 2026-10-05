import Link from "next/link";
import type { ReactNode } from "react";
import { Breadcrumbs } from "@/components/marketing/breadcrumbs";
import { Faq, type FaqItem } from "@/components/marketing/faq";
import { Container } from "@/components/marketing/section";
import { Icon } from "@/components/ui/icon";
import { arrowForwardIcon } from "@/components/ui/icons.generated";
import { CarCarrier, Dolly, Pallet, Truck } from "@/components/theater/illustrations";
import { JsonLd, jsonLd } from "@/lib/seo";
import { toolCatalog, type ToolKey } from "./catalog";
import { RevealText } from "@/components/motion/reveal-text";
import { enter } from "@/components/motion/enter";

const art: Record<ToolKey, ReactNode> = { moving: <Dolly />, car: <CarCarrier />, freight: <Pallet />, cubic: <Truck /> };

export type RelatedLink = { label: string; href: string; description: string };

type ToolPageProps = {
  path: string;
  crumb: string;
  title: string;
  intro: ReactNode;
  appName: string;
  appDescription: string;
  calculator: ReactNode;
  method: ReactNode;
  related: RelatedLink[];
  faq: FaqItem[];
};

export function ToolPage({ path, crumb, title, intro, appName, appDescription, calculator, method, related, faq }: ToolPageProps) {
  const current = toolCatalog.find((t) => t.href === path);
  const others = toolCatalog.filter((t) => t.href !== path);
  return (
    <>
      <JsonLd data={jsonLd.webApplication({ name: appName, description: appDescription, path })} />
      <Container className="pt-6 medium:pt-8">
        <Breadcrumbs items={[{ name: "Calculators", path: "/tools" }, { name: crumb, path }]} />
        <header className="mt-8 grid items-end gap-6 medium:mt-10 expanded:grid-cols-[minmax(0,1fr)_200px] expanded:gap-16">
          <div className="max-w-[760px]">
            <h1 className="text-display-sm font-normal tracking-tight text-balance medium:text-display-md">
              <RevealText>{title}</RevealText>
            </h1>
            <div className="mt-4 text-body-lg text-pretty text-on-surface-variant medium:text-title-lg medium:font-normal" {...enter(2)}>
              {intro}
            </div>
          </div>
          {current && (
            <div className="hidden expanded:block" {...enter(3)}>
              {art[current.key]}
            </div>
          )}
        </header>
      </Container>

      <Container className="pt-10 pb-12 medium:pt-12 medium:pb-16">
        <div {...enter(3)}>{calculator}</div>
        {current && (
          <div className="mt-10 flex flex-col gap-4 border-t border-outline-variant pt-6 medium:flex-row medium:items-center medium:justify-between">
            <p className="max-w-[60ch] text-body-lg text-pretty text-on-surface-variant">
              <span className="text-on-surface">This is an estimate, not a price.</span> On AllShip, FMCSA-verified carriers send firm bids and your payment waits in escrow until delivery.
            </p>
            <Link
              href={current.next.href}
              data-track={`tool_next_${current.key}`}
              className="inline-flex h-12 shrink-0 items-center gap-2 rounded-full bg-primary px-6 text-label-lg font-medium text-on-primary hover:shadow-elevation-1"
            >
              {current.next.label}
              <Icon icon={arrowForwardIcon} size={18} />
            </Link>
          </div>
        )}
      </Container>

      <section aria-labelledby="method" className="border-t border-outline-variant bg-surface-container-lowest py-14 medium:py-20">
        <Container>
          <div className="grid gap-8 large:grid-cols-[280px_minmax(0,1fr)] large:gap-16">
            <h2 id="method" className="text-headline-md font-normal text-balance medium:text-headline-lg">
              How this estimate works
            </h2>
            <div className="max-w-[760px] min-w-0 text-body-lg text-on-surface-variant [&_h3]:mt-8 [&_h3]:mb-2 [&_h3]:text-title-lg [&_h3]:text-on-surface [&_p]:mt-3 [&_p]:text-pretty">{method}</div>
          </div>
        </Container>
      </section>

      <section aria-labelledby="next" className="py-14 medium:py-20">
        <Container>
          <h2 id="next" className="text-headline-md font-normal medium:text-headline-lg">
            Next steps
          </h2>
          <ul className="mt-8 grid border-t border-outline-variant medium:grid-cols-2 large:grid-cols-3">
            {related.map((r) => (
              <li key={r.href} className="border-b border-outline-variant">
                <Link href={r.href} className="group flex h-full items-start justify-between gap-4 py-5 pr-2 medium:pr-6">
                  <span>
                    <span className="block text-title-md text-primary group-hover:underline">{r.label}</span>
                    <span className="mt-1 block text-body-md text-on-surface-variant">{r.description}</span>
                  </span>
                  <Icon icon={arrowForwardIcon} size={20} className="mt-0.5 shrink-0 text-primary transition-transform duration-200 ease-standard group-hover:translate-x-0.5" />
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section aria-labelledby="faq" className="pb-20 medium:pb-28">
        <Container width="narrow">
          <h2 id="faq" className="mb-6 text-headline-md font-normal medium:text-headline-lg">
            Questions
          </h2>
          <Faq items={faq} />
        </Container>
      </section>

      <nav aria-labelledby="more-tools" className="border-t border-outline-variant bg-surface-container-low py-12 medium:py-16">
        <Container>
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <h2 id="more-tools" className="text-title-lg text-on-surface">
              More calculators
            </h2>
            <Link href="/tools" className="text-title-sm font-medium text-primary hover:underline">
              All calculators
            </Link>
          </div>
          <ul className="mt-6 grid gap-6 medium:grid-cols-3">
            {others.map((t) => (
              <li key={t.key}>
                <Link href={t.href} className="group grid grid-cols-[64px_minmax(0,1fr)] items-center gap-4">
                  <span>{art[t.key]}</span>
                  <span>
                    <span className="block text-title-md text-on-surface group-hover:underline">{t.name}</span>
                    <span className="block text-body-md text-on-surface-variant">{t.question}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </nav>
    </>
  );
}

export function FormulaBlock({ children, label }: { children: ReactNode; label: string }) {
  return (
    <figure className="mt-5 rounded-md bg-surface-container px-5 py-4">
      <figcaption className="text-label-md text-on-surface-variant">{label}</figcaption>
      <pre className="mt-2 overflow-x-auto font-mono text-body-sm whitespace-pre text-on-surface medium:text-body-md">{children}</pre>
    </figure>
  );
}

export function AssumptionTable({ caption, head, rows }: { caption: string; head: string[]; rows: Array<Array<string>> }) {
  return (
    <div className="mt-5 overflow-x-auto">
      <table className="w-full min-w-[420px] border-collapse text-left text-body-md">
        <caption className="mb-2 text-left text-label-lg text-on-surface-variant">{caption}</caption>
        <thead>
          <tr className="border-b border-outline">
            {head.map((h) => (
              <th key={h} scope="col" className="py-2 pr-4 font-medium text-on-surface">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.join("|")} className="border-b border-outline-variant">
              {r.map((c, i) =>
                i === 0 ? (
                  <th key={i} scope="row" className="py-2 pr-4 font-normal text-on-surface">
                    {c}
                  </th>
                ) : (
                  <td key={i} className="py-2 pr-4 font-mono tabular-nums text-on-surface-variant">
                    {c}
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
