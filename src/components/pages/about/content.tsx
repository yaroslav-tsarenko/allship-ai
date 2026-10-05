import type { ReactNode } from "react";
import type { DescriptionBlock } from "@/components/sections";
import { site } from "@/content/site";

function Term({ name, children }: { name: string; children: ReactNode }) {
  return (
    <>
      <strong className="font-medium text-on-surface">{name}:</strong> {children}
    </>
  );
}

export const aboutIntro =
  "At AllShip AI, we are rebuilding how moving and transportation get booked, with practical artificial intelligence and honest service. The platform was created with a single mission: to give shippers and carriers an efficient, transparent and cost-effective way to work together. AllShip AI is not just a booking form. It is a marketplace where you post a load, carriers verified with the FMCSA bid on it, and your payment is held in escrow until delivery is confirmed.\n\nOur AI assistant helps you describe a load, estimate a fair price and compare bids, so you save time, keep costs under control and make better decisions in a fast-moving market. Whether you are moving one sofa or shipping freight every week, AllShip AI works the same way: you see real bids and you choose.";

export const aboutSections: DescriptionBlock[] = [
  {
    title: "Our vision",
    content:
      "At AllShip AI, we envision a world where logistics is simple, intelligent and fair to both sides of the deal. Our goal is to become the leading AI-assisted marketplace for moving and shipping in the United States, where every shipper can find a verified carrier in minutes and every carrier gets paid reliably for the work they do.",
  },
  {
    title: "Core values",
    list: {
      items: [
        <Term key="t" name="Transparency">
          We believe in open and honest communication with our partners and customers. You see the carrier&apos;s bid and our service fee before you pay.
        </Term>,
        <Term key="e" name="Efficiency">
          The platform is designed to cut phone calls, back-and-forth and delays, from posting a load to confirming delivery.
        </Term>,
        <Term key="i" name="Innovation">
          We keep improving the AllShip AI assistant so it takes more routine work off your hands, while you stay in control of every decision.
        </Term>,
        <Term key="s" name="Sustainability">
          Carriers bid on loads along the lanes they already drive, which helps fill trucks that would otherwise run empty.
        </Term>,
        <Term key="p" name="Partnership">
          We value long-term relationships with shippers and carriers and work to make every completed load a good experience for both.
        </Term>,
      ],
    },
  },
  {
    title: "Why choose AllShip AI?",
    list: {
      items: [
        <Term key="a" name="Practical AI">
          The assistant drafts loads from a plain description, gives labeled price estimates and ranks bids by price, dates, reviews and authority status.
        </Term>,
        <Term key="c" name="Real support">
          {`Our team is available by phone at ${site.phone.display} and by email at ${site.email}, and the assistant answers questions about fees, escrow and bidding at any time.`}
        </Term>,
        <Term key="r" name="Live updates">
          Status changes, messages and the driver&apos;s latest location appear in your dashboard as they happen.
        </Term>,
        <Term key="s" name="Scales with you">
          Whether you are a household or a business with regular freight, you post loads the same way and pay per load, with no subscription.
        </Term>,
      ],
    },
  },
  {
    title: "Our commitment to sustainability",
    content:
      "At AllShip AI, we recognize the importance of sustainable logistics. When carriers can find loads that match the routes they already run, fewer trucks drive empty miles. Complete load details also mean the right truck shows up the first time, and bids, photos and receipts stay digital instead of on paper.",
  },
  {
    title: "Join AllShip AI",
    content:
      "When you sign up with AllShip AI, you are not just choosing a logistics platform. You are choosing verified carriers, clear prices and a payment that stays protected until the job is done. Create a free account and post your first load today.",
  },
  {
    title: "How AllShip AI stands out",
    list: {
      items: [
        <Term key="v" name="Verified carriers">
          Before a carrier can bid, we check their USDOT and MC numbers with the FMCSA, confirm their insurance and require a Stripe payouts account in the company&apos;s name.
        </Term>,
        <Term key="e" name="Escrow by default">
          Your payment is held by Stripe and released to the carrier only after delivery is confirmed, or automatically {site.autoConfirmHours} hours after delivery if you don&apos;t respond.
        </Term>,
        <Term key="r" name="Reviews from real jobs">
          Only shippers who completed a load with a carrier can review them, so every rating comes from a real shipment.
        </Term>,
        <Term key="i" name="Industry focus">
          Each of our shipment types has its own form, so carriers get the details that matter for that kind of load before they bid.
        </Term>,
      ],
    },
  },
  {
    title: "Driving sustainability in logistics",
    content:
      "AllShip AI is committed to reducing wasted miles in transportation. A marketplace where carriers choose loads in their own lanes helps them plan full trips, and accurate load details reduce failed pickups and repeat runs. Every load that moves on a truck that was already on the road is a step toward greener logistics.",
  },
  {
    title: "Comprehensive solutions for every business",
    list: {
      items: [
        <Term key="o" name="One platform for every load">
          Household and office moves, cars, boats and RVs, freight, heavy equipment, and trucks with drivers are all posted and paid for the same way.
        </Term>,
        <Term key="s" name="Scalable features">
          Carrier companies can add their team and drivers, and shippers can post as many loads as they need.
        </Term>,
        <Term key="r" name="Clear records">
          Every load keeps its bids, messages, photos, payments and receipts in one place, ready when you need them for accounting or a dispute.
        </Term>,
      ],
    },
  },
  {
    title: "Partnering with AllShip AI",
    content:
      "When you choose AllShip AI, you are choosing logistics that is smarter, faster and fairer. Carriers keep their full bid amount, shippers see the full price before paying, and the AllShip AI assistant helps both sides along the way.",
  },
  {
    title: "Take your logistics to the next level",
    content:
      "Ready to change the way you ship? Explore the AllShip AI platform and see the difference for yourself. Contact us to learn how AllShip AI can work for your business, or create a free account and post your first load.",
  },
];
