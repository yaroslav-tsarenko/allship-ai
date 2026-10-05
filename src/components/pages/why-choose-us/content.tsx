import Link from "next/link";
import type { ReactNode } from "react";
import type { DescriptionBlock } from "@/components/sections";
import { categories } from "@/content/categories";
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

export const whyIntro = `AllShip AI combines a marketplace of verified carriers with AI tools that make posting, pricing and booking faster. Carriers compete for your load, you compare real bids, and your payment waits in escrow until delivery. Here is what that means in practice.`;

export const whySections: DescriptionBlock[] = [
  {
    title: "1. Faster bookings",
    content: "Getting a truck should not start with ten phone calls. On AllShip AI you:",
    list: {
      items: [
        <Item key="post" term="Post once">
          Describe your load in one form, or let the AllShip AI assistant draft it from a few sentences.
        </Item>,
        <Item key="bids" term="Get bids, not callbacks">
          Verified carriers who serve your lane send prices directly to your dashboard.
        </Item>,
        <Item key="book" term="Book in one step">
          Accept a bid and pay into escrow, and the load is booked to that carrier.
        </Item>,
      ],
    },
  },
  {
    title: "2. Vetted carriers only",
    content: "Every carrier passes the same checks before they can bid:",
    list: {
      items: [
        <Item key="fmcsa" term="USDOT and MC numbers">
          Looked up with FMCSA and confirmed active for the same company.
        </Item>,
        <Item key="ins" term="Insurance">
          Valid cargo and liability coverage in the company&apos;s name.
        </Item>,
        <Item key="payouts" term="Payouts">
          A Stripe account in the company&apos;s name, never a personal one.
        </Item>,
      ],
    },
  },
  {
    title: "3. AI pricing insight",
    content: "AI helps you know what a fair price looks like before and after you post:",
    list: {
      items: [
        <Item key="estimate" term="Estimates before you post">
          Our{" "}
          <Link href="/tools/moving-cost-calculator" className={inline}>
            cost calculators
          </Link>{" "}
          and the assistant give a rough range based on our working rate assumptions.
        </Item>,
        <Item key="market" term="Market prices from real bids">
          Carriers bid against each other, so the price you see is what the market will charge today.
        </Item>,
        <Item key="compare" term="Help comparing bids">
          Ask the assistant to compare bids on price, timing and reviews.
        </Item>,
      ],
    },
  },
  {
    title: "4. Transparent pricing",
    content: `One formula for every load: the carrier's bid plus a ${fee} service fee.`,
    list: {
      items: [
        <Item key="before" term="Shown before you pay">
          The bid, the fee and your total are on screen before checkout.
        </Item>,
        <Item key="free" term="Free to post">
          No posting fee, no subscription and no charge if you do not accept a bid.
        </Item>,
        <Item key="carriers" term="Fair to carriers">
          Carriers keep 100% of their bid, so they can bid their best price.
        </Item>,
      ],
    },
  },
  {
    title: "5. Escrow protection",
    content: "Your payment books the carrier, but it is released only after delivery:",
    list: {
      items: [
        <Item key="held" term="Held through Stripe">
          The carrier is not paid when you pay. Card details never touch our servers.
        </Item>,
        <Item key="confirm" term="Released on confirmation">
          You confirm delivery, or the load confirms automatically {hours} hours after it is marked delivered.
        </Item>,
        <Item key="dispute" term="Disputes hold the payout">
          Report a problem before confirming and the payout waits while we review the trip record.
        </Item>,
      ],
    },
  },
  {
    title: "6. Proof at every step",
    content: "Drivers update the trip from their phone, and everything stays with the load:",
    list: {
      items: [
        <Item key="status" term="Live status">
          On the way to pickup, picked up, in transit and delivered, with the driver&apos;s location shared only during the trip.
        </Item>,
        <Item key="photos" term="Photos">
          The load as the driver receives it, and again at delivery.
        </Item>,
        <Item key="sign" term="Signature">
          The receiver signs on the driver&apos;s screen.
        </Item>,
      ],
    },
  },
  {
    title: "7. Honest reviews",
    content: "Ratings you can trust because they come from real jobs:",
    list: {
      items: [
        <Item key="completed" term="Completed loads only">
          Only the shipper on a delivered and confirmed load can review the carrier who moved it.
        </Item>,
        <Item key="replies" term="Carrier replies">
          Carriers can reply to a review, so you see both sides.
        </Item>,
        <Item key="no-fake" term="No invented testimonials">
          Our pages show only reviews with a named source, or reviews from completed AllShip AI loads.
        </Item>,
      ],
    },
  },
  {
    title: "8. One platform for every load",
    content: `${categories.length} load types, one account, one way to pay:`,
    list: {
      items: [
        <Item key="moving" term="Moving">
          Household and office moves, single items and help with heavy lifting.
        </Item>,
        <Item key="vehicles" term="Vehicles and boats">
          Cars, motorcycles, RVs, trailers, boats and parts.
        </Item>,
        <Item key="freight" term="Freight and equipment">
          LTL, full truckload and heavy or oversized machinery.
        </Item>,
        <Item key="trucks" term="Trucks">
          A rental truck with the carrier&apos;s driver for a day or longer, or a truck with a driver by the hour.
        </Item>,
      ],
    },
  },
  {
    title: "9. Support from real people",
    content: "When a load needs attention, you can reach us directly:",
    list: {
      items: [
        <Item key="email" term="Email">
          <a href={`mailto:${site.email}`} className={inline}>
            {site.email}
          </a>
        </Item>,
        <Item key="phone" term="Phone">
          <a href={site.phone.href} className={inline}>
            {site.phone.display}
          </a>
        </Item>,
        <Item key="chat" term="In the app">
          Message your carrier at any point, and ask the AllShip AI assistant about your loads.
        </Item>,
      ],
    },
  },
];

export const whyCompare = [
  { label: "Getting prices", old: "Call or email carriers one by one and wait for callbacks", ours: "Post once. Verified carriers who serve your lane send bids to your dashboard" },
  { label: "Checking the carrier", old: "Look up USDOT and insurance yourself", ours: "USDOT, MC and insurance checked before a carrier can bid" },
  { label: "Comparing offers", old: "Quotes in different formats across calls, texts and emails", ours: "Bids side by side with price, dates, reviews and the carrier's message" },
  { label: "Paying", old: "Often a deposit up front, straight to the carrier", ours: `Bid plus ${fee}, held in escrow until delivery` },
  { label: "During the trip", old: "Call the driver for updates", ours: "Live status and driver location while the trip is active" },
  { label: "If something goes wrong", old: "Your word against theirs", ours: "Pickup and delivery photos, a signature and a dispute that holds the payout" },
];
