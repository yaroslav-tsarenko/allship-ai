import Link from "next/link";
import { cn } from "@/lib/cn";

export function CategoryTabs({ categories, active }: { categories: Array<{ slug: string; name: string }>; active?: string }) {
  const items = [{ slug: "", name: "All posts" }, ...categories];
  return (
    <nav aria-label="Blog topics" className="-mx-4 overflow-x-auto px-4">
      <ul className="flex gap-2 pb-1">
        {items.map((c) => {
          const isActive = (active ?? "") === c.slug;
          return (
            <li key={c.slug || "all"}>
              <Link
                href={c.slug ? `/blog/category/${c.slug}` : "/blog"}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "state-layer inline-flex h-9 items-center whitespace-nowrap rounded-sm border px-4 text-label-lg font-medium",
                  isActive ? "border-transparent bg-secondary-container text-on-secondary-container" : "border-outline text-on-surface-variant",
                )}
              >
                {c.name}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
