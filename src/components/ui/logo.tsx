import Link from "next/link";
import { cn } from "@/lib/cn";

export function Logo({ className, height = 28, href = "/" }: { className?: string; height?: number; href?: string }) {
  const width = Math.round((704 / 165) * height);
  return (
    <Link href={href} aria-label="AllShip AI home" className={cn("inline-flex items-center", className)}>
      <picture className="block dark:hidden">
        <img src="/brand/logo.svg" alt="AllShip AI" width={width} height={height} decoding="async" className="block" />
      </picture>
      <picture className="hidden dark:block">
        <img src="/brand/logo-dark.svg" alt="" aria-hidden="true" width={width} height={height} loading="lazy" decoding="async" className="block" />
      </picture>
    </Link>
  );
}
