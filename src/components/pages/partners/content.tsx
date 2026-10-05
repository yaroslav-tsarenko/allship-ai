import type { ReactNode } from "react";
import type { DescriptionBlock, FaqEntry } from "@/components/sections";
import { site } from "@/content/site";

const fee = `${site.platformFeePercent}%`;
const hours = site.autoConfirmHours;

function Lead({ term, children }: { term: string; children: ReactNode }) {
  return (
    <>
      <strong className="font-medium text-on-surface">{term}:</strong> {children}
    </>
  );
}

export const partnersHero = {
  checkmarks: ["FMCSA-verified network", "Keep 100% of your bid"],
  kicker: "Enhance efficiency, maximize profits, ensure compliance",
  title: "Partner with",
  highlight: "AllShip AI",
  description:
    "AllShip AI gives carriers a load board with AI load matching that helps reduce deadhead miles and keep trucks earning. You bid your own price and keep all of it. Join us and transform your trucking operations.",
};

export const partnersIntro =
  `At AllShip AI, carriers use the marketplace for free. You bid your own price and keep 100% of it, because the shipper pays the ${fee} service fee on top of your bid. If you would rather have someone work the board for you, we also offer an optional dispatch service with its own agreement. Either way, you get AI load matching, fewer empty miles and bids that shippers can compare on more than price. Our platform simplifies finding and securing loads, so you can focus on what you do best: delivering exceptional service.`;

export const payoutSteps = [
  { title: "The shipper accepts your bid", body: `They pay your bid plus the ${fee} service fee. The money sits in escrow through Stripe before your truck rolls.` },
  { title: "Your driver runs the trip", body: "Pickup photos, live status while driving, then a delivery photo and the receiver’s signature, all from the driver’s phone." },
  { title: "Delivery is confirmed", body: `By the shipper, or automatically ${hours} hours after the trip is marked delivered.` },
  { title: "Your full bid is transferred", body: "To your company’s Stripe account. Nothing is deducted from what you quoted." },
];

export const requirements = [
  { term: "Active USDOT number", body: "We look up your USDOT number with FMCSA and confirm the registration is active and listed as a carrier." },
  { term: "MC number", body: "For-hire carriers hauling regulated freight across state lines generally need active operating authority. We confirm it belongs to the same company." },
  { term: "Cargo and liability insurance", body: "A current certificate of insurance in your company’s name, with policy dates that have not expired." },
  { term: "Stripe payouts account", body: "In your company’s name, never a personal one. Stripe asks for business details, a US business bank account and identity details for the company representative." },
  { term: "Company profile", body: "The states you serve, your equipment and the load types you take. Nothing to verify here, but it decides which loads you see first." },
];

export const teamRoles = [
  { role: "Owner", sees: "Everything", does: "Sets up the company, verification and Stripe payouts. Finds loads, bids, assigns trips, invites the team and reads payouts and reviews." },
  { role: "Dispatcher", sees: "Board, bids, trips, fleet, messages", does: "Works the load board, bids, answers shippers in chat, sets instant quote rates and assigns trips to drivers. No access to payouts." },
  { role: "Driver", sees: "Only their assigned trips", does: "Starts the trip, shares location while driving, takes pickup and delivery photos and collects the receiver’s signature." },
];

export const dispatchIntro =
  "Small fleets and owner-operators often have no one to sit at a screen all day. Our optional dispatch service finds and books AllShip loads for you, inside rules you set, so you can focus on driving. It has its own agreement and its own fee, which we share with you in writing before you sign up. You never need it to use AllShip AI: carriers who bid on their own pay no fee and receive their full bid.";

export const dispatchSections: DescriptionBlock[] = [
  {
    title: "What the dispatch service covers",
    list: {
      items: [
        <Lead key="find" term="Finding loads on your lanes">
          We watch the AllShip load board for loads that fit your service area, equipment and the kinds of freight you want.
        </Lead>,
        <Lead key="bid" term="Bidding with your approval">
          We prepare bids at the rates you set and submit them only within the limits you agree to.
        </Lead>,
        <Lead key="talk" term="Talking with shippers">
          We answer shipper questions in chat and confirm access, timing and what is included before and after booking.
        </Lead>,
        <Lead key="assign" term="Assigning and following the trip">
          We assign booked loads to the driver you choose and watch status updates until delivery is confirmed.
        </Lead>,
      ],
    },
  },
  {
    title: "What stays with you",
    list: { items: ["Driving, loading and handling the cargo", "Your FMCSA compliance, insurance and hours of service", "Loads outside the AllShip AI marketplace"] },
  },
  {
    title: "How to start",
    list: {
      ordered: true,
      items: [
        "Sign up and complete carrier verification: USDOT and MC with FMCSA, insurance and Stripe payouts.",
        "Contact us with your lanes, equipment and the rates you want to work within.",
        "Review the dispatch agreement and fee. Nothing starts until you sign it.",
      ],
    },
  },
  {
    title: "Partner advantages",
    content:
      "As an AllShip AI partner, you get a verified badge on every bid, reviews from completed loads that build your reputation, and a team you can reach when a load needs attention. Already have a dispatcher? Add them to your company account with the dispatcher role and they get the same tools our team uses, at no cost.",
  },
];

export const dispatchCompare = [
  { label: "Who finds and bids on loads", self: "You or your own dispatcher", service: "An AllShip dispatcher, with your approval" },
  { label: "Who talks with the shipper", self: "Your team", service: "An AllShip dispatcher, in AllShip chat" },
  { label: "How you are paid for loads", self: "Full bid after delivery", service: "Full bid after delivery" },
  { label: "Fee on your bid", self: "None", service: "None" },
  { label: "Dispatch fee", self: "None", service: "Separate, agreed in writing before you start" },
];

export const signUpSteps = [
  { title: "Get started", body: "Your name, email and phone. You confirm the email before anything else." },
  { title: "Authority", body: "Your USDOT and MC numbers. We check both with FMCSA." },
  { title: "Company details", body: "Legal company name, the states you serve, your equipment and insurance." },
  { title: "Payouts", body: "Connect a Stripe account in your company's name. Bidding opens when payouts are enabled." },
];

export const partnersFaq: FaqEntry[] = [
  {
    question: "How secure is AllShip AI for my company's data?",
    answer:
      "Your account is protected with optional 2-step verification and passkeys, and all traffic is encrypted. Payments and payouts run through Stripe, so card and bank numbers never touch our servers.",
  },
  {
    question: "What does it cost a carrier to use AllShip AI?",
    answer: `Bidding is free and there is no subscription. You are paid your full bid. The shipper pays a ${fee} service fee on top of your bid, so nothing is deducted from what you quoted. The optional dispatch service has a separate fee agreed in writing.`,
  },
  {
    question: "When do I get paid?",
    answer: `The shipper pays when they accept your bid, and the money is held in escrow through Stripe. After delivery, the shipper confirms the load or it confirms automatically after ${hours} hours. Then your full bid is transferred to your company's Stripe account.`,
  },
  {
    question: "How can I switch my operations to AllShip AI?",
    answer:
      "Sign up as a carrier, enter your USDOT and MC numbers, add your insurance and connect Stripe. Then invite your dispatchers and drivers. You can keep your existing customers and use AllShip AI as an extra source of loads.",
  },
  {
    question: "What kind of carriers use AllShip AI?",
    answer:
      "Owner-operators and fleets that haul household moves, cars and other vehicles, boats, freight and heavy equipment, plus companies with box trucks and cargo vans for truck rentals and hourly jobs. Each sets the load types and states they serve.",
  },
  {
    question: "Can I add my drivers and dispatchers?",
    answer: "Yes. Your company account can have dispatchers and drivers. You invite drivers by email, and each driver sees only the trips you assign to them.",
  },
];
