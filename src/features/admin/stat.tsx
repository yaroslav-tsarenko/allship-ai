import Link from "next/link";
import { cn } from "@/lib/cn";

export function Stat({ label, value, display, href, hint, emphasis }: { label: string; value: number; display?: string; href?: string; hint?: string; emphasis?: boolean }) {
  return (
    <div className={cn("relative -m-3 rounded-md p-3", href && "state-layer has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-primary")}>
      <dt className="text-label-lg text-on-surface-variant">
        {href ? (
          <Link href={href} className="outline-none after:absolute after:inset-0 after:content-['']">
            {label}
          </Link>
        ) : (
          label
        )}
      </dt>
      <dd className={cn("mt-1 font-mono tabular-nums text-on-surface", emphasis ? "text-headline-lg" : "text-headline-md")}>
        <data value={value} data-count-up={value}>
          {display ?? value.toLocaleString("en-US")}
        </data>
      </dd>
      {hint && <dd className="mt-0.5 text-body-sm text-on-surface-variant">{hint}</dd>}
    </div>
  );
}
