import { Icon } from "@/components/ui/icon";
import { checkIcon, removeIcon } from "@/components/ui/icons.generated";
import { aiCapabilities, aiNever, aiRoles } from "./content";

export function AiCapabilities() {
  return (
    <div>
      <div className="hidden expanded:block">
        <table className="w-full border-collapse text-left">
          <caption className="sr-only">What the AllShip AI assistant can do for each role</caption>
          <thead>
            <tr className="border-b border-outline">
              <th scope="col" className="w-[52%] py-3 pr-6 text-label-lg font-medium text-on-surface-variant">
                It can
              </th>
              {aiRoles.map((r) => (
                <th key={r.key} scope="col" className="w-[12%] px-2 py-3 text-center text-label-lg font-medium text-on-surface-variant">
                  {r.label}
                </th>
              ))}
            </tr>
          </thead>
          {aiCapabilities.map((g) => (
            <tbody key={g.group}>
              <tr>
                <th scope="colgroup" colSpan={5} className="pt-8 pb-2 text-title-sm font-medium text-primary">
                  {g.group}
                </th>
              </tr>
              {g.rows.map((row) => (
                <tr key={row.label} className="border-b border-outline-variant align-top">
                  <th scope="row" className="py-4 pr-6 font-normal">
                    <span className="block text-title-md text-on-surface">{row.label}</span>
                    <span className="mt-0.5 block text-body-md text-on-surface-variant">{row.detail}</span>
                  </th>
                  {aiRoles.map((r) => {
                    const on = row.roles.includes(r.key);
                    return (
                      <td key={r.key} className="px-2 py-4 text-center">
                        <Icon icon={on ? checkIcon : removeIcon} size={20} className={on ? "text-primary" : "text-outline-variant"} />
                        <span className="sr-only">{on ? "Yes" : "No"}</span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      </div>

      <div className="flex flex-col gap-10 expanded:hidden">
        {aiCapabilities.map((g) => (
          <section key={g.group} aria-label={g.group}>
            <h3 className="text-title-sm font-medium text-primary">{g.group}</h3>
            <ul className="mt-2 border-t border-outline-variant">
              {g.rows.map((row) => (
                <li key={row.label} className="border-b border-outline-variant py-4">
                  <p className="text-title-md text-on-surface">{row.label}</p>
                  <p className="mt-0.5 text-body-md text-on-surface-variant">{row.detail}</p>
                  <p className="mt-2 font-mono text-label-md text-on-surface-variant">
                    {row.roles.length === aiRoles.length ? "All roles" : aiRoles.filter((r) => row.roles.includes(r.key)).map((r) => r.label).join(" · ")}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <div className="mt-12 grid gap-6 border-t-2 border-on-surface pt-6 expanded:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] expanded:gap-12">
        <p className="text-headline-sm text-on-surface">It never</p>
        <ul className="grid gap-x-8 gap-y-3 medium:grid-cols-2">
          {aiNever.map((n) => (
            <li key={n} className="flex items-start gap-3 text-body-lg text-on-surface">
              <span aria-hidden="true" className="mt-3 h-px w-4 shrink-0 bg-error" />
              {n}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
