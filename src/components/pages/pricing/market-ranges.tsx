import { formatUsdWhole } from "@/components/marketing/core/money";
import { marketRanges } from "./content";

export function MarketRanges() {
  return (
    <div className="border-t border-outline-variant pt-8" id="market-ranges">
      <p className="text-title-sm font-medium text-on-surface-variant">For reference, not AllShip AI packages</p>
      <h2 className="mt-2 text-headline-sm text-balance text-on-surface">Move with ease: typical moving company price ranges</h2>
      <p className="mt-4 text-body-lg text-pretty text-on-surface-variant">
        Use these to sanity-check the bids you get for a move. AllShip AI has no fixed packages: the carrier you choose sets the price.
      </p>
      <div className="mt-6 -mx-4 overflow-x-auto px-4 medium:mx-0 medium:px-0" role="region" aria-label="Typical moving price ranges" tabIndex={0}>
        <table className="w-full min-w-[600px] border-collapse border-t border-on-surface text-left">
          <caption className="sr-only">Typical price ranges charged by US moving companies, by home size</caption>
          <thead>
            <tr className="border-b border-outline-variant text-label-lg text-on-surface-variant">
              <th scope="col" className="py-3 pr-4 font-medium">
                Home size
              </th>
              <th scope="col" className="px-4 py-3 text-right font-medium">
                Typical range
              </th>
              <th scope="col" className="py-3 pl-4 font-medium">
                What that usually includes
              </th>
            </tr>
          </thead>
          <tbody>
            {marketRanges.map((r) => (
              <tr key={r.size} className="border-b border-outline-variant">
                <th scope="row" className="py-5 pr-4 text-title-md font-normal text-on-surface">
                  {r.size}
                </th>
                <td className="px-4 py-5 text-right font-mono text-title-md whitespace-nowrap text-on-surface">
                  {formatUsdWhole(r.low)}–{formatUsdWhole(r.high)}
                </td>
                <td className="py-5 pl-4 text-body-md text-on-surface-variant">{r.crew}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-body-sm text-on-surface-variant">Ranges vary by region, season and distance. They do not include the AllShip AI service fee.</p>
    </div>
  );
}
