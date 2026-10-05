import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { chevronRightIcon } from "@/components/ui/icons.generated";
import { JsonLd, jsonLd } from "@/lib/seo";

export type Crumb = { name: string; path: string };

export function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  return (
    <>
      <JsonLd data={jsonLd.breadcrumbs(items)} />
      <nav aria-label="Breadcrumb" className={className}>
        <ol className="flex flex-wrap items-center gap-1 text-body-md text-on-surface-variant">
          <li>
            <Link href="/" className="rounded-xs hover:text-on-surface hover:underline">
              Home
            </Link>
          </li>
          {items.map((item, i) => (
            <li key={item.path} className="flex items-center gap-1">
              <Icon icon={chevronRightIcon} size={16} />
              {i === items.length - 1 ? (
                <span aria-current="page" className="text-on-surface">
                  {item.name}
                </span>
              ) : (
                <Link href={item.path} className="rounded-xs hover:text-on-surface hover:underline">
                  {item.name}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
