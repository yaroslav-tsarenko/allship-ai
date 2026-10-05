import type { ComponentType } from "react";
import { EscrowShield, RoutePin, VerifiedBadge } from "@/components/theater/illustrations";
import type { IllustrationProps } from "@/components/theater/illustrations";
import { Icon } from "@/components/ui/icon";
import { starIcon } from "@/components/ui/icons.generated";
import { site } from "@/content/site";
import { cn } from "@/lib/cn";
import { getReviewSummary } from "@/server/showcase/queries";

type TrustItem = { art: ComponentType<IllustrationProps>; title: string; text: string };

const items: TrustItem[] = [
  {
    art: EscrowShield,
    title: "Escrow through Stripe",
    text: "Your payment waits in escrow and is released to the carrier only after delivery.",
  },
  {
    art: VerifiedBadge,
    title: "FMCSA-verified carriers",
    text: "USDOT number, operating authority and insurance are checked before anyone can bid.",
  },
  {
    art: RoutePin,
    title: `Bid + ${site.platformFeePercent}%, nothing else`,
    text: "You see the carrier's price and our service fee before you pay. Posting is free.",
  },
];

async function ReviewCell() {
  const summary = await getReviewSummary();
  if (summary.count < 3 || !summary.average) return null;
  return (
    <li className="flex items-center gap-4 py-5">
      <span className="text-display-sm text-on-surface font-mono leading-none tabular-nums">
        {summary.average.toFixed(1)}
      </span>
      <span className="flex flex-col gap-1">
        <span
          className="text-warning inline-flex"
          role="img"
          aria-label={`${summary.average.toFixed(1)} out of 5 stars`}
        >
          {[1, 2, 3, 4, 5].map((i) => (
            <Icon key={i} icon={starIcon} size={16} filled={i <= Math.round(summary.average ?? 0)} />
          ))}
        </span>
        <span className="text-body-sm text-on-surface-variant">
          {summary.count.toLocaleString("en-US")} reviews from completed loads
        </span>
      </span>
    </li>
  );
}

export function TrustStrip({
  className,
  reviews = true,
  compact = false,
  vertical = false,
}: {
  className?: string;
  reviews?: boolean;
  compact?: boolean;
  vertical?: boolean;
}) {
  return (
    <ul
      aria-label="Why it is safe to book here"
      className={cn(
        "divide-outline-variant border-outline-variant grid divide-y border-y",
        !vertical &&
          "expanded:grid-flow-col expanded:auto-cols-fr expanded:divide-x expanded:divide-y-0 expanded:py-5 expanded:[&>li]:px-6 expanded:[&>li]:py-1 expanded:[&>li:first-child]:pl-0",
        className,
      )}
    >
      {items.map(({ art: Art, title, text }) => (
        <li key={title} className="grid grid-cols-[48px_minmax(0,1fr)] items-start gap-4 py-5">
          <Art className="w-12" />
          <div>
            <p className="text-title-md text-on-surface">{title}</p>
            {!compact && <p className="text-body-md text-on-surface-variant mt-1 text-pretty">{text}</p>}
          </div>
        </li>
      ))}
      {reviews && <ReviewCell />}
    </ul>
  );
}
