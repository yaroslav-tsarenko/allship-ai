import Link from "next/link";
import type { LegalSection } from "@/components/marketing/legal/legal-document";
import { site } from "@/content/site";

const categories = [
  {
    name: "Identifiers and contact details",
    examples: "Name, email, phone, account ID, IP address",
    source: "You, your device",
  },
  {
    name: "Load and trip details",
    examples:
      "Pickup and delivery addresses, dates, item descriptions, photos, proof of delivery, signatures",
    source: "Shippers, carriers, drivers",
  },
  {
    name: "Commercial and payment information",
    examples:
      "Bids, bookings, payment status, payout status. Card and bank details are held by Stripe, not by us",
    source: "You, Stripe",
  },
  {
    name: "Carrier business records",
    examples: "USDOT and MC numbers, insurance certificates, company details, safety status",
    source: "Carriers, FMCSA public data",
  },
  {
    name: "Precise location",
    examples: "Driver location during an active trip",
    source: "Driver's device, with permission",
  },
  {
    name: "Communications",
    examples: "Messages between users, support requests, AI assistant conversations",
    source: "You",
  },
  {
    name: "Internet activity",
    examples: "Pages viewed, clicks, referrer, device and browser, ad click IDs and campaign tags",
    source: "Your device, cookies",
  },
];

const providers = [
  { name: "Stripe", purpose: "Payments, escrow, payouts and identity checks for carriers" },
  { name: "Supabase", purpose: "Database, file storage and realtime updates (hosting)" },
  { name: "Resend", purpose: "Sending account and load emails" },
  { name: "OpenAI", purpose: "Generating AllShip AI assistant answers" },
  { name: "Cloudflare", purpose: "Bot protection on sign-in and forms (Turnstile)" },
  { name: "Google", purpose: "Google Analytics and Google Ads measurement, only with your consent" },
  { name: "Microsoft", purpose: "Microsoft Clarity usage analytics, only with your consent" },
];

const retention = [
  {
    what: "Account information",
    period: "While your account is open, then up to 30 days to process deletion",
  },
  {
    what: "Loads, bookings, payments and messages tied to a booking",
    period: "7 years after the load is completed, for tax, accounting and dispute records",
  },
  { what: "Open loads that were never booked", period: "2 years after the load closes" },
  {
    what: "Driver location during trips",
    period: "90 days after the load is completed, unless needed for an open dispute",
  },
  { what: "AI assistant conversations", period: "12 months, or until you delete them" },
  {
    what: "Analytics and advertising data",
    period: "Set by Google and Microsoft, up to 14 months for Google Analytics",
  },
  { what: "Attribution cookie", period: "90 days" },
];

const Table = ({ head, rows, caption }: { head: string[]; rows: string[][]; caption: string }) => (
  <div className="mt-4 overflow-x-auto">
    <table className="text-body-md w-full min-w-[520px] border-collapse text-left">
      <caption className="sr-only">{caption}</caption>
      <thead>
        <tr className="border-outline border-b">
          {head.map((h) => (
            <th key={h} scope="col" className="text-on-surface py-2 pr-4 font-medium">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r[0]} className="border-outline-variant border-b align-top">
            {r.map((c, i) =>
              i === 0 ? (
                <th key={i} scope="row" className="text-on-surface py-3 pr-4 font-medium">
                  {c}
                </th>
              ) : (
                <td key={i} className="py-3 pr-4">
                  {c}
                </td>
              ),
            )}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export const privacySections: LegalSection[] = [
  {
    id: "who-we-are",
    title: "Who we are",
    body: (
      <p>
        {site.legalName} (&quot;AllShip&quot;) runs the AllShip marketplace at allship.ai. We are responsible
        for the personal information described in this policy. It applies to our website, apps, AI assistant
        and emails. It does not cover how carriers or shippers handle your information outside AllShip.
      </p>
    ),
  },
  {
    id: "what-we-collect",
    title: "What we collect",
    body: (
      <>
        <p>
          We collect information you give us, information created when you use the Service, and information
          from partners and public sources.
        </p>
        <Table
          caption="Categories of personal information"
          head={["Category", "Examples", "Source"]}
          rows={categories.map((c) => [c.name, c.examples, c.source])}
        />
        <p>
          We do not ask for Social Security numbers. Carriers&apos; identity verification for payouts is
          handled by Stripe.
        </p>
      </>
    ),
  },
  {
    id: "how-we-use",
    title: "How we use it",
    body: (
      <ul>
        <li>
          To run the marketplace: post loads, show bids, book loads, process payments and payouts, and send
          updates.
        </li>
        <li>
          To verify carriers against FMCSA records and keep the platform safe, including fraud and abuse
          prevention.
        </li>
        <li>To show live trip progress to the shipper while a load is in transit.</li>
        <li>To handle support requests and disputes, using the load record, messages and photos.</li>
        <li>To answer questions in the AI assistant and carry out actions you confirm.</li>
        <li>To measure and improve the Service and, with your consent, our advertising.</li>
        <li>To meet legal obligations, such as tax records, and to enforce our terms.</li>
      </ul>
    ),
  },
  {
    id: "sharing",
    title: "Who we share it with",
    body: (
      <>
        <h3>Other users</h3>
        <p>
          Open loads on the public load board show only general locations (city and state) and load details,
          never your name or exact address. After booking, the shipper and the carrier see each other&apos;s
          names, contact details and exact addresses needed to do the job. Carriers&apos; business details,
          verification status and ratings are shown with their bids.
        </p>
        <h3>Service providers</h3>
        <p>These companies process data for us under contracts that limit their use of it:</p>
        <Table
          caption="Service providers"
          head={["Provider", "What they do for us"]}
          rows={providers.map((p) => [p.name, p.purpose])}
        />
        <p>An SMS provider delivers text messages if you opt in to them.</p>
        <h3>Other cases</h3>
        <p>
          We share information when the law requires it, to protect people&apos;s safety or our rights, with
          insurers or the other party when handling a claim, and with a buyer or successor if AllShip is
          involved in a merger or sale, subject to this policy.
        </p>
      </>
    ),
  },
  {
    id: "ai-assistant",
    title: "The AI assistant",
    body: (
      <>
        <p>
          When you use the AllShip AI assistant, your messages and the load details needed to answer are sent
          to OpenAI to generate a reply. Under OpenAI&apos;s API terms, data sent through the API is not used
          to train OpenAI&apos;s models by default.
        </p>
        <p>
          Don&apos;t share payment card numbers, passwords or other sensitive details in the chat. You can
          delete your conversations in the app.
        </p>
      </>
    ),
  },
  {
    id: "cookies",
    title: "Cookies, analytics and advertising",
    body: (
      <>
        <p>
          We use essential cookies to keep you signed in and secure. Analytics (Google Analytics, Microsoft
          Clarity) and advertising (Google Ads) cookies run only if you allow them in the cookie banner. We
          use Google Consent Mode, so Google tags stay in a limited mode until you consent.
        </p>
        <p>
          The <Link href="/cookie-policy">Cookie Policy</Link> lists each cookie and how to change your
          choice.
        </p>
      </>
    ),
  },
  {
    id: "sell-share",
    title: "Selling and sharing",
    body: (
      <>
        <p>
          We do not sell personal information for money. If you allow advertising cookies, Google may receive
          information about your visits for ad measurement and remarketing. Under California law this can
          count as &quot;sharing&quot; for cross-context behavioral advertising, and in some states as a
          &quot;sale&quot;.
        </p>
        <p>
          You can opt out at any time on the{" "}
          <Link href="/legal/do-not-sell">Do Not Sell or Share My Personal Information</Link> page or in
          Cookie settings. We treat a Global Privacy Control (GPC) signal from your browser as a valid opt-out
          for that browser.
        </p>
        <p>We do not knowingly sell or share the personal information of anyone under 16.</p>
      </>
    ),
  },
  {
    id: "sensitive",
    title: "Sensitive information",
    body: (
      <p>
        Driver location during a trip and account sign-in credentials are sensitive personal information under
        California law. We use them only to provide the Service, keep accounts secure and meet legal duties,
        and not to infer characteristics about you. Because of this, we do not offer a separate &quot;limit
        the use&quot; option.
      </p>
    ),
  },
  {
    id: "retention",
    title: "How long we keep it",
    body: (
      <>
        <p>We keep information only as long as we need it for the purposes above or as the law requires:</p>
        <Table
          caption="Retention periods"
          head={["Information", "Kept for"]}
          rows={retention.map((r) => [r.what, r.period])}
        />
        <p>When the period ends we delete the information or remove details that identify you.</p>
      </>
    ),
  },
  {
    id: "security",
    title: "Security",
    body: (
      <p>
        We protect data with encryption in transit, access controls, row-level security in our database,
        two-factor sign-in options and logging of sensitive actions. No system is perfectly secure. If a
        breach affects your information, we will notify you as the law requires.
      </p>
    ),
  },
  {
    id: "your-rights",
    title: "Your privacy rights",
    body: (
      <>
        <p>If you live in California, you have the right to:</p>
        <ul>
          <li>
            <strong>Know</strong> what personal information we collect, use and disclose, and get a copy of
            it.
          </li>
          <li>
            <strong>Delete</strong> personal information we collected from you, subject to legal exceptions
            such as tax records and open disputes.
          </li>
          <li>
            <strong>Correct</strong> inaccurate personal information.
          </li>
          <li>
            <strong>Opt out of sale or sharing</strong>, including through a GPC signal.
          </li>
          <li>
            <strong>Not be discriminated against</strong> for using these rights.
          </li>
        </ul>
        <p>
          Residents of other states with privacy laws, such as Colorado, Connecticut, Virginia and others,
          have similar rights, including opting out of targeted advertising. We offer these rights to all US
          users.
        </p>
        <h3>How to make a request</h3>
        <p>
          Email <a href={`mailto:${site.email}?subject=Privacy%20request`}>{site.email}</a> with the subject
          &quot;Privacy request&quot;, or call {site.phone.display}. Many details can also be viewed and
          changed in your account settings. We will confirm receipt within 10 business days and respond within
          45 days. To protect you, we verify requests by confirming control of the email address or phone
          number on the account.
        </p>
        <p>
          You can use an authorized agent. We will ask the agent for your signed permission and may ask you to
          confirm your identity directly. If we deny a request, you can appeal by replying to our decision. We
          will answer an appeal within 45 days.
        </p>
      </>
    ),
  },
  {
    id: "children",
    title: "Children",
    body: (
      <p>
        The Service is for adults 18 and over. We do not knowingly collect personal information from children
        under 13. If you think a child has given us information, contact us and we will delete it.
      </p>
    ),
  },
  {
    id: "location",
    title: "Where data is stored",
    body: (
      <p>
        AllShip serves users in the United States. Our service providers may process data in the United States
        and other countries, under contracts that require appropriate protection.
      </p>
    ),
  },
  {
    id: "sms",
    title: "Text messages",
    body: (
      <p>
        If you opt in to texts, we use your phone number to send transactional messages about your account and
        loads. We keep a record of your consent (time, method and policy version). We do not share opt-in data
        or phone numbers with third parties for their marketing. Reply STOP to opt out.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes to this policy",
    body: (
      <p>
        We will post updates here with a new date. If we make material changes, we will tell you by email or
        in the app before they take effect.
      </p>
    ),
  },
];

export const privacySummary = (
  <p>
    We collect what we need to run a shipping marketplace: your account, your loads, payments through Stripe
    and trip updates. We don&apos;t sell your data for money, advertising cookies are off until you allow
    them, and we honor Global Privacy Control.
  </p>
);

export const privacyDescription =
  "What personal information AllShip AI collects, why, who we share it with, how long we keep it, and your rights under California and other US state privacy laws.";
