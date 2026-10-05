import Link from "next/link";
import type { ReactNode } from "react";
import type { DescriptionBlock, FaqEntry } from "@/components/sections";
import { site } from "@/content/site";

const fee = `${site.platformFeePercent}%`;
const hours = site.autoConfirmHours;
const inline = "text-primary underline underline-offset-4 decoration-primary/40 hover:decoration-primary";

function Item({ term, children }: { term: string; children: ReactNode }) {
  return (
    <>
      <strong className="font-medium text-on-surface">{term}:</strong> {children}
    </>
  );
}

export const pricingIntro = `On AllShip AI, carriers set prices by bidding on your load, and AI tools help both sides read the market. You pay the bid you accept plus a ${fee} service fee, shown before you pay and held in escrow until delivery. Carriers keep 100% of their bid. No posting fee, no subscription, and no charge if you do not accept a bid.`;

export const pricingSections: DescriptionBlock[] = [
  {
    title: "1. Dynamic pricing models",
    content: "Because carriers bid on each load, prices follow the market in real time. A bid usually reflects:",
    list: {
      items: [
        <Item key="demand" term="Market demand">
          Busy seasons, weekends and the end of the month draw more requests, and bids rise with them. Flexible dates usually bring lower bids.
        </Item>,
        <Item key="supply" term="Supply levels">
          How many verified carriers serve your lane and have a truck free on your dates.
        </Item>,
        <Item key="history" term="Rough estimates first">
          Before you post, our{" "}
          <Link href="/tools/moving-cost-calculator" className={inline}>
            moving
          </Link>{" "}
          and{" "}
          <Link href="/tools/car-shipping-cost-calculator" className={inline}>
            car shipping
          </Link>{" "}
          calculators and the AllShip AI assistant give a rough range based on our working rate assumptions. Carrier bids set the real price.
        </Item>,
        <Item key="route" term="Route-specific variables">
          Distance, tolls, fuel, remote pickups and access at each stop, such as stairs, elevators or the lack of a loading dock.
        </Item>,
      ],
    },
  },
  {
    title: "2. Cost optimization",
    content: "A few details in your post make a real difference to the bids you get:",
    list: {
      items: [
        <Item key="dates" term="Flexible dates">
          A pickup window of a few days lets carriers fit your load into a trip they are already making.
        </Item>,
        <Item key="details" term="Complete details">
          Accurate sizes, weights, item lists and photos mean fewer surprises, so carriers do not need to price in a margin for the unknown.
        </Item>,
        <Item key="combine" term="One load, not several">
          Combine items going to the same place into one load instead of booking separate trips.
        </Item>,
        <Item key="equipment" term="The right equipment">
          Ask for an enclosed trailer, liftgate or extra helpers only when you need them.
        </Item>,
      ],
    },
  },
  {
    title: "3. Competitive analysis",
    content: "Carriers compete for your load, and you compare their offers side by side:",
    list: {
      items: [
        <Item key="price" term="Carrier pricing">
          Every bid shows the price, so you can compare offers on the same load directly.
        </Item>,
        <Item key="timing" term="Delivery estimate">
          Each carrier states when they can pick up and deliver.
        </Item>,
        <Item key="reputation" term="Verification and reviews">
          Every bidder is FMCSA-checked, and ratings come only from shippers on completed loads.
        </Item>,
        <Item key="message" term="The carrier’s message">
          Read what is included and ask questions in chat before you accept.
        </Item>,
      ],
    },
  },
  {
    title: "4. Real-time adjustments",
    content: "Your load stays open while bids come in, so you decide when the price is right:",
    list: {
      items: [
        <Item key="new" term="New bids as they arrive">
          You are notified as carriers bid, and you can accept whenever one fits.
        </Item>,
        <Item key="ask" term="Questions before you commit">
          Clear up access, packing or timing in chat, so the price covers the whole job.
        </Item>,
        <Item key="none" term="No match, no charge">
          If no bid fits, do not accept one. You are never charged for posting a load or receiving bids.
        </Item>,
      ],
    },
  },
  {
    id: "fee",
    title: "5. Transparency in pricing",
    content: (
      <p>
        You see the full breakdown before you pay. Try any bid amount in the{" "}
        <a href="#fee-calculator" className={inline}>
          fee calculator
        </a>{" "}
        at the top of this page.
      </p>
    ),
    list: {
      items: [
        <Item key="breakdown" term="Breakdown of costs">
          The carrier&apos;s bid, the {fee} service fee and your total, shown before checkout.
        </Item>,
        <Item key="included" term="What the fee pays for">
          Carrier verification with FMCSA, Stripe escrow, dispute handling, pickup photos and proof of delivery, in-app messaging and the AllShip AI assistant.
        </Item>,
        <Item key="never" term="Never charged for">
          Posting a load, receiving bids, a subscription or a monthly plan.
        </Item>,
      ],
    },
  },
  {
    title: "6. Revenue management",
    content: "For carriers, the price you bid is the price you are paid:",
    list: {
      items: [
        <Item key="keep" term="100% of your bid">
          The {fee} fee is added to the shipper&apos;s total, never taken out of your bid.
        </Item>,
        <Item key="paid" term="Paid after delivery">
          The payment is already in escrow when the load is booked. Your full bid is transferred when the shipper confirms delivery, or automatically {hours} hours after it is marked delivered.
        </Item>,
        <Item key="free" term="No subscription to bid">
          Bidding is free for verified carriers. See the{" "}
          <Link href="/partners" className={inline}>
            partners page
          </Link>{" "}
          for details.
        </Item>,
      ],
    },
  },
  {
    title: "7. Sustainability benefits",
    content: "Bid-based pricing helps trucks run fuller:",
    list: {
      items: [
        <Item key="empty" term="Reducing empty miles">
          Carriers bid on loads along lanes they already run, including return trips that would otherwise be empty.
        </Item>,
        <Item key="match" term="Better-matched trucks">
          You describe the load, and carriers with the right size truck bid, so fewer oversized trucks run half empty.
        </Item>,
        <Item key="waste" term="Fewer wasted trips">
          Clear details and chat before booking mean fewer failed pickups and repeat visits.
        </Item>,
      ],
    },
  },
  {
    title: "8. Client retention strategies",
    content: "Pricing on AllShip AI is built to be fair to both sides, every time:",
    list: {
      items: [
        <Item key="consistent" term="Consistent fee">
          The same {fee} service fee on every load type, with no tiers or upsells.
        </Item>,
        <Item key="protected" term="Protected payment">
          Your money stays in escrow until delivery, and opening a dispute holds the carrier&apos;s payout while we review the trip record.
        </Item>,
        <Item key="policy" term="Clear cancellation rules">
          Refunds follow the published{" "}
          <Link href="/legal/cancellation-refunds" className={inline}>
            cancellation and refund policy
          </Link>
          , so you know what applies before you book.
        </Item>,
      ],
    },
  },
  {
    title: "9. Scalability",
    content: "The same pricing works for one sofa or a fleet's worth of freight:",
    list: {
      items: [
        <Item key="types" term="Every load type">
          Household moves, vehicles, boats, freight, heavy equipment, truck rental and trucks with a driver.
        </Item>,
        <Item key="volume" term="Handling increased volume">
          Post as many loads as you need. Each one is priced by its own bids.
        </Item>,
        <Item key="us" term="Across the United States">
          Local and long-distance loads anywhere in the US, priced in US dollars.
        </Item>,
      ],
    },
  },
];

export const marketRanges = [
  { size: "Studio or single room", low: 299, high: 699, crew: "2 movers, standard truck, basic packing materials, up to 3 hours" },
  { size: "1–2 bedroom apartment", low: 700, high: 1899, crew: "3 movers, larger truck, furniture disassembly, up to 5 hours" },
  { size: "House or townhouse", low: 2499, high: 6499, crew: "4 movers, large truck, full packing, specialty items, up to 8 hours" },
  { size: "Large home or long-distance", low: 7499, high: 26499, crew: "6+ movers, one or more trucks, crating and storage" },
];

export const pricingFaq: FaqEntry[] = [
  {
    question: "Who sets the price?",
    answer: `The carriers. Each one bids what they want to be paid for your load, and you choose. AllShip AI adds a ${fee} service fee on top of the bid you accept and shows it before you pay.`,
  },
  {
    question: "When am I charged?",
    answer: `When you accept a bid. The full amount is held in escrow through Stripe. The carrier receives their bid only after you confirm delivery, or automatically ${hours} hours after delivery.`,
  },
  {
    question: "Do carriers pay a fee?",
    answer: `No fee is taken from a carrier's bid and there is no subscription to bid. The shipper pays the ${fee} service fee on top. The optional dispatch service for carriers has its own agreement.`,
  },
  {
    question: "Are the moving price ranges on this page AllShip AI prices?",
    answer: "No. They are typical ranges charged by moving companies, shown to help you sanity-check bids. On AllShip AI, the price is whatever the carrier you pick bids, plus the service fee.",
  },
  {
    question: "Is the service fee refundable?",
    answer: "Refunds, including the service fee, follow the cancellation and refund policy, which depends on how close to pickup you cancel. Read it before you book.",
  },
  {
    question: "Which payment methods can I use?",
    answer: "Payments are processed by Stripe. Available methods are shown at checkout and can include cards, Apple Pay, Google Pay and bank payments. AllShip AI does not store your card number.",
  },
];

export const pricingCompare = [
  { item: "Posting a load", shipper: "Free", carrier: "—" },
  { item: "Receiving and comparing bids", shipper: "Free", carrier: "—" },
  { item: "Bidding on loads", shipper: "—", carrier: "Free after verification" },
  { item: "Subscription or monthly plan", shipper: "None", carrier: "None" },
  { item: "Service fee", shipper: `${fee} on top of the accepted bid`, carrier: "None. Nothing is deducted from your bid" },
  { item: "When money moves", shipper: "Charged when you accept a bid, held in escrow", carrier: `Full bid paid after delivery is confirmed or ${hours} hours pass` },
  { item: "If something goes wrong", shipper: "Open a dispute before confirming; the payout waits", carrier: "The trip record of photos and signature is reviewed" },
];
