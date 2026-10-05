import Link from "next/link";
import type { ReactNode } from "react";
import { Container } from "@/components/marketing/section";
import { Theater } from "@/components/theater";
import { EscrowShield, Truck } from "@/components/theater/illustrations";
import { Icon } from "@/components/ui/icon";
import { arrowForwardIcon } from "@/components/ui/icons.generated";
import { site } from "@/content/site";
import { cn } from "@/lib/cn";
import { feeFor, formatUsd } from "@/lib/money";

export function PriceBreakdown({
  id = "pricing-explained",
  title = "What you pay, line by line",
  lead,
  exampleBidCents = 94_000,
  exampleLabel = "Example: a carrier bids $940, the same as in the demo",
  tone = "low",
  cta,
  visual = "theater",
}: {
  id?: string;
  title?: string;
  lead?: ReactNode;
  exampleBidCents?: number;
  exampleLabel?: string;
  tone?: "surface" | "low";
  cta?: ReactNode;
  visual?: "theater" | "static";
}) {
  const { carrierAmountCents, platformFeeCents, shipperTotalCents } = feeFor(
    exampleBidCents,
    site.platformFeePercent * 100,
  );
  const rows: Array<{ label: string; detail: string; value: string; strong?: boolean }> = [
    { label: "Carrier's bid", detail: "Set by the carrier you choose", value: formatUsd(carrierAmountCents) },
    {
      label: `AllShip service fee (${site.platformFeePercent}%)`,
      detail: "Shown before you pay",
      value: formatUsd(platformFeeCents),
    },
    {
      label: "You pay into escrow",
      detail: "Card, Apple Pay, Google Pay or bank",
      value: formatUsd(shipperTotalCents),
      strong: true,
    },
  ];
  return (
    <section
      aria-labelledby={id}
      className={cn("medium:py-24 py-16", tone === "low" ? "bg-surface-container-low" : "bg-surface")}
    >
      <Container>
        <div className="large:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] large:items-center large:gap-16 grid gap-12">
          <div>
            <h2
              id={id}
              className="text-headline-lg text-on-surface medium:text-display-sm font-normal text-balance"
            >
              {title}
            </h2>
            <p className="text-body-lg text-on-surface-variant mt-4 max-w-[52ch] text-pretty">
              {lead ??
                "No subscription, no posting fee, no deposit to see bids. The price is the bid you accept plus our fee, and the carrier keeps 100% of the bid."}
            </p>
            <figure className="border-on-surface mt-8 border-t-2">
              <figcaption className="text-label-lg text-on-surface-variant py-3 font-medium">
                {exampleLabel}
              </figcaption>
              <dl className="text-body-lg font-mono tabular-nums">
                {rows.map((r) => (
                  <div
                    key={r.label}
                    className={cn(
                      "border-outline-variant grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-6 border-t py-3",
                      r.strong && "border-t-on-surface",
                    )}
                  >
                    <dt className="font-sans">
                      <span
                        className={cn(
                          "text-body-lg block",
                          r.strong ? "text-on-surface font-medium" : "text-on-surface",
                        )}
                      >
                        {r.label}
                      </span>
                      <span className="text-body-sm text-on-surface-variant block">{r.detail}</span>
                    </dt>
                    <dd className={cn(r.strong ? "text-title-lg text-primary" : "text-on-surface")}>
                      {r.value}
                    </dd>
                  </div>
                ))}
                <div className="border-outline text-on-surface-variant grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-6 border-t border-dashed py-3">
                  <dt className="text-body-md font-sans">Carrier receives after delivery</dt>
                  <dd>{formatUsd(carrierAmountCents)}</dd>
                </div>
              </dl>
            </figure>
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
              {cta}
              <Link
                href="/pricing"
                className="text-label-lg text-primary inline-flex items-center gap-1 font-medium hover:underline"
              >
                Pricing and fees in detail
                <Icon icon={arrowForwardIcon} size={18} />
              </Link>
            </div>
          </div>
          <div className="min-w-0">
            {visual === "theater" ? (
              <Theater
                scene="escrowFlow"
                caption="Illustration of how an escrow payment moves from booking to payout."
              />
            ) : (
              <MoneyPath bid={formatUsd(carrierAmountCents)} total={formatUsd(shipperTotalCents)} />
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}

function MoneyPath({ bid, total }: { bid: string; total: string }) {
  const stops = [
    { art: null, title: "You book", detail: `${total} paid by card or bank`, when: "At booking" },
    {
      art: EscrowShield,
      title: "Escrow holds it",
      detail: "Stripe keeps the money during the trip",
      when: "Pickup to delivery",
    },
    { art: Truck, title: "Carrier is paid", detail: `${bid}, 100% of the bid`, when: "After you confirm" },
  ];
  return (
    <ol aria-label="How the money moves" className="medium:grid-cols-3 medium:gap-6 relative grid gap-8">
      <span
        aria-hidden="true"
        className="border-outline-variant medium:block absolute top-12 right-[16%] left-[16%] hidden border-t-2 border-dashed"
      />
      {stops.map(({ art: Art, title, detail, when }, i) => (
        <li
          key={title}
          className="medium:flex medium:flex-col medium:text-center relative grid grid-cols-[96px_minmax(0,1fr)] items-center gap-4"
        >
          <span className="border-outline-variant bg-surface flex size-24 items-center justify-center rounded-full border">
            {Art ? (
              <Art className="w-16" />
            ) : (
              <span className="text-label-lg text-primary font-mono tabular-nums">{total}</span>
            )}
          </span>
          <span>
            <span className="text-label-md text-on-surface-variant block font-mono tracking-wide uppercase">
              {String(i + 1).padStart(2, "0")} · {when}
            </span>
            <span className="text-title-md text-on-surface mt-1 block">{title}</span>
            <span className="text-body-md text-on-surface-variant mt-1 block text-pretty">{detail}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}
