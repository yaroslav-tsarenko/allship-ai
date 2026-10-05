import type { FaqItem } from "@/components/marketing/faq";
import { site } from "@/content/site";

export type FaqGroup = { id: string; label: string; intro: string; items: FaqItem[] };

const fee = `${site.platformFeePercent}%`;
const hours = site.autoConfirmHours;

export const shipperFaq: FaqItem[] = [
  {
    question: "What is AllShip AI?",
    answer:
      "AllShip AI is an online marketplace for shipping in the United States. You post what needs to move, such as a household move, a car, pallets of freight or a piece of heavy equipment. Verified trucking companies bid on it, and you choose the carrier you want.",
  },
  {
    question: "How do I get prices for my shipment?",
    answer:
      "Start a quote with your pickup and delivery locations and what you are shipping. Once your load is posted, verified carriers send bids with their price, an estimated delivery time and a short message. You can compare bids and ask questions in chat before you accept one.",
  },
  {
    question: "Is AllShip AI a carrier or a broker?",
    answer:
      "Neither. AllShip AI does not own trucks and does not haul your load. It is a marketplace: carriers set their own prices through bids, and the carrier you book is responsible for the transport.",
  },
  {
    question: "What can I ship?",
    answer:
      "Household and office moves, single household items, cars and light trucks, motorcycles, boats, RVs, trailers, vehicle parts, palletized and full-truckload freight, and heavy or oversized equipment. You can also request a rental truck or a truck with a driver.",
  },
  {
    question: "Can I talk to the carrier before booking?",
    answer:
      "Yes. Each bid comes with a message from the carrier, and you can reply through AllShip chat to confirm details like access at pickup, packing, or delivery windows before you accept.",
  },
  {
    question: "How do I know where my shipment is?",
    answer:
      "While the trip is active, the assigned driver updates its status: on the way to pickup, picked up, in transit and delivered. Their location is shared with you only while the trip is in progress.",
  },
  {
    question: "Is there a mobile app?",
    answer:
      "AllShip AI runs in the browser on phones, tablets and computers, so there is nothing to install. Drivers use the same web app on their phone during a trip.",
  },
];

export const carrierFaq: FaqItem[] = [
  {
    question: "What does it cost a carrier to use AllShip AI?",
    answer: `Bidding is free. You are paid your full bid amount. The shipper pays a ${fee} service fee on top of your bid, so nothing is deducted from what you quoted.`,
  },
  {
    question: "When do I get paid?",
    answer: `The shipper pays when they accept your bid, and the money is held in escrow through Stripe. After delivery, the shipper confirms the load or it confirms automatically after ${hours} hours. Then your full bid is transferred to your company's Stripe account.`,
  },
  {
    question: "What do I need to start bidding?",
    answer:
      "An active USDOT number and MC number that we can check with FMCSA, valid cargo and liability insurance, and a Stripe payouts account in your company's name. Bidding unlocks once all three are verified.",
  },
  {
    question: "Can I add my drivers and dispatchers?",
    answer:
      "Yes. Your company account can have dispatchers and drivers. You invite drivers by email, and each driver sees only the trips you assign to them.",
  },
  {
    question: "How do I find loads that fit my trucks?",
    answer:
      "Set your service area, equipment and the kinds of loads you haul in your company profile. Open loads are listed on the load board, and you can ask the AllShip AI assistant to find loads that match your profile.",
  },
  {
    question: "Do I have to accept every load I bid on?",
    answer:
      "Your bid is an offer. If the shipper accepts it and pays, the load is booked to you, so only bid on loads you can actually move at the price and time you quote.",
  },
];

export const paymentsFaq: FaqItem[] = [
  {
    question: "How much does AllShip AI charge?",
    answer: `Shippers pay the carrier's bid plus a ${fee} service fee. You see the full total before you pay. Carriers are not charged a fee on their bid.`,
  },
  {
    question: "When am I charged?",
    answer:
      "When you accept a bid. Payment is taken at that moment and held in escrow, which is what books the carrier to your load.",
  },
  {
    question: "What does escrow mean here?",
    answer: `Your payment is held by AllShip AI through Stripe and is not sent to the carrier when you pay. It is released after delivery, when you confirm the load or ${hours} hours after the driver marks it delivered, whichever comes first.`,
  },
  {
    question: "Which payment methods can I use?",
    answer: "Payments are processed by Stripe. Available methods are shown at checkout and can include cards, Apple Pay, Google Pay and bank payments.",
  },
  {
    question: "What happens if something goes wrong with delivery?",
    answer: `Report the problem before the load is confirmed. Opening a dispute holds the carrier's payout while the AllShip team reviews the trip record, including the photos and signature taken at delivery.`,
  },
  {
    question: "Can I cancel after booking?",
    answer: "Cancellations and refunds follow the AllShip cancellation and refund policy. Read it before you accept a bid so you know what applies to your load.",
  },
];

export const safetyFaq: FaqItem[] = [
  {
    question: "How are carriers verified?",
    answer:
      "Before a carrier can bid, we check their USDOT and MC numbers with FMCSA, confirm they hold valid cargo and liability insurance, and require a Stripe payouts account in the company's name.",
  },
  {
    question: "Who can leave reviews?",
    answer: "Only the shipper on a completed load can review the carrier who moved it. Reviews cannot be posted for loads that never happened.",
  },
  {
    question: "What proof of delivery is collected?",
    answer: "The driver takes photos at pickup and, at delivery, takes a photo and collects a signature in the app. Both are saved to the load's trip record.",
  },
  {
    question: "Is my card stored by AllShip AI?",
    answer: "No. Card and bank details are entered in Stripe's secure payment form and stay with Stripe.",
  },
  {
    question: "How do I protect my account?",
    answer: "Turn on 2-step verification in your account settings, or sign in with a passkey stored on your phone or computer.",
  },
  {
    question: "Who can see my addresses and phone number?",
    answer: "The public load board shows only the city and state. Exact addresses and contact details are shared with the carrier you book.",
  },
];

export const faqGroups: FaqGroup[] = [
  { id: "shippers", label: "Shippers", intro: "Posting a load, getting bids and following your shipment.", items: shipperFaq },
  { id: "carriers", label: "Carriers", intro: "Joining, bidding and running trips with your team.", items: carrierFaq },
  { id: "payments", label: "Payments", intro: "Fees, escrow and when money moves.", items: paymentsFaq },
  { id: "safety", label: "Safety", intro: "Verification, proof of delivery, reviews and privacy.", items: safetyFaq },
];
