import { Container } from "@/components/marketing/section";
import { Icon } from "@/components/ui/icon";
import { checkCircleIcon, closeIcon } from "@/components/ui/icons.generated";
import { cn } from "@/lib/cn";
import { SectionHeader } from "./section-header";
import { sectionId } from "./types";

export type ComparisonRow = { label?: string; cells: string[] };

export function ComparisonTable({
  title,
  description,
  columns,
  rows,
  highlight = columns.length - 1,
  rowHeader,
  note,
  id,
}: {
  title: string;
  description?: string;
  columns: string[];
  rows: ComparisonRow[];
  highlight?: number;
  rowHeader?: string;
  note?: string;
  id?: string;
}) {
  const headingId = id ?? sectionId("compare", title);
  const hasLabels = rows.some((r) => r.label);
  return (
    <section aria-labelledby={headingId} className="py-14 medium:py-20">
      <Container>
        <SectionHeader id={headingId} title={title} description={description} className="mb-10" />
        <div className="-mx-4 overflow-x-auto px-4 medium:mx-0 medium:px-0" tabIndex={0} role="region" aria-labelledby={headingId}>
          <table className="w-full min-w-[640px] border-separate border-spacing-0 text-left">
            <thead>
              <tr>
                {hasLabels && (
                  <th scope="col" className="border-b border-outline-variant px-4 py-4 text-title-sm text-on-surface-variant">
                    {rowHeader ?? <span className="sr-only">Feature</span>}
                  </th>
                )}
                {columns.map((c, i) => (
                  <th
                    key={c}
                    scope="col"
                    className={cn("border-b px-4 py-4 text-title-md", i === highlight ? "rounded-t-lg border-primary bg-primary-container text-on-primary-container" : "border-outline-variant text-on-surface-variant")}
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri}>
                  {hasLabels && (
                    <th scope="row" className="border-b border-outline-variant px-4 py-3.5 text-body-lg font-medium text-on-surface">
                      {row.label}
                    </th>
                  )}
                  {row.cells.map((cell, ci) => {
                    const hi = ci === highlight;
                    return (
                      <td
                        key={ci}
                        className={cn(
                          "border-b px-4 py-3.5 text-body-lg",
                          hi ? "border-primary/20 bg-primary-container/40 font-medium text-on-surface" : "border-outline-variant text-on-surface-variant",
                          hi && ri === rows.length - 1 && "rounded-b-lg",
                        )}
                      >
                        <span className="inline-flex items-start gap-2">
                          <Icon icon={hi ? checkCircleIcon : closeIcon} filled={hi} size={20} className={cn("mt-0.5 shrink-0", hi ? "text-primary" : "text-on-surface-variant/70")} />
                          <span>{cell}</span>
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {note && <p className="mt-4 text-body-sm text-on-surface-variant">{note}</p>}
      </Container>
    </section>
  );
}
