import Link from "next/link";
import { Container } from "@/components/marketing/section";
import { MoneyFlow } from "@/components/theater/illustrations/money-flow";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { closeIcon } from "@/components/ui/icons.generated";
import { cn } from "@/lib/cn";
import { feeExample, homeMoney } from "./content";
import { eyebrow, sectionTitle } from "./shared";

export function HomeMoney() {
  return (
    <section aria-labelledby="home-money" className="py-16 medium:py-24">
      <Container>
        <div className="max-w-[880px]">
          <p className={eyebrow}>{homeMoney.eyebrow}</p>
          <h2 id="home-money" className={`mt-3 ${sectionTitle}`}>
            {homeMoney.title}
          </h2>
          <p className="mt-4 max-w-[64ch] text-body-lg text-pretty text-on-surface-variant medium:text-body-xl">{homeMoney.description}</p>
        </div>
        <div className="mt-10 grid grid-cols-[minmax(0,1fr)] gap-x-12 gap-y-10 large:grid-cols-[minmax(0,8fr)_minmax(0,4fr)]">
          <figure className="min-w-0 rounded-lg bg-surface-container-low p-4 medium:p-8">
            <MoneyFlow
              amounts={feeExample}
              className="w-full"
              title={`Money flow: you pay ${feeExample.total}, Stripe holds ${feeExample.bid} plus the ${feeExample.fee} fee in escrow, and the carrier receives ${feeExample.bid} after delivery. If a dispute is opened, the payout pauses and is then released, refunded or split.`}
            />
            <figcaption className="mt-4 text-body-sm text-on-surface-variant">
              Example with a {feeExample.bid} bid. The fee is always {feeExample.percent}% of the accepted bid.
            </figcaption>
          </figure>
          <div>
            <h3 className="text-title-lg text-on-surface">The fee, worked out</h3>
            <table className="mt-4 w-full border-t border-outline-variant text-left">
              <caption className="sr-only">Fee example for a {feeExample.bid} bid</caption>
              <tbody>
                {feeExample.rows.map((r) => (
                  <tr key={r.label} className={cn("border-b border-outline-variant", r.total && "border-on-surface")}>
                    <th scope="row" className={cn("py-3 pr-4 text-body-lg font-normal", r.total ? "text-on-surface" : "text-on-surface-variant", r.payout && "text-tertiary")}>
                      {r.label}
                    </th>
                    <td className={cn("py-3 text-right font-mono text-body-lg tabular-nums", r.total ? "font-medium text-on-surface" : "text-on-surface", r.payout && "text-tertiary")}>{r.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3 text-body-sm text-pretty text-on-surface-variant">The fee is added on top of the bid, so the carrier keeps all of it.</p>
          </div>
        </div>
        <div className="mt-14 grid grid-cols-[minmax(0,1fr)] gap-x-16 gap-y-12 large:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
          <div>
            <h3 className="text-title-lg text-on-surface">If something doesn&apos;t go to plan</h3>
            <dl className="mt-4 border-t border-outline-variant">
              {homeMoney.cases.map((c) => (
                <div key={c.title} className="grid grid-cols-[minmax(0,1fr)] gap-x-6 gap-y-1 border-b border-outline-variant py-4 medium:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
                  <dt className="text-body-lg font-medium text-on-surface">{c.title}</dt>
                  <dd className="text-body-lg text-pretty text-on-surface-variant">{c.text}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div>
            <h3 className="text-title-lg text-on-surface">What we never do</h3>
            <ul className="mt-4 flex flex-col gap-3">
              {homeMoney.never.map((t) => (
                <li key={t} className="grid grid-cols-[1.75rem_minmax(0,1fr)] text-body-lg text-pretty text-on-surface">
                  <Icon icon={closeIcon} size={20} className="mt-0.5 text-error" />
                  <span>
                    <span className="sr-only">We never </span>
                    {t}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="tonal">
                <Link href="/safety">How we verify carriers</Link>
              </Button>
              <Button asChild variant="text">
                <Link href="/pricing">Pricing details</Link>
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
