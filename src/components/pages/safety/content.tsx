import Link from "next/link";
import { safetyFaq as companySafetyFaq } from "@/components/marketing/company/faq-content";
import type { DescriptionBlock, FaqEntry } from "@/components/sections";
import { site } from "@/content/site";

const fee = `${site.platformFeePercent}%`;
const hours = site.autoConfirmHours;
const inline = "text-primary underline underline-offset-4 decoration-primary/40 hover:decoration-primary";

export const safetyIntro = `At AllShip AI, safety is our top priority. Every carrier is checked before they can bid, every payment waits in escrow until delivery, and every trip leaves a record of photos and a signature. Payments run through Stripe, so card and bank details never touch our servers, and all traffic to AllShip AI is encrypted. Your shipment is protected by rules that run on every load, from start to finish.`;

export const complianceIntro =
  "Safety on a marketplace comes from rules that run every time, not from promises. These are the ones AllShip AI enforces on every load, for shippers and carriers alike.";

export const verificationSteps = [
  { title: "USDOT checked", body: "The carrier's USDOT number is looked up with FMCSA and must be active." },
  { title: "MC authority checked", body: "Operating authority under the MC number must be active and belong to the same company." },
  { title: "Insurance confirmed", body: "Valid cargo and liability insurance in the company's name." },
  { title: "Stripe payouts connected", body: "Payouts go to a Stripe account in the company's name, never a personal one." },
  { title: "Bidding opens", body: "Only now can the carrier bid on your load." },
];

export const escrowSteps = [
  { title: "You pay at booking", body: `The carrier's bid plus the ${fee} service fee, charged when you accept the bid.` },
  { title: "Held in escrow", body: "The money waits with AllShip AI through Stripe. The carrier is not paid yet." },
  { title: "Trip and delivery", body: "The driver records pickup photos, then a delivery photo and signature." },
  { title: "You confirm", body: `Or the load confirms automatically ${hours} hours after delivery if you do nothing.` },
  { title: "Carrier is paid", body: "Their full bid is transferred. A dispute opened before this holds the payout." },
];

export const proofItems = [
  { title: "At pickup", body: "Photos of the load as the driver receives it." },
  { title: "At delivery", body: "A photo of the delivered load." },
  { title: "Signature", body: "The receiver signs on the driver's screen." },
];

export const privacyRows = [
  { what: "Street addresses", who: "Only the booked carrier and its assigned driver. The public board shows city and state." },
  { what: "Card and bank details", who: "Nobody at AllShip AI. You pay in Stripe's payment form." },
  { what: "Driver location", who: "The people on that load, only from the start of the trip until delivery." },
  { what: "Your account", who: "You, protected by 2-step verification or a passkey if you turn them on." },
];

export const complianceSections: DescriptionBlock[] = [
  {
    id: "insurance",
    title: "Insurance coverage",
    content:
      "Every carrier must hold valid cargo and liability insurance before they can bid, and we confirm both coverages are present and in date. The carrier you book is responsible for your load in transit, and their insurance is what covers loss or damage. Ask carriers in chat about their coverage limits before you accept a bid, especially for high-value items. If something goes wrong, report it before you confirm delivery: opening a dispute holds the carrier's payout while our team reviews the trip record with you.",
  },
  {
    id: "peace-of-mind",
    title: "Peace of mind with AllShip AI",
    content:
      "Trust on AllShip AI is built from records, not testimonials. Only the shipper on a delivered and confirmed load can review the carrier who moved it, so a carrier's rating reflects real jobs. Your data is protected too:",
    list: {
      items: [
        <>
          <strong className="font-medium text-on-surface">Addresses stay private until booking.</strong> The public load board shows city and state only.
        </>,
        <>
          <strong className="font-medium text-on-surface">Card details never touch our servers.</strong> You pay in Stripe&apos;s payment form.
        </>,
        <>
          <strong className="font-medium text-on-surface">Driver location only during a trip.</strong> It is shared from the start of a trip until delivery, and only with the people on that load.
        </>,
        <>
          <strong className="font-medium text-on-surface">2-step verification and passkeys.</strong> Protect your account with a one-time code, or sign in with a passkey. Read the{" "}
          <Link href="/privacy-policy" className={inline}>
            privacy policy
          </Link>{" "}
          for what we collect and why.
        </>,
      ],
    },
  },
];

export const safetyFaq: FaqEntry[] = [
  {
    question: "Does AllShip AI send real-time shipment notifications?",
    answer:
      "Yes. You are notified when carriers bid, when your load is booked and as the driver updates the trip: on the way to pickup, picked up, in transit and delivered. The driver's location is visible to you while the trip is in progress.",
  },
  ...companySafetyFaq.slice(0, 3),
  {
    question: "What kind of AI technology powers AllShip AI?",
    answer:
      "The AllShip AI assistant is built on large language models. It helps you draft loads, estimate costs, find matching loads and compare bids. It never makes safety decisions: carrier verification, escrow and payouts follow fixed rules.",
  },
  {
    question: "Can AllShip AI handle perishable or temperature-sensitive shipments?",
    answer:
      "AllShip AI does not monitor temperature. If your freight needs it, state the temperature range in your load details and confirm the carrier's equipment in chat before you accept a bid.",
  },
  {
    question: "How does AllShip AI help reduce errors?",
    answer:
      "Each load type has its own form, so carriers get the sizes, weights and access details they need to price correctly. Questions are answered in chat before booking, and photos and a signature are recorded at pickup and delivery.",
  },
  {
    question: "What does it cost to use AllShip AI?",
    answer: `Posting a load and receiving bids is free. When you accept a bid you pay the carrier's price plus a ${fee} service fee, held in escrow until delivery. Carriers keep 100% of their bid.`,
  },
  ...companySafetyFaq.slice(3),
];
