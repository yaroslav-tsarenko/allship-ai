import Image from "next/image";
import Link from "next/link";
import { Description, FAQSection, Introduction } from "@/components/sections";
import { ClientReviews } from "@/components/sections/client-reviews";
import { Breadcrumbs } from "@/components/marketing/breadcrumbs";
import { Container } from "@/components/marketing/section";
import { enter } from "@/components/motion/enter";
import { RevealText } from "@/components/motion/reveal-text";
import { complianceIntro, complianceSections, escrowSteps, privacyRows, proofItems, safetyFaq, safetyIntro, verificationSteps } from "@/components/pages/safety/content";
import { NumberedList } from "@/components/pages/safety/parts";
import { FeatureSpotlight, Theater } from "@/components/theater";
import { EscrowShield, VerifiedBadge } from "@/components/theater/illustrations";
import { Icon } from "@/components/ui/icon";
import { openInNewIcon } from "@/components/ui/icons.generated";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 3600;

const path = "/safety";
const title = "Safety & Compliance: Verified Carriers, Escrow, Proof of Delivery";
const description =
  "How AllShip AI protects every load: carriers checked with FMCSA and insurance confirmed before bidding, payment held in Stripe escrow until delivery, photo and signature proof.";

export const metadata = buildMetadata({ title, description, path });

const pillars = [
  { href: "#fmcsa", n: "01", label: "Verified carriers" },
  { href: "#escrow", n: "02", label: "Escrow payments" },
  { href: "#proof", n: "03", label: "Proof of delivery" },
  { href: "#privacy", n: "04", label: "Privacy" },
];

const link = "rounded-xs text-primary underline-offset-4 hover:underline";

export default function SafetyPage() {
  return (
    <>
      <header className="overflow-hidden pt-6 pb-14 medium:pt-8 medium:pb-20">
        <Container>
          <Breadcrumbs items={[{ name: "Safety", path }]} />
          <div className="mt-10 grid gap-12 large:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] large:items-center large:gap-20 medium:mt-14">
            <div data-out="0.3">
              <p className="mb-4 text-title-sm font-medium text-primary" {...enter(0)}>
                Safety and trust
              </p>
              <h1 className="text-display-sm font-normal tracking-tight text-balance medium:text-display-lg">
                <RevealText>Safety and compliance</RevealText>
              </h1>
              <p className="mt-6 max-w-[640px] text-body-lg text-pretty text-on-surface-variant medium:text-title-lg medium:font-normal" {...enter(3)}>
                {safetyIntro}
              </p>
            </div>
            <div className="relative" {...enter(4)}>
              <div className="relative hidden aspect-[4/5] max-h-[560px] overflow-hidden rounded-xl bg-surface-container large:block">
                <Image src="/images/household-load-strapped.jpg" alt="Household furniture strapped securely inside a truck" fill sizes="480px" className="object-cover" />
              </div>
              <div data-speed="0.15" aria-hidden="true" className="w-[150px] rounded-lg bg-surface p-3 shadow-elevation-2 large:absolute large:-bottom-6 large:-left-12 large:w-[190px]">
                <EscrowShield />
              </div>
            </div>
          </div>
          <nav aria-label="Safety topics" className="mt-16 grid grid-cols-2 border-t border-outline-variant medium:grid-cols-4">
            {pillars.map((p) => (
              <a key={p.href} href={p.href} className="state-layer flex items-baseline gap-3 border-b border-outline-variant py-4 pr-4 text-title-md text-on-surface medium:border-b-0">
                <span className="font-mono text-label-lg text-primary">{p.n}</span>
                {p.label}
              </a>
            ))}
          </nav>
        </Container>
      </header>

      <section id="fmcsa" aria-labelledby="fmcsa-title" className="scroll-mt-20 bg-surface-container-low py-20 medium:py-28">
        <Container>
          <div className="grid gap-12 large:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] large:gap-20">
            <div className="large:sticky large:top-24 large:self-start">
              <p className="text-title-sm font-medium text-primary">Compliance with FMCSA regulations</p>
              <h2 id="fmcsa-title" className="mt-3 text-headline-lg font-normal text-balance medium:text-display-sm">
                No carrier bids before these checks pass
              </h2>
              <p className="mt-5 max-w-[520px] text-body-lg text-pretty text-on-surface-variant">
                Carriers are responsible for their own FMCSA compliance, including operating authority and hours of service. Before a carrier can bid on AllShip AI, we check their registration with the Federal Motor Carrier Safety Administration. There is no way around the order.
              </p>
              <VerifiedBadge className="mt-8 max-w-[220px]" />
              <p className="mt-6 flex flex-col gap-2 text-title-sm font-medium">
                <Link href="/partners#requirements" className={link}>
                  Full carrier requirements
                </Link>
                <a href="https://safer.fmcsa.dot.gov/CompanySnapshot.aspx" target="_blank" rel="noopener noreferrer" className={`${link} inline-flex items-center gap-1.5`}>
                  Look up any carrier on FMCSA SAFER
                  <Icon icon={openInNewIcon} size={18} />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              </p>
            </div>
            <NumberedList items={verificationSteps} label="Carrier verification steps" />
          </div>
        </Container>
      </section>

      <section id="escrow" aria-labelledby="escrow-title" className="scroll-mt-20 py-20 medium:py-28">
        <Container>
          <div className="grid gap-6 large:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] large:items-end large:gap-16">
            <div>
              <p className="text-title-sm font-medium text-primary">Escrow: paid only after delivery</p>
              <h2 id="escrow-title" className="mt-3 text-headline-lg font-normal text-balance medium:text-display-sm">
                Your payment books the carrier. Delivery releases it.
              </h2>
            </div>
            <p className="text-body-lg text-pretty text-on-surface-variant medium:text-body-xl">
              Fees in full are on the{" "}
              <Link href="/pricing" className={link}>
                pricing page
              </Link>
              . Payments and payouts run through Stripe.
            </p>
          </div>
          <Theater scene="escrowFlow" className="mt-12" caption="Illustrative example with sample amounts." />
          <ol aria-label="Escrow payment steps" className="mt-12 grid gap-x-8 medium:grid-cols-2 large:grid-cols-5">
            {escrowSteps.map((step, i) => (
              <li key={step.title} className="border-t border-outline-variant py-5">
                <span className="font-mono text-title-md text-primary tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                <span className="mt-2 block text-title-md text-on-surface">{step.title}</span>
                <span className="mt-1 block text-body-md text-pretty text-on-surface-variant">{step.body}</span>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <section id="proof" aria-labelledby="proof-title" className="scroll-mt-20 bg-surface-container-low py-20 medium:py-28">
        <Container>
          <FeatureSpotlight
            scene="driverTrip"
            device="phone"
            reverse
            eyebrow="Proof of delivery, on the record"
            title={<span id="proof-title">Photos and a signature on every trip</span>}
            description="Drivers update the trip from their phone, and the app keeps what they capture with the load. If a question comes up, everyone looks at the same record."
          >
            <dl className="border-t border-outline-variant">
              {proofItems.map((p) => (
                <div key={p.title} className="grid grid-cols-[120px_1fr] gap-4 border-b border-outline-variant py-3">
                  <dt className="text-title-sm font-medium text-on-surface">{p.title}</dt>
                  <dd className="text-body-lg text-on-surface-variant">{p.body}</dd>
                </div>
              ))}
            </dl>
          </FeatureSpotlight>
        </Container>
      </section>

      <section id="privacy" aria-labelledby="privacy-title" className="scroll-mt-20 py-20 medium:py-28">
        <Container>
          <div className="grid gap-10 large:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] large:gap-20">
            <div>
              <p className="text-title-sm font-medium text-primary">Privacy</p>
              <h2 id="privacy-title" className="mt-3 text-headline-lg font-normal text-balance medium:text-display-sm">
                Who sees what
              </h2>
              <p className="mt-5 max-w-[460px] text-body-lg text-pretty text-on-surface-variant">
                All traffic to AllShip AI is encrypted. Read the{" "}
                <Link href="/privacy-policy" className={link}>
                  privacy policy
                </Link>{" "}
                for what we collect and why.
              </p>
            </div>
            <dl className="border-t border-on-surface">
              {privacyRows.map((r) => (
                <div key={r.what} className="grid gap-1 border-b border-outline-variant py-5 medium:grid-cols-[220px_1fr] medium:gap-6">
                  <dt className="text-title-md text-on-surface">{r.what}</dt>
                  <dd className="text-body-lg text-pretty text-on-surface-variant">{r.who}</dd>
                </div>
              ))}
            </dl>
          </div>
        </Container>
      </section>

      <Description id="compliance" title="Insurance and reviews" description={complianceIntro} sections={complianceSections} tone="low" />
      <Introduction
        title="Start easy shipping"
        description="Discover simplicity with AllShip AI, where verified carriers and protected payments are at your fingertips. Post your load for free, compare bids and pay only when you book."
        image={{ src: "/images/wrapped-cabinet-dock.jpg", alt: "A wrapped cabinet waiting on a loading dock", width: 960, height: 1280 }}
        cta={{ label: "Get started", href: "/quote", track: "safety_intro_quote" }}
        secondaryCta={{ label: "Haul as a carrier", href: "/partners" }}
      />
      <ClientReviews placement="safety" />
      <FAQSection items={safetyFaq} tone="low" />
    </>
  );
}
