import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type DataTableProps = {
  caption: string;
  showCaption?: boolean;
  columns: ReactNode[];
  rows: ReactNode[][];
  minWidth?: number;
  footnote?: ReactNode;
  className?: string;
  numericFrom?: number;
};

export function DataTable({
  caption,
  showCaption = false,
  columns,
  rows,
  minWidth = 520,
  footnote,
  className,
  numericFrom,
}: DataTableProps) {
  return (
    <div className={cn("min-w-0", className)}>
      <div className="divide-outline-variant border-outline-variant medium:hidden divide-y rounded-md border">
        {showCaption && <p className="text-title-md text-on-surface px-4 pt-4 pb-3">{caption}</p>}
        {rows.map((row, r) => (
          <div key={r} className="px-4 py-4">
            <p className="text-title-md text-on-surface">{row[0]}</p>
            <dl>
              {row.slice(1).map((cell, c) => (
                <div key={c} className="mt-2">
                  <dt className="text-label-md text-on-surface-variant">{columns[c + 1]}</dt>
                  <dd
                    className={cn(
                      "text-body-lg text-on-surface-variant text-pretty",
                      numericFrom !== undefined &&
                        c + 1 >= numericFrom &&
                        "text-on-surface font-mono tabular-nums",
                    )}
                  >
                    {cell}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
      <div
        className="border-outline-variant medium:block hidden overflow-x-auto rounded-md border"
        role="region"
        aria-label={caption}
        tabIndex={0}
      >
        <table className="w-full border-collapse text-left" style={{ minWidth }}>
          <caption
            className={cn(
              showCaption ? "text-title-md text-on-surface medium:px-6 px-4 pt-4 pb-2 text-left" : "sr-only",
            )}
          >
            {caption}
          </caption>
          <thead className="bg-surface-container-low">
            <tr>
              {columns.map((col, i) => (
                <th
                  key={i}
                  scope="col"
                  className={cn(
                    "text-label-lg text-on-surface-variant medium:px-6 px-4 py-3 align-bottom font-medium",
                    numericFrom !== undefined && i >= numericFrom && "text-right",
                  )}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, r) => (
              <tr key={r} className="border-outline-variant border-t">
                {row.map((cell, c) =>
                  c === 0 ? (
                    <th
                      key={c}
                      scope="row"
                      className="text-body-lg text-on-surface medium:px-6 px-4 py-4 align-top font-medium"
                    >
                      {cell}
                    </th>
                  ) : (
                    <td
                      key={c}
                      className={cn(
                        "text-body-lg text-on-surface-variant medium:px-6 px-4 py-4 align-top",
                        numericFrom !== undefined &&
                          c >= numericFrom &&
                          "text-on-surface text-right font-mono tabular-nums",
                      )}
                    >
                      {cell}
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {footnote && <p className="text-body-md text-on-surface-variant mt-3 text-pretty">{footnote}</p>}
    </div>
  );
}
