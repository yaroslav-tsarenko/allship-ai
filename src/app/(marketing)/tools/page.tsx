import Link from "next/link";
import type { ReactNode } from "react";
import { Breadcrumbs } from "@/components/marketing/breadcrumbs";
import { CtaBand } from "@/components/marketing/cta-band";
import { Container, DisplayHeading, Lead, Section, SectionHeading } from "@/components/marketing/section";
import { toolCatalog, type ToolKey } from "@/components/marketing/tools/catalog";
import { CarCarrier, Dolly, Pallet, Truck } from "@/components/theater/illustrations";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { arrowForwardIcon } from "@/components/ui/icons.generated";
import { site } from "@/content/site";
import { buildMetadata, JsonLd } from "@/lib/seo";

const path = "/tools";
const description =
  "Free calculators for moving costs, car shipping costs, freight class and cubic feet. Every assumption is shown, and you can turn the estimate into real carrier bids.";

export const metadata = buildMetadata({ title: "Free Shipping and Moving Calculators", description, path });

const art: Record<ToolKey, ReactNode> = {
  moving: <Dolly />,
  car: <CarCarrier />,
  freight: <Pallet />,
  cubic: <Truck />,
};

const itemList = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "AllShip AI calculators",
  url: new URL(path, site.url).toString(),
  itemListElement: toolCatalog.map((t, i) => ({
    "@type": "ListItem",
    position: i + 1,
    url: new URL(t.href, site.url).toString(),
    name: t.name,
  })),
};

function Spec({ inputs, output }: { inputs: string[]; output: string }) {
  return (
    <dl className="grid grid-cols-[48px_1fr] gap-x-3 gap-y-1.5 font-mono text-label-lg text-on-surface-variant">
      <dt className="text-on-surface">In</dt>
      <dd>{inputs.join(" · ")}</dd>
      <dt className="text-on-surface">Out</dt>
      <dd>{output}</dd>
    </dl>
  );
}

export default function ToolsIndexPage() {
  const [moving, car, ...small] = toolCatalog;
  const featured = [moving!, car!];
  return (
    <>
      <JsonLd data={itemList} />
      <Section spacing="none" className="pt-6 pb-12 medium:pt-8 medium:pb-16">
        <Breadcrumbs items={[{ name: "Calculators", path }]} />
        <div className="mt-10 grid gap-8 medium:mt-14 large:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] large:items-end large:gap-16">
          <DisplayHeading enter={1}>Free calculators for shipping and moving</DisplayHeading>
          <Lead enter={3}>Get a ballpark before you post. Each calculator shows every assumption it uses, so you can see why the number is what it is. No sign-up.</Lead>
        </div>
      </Section>

      <section aria-label="Price calculators" className="border-t border-outline-variant">
        <Container>
          <ol>
            {featured.map((t, i) => (
              <li key={t.key} className="border-b border-outline-variant py-12 medium:py-16">
                <article className="grid items-center gap-8 expanded:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] expanded:gap-16">
                  <div className={i === 1 ? "expanded:order-2" : undefined}>
                    <div className="mx-auto max-w-[360px] rounded-lg bg-surface-container-low p-8 medium:p-10">{art[t.key]}</div>
                  </div>
                  <div>
                    <p className="font-mono text-label-lg text-primary">0{i + 1}</p>
                    <h2 className="mt-2 text-headline-lg font-normal text-balance text-on-surface medium:text-display-sm">
                      <Link href={t.href} className="rounded-xs hover:underline">
                        {t.question}
                      </Link>
                    </h2>
                    <p className="mt-2 text-title-md text-on-surface-variant">{t.name}</p>
                    <p className="mt-5 max-w-[56ch] text-body-xl text-pretty text-on-surface-variant">{t.description}</p>
                    <div className="mt-6">
                      <Spec inputs={t.inputs} output={t.output} />
                    </div>
                    <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
                      <Button asChild size="lg">
                        <Link href={t.href} data-track={`tools_index_${t.key}`}>
                          Open the calculator
                        </Link>
                      </Button>
                      <Link href={t.next.href} className="inline-flex min-h-12 items-center gap-2 text-title-sm font-medium text-primary hover:underline">
                        {t.next.label} <Icon icon={arrowForwardIcon} size={18} />
                      </Link>
                    </div>
                  </div>
                </article>
              </li>
            ))}
          </ol>
          <ul aria-label="Planning calculators" className="grid medium:grid-cols-2">
            {small.map((t, i) => (
              <li key={t.key} className="border-b border-outline-variant py-10 medium:odd:border-r medium:odd:pr-10 medium:even:pl-10">
                <article className="grid grid-cols-[88px_minmax(0,1fr)] items-start gap-6">
                  <div className="pt-1">{art[t.key]}</div>
                  <div>
                    <p className="font-mono text-label-lg text-primary">0{i + 3}</p>
                    <h2 className="mt-1 text-headline-sm text-balance text-on-surface">
                      <Link href={t.href} className="rounded-xs hover:underline">
                        {t.question}
                      </Link>
                    </h2>
                    <p className="mt-1 text-title-sm text-on-surface-variant">{t.name}</p>
                    <p className="mt-3 text-body-lg text-pretty text-on-surface-variant">{t.description}</p>
                    <div className="mt-4">
                      <Spec inputs={t.inputs} output={t.output} />
                    </div>
                    <Link href={t.href} data-track={`tools_index_${t.key}`} className="mt-5 inline-flex min-h-12 items-center gap-2 text-title-sm font-medium text-primary hover:underline">
                      Open the calculator <Icon icon={arrowForwardIcon} size={18} />
                    </Link>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <Section labelledBy="estimate-vs-bid">
        <div className="grid gap-10 large:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] large:gap-16">
          <SectionHeading id="estimate-vs-bid">An estimate is a starting point. A bid is a price.</SectionHeading>
          <div className="grid gap-px overflow-hidden rounded-md bg-outline-variant medium:grid-cols-2">
            <div className="bg-surface p-6 medium:p-8">
              <p className="text-label-lg text-on-surface-variant">Calculator</p>
              <ul className="mt-4 flex flex-col gap-3 text-body-lg text-on-surface">
                <li>Built from published assumptions</li>
                <li>Gives a range, never one number</li>
                <li>Doesn&apos;t know your stairs, dates or access</li>
              </ul>
            </div>
            <div className="bg-primary-container p-6 text-on-primary-container medium:p-8">
              <p className="text-label-lg">Bids on AllShip</p>
              <ul className="mt-4 flex flex-col gap-3 text-body-lg">
                <li>From carriers verified with the FMCSA</li>
                <li>A firm price with pickup and delivery dates</li>
                <li>Paid into escrow, released after delivery</li>
              </ul>
            </div>
          </div>
        </div>
      </Section>

      <CtaBand
        title="Ready for real prices?"
        description={`Post your load for free and compare bids. You pay the bid you choose plus a ${site.platformFeePercent}% service fee, only when you book.`}
        primary={{ label: "Get a quote", href: "/quote" }}
        secondary={{ label: "Instant moving prices", href: "/moving" }}
      />
    </>
  );
}
