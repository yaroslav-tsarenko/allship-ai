import Image from "next/image";
import Link from "next/link";
import type { Category } from "@/content/categories";

export function VehicleRail({ items }: { items: Category[] }) {
  return (
    <ul className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 medium:-mx-8 medium:px-8 large:mx-0 large:grid large:grid-cols-5 large:gap-4 large:overflow-visible large:px-0">
      {items.map((c) => (
        <li key={c.slug} className="w-[168px] shrink-0 snap-start large:w-auto">
          <Link href={`/services/${c.slug}`} className="group block h-full rounded-md bg-surface-container-low p-2 transition-colors duration-200 ease-standard hover:bg-surface-container">
            <span className="flex h-28 items-center justify-center rounded-sm bg-white">
              <Image src={c.image.src} alt="" width={c.image.width} height={c.image.height} sizes="140px" className="h-auto max-h-24 w-auto max-w-[85%]" />
            </span>
            <span className="block px-2 pt-3 pb-2">
              <span className="block text-title-md text-on-surface group-hover:text-primary">{c.name}</span>
              <span className="mt-1 line-clamp-2 block text-body-sm text-on-surface-variant">{c.summary}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
