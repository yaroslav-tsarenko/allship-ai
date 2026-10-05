import Link from "next/link";
import { Description, ReadyToGetStarted } from "@/components/sections";
import { ClientReviews } from "@/components/sections/client-reviews";
import { Breadcrumbs } from "@/components/marketing/breadcrumbs";
import { Container } from "@/components/marketing/section";
import { enter } from "@/components/motion/enter";
import { RevealText } from "@/components/motion/reveal-text";
import { ScrubWords } from "@/components/motion/scroll";
import { LiveLine } from "@/components/pages/partners/live-line";
import { whyCompare, whyIntro, whySections } from "@/components/pages/why-choose-us/content";
import { FeatureSpotlight, TheaterTabs } from "@/components/theater";
import { Button } from "@/components/ui/button";
import { site } from "@/content/site";
import { buildMetadata, JsonLd } from "@/lib/seo";

export const revalidate = 3600;

const path = "/why-choose-us";
const title = "Why Choose AllShip AI: Verified Carriers, Real Bids, Escrow";
const description = `Faster bookings, FMCSA-checked carriers, AI pricing insight and a transparent ${site.platformFeePercent}% fee, with payment held in escrow until delivery. Why shippers choose AllShip AI.`;

export const metadata = buildMetadata({ title, description, path });

export default function WhyChooseUsPage() {
  return (
    <>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "WebPage", name: title, description, url: new URL(path, site.url).toString(), about: { "@id": `${site.url}/#organization` } }} />
      <header className="pt-6 pb-14 medium:pt-8 medium:pb-20">
        <Container>
          <Breadcrumbs items={[{ name: "Why choose us", path }]} />
          <div className="mt-10 grid gap-10 large:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] large:items-end large:gap-20 medium:mt-14">
            <div>
              <p className="mb-4 text-title-sm font-medium text-primary" {...enter(0)}>
                Why choose us
              </p>
              <h1 className="text-display-sm font-normal tracking-tight text-balance medium:text-display-lg">
                <RevealText>Why shippers and carriers choose AllShip AI</RevealText>
              </h1>
            </div>
            <div {...enter(3)}>
              <p className="text-body-lg text-pretty text-on-surface-variant medium:text-title-lg medium:font-normal">{whyIntro}</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button asChild size="lg" data-magnetic="">
                  <Link href="/quote" data-track="why_quote">
                    Get bids for your load
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outlined">
                  <Link href="/pricing">See pricing</Link>
                </Button>
              </div>
              <LiveLine className="mt-6" />
            </div>
          </div>
        </Container>
      </header>

      <section aria-label="Product tour" className="pb-16 medium:pb-24">
        <Container>
          <TheaterTabs
            label="AllShip AI product tour"
            caption="Illustrative demo of AllShip AI with sample data."
            tabs={[
              { scene: "postLoad", label: "Post" },
              { scene: "bidsCompare", label: "Compare" },
              { scene: "aiAssistant", label: "Ask AI" },
              { scene: "liveTracking", label: "Track" },
              { scene: "escrowFlow", label: "Pay" },
            ]}
          />
        </Container>
      </section>

      <section aria-labelledby="statement-title" className="bg-inverse-surface py-20 text-inverse-on-surface medium:py-28">
        <Container>
          <h2 id="statement-title" className="text-title-sm font-medium text-inverse-primary">
            The short version
          </h2>
          <ScrubWords
            text="Carriers compete for your load. Every one of them is checked before they can bid. Your money waits in escrow until the delivery is confirmed."
            accent={["compete", "checked", "escrow"]}
            className="mt-4 max-w-[1080px] text-headline-lg font-normal text-balance medium:text-display-md [&_.text-primary]:text-inverse-primary"
          />
        </Container>
      </section>

      <section aria-labelledby="compare-title" className="py-16 medium:py-24">
        <Container>
          <h2 id="compare-title" className="max-w-[760px] text-headline-lg font-normal text-balance medium:text-display-sm">
            Booking a truck the usual way, and on AllShip AI
          </h2>
          <div className="mt-8 -mx-4 overflow-x-auto px-4 medium:mx-0 medium:px-0" role="region" aria-label="The usual way compared with AllShip AI" tabIndex={0}>
            <table className="w-full min-w-[680px] border-collapse border-t border-on-surface text-left">
              <thead>
                <tr className="border-b border-outline-variant text-label-lg text-on-surface-variant">
                  <th scope="col" className="w-[22%] py-3 pr-4 font-medium">
                    <span className="sr-only">Step</span>
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    The usual way
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium text-primary">
                    On AllShip AI
                  </th>
                </tr>
              </thead>
              <tbody>
                {whyCompare.map((r) => (
                  <tr key={r.label} className="border-b border-outline-variant">
                    <th scope="row" className="py-4 pr-4 text-title-sm font-medium text-on-surface">
                      {r.label}
                    </th>
                    <td className="px-4 py-4 text-body-lg text-on-surface-variant">{r.old}</td>
                    <td className="px-4 py-4 text-body-lg text-on-surface">{r.ours}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Container>
      </section>

      <section aria-label="Every device" className="bg-surface-container-low py-20 medium:py-28">
        <Container>
          <FeatureSpotlight
            scene="adaptive"
            eyebrow="Desktop, tablet and phone"
            title="The same account on whatever is in your hand"
            description="Post from the office, compare bids on a tablet and confirm delivery from your phone. Every action works on every screen, and drivers run whole trips from a phone browser."
          />
        </Container>
      </section>

      <Description title="Nine reasons, in detail" eyebrow="What that means in practice" sections={whySections} toc />
      <ClientReviews placement="why-choose-us" />
      <ReadyToGetStarted />
    </>
  );
}
