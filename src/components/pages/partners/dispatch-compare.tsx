import { dispatchCompare } from "./content";

export function DispatchCompare() {
  return (
    <div className="mt-12 border-t border-outline-variant pt-8">
      <h3 className="text-headline-sm text-balance text-on-surface">Self-dispatch or the dispatch service</h3>
      <div className="mt-6 -mx-4 overflow-x-auto px-4 medium:mx-0 medium:px-0" role="region" aria-label="Self-dispatch compared with the dispatch service" tabIndex={0}>
        <table className="w-full min-w-[560px] border-collapse text-left">
          <thead>
            <tr className="border-b border-outline-variant text-label-lg text-on-surface-variant">
              <th scope="col" className="w-[34%] py-3 pr-4 font-medium">
                <span className="sr-only">Question</span>
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Self-dispatch
              </th>
              <th scope="col" className="px-4 py-3 font-medium text-primary">
                Dispatch service
              </th>
            </tr>
          </thead>
          <tbody>
            {dispatchCompare.map((row) => (
              <tr key={row.label} className="border-b border-outline-variant">
                <th scope="row" className="py-4 pr-4 text-title-sm font-medium text-on-surface">
                  {row.label}
                </th>
                <td className="px-4 py-4 text-body-lg text-on-surface-variant">{row.self}</td>
                <td className="px-4 py-4 text-body-lg text-on-surface">{row.service}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
