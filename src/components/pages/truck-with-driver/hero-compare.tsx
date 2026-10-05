import { compareColumns, compareRows } from "./content";

export function HeroCompare() {
  return (
    <div className="overflow-hidden rounded-xl bg-surface-container-low">
      <div className="overflow-x-auto" role="region" aria-labelledby="twd-compare-caption" tabIndex={0}>
        <table className="w-full min-w-[520px] border-collapse text-left">
          <caption id="twd-compare-caption" className="px-5 pt-5 pb-2 text-left text-title-md text-on-surface">
            Truck with driver on AllShip AI, compared
          </caption>
          <thead>
            <tr className="text-label-lg text-on-surface-variant">
              <th scope="col" className="px-5 py-3 font-medium">
                <span className="sr-only">Feature</span>
              </th>
              {compareColumns.map((c, i) => (
                <th key={c} scope="col" className={i === 0 ? "bg-primary-container px-4 py-3 font-medium text-on-primary-container" : "px-4 py-3 font-medium"}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {compareRows.map((row) => (
              <tr key={row.label} className="border-t border-outline-variant align-top">
                <th scope="row" className="px-5 py-3 text-label-lg font-medium text-on-surface">
                  {row.label}
                </th>
                {row.cells.map((cell, i) => (
                  <td key={i} className={i === 0 ? "bg-primary-container/45 px-4 py-3 text-body-md font-medium text-on-surface" : "px-4 py-3 text-body-md text-on-surface-variant"}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
