import type { FaqEntry } from "@/components/sections";
import { site } from "@/content/site";

const fee = `${site.platformFeePercent}%`;

export const shipBest = {
  title: "Why shipping with AllShip AI is the best choice",
  assistant: [
    "Load drafts written by the assistant from a plain description, ready for you to review.",
    "Route distance calculated from your addresses for accurate price estimates.",
    "Bids from carriers who already run your lane, which helps cut empty miles.",
  ],
};

export const shipTracking = {
  eyebrow: "Complete shipment visibility",
  title: "Know where your load is without calling anyone",
  description: "Status changes, pickup photos and the driver's latest location land on the load page as they happen. Delivery comes with photos and a signature, and only then do you release the payment.",
};

export const shipGreen = {
  eyebrow: "Commitment to sustainability",
  title: "Fuller trucks, fewer empty miles",
  description: "Carriers search loads along the lanes they already drive, so your shipment often rides on a trip that was happening anyway.",
  points: [
    "Lane-based load search helps carriers plan full trips and avoid driving empty.",
    "Complete load details and photos mean the right truck arrives the first time.",
    "Bids, documents and receipts stay with the load in the app instead of on paper.",
  ],
};

export const shipIntroEasy = {
  title: "Start easy shipping",
  description: `Furniture, a car, a few pallets or a full truckload: describe it once, compare bids from FMCSA-verified carriers and pay the bid plus a ${fee} service fee, held in escrow until delivery.`,
};

export const shipIntroAgain = {
  title: "Ship your next load today",
  description: "Shipping with AllShip AI takes minutes: describe what needs to move, set your dates and let verified carriers come to you with bids. Posting is free.",
};

export const shipFaq: FaqEntry[] = [
  {
    question: "How does AllShip AI help reduce shipping costs?",
    answer: `Carriers compete for your load with their own bids, so you see real market prices and choose the one that fits. The AI assistant gives you a price estimate to compare against, and the only extra cost is the ${fee} service fee shown before you pay.`,
  },
  {
    question: "Can AllShip AI handle regular or high-volume shipping?",
    answer: "Yes. There are no plans or limits on the number of loads. Businesses that ship often post each load the same way, keep every bid, message and receipt in one account, and pay per load.",
  },
  {
    question: "When is the carrier paid?",
    answer: `After delivery. Your payment is held in escrow through Stripe. Once the load is delivered you confirm it, or it is confirmed automatically after ${site.autoConfirmHours} hours, and only then is the money released to the carrier.`,
  },
  {
    question: "What makes AllShip AI different from traditional shipping brokers?",
    answer:
      "You see every bid and choose the carrier yourself, instead of getting a single marked-up quote. Every carrier is checked with the FMCSA before bidding, reviews come only from completed loads, and the AI assistant helps you describe the load and compare bids.",
  },
  {
    question: "What types of shipments and transport does AllShip AI support?",
    answer:
      "Road transport within the United States: household and office moves, cars, motorcycles, boats and RVs, palletized freight, heavy equipment, and box trucks with drivers. Air, ocean and rail shipping are not offered.",
  },
];
