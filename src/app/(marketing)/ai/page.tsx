import Link from "next/link";
import { Breadcrumbs } from "@/components/marketing/breadcrumbs";
import { CtaBand } from "@/components/marketing/cta-band";
import { Container, DisplayHeading, Eyebrow, Lead, Section, SectionHeading } from "@/components/marketing/section";
import { enter } from "@/components/motion/enter";
import { ScrubWords } from "@/components/motion/scroll";
import { AiCapabilities } from "@/components/pages/ai/capabilities";
import { aiFaq, aiWorld } from "@/components/pages/ai/content";
import { CtaButtons, Description, FAQSection } from "@/components/sections";
import { FeatureSpotlight, Theater } from "@/components/theater";
import { Icon } from "@/components/ui/icon";
import { arrowForwardIcon } from "@/components/ui/icons.generated";
import { authLinks } from "@/content/site";
import { buildMetadata, JsonLd, jsonLd } from "@/lib/seo";

const path = "/ai";
const description =
  "The AllShip AI assistant drafts loads from a plain description, estimates prices, compares carrier bids and keeps you updated on every shipment. Free for shippers.";

export const metadata = buildMetadata({ title: "AI Tools for Shipping and Moving", description, path });

const link = "text-primary underline decoration-primary/40 underline-offset-4 hover:decoration-primary";

export default function AiPage() {
  return (
    <>
      <JsonLd data={jsonLd.webApplication({ name: "AllShip AI assistant", description, path })} />

      <Section spacing="none" className="pt-6 pb-16 medium:pt-8 medium:pb-24">
        <Breadcrumbs items={[{ name: "AI tools", path }]} />
        <div className="mt-10 grid grid-cols-[minmax(0,1fr)] items-center gap-12 medium:mt-14 large:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] large:gap-14">
          <div>
            <Eyebrow className="mb-4" enter={0}>
              AllShip AI
            </Eyebrow>
            <DisplayHeading enter={1} className="large:text-display-lg">
              Paperwork by AI. Decisions by you.
            </DisplayHeading>
            <Lead className="mt-6 max-w-[56ch]" enter={3}>
              The assistant turns a sentence into a load, compares bids in plain language, drafts bids for carriers and walks new users through the app. It never posts, bids or pays on its own.
            </Lead>
            <div {...enter(4)}>
              <CtaButtons
                className="mt-8"
                ctas={[
                  { label: "Create a free account", href: authLinks.signUp.href, track: "ai_hero_signup" },
                  { label: "What it can do", href: "#assistant", variant: "text" },
                ]}
              />
            </div>
          </div>
          <div {...enter(5)}>
            <Theater scene="aiAssistant" />
          </div>
        </div>
      </Section>

      <section aria-labelledby="ai-principle" data-scrub-scope="" className="border-y border-outline-variant">
        <Container className="py-20 medium:py-28">
          <h2 id="ai-principle" className="sr-only">
            How the assistant works
          </h2>
          <ScrubWords
            className="max-w-[22ch] text-headline-lg font-normal text-balance text-on-surface medium:text-display-md"
            text="It reads your loads, bids and trips. It drafts, compares and explains. Then it hands the button back to you."
            accent={["reads", "drafts,", "compares", "explains.", "you."]}
          />
          <p className="mt-8 max-w-[62ch] text-body-xl text-pretty text-on-surface-variant">
            Every draft is marked as AI-filled, every estimate is labeled as an estimate, and every action is a button you press yourself. That is the whole design: less typing and comparing for you, no surprises on your account.
          </p>
        </Container>
      </section>

      <Section labelledBy="ai-draft-load">
        <FeatureSpotlight
          scene="aiDraftLoad"
          eyebrow="For shippers"
          title={<span id="ai-draft-load">One sentence in, a load form out</span>}
          description="Type what you're moving and where. The assistant picks the category, fills the fields it can and marks the form as AI-filled, so you know what to check before you post."
        >
          <Link href="/quote" className="inline-flex min-h-12 items-center gap-2 text-title-sm font-medium text-primary">
            Prefer the form? Start a quote <Icon icon={arrowForwardIcon} size={18} />
          </Link>
        </FeatureSpotlight>
      </Section>

      <Section tone="low" labelledBy="ai-draft-bid">
        <FeatureSpotlight
          scene="aiDraftBid"
          reverse
          eyebrow="For carriers and dispatchers"
          title={<span id="ai-draft-bid">A bid draft that mentions the actual load</span>}
          description="Ask for a bid on any open load. The assistant reads the route, dates, target and how many carriers bid, then writes a message specific to that load. You set the price and place it."
        >
          <Link href="/loads" className="inline-flex min-h-12 items-center gap-2 text-title-sm font-medium text-primary">
            See open loads <Icon icon={arrowForwardIcon} size={18} />
          </Link>
        </FeatureSpotlight>
      </Section>

      <Section labelledBy="ai-tours">
        <FeatureSpotlight
          scene="guidedTour"
          eyebrow="For everyone new"
          title={<span id="ai-tours">A tour that points at the real buttons</span>}
          description="First sign-in starts a one-minute tour for your role. Ask the assistant to show you how posting, comparing bids, the load board or a trip works, and it starts the matching tour."
        />
      </Section>

      <section id="assistant" aria-labelledby="ai-matrix" className="scroll-mt-20 border-t border-outline-variant py-16 medium:py-24">
        <Container>
          <div className="grid gap-6 large:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] large:items-end large:gap-16">
            <SectionHeading id="ai-matrix">Exactly what it can do, by role</SectionHeading>
            <p className="text-body-xl text-pretty text-on-surface-variant">
              The assistant only sees what your account can already see, and only gets the tools your role needs. This is the full list today.
            </p>
          </div>
          <div className="mt-12">
            <AiCapabilities />
          </div>
        </Container>
      </section>

      <Section tone="low" labelledBy="ai-quotes">
        <div className="grid grid-cols-[minmax(0,1fr)] items-center gap-12 large:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] large:gap-16">
          <Theater scene="instantQuote" className="order-2 large:order-1" />
          <div className="order-1 large:order-2">
            <Eyebrow className="mb-3">Not everything needs AI</Eyebrow>
            <SectionHeading id="ai-quotes">Instant moving prices come from real rate cards</SectionHeading>
            <p className="mt-5 text-body-xl text-pretty text-on-surface-variant">
              On the moving page, prices are calculated from the rates movers publish on AllShip, for your exact route and home size. No model guesses a number. Every line of the price is shown, including our fee.
            </p>
            <CtaButtons className="mt-8" ctas={[{ label: "Get instant moving prices", href: "/moving", track: "ai_instant_quotes" }]} />
            <p className="mt-6 text-body-md text-on-surface-variant">
              Shipping something else? The assistant&apos;s ranges use the same math as our{" "}
              <Link href="/tools" className={link}>
                free calculators
              </Link>
              .
            </p>
          </div>
        </div>
      </Section>

      <Description title={aiWorld.title} description={aiWorld.description} sections={aiWorld.sections} />

      <FAQSection items={aiFaq} tone="low" />

      <CtaBand
        title="Try it on your own load"
        description="Create a free account, describe what you're shipping and let the assistant fill in the form. You still press Post."
        primary={{ label: "Create a free account", href: authLinks.signUp.href }}
        secondary={{ label: "I'm a carrier", href: authLinks.carrierSignUp.href }}
      />
    </>
  );
}
