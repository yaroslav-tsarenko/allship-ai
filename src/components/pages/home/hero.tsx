import Link from "next/link";
import type { ReactNode } from "react";
import { enter } from "@/components/motion/enter";
import { RevealText } from "@/components/motion/reveal-text";
import { Container } from "@/components/marketing/section";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { arrowForwardIcon, checkCircleIcon, swapHorizIcon } from "@/components/ui/icons.generated";
import { RouteField } from "@/components/webgl/route-field";
import { homeHero } from "./content";
import { getLiveBoardStats } from "./live-stats";
import { QuickQuote } from "./quick-quote";

const number = new Intl.NumberFormat("en-US");

async function LiveStrip() {
  const { openLoads, carrierStates } = await getLiveBoardStats();
  if (!openLoads && !carrierStates) return null;
  return (
    <p className="mt-8 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-body-md text-on-surface-variant" {...enter(6)}>
      <span aria-hidden="true" className="relative inline-flex size-2">
        <span className="absolute inset-0 rounded-full bg-success motion-safe:animate-ping motion-safe:[animation-duration:2.4s]" />
        <span className="relative size-2 rounded-full bg-success" />
      </span>
      {openLoads > 0 && (
        <Link href="/loads" className="underline-offset-4 hover:text-on-surface hover:underline">
          <span className="font-medium text-on-surface tabular-nums">{number.format(openLoads)}</span> open {openLoads === 1 ? "load" : "loads"} on the board right now
        </Link>
      )}
      {openLoads > 0 && carrierStates > 0 && <span aria-hidden="true">·</span>}
      {carrierStates > 0 && (
        <span>
          Verified carriers in <span className="font-medium text-on-surface tabular-nums">{carrierStates}</span> {carrierStates === 1 ? "state" : "states"}
        </span>
      )}
    </p>
  );
}

export function HomeHero({ proof }: { proof?: ReactNode }) {
  return (
    <section id="home-hero" aria-labelledby="hero-title" className="relative isolate overflow-hidden">
      <RouteField variant="hero" className="-z-10" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_62%_58%_at_50%_46%,var(--md-surface)_35%,color-mix(in_srgb,var(--md-surface)_55%,transparent)_70%,transparent_100%),linear-gradient(to_bottom,transparent_70%,var(--md-surface))]"
      />
      <Container className="flex min-h-[calc(100svh-4rem)] flex-col items-center justify-center pt-10 pb-14 text-center medium:pt-12 medium:pb-20">
        <div data-out="0.35" className="flex w-full flex-col items-center">
          <ul className="flex flex-wrap justify-center gap-2" {...enter(0)}>
            {homeHero.checkmarks.map((text) => (
              <li key={text} className="inline-flex h-8 items-center gap-1.5 rounded-sm bg-success-container pr-3 pl-2 text-label-lg font-medium text-on-success-container">
                <Icon icon={checkCircleIcon} filled size={18} />
                {text}
              </li>
            ))}
          </ul>
          <h1 id="hero-title" className="mt-5 max-w-[1040px] text-display-sm font-normal tracking-tight text-balance medium:text-display-lg large:text-display-xl">
            <RevealText>{homeHero.title}</RevealText>{" "}
            <span className="text-primary">
              <RevealText delay={180}>{homeHero.highlight}</RevealText>
            </span>
          </h1>
          <p className="mt-5 max-w-[780px] text-body-lg text-pretty text-on-surface-variant medium:text-title-lg medium:font-normal" {...enter(3)}>
            {homeHero.description}
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3" {...enter(4)}>
            <Button asChild size="lg" data-magnetic="">
              <Link href="/quote" data-track="hero_ship">
                Ship something
              </Link>
            </Button>
            <Button asChild size="lg" variant="outlined" className="bg-surface/70" data-magnetic="">
              <Link href="/partners" data-track="hero_carrier">
                Become a carrier
              </Link>
            </Button>
          </div>
        </div>
        <div id="hero-quote" className="mt-8 w-full scroll-mt-24" {...enter(5)}>
          <QuickQuote arrowIcon={<Icon icon={arrowForwardIcon} size={20} />} swapIcon={<Icon icon={swapHorizIcon} size={22} />} />
        </div>
        <LiveStrip />
        {proof && (
          <div className="mt-4 flex justify-center" {...enter(7)}>
            {proof}
          </div>
        )}
      </Container>
    </section>
  );
}
