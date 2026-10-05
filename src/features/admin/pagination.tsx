import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { arrowBackIcon, arrowForwardIcon } from "@/components/ui/icons.generated";
import { cn } from "@/lib/cn";
import { ADMIN_PAGE_SIZE } from "@/server/admin/queries";

function PageLink({ href, label, icon }: { href: string | null; label: string; icon: typeof arrowBackIcon }) {
  const cls = "inline-flex size-10 items-center justify-center rounded-full";
  if (!href)
    return (
      <span aria-disabled="true" className={cn(cls, "text-on-surface/38")}>
        <Icon icon={icon} size={20} label={label} />
      </span>
    );
  return (
    <Link href={href} scroll={false} className={cn(cls, "state-layer text-on-surface-variant")} aria-label={label} title={label}>
      <Icon icon={icon} size={20} />
    </Link>
  );
}

export function Pagination({ page, pageCount, total, hrefFor }: { page: number; pageCount: number; total: number; hrefFor: (page: number) => string }) {
  const from = total === 0 ? 0 : (page - 1) * ADMIN_PAGE_SIZE + 1;
  const to = Math.min(total, page * ADMIN_PAGE_SIZE);
  return (
    <div className="flex items-center justify-end gap-2 border-t border-outline-variant px-4 py-1 text-body-md text-on-surface-variant">
      <span className="mr-2 tabular-nums">
        {from.toLocaleString("en-US")}–{to.toLocaleString("en-US")} of {total.toLocaleString("en-US")}
      </span>
      <PageLink href={page > 1 ? hrefFor(page - 1) : null} label="Previous page" icon={arrowBackIcon} />
      <PageLink href={page < pageCount ? hrefFor(page + 1) : null} label="Next page" icon={arrowForwardIcon} />
    </div>
  );
}
