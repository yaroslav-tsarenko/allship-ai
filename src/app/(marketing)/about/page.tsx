import Image from "next/image";
import { Breadcrumbs } from "@/components/marketing/breadcrumbs";
import { CtaBand } from "@/components/marketing/cta-band";
import { Container, DisplayHeading, Eyebrow, Lead, Section, SectionHeading } from "@/components/marketing/section";
import { aboutIntro, aboutSections } from "@/components/pages/about/content";
import { Description } from "@/components/sections";
import { Theater } from "@/components/theater";
import { authLinks, site } from "@/content/site";
import { buildMetadata, JsonLd } from "@/lib/seo";

const path = "/about";
const description = "Learn about AllShip AI: our mission, our values and how our marketplace makes moving, freight and truck rental simpler with verified carriers and escrow.";

export const metadata = buildMetadata({ title: "About Us: Our Mission and Values", description, path });

const photos = [
  { src: "/images/movers-ramp.jpg", alt: "Movers carrying furniture up a truck ramp" },
  { src: "/images/wrapped-cabinet-dock.jpg", alt: "A blanket-wrapped cabinet waiting at a loading dock" },
  { src: "/images/pallets-in-trailer.jpg", alt: "Wrapped pallets loaded in a trailer" },
];

const principles = [
  { k: "01", title: "You see the whole price", body: `The carrier's bid and our ${site.platformFeePercent}% service fee are separate lines, shown before you pay. Carriers keep 100% of their bid.` },
  { k: "02", title: "Money waits for the delivery", body: `Stripe holds the payment until delivery is confirmed, or ${site.autoConfirmHours} hours after delivery if nobody reports a problem.` },
  { k: "03", title: "Carriers are checked first", body: "USDOT and MC authority with the FMCSA, insurance and a company payouts account, all before the first bid." },
  { k: "04", title: "Reviews come from real jobs", body: "Only the shipper on a completed load can review the carrier who moved it." },
];

export default function AboutPage() {
  const [intro1, intro2] = aboutIntro.split("\n\n");
  return (
    <>
      <JsonLd
        data={{ "@context": "https://schema.org", "@type": "AboutPage", name: "About AllShip AI", description, url: new URL(path, site.url).toString(), about: { "@id": `${site.url}/#organization` } }}
      />
      <Section spacing="none" className="pt-6 pb-14 medium:pt-8 medium:pb-20">
        <Breadcrumbs items={[{ name: "About", path }]} />
        <div className="mt-10 grid gap-10 medium:mt-14 large:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] large:items-end large:gap-16">
          <div>
            <Eyebrow className="mb-4" enter={0}>
              About us
            </Eyebrow>
            <DisplayHeading enter={1}>A marketplace where the money waits for the delivery</DisplayHeading>
          </div>
          <Lead enter={3}>Post a load, get bids from carriers verified with the FMCSA, and pay into escrow that releases only after delivery. AI handles the typing and comparing. You make the decisions.</Lead>
        </div>
      </Section>

      <section aria-label="Freight on AllShip" className="pb-16 medium:pb-24">
        <Container width="wide">
          <div className="grid aspect-[4/3] grid-cols-[minmax(0,2fr)_minmax(0,1fr)] grid-rows-2 gap-3 medium:aspect-[21/9] medium:gap-4">
            {photos.map((p, i) => (
              <div key={p.src} className={i === 0 ? "relative row-span-2 overflow-hidden rounded-xl" : "relative overflow-hidden rounded-xl"}>
                <Image src={p.src} alt={p.alt} fill priority={i === 0} sizes={i === 0 ? "(min-width: 1440px) 920px, 66vw" : "(min-width: 1440px) 460px, 33vw"} className="object-cover" />
              </div>
            ))}
          </div>
        </Container>
      </section>

      <Section tone="low" labelledBy="about-principles">
        <div className="grid gap-12 large:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] large:gap-16">
          <div>
            <SectionHeading id="about-principles">Four rules the product is built around</SectionHeading>
            <p className="mt-5 text-body-lg text-pretty text-on-surface-variant">{intro1}</p>
            <p className="mt-4 text-body-lg text-pretty text-on-surface-variant">{intro2}</p>
          </div>
          <ol className="border-t border-outline-variant">
            {principles.map((p) => (
              <li key={p.k} className="grid grid-cols-[48px_minmax(0,1fr)] gap-4 border-b border-outline-variant py-6">
                <span className="font-mono text-title-md text-primary">{p.k}</span>
                <div>
                  <h3 className="text-title-lg text-on-surface">{p.title}</h3>
                  <p className="mt-1 text-body-lg text-pretty text-on-surface-variant">{p.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </Section>

      <Section labelledBy="about-product">
        <div className="grid gap-4 large:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] large:items-end large:gap-16">
          <SectionHeading id="about-product">One account on every screen</SectionHeading>
          <p className="text-body-xl text-pretty text-on-surface-variant">Shippers, carrier owners, dispatchers and drivers use the same app on a desktop, a tablet or a phone.</p>
        </div>
        <Theater scene="adaptive" className="mt-10" />
      </Section>

      <Description title="About AllShip AI" sections={aboutSections} tone="low" />

      <Section labelledBy="about-company" spacing="md">
        <div className="grid gap-8 large:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] large:gap-16">
          <h2 id="about-company" className="text-headline-md font-normal text-on-surface">
            Company details
          </h2>
          <dl className="grid gap-x-10 border-t border-outline-variant medium:grid-cols-2">
            {[
              ["Legal name", site.legalName],
              ["Address", `${site.address.street}, ${site.address.city}, ${site.address.region} ${site.address.postalCode}`],
              ["Phone", site.phone.display],
              ["Email", site.email],
            ].map(([k, v]) => (
              <div key={k} className="border-b border-outline-variant py-4">
                <dt className="text-label-lg text-on-surface-variant">{k}</dt>
                <dd className="mt-1 text-body-lg text-on-surface">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Section>

      <CtaBand
        title="Post your first load"
        description="Free to post. Verified carriers bid, you choose, and your payment stays in escrow until delivery."
        primary={{ label: "Create a free account", href: authLinks.signUp.href }}
        secondary={{ label: "Contact us", href: "/contact-us" }}
      />
    </>
  );
}
