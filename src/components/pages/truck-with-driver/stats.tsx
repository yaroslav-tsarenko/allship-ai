import { Container } from "@/components/marketing/section";
import { getMarketplaceStats, MIN_COMPLETED_LOADS, MIN_REVIEWS, MIN_VERIFIED_CARRIERS } from "@/components/pages/partners/stats";

const number = new Intl.NumberFormat("en-US");

export async function MarketplaceStatsRow() {
  const s = await getMarketplaceStats();
  const items = [
    s.completedLoads >= MIN_COMPLETED_LOADS ? { value: number.format(s.completedLoads), label: "Loads completed on AllShip AI" } : null,
    s.verifiedCarriers >= MIN_VERIFIED_CARRIERS ? { value: number.format(s.verifiedCarriers), label: "FMCSA-verified carriers" } : null,
    s.reviews >= MIN_REVIEWS && s.averageRating !== null ? { value: `${s.averageRating.toFixed(1)}/5`, label: `Average from ${number.format(s.reviews)} shipper reviews` } : null,
  ].filter((x): x is { value: string; label: string } => x !== null);
  if (!items.length) return null;
  const [lead, ...rest] = items;
  return (
    <section aria-label="AllShip AI in numbers" className="py-10 medium:py-14">
      <Container>
        <div className="grid gap-8 border-y border-outline-variant py-8 large:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] large:items-center">
          <dl className="flex flex-col-reverse">
            <dt className="mt-1 text-title-md text-on-surface-variant">{lead!.label}</dt>
            <dd className="text-display-md font-normal tracking-tight text-primary tabular-nums">{lead!.value}</dd>
          </dl>
          {rest.length > 0 && (
            <dl className="grid gap-6 medium:grid-cols-2 large:border-l large:border-outline-variant large:pl-10">
              {rest.map((item) => (
                <div key={item.label} className="flex flex-col-reverse">
                  <dt className="mt-1 text-body-lg text-on-surface-variant">{item.label}</dt>
                  <dd className="text-headline-lg text-on-surface tabular-nums">{item.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </Container>
    </section>
  );
}
