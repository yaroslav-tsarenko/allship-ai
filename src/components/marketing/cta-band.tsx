import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Container } from "./section";

export function CtaBand({
  title,
  description,
  primary = { label: "Get a quote", href: "/quote" },
  secondary,
  aside,
}: {
  title: string;
  description?: ReactNode;
  primary?: { label: string; href: string };
  secondary?: { label: string; href: string };
  aside?: ReactNode;
}) {
  return (
    <section className="py-16 medium:py-20">
      <Container>
        <div className="grid items-center gap-8 rounded-xl bg-primary px-6 py-10 text-on-primary medium:px-12 medium:py-14 large:grid-cols-[1.4fr_1fr]">
          <div>
            <h2 className="text-headline-lg font-normal text-balance medium:text-display-sm">{title}</h2>
            {description && <p className="mt-4 max-w-[620px] text-body-lg text-pretty">{description}</p>}
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-surface text-primary hover:shadow-elevation-1">
                <Link href={primary.href}>{primary.label}</Link>
              </Button>
              {secondary && (
                <Button asChild size="lg" variant="outlined" className="border-on-primary/70 text-on-primary">
                  <Link href={secondary.href}>{secondary.label}</Link>
                </Button>
              )}
            </div>
          </div>
          {aside}
        </div>
      </Container>
    </section>
  );
}
