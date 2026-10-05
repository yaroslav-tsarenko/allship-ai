import type { FaqEntry } from "@/components/sections";
import { site } from "@/content/site";

export const homeHero = {
  checkmarks: ["Residential & business", "Ship anything, anywhere in the US"],
  title: "Maximize savings, reduce time, automate control",
  highlight: "on every shipment",
  description:
    "Post a move, a vehicle, freight or heavy equipment for free. FMCSA-verified carriers bid, you pick the one that fits, and your payment waits in escrow until delivery is confirmed.",
};

export type HomeCategory = {
  key: "vehicles" | "moving" | "heavy" | "freight";
  label: string;
  title: string;
  href: string;
  cta: string;
  types: { label: string; href: string }[];
};

export const homeCategories: HomeCategory[] = [
  {
    key: "vehicles",
    label: "Vehicles & Boats",
    title: "Cars, boats, motorcycles, RVs, trailers, parts",
    href: "/vehicle-load",
    cta: "Post a vehicle load",
    types: [
      { label: "Car", href: "/vehicle-load?type=car_or_light_truck" },
      { label: "Motorcycle", href: "/vehicle-load?type=motorcycle" },
      { label: "Boat", href: "/vehicle-load?type=powerboat" },
      { label: "RV", href: "/vehicle-load?type=rv" },
    ],
  },
  {
    key: "moving",
    label: "Moving",
    title: "Homes, offices, furniture and appliances",
    href: "/moving-load",
    cta: "Post a moving load",
    types: [
      { label: "Local", href: "/moving-load?type=local_moving" },
      { label: "Long-distance", href: "/moving-load?type=long_distance_moving" },
      { label: "A few items", href: "/moving-load?type=household_items" },
      { label: "Instant prices", href: "/moving" },
    ],
  },
  {
    key: "heavy",
    label: "Heavy Equipment",
    title: "Farm, construction and industrial machinery",
    href: "/heavy-load",
    cta: "Post a heavy load",
    types: [
      { label: "Equipment guide", href: "/services/heavy-equipment" },
    ],
  },
  {
    key: "freight",
    label: "Freight",
    title: "Pallets and crates, LTL or full truckload",
    href: "/freight-load",
    cta: "Post a freight load",
    types: [
      { label: "Freight class", href: "/tools/freight-class-calculator" },
      { label: "Freight guide", href: "/services/freight" },
    ],
  },
];

export const homeTour = {
  eyebrow: "How it works",
  title: "Post it, compare real bids, follow it to the door",
  description:
    "This is the product you will use, not a mock-up. Pick a step to watch it: a load goes live, verified carriers bid on it, and the trip shows up on a live timeline.",
  steps: [
    { label: "Post", text: "Describe the load in a few steps. Posting is free and nothing is charged." },
    { label: "Compare", text: "Bids arrive from FMCSA-verified carriers. Sort by price, rating or pickup date." },
    { label: "Track", text: "Pickup photos, live position and delivery proof land on one timeline." },
  ],
};

export const homeEscrow = {
  eyebrow: "Step 4 · Pay safely",
  title: "Your money moves only when the load does",
  description: `You pay when you accept a bid: the carrier's price plus a ${site.platformFeePercent}% service fee. Stripe holds it in escrow during the trip and releases it after you confirm delivery, or automatically ${site.autoConfirmHours} hours after delivery proof if you don't respond.`,
  facts: [
    { title: "Verified before they bid", text: "USDOT number, operating authority and insurance are checked against FMCSA records." },
    { title: "Proof on delivery", text: "Drivers confirm with photos, the recipient's name and a signature." },
    { title: "Disputes pause the payout", text: "If something is wrong, open a dispute and the money stays put until it is resolved." },
  ],
};

export type HomeRole = {
  id: string;
  name: string;
  lead: string;
  points: string[];
  cta: { label: string; href: string };
  secondary?: { label: string; href: string };
  scene: "instantQuote" | "fleet" | "carrierBoard" | "driverTrip";
};

export const homeRoles: HomeRole[] = [
  {
    id: "shipper",
    name: "Shipper",
    lead: "Anyone moving something: a family, a dealer, a small business.",
    points: ["Post free in 23 categories", "Instant prices from movers' published rates", "Bids, chat, tracking and escrow on one load page", "Reviews and disputes after delivery"],
    cta: { label: "Ship something", href: "/quote" },
    secondary: { label: "See instant moving prices", href: "/moving" },
    scene: "instantQuote",
  },
  {
    id: "owner",
    name: "Carrier owner",
    lead: "The company account. Verification, payouts and the team live here.",
    points: ["FMCSA check before the first bid", "Stripe payouts: 100% of every accepted bid", "Invite dispatchers and drivers", "Fleet map with every driver on a trip"],
    cta: { label: "Become a carrier", href: "/sign-up?type=carrier" },
    secondary: { label: "How partnership works", href: "/partners" },
    scene: "fleet",
  },
  {
    id: "dispatcher",
    name: "Dispatcher",
    lead: "Joins a carrier by invitation and keeps the trucks full.",
    points: ["Load board filtered by category and state", "Place bids, with an AI draft if you want one", "Assign the driver once a bid is accepted", "Message shippers on each load"],
    cta: { label: "Browse open loads", href: "/loads" },
    secondary: { label: "Dispatch service", href: "/partners#dispatch" },
    scene: "carrierBoard",
  },
  {
    id: "driver",
    name: "Driver",
    lead: "Invited by the carrier. Everything happens on the phone.",
    points: ["Today's trips in one list", "Live location shared during the trip", "Pickup photos in two taps", "Delivery proof with photos and signature"],
    cta: { label: "For drivers", href: "/drivers" },
    scene: "driverTrip",
  },
];

export const homeAi = {
  assistant: {
    eyebrow: "AllShip AI",
    title: "An assistant that reads your load before it answers",
    description:
      "Ask in plain words. It looks at the load and every bid, explains the trade-offs and opens the right page. It never accepts, pays or posts anything on its own.",
  },
  adaptive: {
    eyebrow: "Any screen",
    title: "Start on a laptop, finish from your phone",
    description:
      "The same account works on desktop, tablet and phone. Check bids at your desk, approve the driver's delivery photos from the driveway.",
  },
};

export const homeMinis: { scene: "aiDraftLoad" | "chat" | "guidedTour" | "rateCard" | "aiDraftBid"; title: string; text: string }[] = [
  { scene: "aiDraftLoad", title: "A load from one sentence", text: "Type the job the way you would text it. The assistant fills a draft for you to review." },
  { scene: "chat", title: "A thread per load", text: "Message the carrier on the load itself. Drivers send photos from the road." },
  { scene: "guidedTour", title: "A one-minute tour", text: "New accounts get a guided tour that points at the real controls." },
  { scene: "rateCard", title: "Carrier rate cards", text: "Movers set per-cubic-foot rates once and get booked at that price." },
  { scene: "aiDraftBid", title: "Bid drafts for carriers", text: "The assistant reads the load and suggests a bid. The carrier sets the price." },
];

export const homeFaq: FaqEntry[] = [
  {
    question: "What is AllShip AI?",
    answer:
      "AllShip AI is an AI-assisted shipping marketplace. You post what needs to move, FMCSA-verified carriers bid on it, and you choose the bid that fits your price and dates. The assistant helps you describe the load, estimate a price and compare bids.",
  },
  {
    question: "How does AllShip AI benefit my business?",
    answer: `Carriers compete for your load, so you see real market prices instead of a single quote. You get one place for bids, messages, tracking updates and payments, and your money is held in escrow until delivery is confirmed. Posting is free; you pay the accepted bid plus a ${site.platformFeePercent}% service fee.`,
  },
  {
    question: "Is AllShip AI suitable for small businesses?",
    answer:
      "Yes. There is no subscription and no minimum volume. A small business can post a single pallet or one delivery, compare bids from verified carriers and pay per load, the same way a larger shipper does.",
  },
  {
    question: "What kind of customer support does AllShip AI provide?",
    answer: `Our team answers by phone at ${site.phone.display} and by email at ${site.email}. In the app, the AllShip AI assistant answers questions about fees, escrow, verification and bidding at any time, and you can message your carrier directly.`,
  },
  {
    question: "Is my data secure with AllShip AI?",
    answer:
      "Payments are processed by Stripe, so we never store your card number. Accounts support two-factor authentication and passkeys, and you can download or delete your data from your account settings at any time.",
  },
  {
    question: "How does AllShip AI help plan routes and prices?",
    answer:
      "When you post a load we calculate the route distance from your pickup and delivery addresses. The assistant uses the distance, the size of the shipment and market rates to give a price estimate, clearly labeled as an estimate. The final price always comes from carrier bids.",
  },
  {
    question: "Can I schedule pickups and deliveries through AllShip AI?",
    answer:
      "Yes. You set the pickup and delivery dates when you post a load, carriers bid with their own dates, and once you book you can follow the status from pickup to delivery in your dashboard.",
  },
];
