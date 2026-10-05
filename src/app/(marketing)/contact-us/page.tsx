import Link from "next/link";
import { Breadcrumbs } from "@/components/marketing/breadcrumbs";
import { ContactForm } from "@/components/marketing/company/contact-form";
import { Container } from "@/components/marketing/section";
import { enter } from "@/components/motion/enter";
import { RevealText } from "@/components/motion/reveal-text";
import { ContactDetails } from "@/components/pages/contact-us/contact-details";
import { Icon } from "@/components/ui/icon";
import { arrowForwardIcon } from "@/components/ui/icons.generated";
import { site } from "@/content/site";
import { buildMetadata, JsonLd } from "@/lib/seo";

const path = "/contact-us";

export const metadata = buildMetadata({
  title: "Contact Us: Support, Sales and Partnerships",
  description: `Get in touch with AllShip AI support and sales about bookings, carrier partnerships and billing. Call ${site.phone.display}, email ${site.email} or send us a message.`,
  path,
});

const contactPage = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  name: "Contact AllShip AI",
  url: new URL(path, site.url).toString(),
  about: { "@id": `${site.url}/#organization` },
  mainEntity: {
    "@type": "Organization",
    "@id": `${site.url}/#organization`,
    contactPoint: [
      { "@type": "ContactPoint", contactType: "customer support", telephone: site.phone.e164, email: site.email, areaServed: "US", availableLanguage: "English" },
    ],
  },
};

const shortcuts = [
  { label: "Check on a load you posted", note: "Status, bids and messages are in your dashboard", href: "/app/loads" },
  { label: "Get a price for a shipment", note: "Post free and compare carrier bids", href: "/quote" },
  { label: "See movers' prices instantly", note: "No sign-up to see them", href: "/moving" },
  { label: "Get verified as a carrier", note: "What we check before your first bid", href: "/partners#requirements" },
  { label: "Cancel or change a booking", note: "Refunds by how close to pickup", href: "/legal/cancellation-refunds" },
  { label: "Fees, escrow and payouts", note: "Answers in the FAQ", href: "/faq" },
];

export default function ContactUsPage() {
  return (
    <>
      <JsonLd data={contactPage} />
      <Container className="pt-6 pb-16 medium:pt-8 medium:pb-24">
        <Breadcrumbs items={[{ name: "Contact Us", path }]} />
        <div className="mt-10 grid gap-8 medium:mt-14 large:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] large:items-end large:gap-20">
          <h1 id="contact-title" className="text-display-sm font-normal tracking-tight text-balance medium:text-display-md large:text-display-lg">
            <RevealText>Talk to AllShip</RevealText>
          </h1>
          <p className="text-body-lg text-pretty text-on-surface-variant medium:text-title-lg medium:font-normal" {...enter(2)}>
            Questions about a shipment, a carrier account or a payment. Send a message, call or email. For an active load, phone is fastest.
          </p>
        </div>

        <div className="mt-12 grid gap-14 medium:mt-16 large:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] large:gap-20">
          <section aria-labelledby="contact-form-title" className="large:sticky large:top-24 large:self-start" {...enter(3)}>
            <h2 id="contact-form-title" className="sr-only">
              Send us a message
            </h2>
            <ContactForm topicFromUrl />
          </section>

          <div className="flex flex-col gap-12" {...enter(4)}>
            <section aria-labelledby="contact-direct">
              <h2 id="contact-direct" className="text-title-lg text-on-surface">
                Call or email
              </h2>
              <div className="mt-4 grid gap-px overflow-hidden rounded-lg bg-outline-variant">
                <a href={site.phone.href} className="group state-layer flex flex-col gap-1 bg-surface px-5 py-5">
                  <span className="text-label-lg text-on-surface-variant">Phone</span>
                  <span className="text-headline-sm text-on-surface tabular-nums group-hover:text-primary">{site.phone.display}</span>
                  <span className="text-body-md text-on-surface-variant">Active loads and bookings</span>
                </a>
                <a href={`mailto:${site.email}`} className="group state-layer flex flex-col gap-1 bg-surface px-5 py-5">
                  <span className="text-label-lg text-on-surface-variant">Email</span>
                  <span className="text-headline-sm break-all text-on-surface group-hover:text-primary">{site.email}</span>
                  <span className="text-body-md text-on-surface-variant">Documents, screenshots, anything you want in writing</span>
                </a>
              </div>
            </section>

            <nav aria-labelledby="contact-shortcuts">
              <h2 id="contact-shortcuts" className="text-title-lg text-on-surface">
                You might not need to wait
              </h2>
              <ul className="mt-4 border-t border-outline-variant">
                {shortcuts.map((s) => (
                  <li key={s.href} className="border-b border-outline-variant">
                    <Link href={s.href} className="group flex items-center justify-between gap-4 py-4">
                      <span>
                        <span className="block text-title-md text-on-surface group-hover:text-primary">{s.label}</span>
                        <span className="block text-body-md text-on-surface-variant">{s.note}</span>
                      </span>
                      <Icon icon={arrowForwardIcon} size={20} className="shrink-0 text-primary transition-transform duration-(--duration-short4) ease-standard group-hover:translate-x-0.5" />
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <section aria-labelledby="contact-details">
              <ContactDetails mailOnly />
            </section>
          </div>
        </div>
      </Container>
    </>
  );
}
