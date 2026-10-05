import Link from "next/link";
import type { LegalSection } from "@/components/marketing/legal/legal-document";
import { site } from "@/content/site";

const fee = site.platformFeePercent;
const hours = site.autoConfirmHours;
const exampleFee = (1000 * fee) / 100;
const usd = (v: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);

export const termsSections: LegalSection[] = [
  {
    id: "agreement",
    title: "Agreement to these terms",
    body: (
      <>
        <p>
          These Terms and Conditions are a contract between you and {site.legalName} (&quot;AllShip&quot;,
          &quot;we&quot;, &quot;us&quot;), a Delaware corporation. They cover the AllShip website at
          allship.ai, the AllShip apps and the AllShip AI assistant (together, the &quot;Service&quot;).
        </p>
        <p>
          By creating an account, posting a load, placing a bid or paying through the Service, you agree to
          these terms. If you use the Service for a company, you confirm you can bind that company, and
          &quot;you&quot; means the company too.
        </p>
        <p>
          Some parts of the Service have extra terms that form part of this contract: the{" "}
          <Link href="/legal/cancellation-refunds">Cancellation and Refund Policy</Link>, the{" "}
          <Link href="/legal/carrier-agreement">Carrier Agreement</Link> for carriers, and the{" "}
          <Link href="/privacy-policy">Privacy Policy</Link>, which explains how we handle personal
          information.
        </p>
      </>
    ),
  },
  {
    id: "what-allship-does",
    title: "What AllShip does and does not do",
    body: (
      <>
        <p>
          AllShip is an online marketplace. Shippers post loads, such as a household move, a vehicle, freight
          or heavy equipment. Independent carriers bid on those loads. When a shipper accepts a bid, the
          shipper and the carrier enter into a transportation agreement with each other.
        </p>
        <p>
          <strong>AllShip is not a motor carrier.</strong> We do not transport goods, take possession of
          shipments, employ drivers or own trucks. Carriers decide how to perform the move or haul, using
          their own equipment, staff and judgment. Carriers are independent businesses, not AllShip employees,
          agents or partners.
        </p>
        <p>
          We provide the tools around the transaction: listings, bidding, messaging, trip tracking, payment
          handling through Stripe, carrier verification checks and dispute handling for funds we hold.
        </p>
      </>
    ),
  },
  {
    id: "accounts",
    title: "Accounts",
    body: (
      <ul>
        <li>You must be at least 18 years old and able to form a binding contract.</li>
        <li>
          Give accurate information and keep it current, including your name, phone number and, for carriers,
          your USDOT and MC numbers.
        </li>
        <li>
          Keep your password and sign-in methods secure. You are responsible for activity on your account.
          Tell us right away at {site.email} if you think someone else has access.
        </li>
        <li>One person or company may hold one account per role unless we agree otherwise.</li>
      </ul>
    ),
  },
  {
    id: "posting-loads",
    title: "Posting a load",
    body: (
      <>
        <p>When you post a load, you agree to:</p>
        <ul>
          <li>
            Describe the shipment accurately, including size, weight, number of items, vehicle condition,
            access at pickup and delivery (stairs, elevators, long carries) and any special handling.
          </li>
          <li>Have the legal right to ship the items.</li>
          <li>
            Not post hazardous materials, weapons, illegal goods, live animals, cash, or other items carriers
            cannot legally or safely carry, unless the load type allows it and you disclose it in full.
          </li>
          <li>
            Be available, or have someone available, at the pickup and delivery times you agreed with the
            carrier.
          </li>
        </ul>
        <p>
          Price estimates on our site, in our calculators or from the AI assistant are for planning only. They
          are not quotes. The price for a load is the bid you accept.
        </p>
      </>
    ),
  },
  {
    id: "bids-booking",
    title: "Bids and booking",
    body: (
      <>
        <p>
          A bid is a carrier&apos;s offer to carry your load for the stated price and on the stated terms.
          Bids are visible to the shipper together with the carrier&apos;s verification status, ratings from
          completed loads and any notes.
        </p>
        <p>
          A load is <strong>booked</strong> when the shipper accepts a bid and the payment succeeds. If
          payment is not completed within 30 minutes of accepting a bid, the acceptance lapses and the load
          returns to open. Once booked, other bids on the load are declined automatically.
        </p>
      </>
    ),
  },
  {
    id: "payments",
    title: "Payments, escrow and the service fee",
    body: (
      <>
        <p>
          Payments are processed by Stripe, Inc. Carriers receive payouts through Stripe Connect. By paying or
          receiving money through the Service, you also agree to the{" "}
          <a href="https://stripe.com/legal/ssa" rel="noopener noreferrer" target="_blank">
            Stripe Services Agreement
          </a>{" "}
          that applies to you. We do not store full card numbers.
        </p>
        <h3>What the shipper pays</h3>
        <p>
          At booking, the shipper pays the carrier&apos;s accepted bid plus an AllShip service fee of {fee}%
          of that bid. Both amounts are shown before you pay. Example: on a {usd(1000)} bid, you pay{" "}
          {usd(1000)} for the carrier and a {usd(exampleFee)} service fee, {usd(1000 + exampleFee)} in total.
          The carrier receives the full amount of their bid.
        </p>
        <h3>How escrow works</h3>
        <p>
          We hold the payment and release the carrier&apos;s amount only after the load is completed. A load
          is completed when the shipper confirms delivery in the app, or automatically {hours} hours after the
          carrier marks it delivered with proof of delivery, if the shipper has not opened a dispute by then.
        </p>
        <p>
          Holding funds this way is a payment arrangement, not a guarantee of the carrier&apos;s work. It
          gives you time to check the delivery before the carrier is paid.
        </p>
        <h3>Taxes</h3>
        <p>
          Prices are shown in US dollars. Each user is responsible for their own taxes. Stripe may issue tax
          forms, such as Form 1099-K, to carriers who meet the reporting thresholds.
        </p>
      </>
    ),
  },
  {
    id: "delivery-confirmation",
    title: "Delivery confirmation",
    body: (
      <>
        <p>
          When the carrier delivers, they mark the load delivered in the app and add proof of delivery, such
          as photos and a signature. You then have {hours} hours to either confirm delivery or open a dispute.
        </p>
        <p>
          Inspect the shipment as soon as you can. Note visible damage or missing items on the delivery
          paperwork and in the app before the window ends. If you do nothing within {hours} hours, the load is
          completed and the carrier is paid.
        </p>
      </>
    ),
  },
  {
    id: "cancellations",
    title: "Cancellations and refunds",
    body: (
      <p>
        You can withdraw a load at no cost before booking. After booking, cancellations and refunds follow the{" "}
        <Link href="/legal/cancellation-refunds">Cancellation and Refund Policy</Link>, which depends on how
        close to pickup you cancel and who cancels.
      </p>
    ),
  },
  {
    id: "disputes-between-users",
    title: "Disputes between shippers and carriers",
    body: (
      <>
        <p>
          If something goes wrong with a booked load, open a dispute in the app before the load is completed.
          Once a dispute is open, the carrier&apos;s payout is frozen until it is resolved.
        </p>
        <ol>
          <li>Describe the problem and add photos, messages, paperwork or other evidence.</li>
          <li>The other side gets a chance to respond, usually within 3 business days.</li>
          <li>
            We review the evidence and decide how to release the funds we hold: in full to the carrier, as a
            partial refund to the shipper, or as a full refund.
          </li>
        </ol>
        <p>
          Our decision covers only the money we hold for that load. It does not prevent either side from
          pursuing other legal rights against the other, such as a cargo loss or damage claim against the
          carrier or its insurer. We will share the information we have to help with such a claim, as allowed
          by our Privacy Policy.
        </p>
      </>
    ),
  },
  {
    id: "carriers",
    title: "Carriers",
    body: (
      <>
        <p>
          Before a carrier can bid, we check its USDOT number and, where required, its operating authority
          against public records from the Federal Motor Carrier Safety Administration (FMCSA), and the carrier
          must complete Stripe onboarding. We re-check records over time. Verification reflects public records
          and documents at the time of the check. It is not an endorsement or a guarantee of performance.
        </p>
        <p>
          Carriers agree to the <Link href="/legal/carrier-agreement">Carrier Agreement</Link>, which sets out
          insurance, conduct, payout and claims terms.
        </p>
      </>
    ),
  },
  {
    id: "prohibited-conduct",
    title: "Things you may not do",
    body: (
      <ul>
        <li>
          Arrange payment outside AllShip for a load you found or booked through AllShip, or ask the other
          side to do so.
        </li>
        <li>
          Post false loads, place bids you don&apos;t intend to honor, or misrepresent your identity,
          authority or insurance.
        </li>
        <li>Harass, threaten or discriminate against other users.</li>
        <li>
          Scrape, copy or resell data from the Service, or access it with bots except through tools we
          provide.
        </li>
        <li>
          Interfere with the security of the Service, probe for vulnerabilities without permission, or upload
          malware.
        </li>
        <li>Use the Service for anything illegal, including shipping prohibited goods.</li>
      </ul>
    ),
  },
  {
    id: "ai-assistant",
    title: "The AllShip AI assistant",
    body: (
      <>
        <p>
          The assistant can help you describe a load, estimate a price range, compare bids and answer
          questions. Its answers are generated automatically and can be wrong or incomplete. Check important
          details, such as dimensions, regulations and prices, before relying on them.
        </p>
        <p>
          The assistant only acts on your account when you ask it to and confirm the action. You are
          responsible for loads, bids and messages you approve.
        </p>
      </>
    ),
  },
  {
    id: "messages-sms",
    title: "Messages, email and SMS",
    body: (
      <>
        <p>
          We send service messages about your account and loads by email and in the app. If you give us your
          phone number and opt in, we also send transactional text messages, such as booking confirmations,
          pickup and delivery updates and security codes.
        </p>
        <ul>
          <li>Message frequency depends on your activity. Message and data rates may apply.</li>
          <li>Reply STOP to stop texts and HELP for help.</li>
          <li>
            Consent to texts is not a condition of using the Service. We do not send marketing texts without
            separate consent.
          </li>
        </ul>
        <p>
          Keep conversations about a load in AllShip messages. They become part of the record if there is a
          dispute.
        </p>
      </>
    ),
  },
  {
    id: "content",
    title: "Your content and reviews",
    body: (
      <>
        <p>
          You keep ownership of what you upload, such as load descriptions, photos, documents, messages and
          reviews. You give AllShip a non-exclusive, worldwide, royalty-free license to host, display and
          process that content to run, improve and promote the Service, and to share it with other users as
          needed for a load.
        </p>
        <p>
          Reviews can be left only after a completed load and must reflect a real experience. We may remove
          content that breaks these terms or the law.
        </p>
        <p>
          The Service, its software, design and the AllShip name and logo belong to AllShip or its licensors.
        </p>
      </>
    ),
  },
  {
    id: "disclaimers",
    title: "Disclaimers",
    body: (
      <>
        <p>
          The Service is provided &quot;as is&quot; and &quot;as available&quot;. To the extent the law
          allows, we disclaim all warranties, express or implied, including merchantability, fitness for a
          particular purpose and non-infringement.
        </p>
        <p>
          We do not control, and are not responsible for, how carriers perform transportation, the condition
          of shipments, delays, or the acts of shippers and carriers. Carriers are responsible for loss or
          damage to goods in their care as provided by law and their own terms.
        </p>
      </>
    ),
  },
  {
    id: "liability",
    title: "Limitation of liability",
    body: (
      <>
        <p>
          To the extent the law allows, AllShip will not be liable for indirect, incidental, special,
          consequential or punitive damages, or for lost profits, revenue or data, arising from the Service or
          these terms.
        </p>
        <p>
          To the extent the law allows, AllShip&apos;s total liability for any claim related to a load is
          limited to the service fees you paid AllShip for that load, and for any other claim to the greater
          of $100 or the service fees you paid AllShip in the 12 months before the claim. Some states do not
          allow these limits, so they may not apply to you.
        </p>
      </>
    ),
  },
  {
    id: "indemnity",
    title: "Indemnity",
    body: (
      <p>
        You agree to defend and hold harmless AllShip and its officers, employees and agents from third-party
        claims, losses and costs, including reasonable attorneys&apos; fees, arising from your content, your
        shipments, your transportation services, or your breach of these terms or the law.
      </p>
    ),
  },
  {
    id: "governing-law",
    title: "Governing law and disputes with AllShip",
    body: (
      <>
        <p>
          These terms are governed by the laws of the State of Delaware, without regard to its conflict-of-law
          rules, and by applicable federal law.
        </p>
        <p>
          If you have a dispute with AllShip, contact us first at {site.email}. We will try to resolve it
          informally within 30 days. If we can&apos;t, either of us may bring a claim in the state or federal
          courts located in Delaware, and both of us consent to their jurisdiction. Either of us may instead
          bring an individual claim in small claims court where it qualifies.
        </p>
      </>
    ),
  },
  {
    id: "termination",
    title: "Suspension and termination",
    body: (
      <>
        <p>
          You can close your account at any time in settings, after any booked loads are completed or
          cancelled.
        </p>
        <p>
          We may suspend or close accounts that break these terms, create risk for other users, fail
          verification, or that we must close by law. When possible, we will tell you why and let you finish
          or cancel booked loads. Sections that by their nature should continue, such as payments owed,
          disputes, disclaimers, liability limits and governing law, survive termination.
        </p>
      </>
    ),
  },
  {
    id: "changes",
    title: "Changes to these terms",
    body: (
      <p>
        We may update these terms. We will post the new version here with a new date and, for material
        changes, notify you by email or in the app at least 14 days before they take effect. Changes do not
        apply to loads already booked.
      </p>
    ),
  },
];

export const termsSummary = (
  <p>
    In short: AllShip connects shippers with independent carriers. Shippers pay the accepted bid plus a {fee}%
    service fee, we hold the money through Stripe, and the carrier is paid after delivery is confirmed or{" "}
    {hours} hours pass without a dispute.
  </p>
);

export const termsDescription =
  "The rules for using AllShip AI: posting loads, carrier bids, escrow payments through Stripe, the 10% service fee, delivery confirmation and disputes.";
