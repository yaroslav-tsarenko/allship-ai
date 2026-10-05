import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { enter } from "@/components/motion/enter";
import { RevealText } from "@/components/motion/reveal-text";
import { ScrubWords, SectionProgress } from "@/components/motion/scroll";
import { Container } from "@/components/marketing/section";
import { VerifiedBadge } from "@/components/theater/illustrations";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { arrowForwardIcon, checkCircleIcon, openInNewIcon } from "@/components/ui/icons.generated";
import { RouteField } from "@/components/webgl/route-field";
import { authLinks, site } from "@/content/site";
import { partnersHero, payoutSteps, requirements, teamRoles } from "./content";
import { LiveLine } from "./live-line";
import { PayoutLedger } from "./payout-ledger";

export function PartnersHero({ proof }: { proof?: ReactNode }) {
  return (
    <section aria-labelledby="partners-title" className="relative isolate overflow-hidden pt-8 pb-16 medium:pt-12 medium:pb-24">
      <Container>
        <div className="grid items-center gap-12 large:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] large:gap-16">
          <div data-out="0.3">
            <ul className="flex flex-wrap gap-2" {...enter(0)}>
              {partnersHero.checkmarks.map((text) => (
                <li key={text} className="inline-flex h-8 items-center gap-1.5 rounded-sm bg-success-container pr-3 pl-2 text-label-lg font-medium text-on-success-container">
                  <Icon icon={checkCircleIcon} filled size={18} />
                  {text}
                </li>
              ))}
            </ul>
            <p className="mt-6 text-title-md font-medium text-primary medium:text-title-lg" {...enter(1)}>
              {partnersHero.kicker}
            </p>
            <h1 id="partners-title" className="mt-3 text-display-sm font-normal tracking-tight text-balance medium:text-display-lg">
              <RevealText>{partnersHero.title}</RevealText> <span className="text-primary"><RevealText delay={160}>{partnersHero.highlight}</RevealText></span>
            </h1>
            <p className="mt-6 max-w-[600px] text-body-lg text-pretty text-on-surface-variant medium:text-title-lg medium:font-normal" {...enter(3)}>
              {partnersHero.description}
            </p>
            <div className="mt-8 flex flex-wrap gap-3" {...enter(4)}>
              <Button asChild size="lg" data-magnetic="">
                <Link href={authLinks.carrierSignUp.href} data-track="partners_hero_carrier">
                  Become Carrier
                </Link>
              </Button>
              <Button asChild size="lg" variant="outlined">
                <Link href="/loads" data-track="partners_hero_board">
                  See open loads
                </Link>
              </Button>
              <Button asChild size="lg" variant="text">
                <Link href={authLinks.signUp.href} data-track="partners_hero_shipper">
                  Become Shipper
                </Link>
              </Button>
            </div>
            <div {...enter(5)}>
              <LiveLine className="mt-8" />
            </div>
            {proof && (
              <div className="mt-6" {...enter(6)}>
                {proof}
              </div>
            )}
          </div>
          <div className="relative" {...enter(3)}>
            <div className="relative hidden aspect-[5/6] overflow-hidden rounded-xl bg-surface-container large:block">
              <Image src="/images/truck-at-dock.jpg" alt="A box truck backed up to a loading dock" fill sizes="560px" className="object-cover" />
            </div>
            <div data-speed="0.18" className="medium:max-w-[400px] large:absolute large:bottom-10 large:-left-16 large:w-[360px]">
              <PayoutLedger bidCents={115_000} route={["Houston, TX", "Phoenix, AZ"]} compact />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

export function PayoutStory() {
  return (
    <section aria-labelledby="payout-title" className="bg-inverse-surface py-20 text-inverse-on-surface medium:py-28">
      <Container>
        <p className="text-title-sm font-medium text-inverse-primary">How you get paid</p>
        <h2 id="payout-title" className="sr-only">
          You keep 100% of your bid
        </h2>
        <ScrubWords
          text={`You quote $1,150. You receive $1,150. The ${site.platformFeePercent}% service fee is added to the shipper's total, never taken out of your bid.`}
          accent={["$1150", "receive", "never"]}
          className="mt-4 max-w-[1080px] text-headline-lg font-normal text-balance medium:text-display-md [&_.text-primary]:text-inverse-primary"
        />
        <SectionProgress className="mt-12 bg-inverse-primary" />
        <ol className="grid gap-x-10 border-t border-inverse-on-surface/20 medium:grid-cols-2 large:grid-cols-4">
          {payoutSteps.map((step, i) => (
            <li key={step.title} className="border-b border-inverse-on-surface/20 py-6 large:border-b-0" {...enter(i)}>
              <span className="font-mono text-title-md text-inverse-primary tabular-nums">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="mt-3 text-title-lg">{step.title}</h3>
              <p className="mt-2 text-body-lg text-pretty text-inverse-on-surface/75">{step.body}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}

export function LanesBand() {
  return (
    <section aria-labelledby="lanes-title" className="relative isolate overflow-hidden">
      <RouteField variant="section" className="-z-10" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(90deg,var(--md-surface)_0%,color-mix(in_srgb,var(--md-surface)_80%,transparent)_45%,transparent_80%)]" />
      <Container className="py-20 medium:py-28">
        <div className="max-w-[620px]">
          <p className="text-title-sm font-medium text-primary">Loads across the US</p>
          <h2 id="lanes-title" className="mt-3 text-headline-lg font-normal text-balance medium:text-display-sm">
            Moves, vehicles, freight and heavy equipment on one board
          </h2>
          <p className="mt-5 text-body-lg text-pretty text-on-surface-variant medium:text-body-xl">
            Shippers post loads with the details carriers price on: sizes, weights, vehicle types, access at each stop and a pickup window. The public board shows city and state; you see the full listing once you are verified.
          </p>
          <LiveLine className="mt-6" linkBoard={false} />
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/loads" data-track="partners_lanes_board">
                Browse the load board
              </Link>
            </Button>
            <Button asChild size="lg" variant="outlined" className="bg-surface/70">
              <Link href="#carrier-sign-up">Sign up to bid</Link>
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}

export function TeamRoles() {
  return (
    <div className="border-t border-outline-variant">
      {teamRoles.map((r) => (
        <div key={r.role} className="grid gap-1 border-b border-outline-variant py-4 medium:grid-cols-[140px_1fr] medium:gap-6">
          <p className="text-title-md text-on-surface">
            {r.role}
            <span className="block text-body-sm text-on-surface-variant">{r.sees}</span>
          </p>
          <p className="text-body-lg text-pretty text-on-surface-variant">{r.does}</p>
        </div>
      ))}
      <p className="mt-6 text-body-lg text-on-surface-variant">
        Drivers join by email invitation.{" "}
        <Link href="/drivers" className="rounded-xs text-primary underline-offset-4 hover:underline">
          What drivers do on a trip
        </Link>
      </p>
    </div>
  );
}

export function Requirements() {
  return (
    <section id="requirements" aria-labelledby="requirements-title" className="scroll-mt-20 py-20 medium:py-28">
      <Container>
        <div className="grid gap-12 large:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] large:gap-20">
          <div className="large:sticky large:top-24 large:self-start">
            <p className="text-title-sm font-medium text-primary">Legal and insurance requirements</p>
            <h2 id="requirements-title" className="mt-3 text-headline-lg font-normal text-balance medium:text-display-sm">
              Five checks, then bidding opens
            </h2>
            <p className="mt-5 max-w-[520px] text-body-lg text-pretty text-on-surface-variant">
              AllShip AI holds every carrier to the same rules. The verified badge shippers see on your bids means all of these were confirmed.
            </p>
            <VerifiedBadge className="mt-8 max-w-[240px]" />
            <a
              href="https://safer.fmcsa.dot.gov/CompanySnapshot.aspx"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-1.5 rounded-xs text-title-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              Check your record on FMCSA SAFER
              <Icon icon={openInNewIcon} size={18} />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </div>
          <ol className="border-t border-outline-variant">
            {requirements.map((r, i) => (
              <li key={r.term} className="grid grid-cols-[3rem_1fr] gap-x-4 border-b border-outline-variant py-6">
                <span className="font-mono text-title-lg text-primary tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                <span>
                  <h3 className="text-title-lg text-on-surface">{r.term}</h3>
                  <span className="mt-1 block text-body-lg text-pretty text-on-surface-variant">{r.body}</span>
                </span>
              </li>
            ))}
            <li className="grid grid-cols-[3rem_1fr] gap-x-4 py-6">
              <Icon icon={arrowForwardIcon} className="mt-1 text-primary" />
              <span className="text-title-lg text-on-surface">Bidding opens on every load in your lanes</span>
            </li>
          </ol>
        </div>
      </Container>
    </section>
  );
}
