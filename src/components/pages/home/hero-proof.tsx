import { Icon } from "@/components/ui/icon";
import { starIcon } from "@/components/ui/icons.generated";
import type { ReviewSummary } from "@/server/showcase/queries";

export function HeroProof({ summary }: { summary: ReviewSummary }) {
  if (summary.count < 3 || !summary.average) return null;
  const rounded = Math.round(summary.average);
  return (
    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-body-md text-on-surface-variant">
      <span className="inline-flex text-primary" role="img" aria-label={`Rated ${summary.average.toFixed(1)} out of 5`}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Icon key={n} icon={starIcon} filled={n <= rounded} size={20} className={n <= rounded ? "" : "text-outline-variant"} />
        ))}
      </span>
      <span>
        <span className="text-title-sm text-on-surface">{summary.average.toFixed(1)}</span> from {summary.count} verified shipper reviews after completed loads
      </span>
    </p>
  );
}
