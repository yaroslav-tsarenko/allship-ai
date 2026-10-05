import Link from "next/link";
import { ConsentSettingsLink } from "@/components/marketing/consent";
import type { LegalSection } from "@/components/marketing/legal/legal-document";

type CookieRow = { name: string; provider: string; purpose: string; duration: string };

const essential: CookieRow[] = [
  {
    name: "allship.session_token and other allship.* cookies",
    provider: "AllShip",
    purpose: "Keep you signed in and protect your session",
    duration: "Session to 30 days",
  },
  {
    name: "allship-consent-v1 (browser storage)",
    provider: "AllShip",
    purpose: "Remember your cookie choice",
    duration: "Until you clear it",
  },
  {
    name: "Turnstile cookies",
    provider: "Cloudflare",
    purpose: "Tell people from bots on sign-in and forms",
    duration: "Session",
  },
  {
    name: "allship_attr",
    provider: "AllShip",
    purpose:
      "Remember which campaign or page brought you here (UTM tags, ad click IDs) so we can credit sign-ups. It stays on our servers and is not sent to ad platforms unless you allow advertising cookies",
    duration: "90 days",
  },
];

const analytics: CookieRow[] = [
  {
    name: "_ga, _ga_*",
    provider: "Google Analytics",
    purpose: "Count visits and see how pages are used",
    duration: "Up to 2 years",
  },
  {
    name: "_clck, _clsk",
    provider: "Microsoft Clarity",
    purpose: "Understand clicks and scrolling to fix usability problems",
    duration: "1 day to 1 year",
  },
];

const advertising: CookieRow[] = [
  {
    name: "_gcl_au, _gcl_aw",
    provider: "Google Ads",
    purpose: "Measure which ads lead to quotes and sign-ups",
    duration: "90 days",
  },
  {
    name: "Google remarketing cookies",
    provider: "Google",
    purpose: "Show AllShip ads to people who visited the site",
    duration: "Up to 13 months",
  },
];

const CookieTable = ({ rows, caption }: { rows: CookieRow[]; caption: string }) => (
  <div className="mt-4 overflow-x-auto">
    <table className="text-body-md w-full min-w-[560px] border-collapse text-left">
      <caption className="sr-only">{caption}</caption>
      <thead>
        <tr className="border-outline border-b">
          <th scope="col" className="text-on-surface py-2 pr-4 font-medium">
            Name
          </th>
          <th scope="col" className="text-on-surface py-2 pr-4 font-medium">
            Set by
          </th>
          <th scope="col" className="text-on-surface py-2 pr-4 font-medium">
            Purpose
          </th>
          <th scope="col" className="text-on-surface py-2 font-medium">
            Lasts
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.name} className="border-outline-variant border-b align-top">
            <th
              scope="row"
              className="text-body-sm text-on-surface py-3 pr-4 font-mono font-normal break-words"
            >
              {r.name}
            </th>
            <td className="py-3 pr-4">{r.provider}</td>
            <td className="py-3 pr-4">{r.purpose}</td>
            <td className="py-3">{r.duration}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export const cookieSections: LegalSection[] = [
  {
    id: "what-cookies-are",
    title: "What cookies are",
    body: (
      <p>
        Cookies are small files a website stores in your browser. Similar technologies include browser storage
        and tags that send information to analytics or ad services. In this policy, &quot;cookies&quot; covers
        all of them.
      </p>
    ),
  },
  {
    id: "essential",
    title: "Essential cookies",
    body: (
      <>
        <p>
          These keep the site working and secure. They are always on, because sign-in, security and
          remembering your cookie choice don&apos;t work without them.
        </p>
        <CookieTable caption="Essential cookies" rows={essential} />
      </>
    ),
  },
  {
    id: "analytics",
    title: "Analytics cookies",
    body: (
      <>
        <p>These run only if you choose &quot;Accept all&quot; or turn on Analytics in Cookie settings.</p>
        <CookieTable caption="Analytics cookies" rows={analytics} />
      </>
    ),
  },
  {
    id: "advertising",
    title: "Advertising cookies",
    body: (
      <>
        <p>
          These run only if you choose &quot;Accept all&quot; or turn on Advertising in Cookie settings, and
          never when your browser sends a Global Privacy Control signal.
        </p>
        <CookieTable caption="Advertising cookies" rows={advertising} />
      </>
    ),
  },
  {
    id: "consent-mode",
    title: "How consent works",
    body: (
      <>
        <p>
          Until you make a choice, analytics and advertising storage are set to &quot;denied&quot; using
          Google Consent Mode. In that state Google tags do not set analytics or advertising cookies. When you
          change your choice, we update the setting right away.
        </p>
        <p>
          Your choice is stored in your browser, so you will be asked again on a new device or after clearing
          your browser data.
        </p>
      </>
    ),
  },
  {
    id: "change-choice",
    title: "Changing your choice",
    body: (
      <>
        <p>
          Open <ConsentSettingsLink /> at any time, also linked in the footer of every page. You can also
          block or delete cookies in your browser settings, though blocking essential cookies will sign you
          out.
        </p>
        <p>
          To opt out of sale or sharing of personal information for advertising, see{" "}
          <Link href="/legal/do-not-sell">Do Not Sell or Share My Personal Information</Link>.
        </p>
      </>
    ),
  },
  {
    id: "more",
    title: "More information",
    body: (
      <p>
        The <Link href="/privacy-policy">Privacy Policy</Link> explains how we use the information these
        cookies collect. Google explains its use of data at{" "}
        <a
          href="https://policies.google.com/technologies/partner-sites"
          rel="noopener noreferrer"
          target="_blank"
        >
          policies.google.com/technologies/partner-sites
        </a>
        .
      </p>
    ),
  },
];

export const cookieSummary = (
  <p>
    Essential cookies keep you signed in and safe. Analytics and advertising cookies stay off until you allow
    them, and advertising stays off whenever your browser sends Global Privacy Control.
  </p>
);

export const cookieDescription =
  "The cookies and similar technologies AllShip AI uses, split into essential, analytics and advertising, and how to change your choice or opt out with GPC.";
