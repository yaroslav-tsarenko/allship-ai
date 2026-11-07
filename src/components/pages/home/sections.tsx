import Link from "next/link";
import { ScrubWords, PinnedRow } from "@/components/motion/scroll";
import { Container } from "@/components/marketing/section";
import { FeatureSpotlight, TheaterTabs } from "@/components/theater";
import { VerifiedBadge } from "@/components/theater/illustrations";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { arrowForwardIcon, checkIcon, swapHorizIcon } from "@/components/ui/icons.generated";
import { RouteField } from "@/components/webgl/route-field";
import { authLinks, site } from "@/content/site";
import { homeAi, homeMinis, homeRoles } from "./content";
import { MiniStill } from "./mini-still";
import { QuickQuote } from "./quick-quote";
import { eyebrow } from "./shared";


export function HomeStatement() {
  return (
    <section aria-label="Pricing in one line" className="border-y border-outline-variant py-14 medium:py-20">
      <Container width="narrow">
        <ScrubWords
          text={`Posting is free. Carriers keep 100% of their bid. You pay the bid plus ${site.platformFeePercent}% only when you book, and it waits in escrow until delivery.`}
          accent={["free.", "100%", "escrow"]}
          className="text-headline-md text-balance text-on-surface medium:text-display-sm"
        />
      </Container>
    </section>
  );
}

export function HomeAi() {
  return (
    <section aria-label="AI assistant and devices" className="py-16 medium:py-24">
      <Container className="flex flex-col gap-24 medium:gap-32">
        <FeatureSpotlight scene="aiAssistant" eyebrow={homeAi.assistant.eyebrow} title={homeAi.assistant.title} description={homeAi.assistant.description}>
          <Link href="/ai" className="inline-flex items-center gap-1 rounded-xs text-label-lg font-medium text-primary underline-offset-4 hover:underline">
            What the AI can and can&apos;t do
            <Icon icon={arrowForwardIcon} size={16} />
          </Link>
        </FeatureSpotlight>
        <FeatureSpotlight scene="adaptive" reverse eyebrow={homeAi.adaptive.eyebrow} title={homeAi.adaptive.title} description={homeAi.adaptive.description} />
      </Container>
    </section>
  );
}

export function HomeRoles() {
  return (
    <section aria-labelledby="home-roles" className="bg-surface-container-low py-16 medium:py-24">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className={eyebrow}>Who it&apos;s for</p>
            <h2 id="home-roles" className="mt-3 max-w-[22ch] text-headline-lg text-balance text-on-surface medium:text-display-sm">
              One platform, four seats at the table
            </h2>
          </div>
          <p className="max-w-[46ch] text-body-lg text-pretty text-on-surface-variant">
            Shippers post. Carrier companies bid through their owner and dispatchers, and their drivers run the trip. Here is what each of them gets today.
          </p>
        </div>
        <ul className="mt-12 grid grid-cols-[minmax(0,1fr)] border-t border-outline-variant medium:grid-cols-2 large:grid-cols-4">
          {homeRoles.map((r, i) => (
            <li key={r.id} className={`flex min-w-0 flex-col border-b border-outline-variant py-6 medium:px-5 large:border-b-0 ${i % 2 === 1 ? "medium:border-l" : ""} ${i > 0 ? "large:border-l" : ""}`}>
              <span className="font-mono text-label-lg text-on-surface-variant tabular-nums">0{i + 1}</span>
              <h3 className="mt-2 text-headline-sm text-on-surface">{r.name}</h3>
              <p className="mt-1 text-body-md text-pretty text-on-surface-variant">{r.lead}</p>
              <ul className="mt-4 flex flex-col gap-1.5">
                {r.points.map((p) => (
                  <li key={p} className="flex gap-2 text-body-md text-on-surface">
                    <Icon icon={checkIcon} size={18} className="mt-0.5 shrink-0 text-primary" />
                    {p}
                  </li>
                ))}
              </ul>
              <div className="mt-auto flex flex-col items-start gap-1 pt-5">
                <Button asChild variant={i === 0 ? "filled" : "tonal"}>
                  <Link href={r.cta.href} data-track={`home_role_${r.id}`}>
                    {r.cta.label}
                  </Link>
                </Button>
                {r.secondary && (
                  <Button asChild variant="text">
                    <Link href={r.secondary.href}>{r.secondary.label}</Link>
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
        <TheaterTabs className="mt-14" label="See each seat in the product" tabs={homeRoles.map((r) => ({ scene: r.scene, label: r.name }))} />
      </Container>
    </section>
  );
}

export function HomeMinis() {
  return (
    <section aria-labelledby="home-minis" className="overflow-hidden py-16 medium:py-24">
      <PinnedRow label="Inside the product" trackClassName="items-stretch pr-8 large:pl-[max(2rem,calc((100vw-1280px)/2+2rem))]">
        <div className="flex w-[280px] shrink-0 flex-col medium:w-[360px]">
          <div className="flex items-center gap-3">
            <VerifiedBadge className="w-10" />
            <p className={eyebrow}>Inside the product</p>
          </div>
          <h2 id="home-minis" className="mt-3 text-headline-lg text-balance text-on-surface medium:text-display-sm">
            The small things that save a phone call
          </h2>
          <p className="mt-auto pt-6 text-body-md text-pretty text-on-surface-variant">
            Real screens from the AllShip AI app, shown with sample data. Scroll to see more.
          </p>
        </div>
        {homeMinis.map((m) => {
          return (
            <figure key={m.scene} className="w-[300px] shrink-0 medium:w-[440px]">
              <MiniStill scene={m.scene} />
              <figcaption className="mt-4 pr-6">
                <span className="block text-title-md text-on-surface">{m.title}</span>
                <span className="mt-1 block text-body-md text-pretty text-on-surface-variant">{m.text}</span>
              </figcaption>
            </figure>
          );
        })}
      </PinnedRow>
    </section>
  );
}

export function HomeFinalCta() {
  return (
    <section aria-labelledby="home-final" className="relative isolate overflow-hidden border-t border-outline-variant">
      <RouteField variant="plan" intensity={0.8} className="-z-10" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_62%_at_50%_50%,var(--md-surface)_30%,color-mix(in_srgb,var(--md-surface)_60%,transparent)_68%,transparent_100%)]"
      />
      <Container className="flex flex-col items-center py-20 text-center medium:py-28">
        <h2 id="home-final" className="max-w-[18ch] text-display-sm font-normal tracking-tight text-balance text-on-surface medium:text-display-md">
          Where is it going?
        </h2>
        <p className="mt-4 max-w-[52ch] text-body-lg text-pretty text-on-surface-variant medium:text-title-lg medium:font-normal">
          Enter two places to see mover prices instantly, or post any load free and let verified carriers bid.
        </p>
        <div className="mt-8 w-full">
          <QuickQuote id="final-qq" label="Start your quote" track="home_final_quick_quote" arrowIcon={<Icon icon={arrowForwardIcon} size={20} />} swapIcon={<Icon icon={swapHorizIcon} size={22} />} />
        </div>
        <p className="mt-8 text-body-md text-on-surface-variant">
          Hauling for a living?{" "}
          <Link href={authLinks.carrierSignUp.href} className="font-medium text-primary underline-offset-4 hover:underline" data-track="home_final_carrier">
            Create a carrier account
          </Link>{" "}
          or call{" "}
          <a href={site.phone.href} data-track="click_to_call" className="font-medium text-primary underline-offset-4 hover:underline">
            {site.phone.display}
          </a>
        </p>
      </Container>
    </section>
  );
}
