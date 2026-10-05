import type { DescriptionBlock, FaqEntry } from "@/components/sections";
import { site } from "@/content/site";

function Value({ name, children }: { name: string; children: string }) {
  return (
    <>
      <strong className="block font-medium text-on-surface">{name}</strong>
      <span className="mt-1 block">{children}</span>
    </>
  );
}

export const allVision = {
  title: "Transforming logistics with AI: AllShip AI's vision",
  description:
    "AllShip AI is changing how people and businesses book transportation by putting practical artificial intelligence to work. Our mission is to make it simple to ship anything, from a household move to a car, a pallet of freight or a piece of heavy equipment. We are building a transparent marketplace where shippers post loads, FMCSA-verified carriers bid, and payment is held in escrow until delivery. AI helps with every step: describing the load, estimating a fair price, comparing bids and keeping you updated until the job is done.",
  sections: [
    {
      title: "Core values of AllShip AI",
      list: {
        items: [
          <Value key="i" name="Innovation: putting AI to practical use">
            AllShip AI uses artificial intelligence where it saves real time. The assistant turns a plain description into a load draft, estimates prices from distance, size and market rates, and ranks bids by price, dates, reviews and authority status. We keep improving these tools based on how shippers and carriers use them.
          </Value>,
          <Value key="t" name="Transparency: building trust with clear operations">
            {`Transparency is the cornerstone of AllShip AI. Shippers see every bid, the carrier's verification status and reviews from completed loads. The price you pay is the accepted bid plus a ${site.platformFeePercent}% service fee, shown before you pay, with no hidden charges.`}
          </Value>,
          <Value key="e" name="Efficiency: streamlining logistics processes">
            Posting a load takes minutes, carriers come to you with bids, and messages, photos, tracking updates and payments stay in one place. Fewer phone calls and less paperwork mean faster bookings for shippers and more time on the road for carriers.
          </Value>,
          <Value key="s" name="Sustainability: reducing wasted miles">
            Carriers bid on loads along the lanes they already drive, which helps them fill trucks that would otherwise run empty. Complete load details also mean the right truck arrives the first time, avoiding repeat trips.
          </Value>,
          <Value key="c" name="Customer focus: prioritizing client needs">
            {`Our clients are at the heart of what we do. Our team is available by phone at ${site.phone.display} and by email at ${site.email}, the AllShip AI assistant answers questions at any time, and escrow protects your payment until the job is done.`}
          </Value>,
        ],
      },
    },
  ] satisfies DescriptionBlock[],
};

export const allPerspective = {
  title: "Redefining logistics with AI: AllShip AI's perspective",
  description:
    "AllShip AI is reshaping how transportation gets booked by combining a carrier marketplace with an AI assistant. Our goal is to make shipping faster to arrange, fairer to price and safer to pay for. We are building a connected network where shippers, carriers and drivers work from the same load, with the same information, from the first bid to the confirmed delivery.",
  sections: [
    {
      title: "Key principles of AllShip AI",
      list: {
        items: [
          <Value key="i" name="Innovation: AI that does the busywork">
            The AllShip AI assistant drafts loads, estimates prices, compares bids for shippers, and finds matching loads and drafts bid messages for carriers. You review everything it prepares before anything is published or booked.
          </Value>,
          <Value key="t" name="Transparency: confidence through clarity">
            Every carrier is checked with the FMCSA before bidding, every review comes from a completed load, and every price is broken down into the carrier&apos;s bid and the AllShip service fee.
          </Value>,
          <Value key="e" name="Efficiency: one place for the whole job">
            Bids, messages, photos, status updates, the driver&apos;s latest location and payments are all on the load page, so nobody has to chase information by phone.
          </Value>,
          <Value key="s" name="Sustainability: fuller trucks, fewer empty miles">
            When carriers can find loads in their own lanes, they plan fuller trips. Digital bids, documents and receipts replace paper along the way.
          </Value>,
          <Value key="c" name="Customer focus: protection on both sides">
            {`Shippers' money is held in escrow until delivery is confirmed, or automatically ${site.autoConfirmHours} hours after delivery. Carriers know the payment is already collected before they pick up, and they keep their full bid amount.`}
          </Value>,
        ],
      },
    },
  ] satisfies DescriptionBlock[],
};

export const allIntroStart = {
  title: "Start shipping with AllShip AI",
  description: "Experience a better way to ship with AllShip AI, where verified carriers compete for your load and AI helps you choose. Post your first load for free.",
};

export const allIntroJourney = {
  title: "Begin your journey with AllShip AI",
  description: "Discover the next generation of shipping with AllShip AI. Describe your load in plain words, compare bids from verified carriers and pay only when you book, with your money held in escrow until delivery.",
};

export const allFaq: FaqEntry[] = [
  {
    question: "How secure is AllShip AI?",
    answer:
      "Payments are processed by Stripe, so card details never touch our servers. Accounts support two-factor authentication and passkeys, and you can download or delete your data at any time from your account settings.",
  },
  {
    question: "What information do I get about my shipments?",
    answer:
      "Every load page shows the bids with each carrier's rating and history, the payment status, your messages and the latest tracking position. The AllShip AI assistant can summarize it and compare bids for you.",
  },
  {
    question: "My shipment doesn't fit any category. What should I pick?",
    answer:
      "Pick the closest one and explain the rest in the description, or describe the job to the AllShip AI assistant and it will suggest a category. Carriers see your notes and photos before they bid.",
  },
  {
    question: "How can I switch my shipping to AllShip AI?",
    answer:
      "Create a free account and post your first load. The assistant offers an interactive tour of the product, and our team is available by phone and email if you need help getting started.",
  },
  {
    question: "Do you ship outside the United States?",
    answer: "No. AllShip AI connects shippers with US carriers verified through the FMCSA, for pickups and deliveries within the United States.",
  },
];
