import Link from "next/link";
import type { ReactNode, TdHTMLAttributes, ThHTMLAttributes } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";

export function DataTable({ label, minWidth = 880, toolbar, footer, children }: { label: string; minWidth?: number; toolbar?: ReactNode; footer?: ReactNode; children: ReactNode }) {
  return (
    <Card as="section" aria-label={label} className="overflow-hidden">
      {toolbar}
      <div className="overflow-x-auto medium:max-h-[calc(100dvh-15rem)] medium:overflow-y-auto">
        <table className="w-full text-left text-body-md" style={{ minWidth }}>
          {children}
        </table>
      </div>
      {footer}
    </Card>
  );
}

export function Th({ className, numeric, ...rest }: ThHTMLAttributes<HTMLTableCellElement> & { numeric?: boolean }) {
  return (
    <th
      scope="col"
      className={cn("sticky top-0 z-10 border-b border-outline-variant bg-surface px-4 py-3 text-label-lg font-medium whitespace-nowrap text-on-surface-variant first:pl-6 last:pr-6", numeric && "text-right", className)}
      {...rest}
    />
  );
}

export function Td({ className, numeric, ...rest }: TdHTMLAttributes<HTMLTableCellElement> & { numeric?: boolean }) {
  return <td className={cn("px-4 py-2.5 align-middle first:pl-6 last:pr-6", numeric && "text-right tabular-nums", className)} {...rest} />;
}

export function Tr({ className, interactive, ...rest }: React.HTMLAttributes<HTMLTableRowElement> & { interactive?: boolean }) {
  return (
    <tr
      className={cn("border-b border-outline-variant last:border-b-0", interactive && "relative transition-colors duration-150 hover:bg-on-surface/8 has-[a:focus-visible]:bg-on-surface/10", className)}
      {...rest}
    />
  );
}

export function RowLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return (
    <Link href={href} className={cn("font-medium text-on-surface outline-none after:absolute after:inset-0 after:content-['']", className)}>
      {children}
    </Link>
  );
}

export function EmptyRow({ colSpan, title, detail }: { colSpan: number; title: string; detail?: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-6 py-14 text-center">
        <p className="text-title-md text-on-surface">{title}</p>
        {detail && <p className="mt-1 text-body-md text-on-surface-variant">{detail}</p>}
      </td>
    </tr>
  );
}

export function Mono({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("font-mono text-body-sm whitespace-nowrap text-on-surface-variant", className)}>{children}</span>;
}

export function Toolbar({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-3 border-b border-outline-variant px-4 py-3 medium:px-6 large:flex-row large:items-center large:justify-between">{children}</div>;
}
