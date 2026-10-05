import Link from "next/link";
import { LegalDocument, type LegalSection } from "@/components/marketing/legal/legal-document";
import { site } from "@/content/site";
import { buildMetadata } from "@/lib/seo";

const path = "/legal/cancellation-refunds";

export const metadata = buildMetadata({
  title: "Cancellation and Refund Policy",
  description: "When you can cancel a load on AllShip AI, what you get back before booking, after booking and after pickup, and how refunds reach your original payment method.",
  path,
});

const hours = site.autoConfirmHours;

const timeline = [
  { when: "Before booking", who: "Shipper withdraws the load or lets it expire", refund: "Nothing was charged. No fee." },
  { when: "Bid accepted, payment not finished", who: "Shipper does not pay within 30 minutes", refund: "Acceptance lapses. Nothing was charged." },
  { when: "Booked, 48 hours or more before pickup", who: "Shipper cancels", refund: "Full refund, including the service fee." },
  { when: "Booked, less than 48 hours before pickup", who: "Shipper cancels", refund: "Refund minus a late-cancellation fee paid to the carrier: 10% of the carrier price, up to $250. The service fee is not refunded." },
  { when: "Booked, any time before pickup", who: "Carrier cancels or does not show up", refund: "Full refund, including the service fee, or repost the load for new bids." },
  { when: "After pickup", who: "Either side", refund: "No cancellation. Problems go through the dispute process." },
];

const sections: LegalSection[] = [
  {
    id: "summary",
    title: "At a glance",
    body: (
      <div className="mt-2 overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-left text-body-md">
          <caption className="sr-only">Cancellation outcomes by stage</caption>
          <thead>
            <tr className="border-b border-outline">
              <th scope="col" className="py-2 pr-4 font-medium text-on-surface">When</th>
              <th scope="col" className="py-2 pr-4 font-medium text-on-surface">What happens</th>
              <th scope="col" className="py-2 font-medium text-on-surface">Money</th>
            </tr>
          </thead>
          <tbody>
            {timeline.map((r) => (
              <tr key={r.when + r.who} className="border-b border-outline-variant align-top">
                <th scope="row" className="py-3 pr-4 font-medium text-on-surface">{r.when}</th>
                <td className="py-3 pr-4">{r.who}</td>
                <td className="py-3">{r.refund}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ),
  },
  {
    id: "before-booking",
    title: "Before booking",
    body: (
      <>
        <p>Posting a load is free. You can edit or withdraw an open load at any time before you accept a bid, and you are never charged for doing so.</p>
        <p>If you accept a bid but don&apos;t finish payment within 30 minutes, the acceptance lapses, the load goes back to open, and no money changes hands.</p>
      </>
    ),
  },
  {
    id: "after-booking",
    title: "After booking, before pickup",
    body: (
      <>
        <p>A load is booked once you accept a bid and your payment succeeds. The carrier then reserves a truck and crew for your dates, so later cancellations cost them real money.</p>
        <h3>Cancelling 48 hours or more before pickup</h3>
        <p>You get a full refund of everything you paid: the carrier price and the AllShip service fee. The 48 hours are counted back from the start of the pickup window agreed with the carrier.</p>
        <h3>Cancelling less than 48 hours before pickup</h3>
        <p>The carrier receives a late-cancellation fee of 10% of the carrier price, capped at $250. You get the rest of the carrier price back. The service fee is not refunded.</p>
        <h3>Changing dates instead of cancelling</h3>
        <p>Ask the carrier through AllShip messages. If they agree to the new dates, nothing is charged. If they can&apos;t, you can cancel under the rules above.</p>
        <h3>Shipment not as described</h3>
        <p>If the carrier arrives and the shipment is materially different from the listing (for example, much larger, not ready, or not accessible as described) and the carrier cannot carry it at the agreed price, the carrier may decline the job. We treat that as a cancellation by the shipper less than 48 hours before pickup, unless the evidence shows otherwise.</p>
      </>
    ),
  },
  {
    id: "carrier-cancels",
    title: "When the carrier cancels",
    body: (
      <>
        <p>If the carrier cancels a booked load, or does not arrive within the agreed pickup window and does not respond, you get a full refund, including the service fee. You can also repost the load to get new bids instead.</p>
        <p>Carriers who cancel without a valid reason may lose bidding access. The <Link href="/legal/carrier-agreement">Carrier Agreement</Link> explains the rules for carriers.</p>
      </>
    ),
  },
  {
    id: "after-pickup",
    title: "After pickup: the dispute process",
    body: (
      <>
        <p>Once the carrier has picked up your shipment, the load can no longer be cancelled. If there is a problem, such as damage, missing items, major delays or a delivery that didn&apos;t happen, open a dispute in the app before the load is completed. A delivered load completes when you confirm it or {hours} hours after the carrier marks it delivered.</p>
        <ol>
          <li>Opening a dispute freezes the carrier&apos;s payout.</li>
          <li>Add photos, delivery paperwork and messages. The carrier can respond, usually within 3 business days.</li>
          <li>We review and decide how to release the money we hold: to the carrier, as a partial refund, or as a full refund. We aim to decide within 10 business days of receiving both sides&apos; evidence.</li>
        </ol>
        <p>The dispute decision covers only the money held for that load. A claim for loss or damage beyond that amount goes to the carrier and its cargo insurer. We will help by sharing the trip record, photos and messages.</p>
      </>
    ),
  },
  {
    id: "refund-timing",
    title: "How and when refunds arrive",
    body: (
      <>
        <p>Refunds go back to the original payment method through Stripe. We start the refund within 2 business days of the cancellation or dispute decision. Most banks show it within 5 to 10 business days.</p>
        <p>We cannot refund to a different card or account.</p>
      </>
    ),
  },
  {
    id: "chargebacks",
    title: "Chargebacks",
    body: <p>Please contact us before disputing a charge with your bank. A chargeback freezes the carrier&apos;s payout while the bank reviews it, and we will send the bank the booking, trip and delivery records. If a chargeback is opened while an AllShip dispute is in progress, the bank&apos;s decision controls the money.</p>,
  },
  {
    id: "service-fee",
    title: "The service fee",
    body: <p>The {site.platformFeePercent}% AllShip service fee pays for the marketplace, payment handling, carrier verification and support. It is refunded in full when you cancel 48 hours or more before pickup, when the carrier cancels, and when a dispute ends in a full refund. In other cases it is not refunded.</p>,
  },
];

export default function Page() {
  return (
    <LegalDocument
      path={path}
      crumb="Cancellation and refunds"
      title="Cancellation and Refund Policy"
      summary={<p>Cancel for free before booking and up to 48 hours before pickup. After that a small fee goes to the carrier who held the date. After pickup, problems are handled through a dispute while your payment is still held.</p>}
      sections={sections}
    />
  );
}
