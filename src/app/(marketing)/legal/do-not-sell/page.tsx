import Link from "next/link";
import { LegalDocument, type LegalSection } from "@/components/marketing/legal/legal-document";
import { OptOutPanel } from "@/components/marketing/legal/opt-out-panel";
import { site } from "@/content/site";
import { buildMetadata } from "@/lib/seo";

const path = "/legal/do-not-sell";

const mailto = `mailto:${site.email}?subject=${encodeURIComponent("Do not sell or share my personal information")}&body=${encodeURIComponent("Please opt me out of the sale and sharing of my personal information.\n\nName:\nEmail on my AllShip account (if any):\nState of residence:")}`;

export const metadata = buildMetadata({
  title: "Do Not Sell or Share My Personal Information",
  description: "Opt out of the sale or sharing of your personal information for advertising at AllShip AI, in this browser, by email or with a Global Privacy Control signal.",
  path,
});

const sections: LegalSection[] = [
  {
    id: "what-this-covers",
    title: "What this opt-out covers",
    body: (
      <>
        <p>We do not sell personal information for money. When advertising cookies are on, Google may receive data about your visits to measure our ads and show AllShip ads to past visitors. California and some other states treat this as &quot;sharing&quot; or a &quot;sale&quot;, so you can opt out of it.</p>
        <p>Opting out turns off advertising cookies and stops us from using your information for targeted advertising. It does not affect essential cookies, your account, or messages about your loads.</p>
      </>
    ),
  },
  {
    id: "gpc",
    title: "Global Privacy Control",
    body: (
      <p>
        If your browser or extension sends a Global Privacy Control (GPC) signal, we treat it as an opt-out for that browser automatically. Advertising cookies stay off even if you click &quot;Accept all&quot;. Learn more at{" "}
        <a href="https://globalprivacycontrol.org" rel="noopener noreferrer" target="_blank">
          globalprivacycontrol.org
        </a>
        .
      </p>
    ),
  },
  {
    id: "by-email",
    title: "Opt out by email or phone",
    body: (
      <>
        <p>
          To opt out across your account, not just one browser, <a href={mailto}>email {site.email}</a> with the subject &quot;Do not sell or share my personal information&quot;, or call {site.phone.display}. Include the email address on your account if you have one.
        </p>
        <p>We act on opt-out requests within 15 business days. We don&apos;t need to verify your identity to opt you out, but we may ask for enough detail to find your records. You can also use an authorized agent.</p>
      </>
    ),
  },
  {
    id: "other-rights",
    title: "Your other rights",
    body: (
      <p>
        You can also ask to know, delete or correct your personal information. The <Link href="/privacy-policy#your-rights">Privacy Policy</Link> explains how. We will not treat you differently for using any of these rights.
      </p>
    ),
  },
];

export default function Page() {
  return (
    <LegalDocument
      path={path}
      crumb="Do not sell or share"
      title="Do Not Sell or Share My Personal Information"
      summary={<p>You can opt out right here for this browser, send a Global Privacy Control signal, or email us to opt out everywhere.</p>}
      aside={
        <div className="mb-12">
          <OptOutPanel />
        </div>
      }
      sections={sections}
    />
  );
}
