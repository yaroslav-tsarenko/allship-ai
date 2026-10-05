import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { arrowForwardIcon } from "@/components/ui/icons.generated";
import type { Category } from "@/content/categories";
import { cn } from "@/lib/cn";

export function CategoryIndex({ items, columns = 2, className }: { items: Category[]; columns?: 1 | 2; className?: string }) {
  return (
    <ul className={cn("grid border-t border-outline-variant", columns === 2 && "expanded:grid-cols-2 expanded:gap-x-12", className)}>
      {items.map((c) => (
        <li key={c.slug} className="border-b border-outline-variant">
          <Link href={`/services/${c.slug}`} className="group flex items-start gap-4 py-5 focus-visible:outline-offset-4">
            {c.image.cutout && (
              <span className="flex h-14 w-16 shrink-0 items-center justify-center rounded-sm bg-white">
                <Image src={c.image.src} alt="" width={c.image.width} height={c.image.height} className="h-auto max-h-12 w-auto max-w-14" sizes="56px" />
              </span>
            )}
            <span className="min-w-0 flex-1">
              <span className="block text-title-lg text-on-surface group-hover:text-primary">{c.name}</span>
              <span className="mt-1 block text-body-md text-pretty text-on-surface-variant">{c.summary}</span>
            </span>
            <Icon icon={arrowForwardIcon} size={20} className="mt-1 shrink-0 text-on-surface-variant transition-transform duration-200 ease-standard group-hover:translate-x-1 group-hover:text-primary" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
