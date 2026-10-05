import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/marketing/section";
import { SectionHeader } from "@/components/sections";
import { Button } from "@/components/ui/button";
import { quoteHref, trucks } from "./content";

export function Trucks() {
  return (
    <section id="trucks" aria-labelledby="trucks-title" className="scroll-mt-20 py-16 medium:py-24">
      <Container>
        <SectionHeader
          id="trucks-title"
          title="Choose the truck that fits the job"
          description="Pick a size in your post. Carriers bid by the hour or at a flat price: hourly when the time is hard to predict, flat when the job is clearly defined."
          className="mb-12"
        />
        <ul className="grid gap-px overflow-hidden rounded-xl bg-outline-variant large:grid-cols-3">
          {trucks.map((truck) => (
            <li key={truck.title} className="flex flex-col bg-surface p-6 medium:p-8">
              <div className="-mx-2 flex h-[200px] items-end justify-center medium:h-[230px]">
                <Image src={truck.image.src} alt={truck.image.alt} sizes="(min-width: 1200px) 380px, (min-width: 600px) 60vw, 90vw" className="h-full w-auto max-w-full object-contain" />
              </div>
              <h3 className="mt-6 text-headline-sm text-on-surface">{truck.title}</h3>
              <p className="mt-2 text-body-lg text-pretty text-on-surface-variant">{truck.subtitle}</p>
              <p className="mt-6 text-label-lg text-on-surface-variant">Good for</p>
              <ul className="mt-2 flex flex-col gap-2">
                {truck.fits.map((fit) => (
                  <li key={fit} className="flex gap-3 text-body-lg text-on-surface">
                    <span aria-hidden="true" className="mt-3 h-px w-3 shrink-0 bg-primary" />
                    {fit}
                  </li>
                ))}
              </ul>
              <Button asChild variant="tonal" className="mt-8 self-start">
                <Link href={quoteHref} aria-label={`Rent truck: get bids for a ${truck.title.toLowerCase()} with a driver`}>
                  Rent Truck
                </Link>
              </Button>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
