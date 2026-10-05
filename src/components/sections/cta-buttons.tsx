import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import type { Cta } from "./types";

export function CtaButtons({ ctas, size = "lg", className, onDark = false }: { ctas: Cta[]; size?: "md" | "lg"; className?: string; onDark?: boolean }) {
  if (!ctas.length) return null;
  return (
    <div className={cn("flex flex-wrap gap-3", className)}>
      {ctas.map((cta, i) => {
        const variant = cta.variant ?? (i === 0 ? "filled" : "outlined");
        const darkClass = onDark ? (variant === "filled" ? "bg-surface text-primary" : variant === "outlined" ? "border-on-primary/70 text-on-primary" : "text-on-primary") : undefined;
        return (
          <Button key={cta.href + cta.label} asChild size={size} variant={variant} className={darkClass}>
            <Link href={cta.href} data-track={cta.track}>
              {cta.label}
            </Link>
          </Button>
        );
      })}
    </div>
  );
}
