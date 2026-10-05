import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Container } from "@/components/marketing/section";
import { Button } from "@/components/ui/button";
import { site } from "@/content/site";

export function PhotoCta({
  id = "final-cta",
  title,
  description,
  primary,
  secondary,
  image = { src: "/images/truck-at-dock.jpg", alt: "Box truck backed up to a loading dock" },
  note,
}: {
  id?: string;
  title: string;
  description?: ReactNode;
  primary: { label: string; href: string; track?: string };
  secondary?: { label: string; href: string };
  image?: { src: string; alt: string };
  note?: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="bg-inverse-surface relative isolate overflow-hidden text-white">
      <Image
        src={image.src}
        alt={image.alt}
        fill
        sizes="100vw"
        className="-z-20 scale-110 object-cover"
        data-speed="0.15"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(100deg,rgb(0_0_0/0.78)_0%,rgb(0_0_0/0.45)_50%,rgb(0_0_0/0.08)_100%)]"
      />
      <Container className="medium:py-28 py-20">
        <div className="max-w-[640px]">
          <h2 id={id} className="text-headline-lg medium:text-display-sm font-normal text-balance">
            {title}
          </h2>
          {description && (
            <p className="text-body-lg medium:text-title-lg medium:font-normal mt-4 text-pretty text-white/85">
              {description}
            </p>
          )}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild size="lg" data-magnetic="">
              <Link href={primary.href} data-track={primary.track}>
                {primary.label}
              </Link>
            </Button>
            {secondary && (
              <Button asChild size="lg" variant="outlined" className="border-white/70 text-white">
                <Link href={secondary.href}>{secondary.label}</Link>
              </Button>
            )}
          </div>
          <p className="text-body-md mt-6 text-white/75">
            {note ?? (
              <>
                Questions first?{" "}
                <a
                  href={site.phone.href}
                  data-track="click_to_call"
                  className="font-medium text-white underline underline-offset-4"
                >
                  {site.phone.display}
                </a>
              </>
            )}
          </p>
        </div>
      </Container>
    </section>
  );
}
