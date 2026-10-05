import { Icon } from "@/components/ui/icon";
import { starIcon, verifiedIcon } from "@/components/ui/icons.generated";
import { getMarketplaceStats, MIN_REVIEWS, MIN_VERIFIED_CARRIERS } from "./stats";

const number = new Intl.NumberFormat("en-US");

export async function HeroProof() {
  const stats = await getMarketplaceStats();
  const showCarriers = stats.verifiedCarriers >= MIN_VERIFIED_CARRIERS;
  const showRating = stats.reviews >= MIN_REVIEWS && stats.averageRating !== null;
  if (!showCarriers && !showRating) return null;
  return (
    <ul className="flex flex-wrap gap-x-10 gap-y-4 border-t border-outline-variant pt-6">
      {showCarriers && (
        <li className="flex items-center gap-3">
          <Icon icon={verifiedIcon} filled className="text-primary" />
          <div>
            <span className="block text-body-md text-on-surface-variant">FMCSA-verified carriers</span>
            <span className="block text-title-lg text-on-surface tabular-nums">{number.format(stats.verifiedCarriers)}</span>
          </div>
        </li>
      )}
      {showRating && (
        <li className="flex items-center gap-3">
          <Icon icon={starIcon} filled className="text-primary" />
          <div>
            <span className="block text-body-md text-on-surface-variant">Average from {number.format(stats.reviews)} shipper reviews</span>
            <span className="block text-title-lg text-on-surface tabular-nums">{stats.averageRating?.toFixed(1)} / 5</span>
          </div>
        </li>
      )}
    </ul>
  );
}
