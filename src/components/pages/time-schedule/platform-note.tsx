import Link from "next/link";

export function PlatformNote({ title, items, cta }: { title: string; items: string[]; cta: { label: string; href: string } }) {
  return (
    <aside aria-label={title} className="border-l-2 border-primary pl-5">
      <p className="text-title-md text-on-surface">{title}</p>
      <ol className="mt-4 flex flex-col gap-3 text-body-md text-pretty text-on-surface-variant">
        {items.map((item, i) => (
          <li key={item} className="grid grid-cols-[20px_1fr] gap-2">
            <span className="font-mono text-label-lg text-primary tabular-nums">{i + 1}</span>
            <span>{item}</span>
          </li>
        ))}
      </ol>
      <Link href={cta.href} className="mt-5 inline-flex min-h-12 items-center rounded-xs text-title-sm font-medium text-primary underline-offset-4 hover:underline">
        {cta.label} →
      </Link>
    </aside>
  );
}
