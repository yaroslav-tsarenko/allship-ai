import Link from "next/link";
import { LegalDocument, type LegalSection } from "@/components/marketing/legal/legal-document";
import { site } from "@/content/site";
import { buildMetadata } from "@/lib/seo";

const path = "/legal/carrier-agreement";

export const metadata = buildMetadata({
  title: "Carrier Agreement",
  description: "Terms for carriers on AllShip AI: FMCSA verification, insurance, bidding, performing loads, payouts through Stripe Connect after delivery, claims and conduct.",
  path,
});

const hours = site.autoConfirmHours;

const sections: LegalSection[] = [
  {
    id: "scope",
    title: "Scope",
    body: (
      <>
        <p>This Carrier Agreement applies to any business that bids on or carries loads through AllShip (&quot;Carrier&quot;, &quot;you&quot;). It adds to the <Link href="/terms-and-conditions">Terms and Conditions</Link>. If the two conflict on a carrier matter, this agreement controls.</p>
        <p>You accept this agreement when you create a carrier account or place your first bid.</p>
      </>
    ),
  },
  {
    id: "independent-contractor",
    title: "Independent business relationship",
    body: (
      <>
        <p>You are an independent business. You are not an employee, agent, partner or joint venturer of {site.legalName}. You decide which loads to bid on, your prices, your routes and how you perform the work.</p>
        <p>You are solely responsible for your drivers, helpers and subcontractors, including their wages, benefits, licensing, hours of service, workers&apos; compensation and taxes. Drivers you add in the app act for you, not for AllShip.</p>
        <p>You may not hand a booked load to another carrier without the shipper&apos;s written agreement through AllShip messages, and any carrier you use must also be verified on AllShip.</p>
      </>
    ),
  },
  {
    id: "eligibility",
    title: "Eligibility and verification",
    body: (
      <>
        <p>To bid, you must:</p>
        <ul>
          <li>Hold an active USDOT number and, where your operation requires it, active operating authority (MC number) from the Federal Motor Carrier Safety Administration (FMCSA).</li>
          <li>Not have an out-of-service order or an unsatisfactory safety rating.</li>
          <li>Keep the insurance described below in force.</li>
          <li>Complete Stripe Connect onboarding, including identity verification, so you can receive payouts.</li>
        </ul>
        <p>We check your records against FMCSA public data when you sign up and again over time. If your authority, safety status or insurance lapses, we may pause bidding and, for booked loads, notify the shipper.</p>
      </>
    ),
  },
  {
    id: "insurance",
    title: "Insurance",
    body: (
      <>
        <p>You must keep, at your own cost:</p>
        <ul>
          <li>Auto liability insurance at least at the levels federal and state law require for your vehicles and operation.</li>
          <li>Cargo insurance that covers the goods you carry, at least at the minimum shown in the app for the load type.</li>
          <li>Workers&apos; compensation and any other coverage required where you operate.</li>
        </ul>
        <p>Upload current certificates of insurance and keep them up to date. Tell us within 2 business days if a policy is cancelled, reduced or not renewed.</p>
      </>
    ),
  },
  {
    id: "bidding",
    title: "Bidding",
    body: (
      <>
        <p>A bid is a binding offer to carry the load as described, for the price you enter, within the dates you state. Review the listing, photos and questions before bidding, and ask through AllShip messages if anything is unclear.</p>
        <p>Your bid price is the total you will receive for the load. Do not add charges after booking unless the shipper agrees in AllShip messages because the shipment differs from the listing.</p>
        <p>You can withdraw a bid until it is accepted.</p>
      </>
    ),
  },
  {
    id: "performing-loads",
    title: "Performing a load",
    body: (
      <ul>
        <li>Arrive within the agreed pickup window and keep the shipper updated through the app.</li>
        <li>Use suitable, safe and legally compliant equipment, and load, secure and protect the shipment with care.</li>
        <li>Record pickup and delivery in the app, including condition photos at pickup and proof of delivery (photos and signature) at delivery.</li>
        <li>For interstate household goods moves, follow the federal consumer protection rules for household goods carriers, including required estimates, paperwork and disclosures.</li>
        <li>Follow hours-of-service, licensing, permit and escort rules for oversize or overweight loads.</li>
      </ul>
    ),
  },
  {
    id: "payouts",
    title: "Payment and payouts",
    body: (
      <>
        <p>The shipper pays your bid plus AllShip&apos;s service fee at booking. AllShip&apos;s service fee is charged to the shipper, so you receive 100% of your accepted bid. Payments are held until the load is completed.</p>
        <p>A load is completed when the shipper confirms delivery, or {hours} hours after you mark it delivered with proof of delivery if no dispute is opened. We then send your payout to your Stripe Connect account. Stripe&apos;s payout schedule for your account decides when it reaches your bank.</p>
        <p>You are responsible for your taxes. Stripe may issue Form 1099-K if you meet the reporting thresholds.</p>
      </>
    ),
  },
  {
    id: "cancellations",
    title: "Cancellations",
    body: (
      <>
        <p>If you cancel a booked load, or fail to show up without notice, the shipper receives a full refund and you receive nothing for that load. Repeated cancellations or no-shows may lead to suspension.</p>
        <p>If the shipper cancels less than 48 hours before pickup, you receive the late-cancellation fee set out in the <Link href="/legal/cancellation-refunds">Cancellation and Refund Policy</Link>.</p>
      </>
    ),
  },
  {
    id: "claims",
    title: "Disputes and cargo claims",
    body: (
      <>
        <p>If a shipper opens a dispute, your payout for that load is frozen until it is resolved. Respond with your evidence, usually within 3 business days. We decide how the held funds are released, as described in the Terms and Conditions.</p>
        <p>You are liable for loss of or damage to goods in your care as provided by applicable law, including federal law for interstate shipments, and by the terms you agreed with the shipper. Handle claims promptly and in good faith, and involve your cargo insurer where appropriate.</p>
      </>
    ),
  },
  {
    id: "conduct",
    title: "Conduct and non-circumvention",
    body: (
      <ul>
        <li>Do not ask shippers to pay you outside AllShip for loads you found or booked on AllShip, or to cancel and rebook off the platform.</li>
        <li>Use shipper contact details and addresses only to perform the load. Do not use them for marketing or share them.</li>
        <li>Treat shippers and their property with respect. Harassment or discrimination leads to removal.</li>
        <li>Do not create multiple accounts or bid under another carrier&apos;s authority.</li>
      </ul>
    ),
  },
  {
    id: "ratings",
    title: "Ratings",
    body: <p>Shippers can rate you after a completed load. Ratings are shown with your bids. You can respond to a review once. We remove reviews that are fake, abusive or unrelated to the load, but we do not remove reviews just because they are negative.</p>,
  },
  {
    id: "termination",
    title: "Suspension and termination",
    body: <p>You can close your carrier account once your booked loads are completed. We may suspend or end your access if you break this agreement or the Terms and Conditions, fail verification, lose required insurance or authority, or create safety risks. Payouts for completed loads that are not under dispute will still be paid.</p>,
  },
];

export default function Page() {
  return (
    <LegalDocument
      path={path}
      crumb="Carrier agreement"
      title="Carrier Agreement"
      summary={<p>You run your own business. We verify your FMCSA records, show your bids to shippers, hold the shipper&apos;s payment and pay you 100% of your bid after delivery is confirmed.</p>}
      sections={sections}
    />
  );
}
