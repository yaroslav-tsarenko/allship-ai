import type { FaqEntry } from "@/components/sections";
import { site } from "@/content/site";

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 });
const usdCents = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const exampleBid = 940;
const exampleFee = Math.round(exampleBid * site.platformFeePercent) / 100;

export const feeExample = {
  percent: site.platformFeePercent,
  bid: usd.format(exampleBid),
  fee: usd.format(exampleFee),
  total: usd.format(exampleBid + exampleFee),
  rows: [
    { label: "Accepted bid", value: usdCents.format(exampleBid) },
    { label: `Service fee (${site.platformFeePercent}%)`, value: usdCents.format(exampleFee) },
    { label: "You pay", value: usdCents.format(exampleBid + exampleFee), total: true },
    { label: "Carrier receives", value: usdCents.format(exampleBid), payout: true },
  ],
};

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
  {
    question: "Who is behind AllShip AI?",
    answer: `AllShip AI is operated by ${site.legalName}, ${site.address.street}, ${site.address.city}, ${site.address.region} ${site.address.postalCode}. You can reach us at ${site.phone.display} or ${site.email}.`,
  },
  {
    question: "How do you verify carriers?",
    answer:
      "Before a carrier can bid, we look up its USDOT number in FMCSA records. The operating authority must be active and allowed to operate, the legal name must match the account, and required liability insurance must be on file. Anything that doesn't match goes to manual review.",
  },
  {
    question: "When is my card charged?",
    answer: `Only when you accept a bid. You pay the bid plus the ${site.platformFeePercent}% service fee, and you have 30 minutes to complete the payment. If it doesn't go through, nothing is charged and the load reopens to bids.`,
  },
  {
    question: "What does the fee look like on a real bid?",
    answer: `On a ${feeExample.bid} bid the service fee is ${feeExample.fee}, so you pay ${feeExample.total}. The carrier receives the full ${feeExample.bid}. The fee is always ${site.platformFeePercent}% of the accepted bid and is shown before you pay.`,
  },
  {
    question: "What happens if I don't confirm delivery?",
    answer: `If you don't confirm and don't open a dispute, the delivery is completed automatically ${site.autoConfirmHours} hours after the driver's proof of delivery, and the carrier is paid.`,
  },
  {
    question: "What if something is damaged or missing?",
    answer:
      "Open a dispute from the load page before the confirmation window ends. The payout pauses while our team reviews the photos, delivery proof and messages, then releases the payment, refunds you, or splits it. Refunds go back to the card you paid with.",
  },
  {
    question: "Do carriers pay to use AllShip AI?",
    answer: "No. Bidding is free and there is no subscription. The service fee is paid by the shipper on top of the bid, so carriers keep 100% of every accepted bid.",
  },
  {
    question: "Will the AI assistant book or pay for me?",
    answer:
      "No. The assistant can draft a load, explain bids and open the right page, but it never accepts a bid, pays or posts anything on its own. You confirm every action.",
  },
];

export const homeAbout = {
  eyebrow: "Who we are",
  title: "A shipping marketplace for the US, run by ALLSHIP AI INC from Newark, Delaware",
  paragraphs: [
    "AllShip AI is a marketplace, not a moving company or a trucking fleet. Licensed carriers do the hauling. We run everything around the trip: carrier verification, bidding, payment in escrow, tracking, delivery proof and support.",
    "You post what needs to move, carriers who passed an FMCSA check bid on it, and you choose. The price you see is the carrier's price, with our fee shown separately.",
  ],
};

export type HomeProblem = { who: "Shipper" | "Carrier"; problem: string; detail: string; fix: string };

export const homeProblems: HomeProblem[] = [
  {
    who: "Shipper",
    problem: "Quotes you can't compare",
    detail: "Every company asks different questions and prices a different job, and a phone quote can change on the day.",
    fix: "Carriers bid on the same written description, so prices line up side by side. For moves, instant prices come from movers' published rate cards.",
  },
  {
    who: "Shipper",
    problem: "Deposits lost to no-shows",
    detail: "Money paid up front to a company that then doesn't show up, or stops answering.",
    fix: "Nothing is charged until you accept a bid. Then the money waits in Stripe escrow and reaches the carrier only after delivery.",
  },
  {
    who: "Shipper",
    problem: "Not knowing who is actually coming",
    detail: "A business name on a website tells you nothing about its license or insurance.",
    fix: "Every carrier's USDOT number is checked against FMCSA records before it can bid: active authority, matching legal name, insurance on file.",
  },
  {
    who: "Shipper",
    problem: "No idea where your stuff is",
    detail: "Days of calls and texts to find out whether the truck has even left.",
    fix: "The driver's phone shares live location during the trip, and pickup photos and delivery proof land on your load page.",
  },
  {
    who: "Carrier",
    problem: "Waiting weeks to get paid",
    detail: "Invoices, reminders and the risk that the customer simply doesn't pay.",
    fix: `The shipper's money is in escrow before you drive. After delivery is confirmed, or ${site.autoConfirmHours} hours after your proof of delivery, Stripe transfers 100% of your bid.`,
  },
  {
    who: "Carrier",
    problem: "Paying for leads that go nowhere",
    detail: "Lead fees and subscriptions for phone numbers that ten other companies also bought.",
    fix: "Bidding is free and there is no subscription. You bid on real posted loads, and the service fee is paid by the shipper, not taken from your bid.",
  },
];

export type HomeServiceGroup = {
  key: "moving" | "vehicles" | "freight" | "trucks";
  summary: string;
  pricing: string;
  actions: { label: string; href: string }[];
};

export const homeServices: HomeServiceGroup[] = [
  {
    key: "moving",
    summary: "Homes, offices, a few pieces of furniture, or a crew to lift without a truck.",
    pricing: "Instant prices from movers' rate cards, or post and collect bids.",
    actions: [
      { label: "Post a moving load", href: "/moving-load" },
      { label: "See instant prices", href: "/moving" },
    ],
  },
  {
    key: "vehicles",
    summary: "Anything with wheels or a hull: cars, motorcycles, boats, RVs, trailers and parts.",
    pricing: "Post free and let carriers bid on your vehicle and route.",
    actions: [{ label: "Post a vehicle load", href: "/vehicle-load" }],
  },
  {
    key: "freight",
    summary: "Pallets and crates, LTL or full truckload, plus farm, construction and industrial machinery.",
    pricing: "Post free with dimensions and weight, then compare bids.",
    actions: [
      { label: "Post freight", href: "/freight-load" },
      { label: "Post heavy equipment", href: "/heavy-load" },
    ],
  },
  {
    key: "trucks",
    summary: "A box truck or van with the carrier's driver, for a day or by the hour.",
    pricing: "Tell us the dates and hours; carriers bid on the booking.",
    actions: [
      { label: "Rent a truck", href: "/rent-truck" },
      { label: "Truck with driver", href: "/truck-with-driver" },
    ],
  },
];

export type FlowStep = { title: string; text: string; hood: string };
export type FlowStage = { key: "post" | "book" | "road" | "paid"; label: string; title: string; figure: string; steps: FlowStep[] };

export const homeFlow: FlowStage[] = [
  {
    key: "post",
    label: "Post and verify",
    title: "A load goes up, and only checked carriers can answer it",
    figure: "A draft load on the left and a carrier's FMCSA record on the right with four checks: active authority, allowed to operate, legal name matches, insurance on file.",
    steps: [
      {
        title: "You post the load",
        text: "Pick a category, add pickup and delivery, dates and details. Posting is free and no card is needed.",
        hood: `The load gets a public ID like AS-1042 and a route distance from the two addresses. If you start on a public form, we create your account and email a link to publish it, valid for ${site.autoConfirmHours} hours.`,
      },
      {
        title: "Carriers are verified before they bid",
        text: "Carriers register with their USDOT number. Until it checks out, they can look at the board but can't bid.",
        hood: "We look the number up in FMCSA records: the authority must be active and allowed to operate, the legal name must match and required liability insurance must be on file. Anything that doesn't line up goes to a person for review.",
      },
    ],
  },
  {
    key: "book",
    label: "Bid, accept, pay",
    title: "You choose a price, and the money goes into escrow",
    figure: `Three bids with the ${feeExample.bid} bid selected, and a checkout showing the bid, the ${feeExample.percent}% fee and the total paid into escrow.`,
    steps: [
      {
        title: "Bids arrive",
        text: "Compare price, pickup date, rating and the carrier's note. Message carriers on the load if you have questions.",
        hood: "New bids reach your load page in real time over a private channel. Carriers never see each other's bids.",
      },
      {
        title: "You accept one bid",
        text: "The load is held for that carrier while you pay.",
        hood: "Accepting is protected against double clicks and races, so only one acceptance can win. You have 30 minutes to finish paying; if you don't, the load reopens to bids.",
      },
      {
        title: "You pay into escrow",
        text: `You pay the bid plus the ${site.platformFeePercent}% service fee. Your card details go to Stripe, not to us.`,
        hood: "Each payment carries an idempotency key, so a retry can't charge you twice. Stripe's confirmation is processed once per event and writes a balanced ledger entry. Then the other bids are declined and the carrier is notified.",
      },
    ],
  },
  {
    key: "road",
    label: "On the road",
    title: "A named driver, a live position and photos from pickup",
    figure: "A route from pickup to delivery with the truck's live position halfway and two pickup photos at the start.",
    steps: [
      {
        title: "A driver is assigned",
        text: "The carrier assigns one of its drivers to your trip.",
        hood: "Only you, the carrier's team and the assigned driver can open the trip. Someone removed from the carrier's team loses access right away.",
      },
      {
        title: "Live tracking",
        text: "While the trip is active, the driver's phone shares its location and you follow it on the load page.",
        hood: "Positions are pushed over a realtime channel scoped to your load, with polling as a fallback if the connection drops.",
      },
      {
        title: "Pickup photos",
        text: "Before the load leaves, the driver photographs it from the phone.",
        hood: "Uploads are checked by their actual file content, stored privately and shown through signed links that expire after 30 minutes.",
      },
    ],
  },
  {
    key: "paid",
    label: "Delivered and paid",
    title: "Proof at the door, then the carrier gets paid",
    figure: `Proof of delivery with photos, the recipient's name and a signature, a ${site.autoConfirmHours}-hour confirmation timer, a ${feeExample.bid} payout to the carrier's bank and a five-star review.`,
    steps: [
      {
        title: "Proof of delivery",
        text: "At the door the driver records photos, the recipient's name and a signature.",
        hood: `The proof is added to the load timeline with a timestamp and starts the ${site.autoConfirmHours}-hour confirmation window.`,
      },
      {
        title: "You confirm, or open a dispute",
        text: "If all is well, confirm delivery. If something is damaged or missing, open a dispute instead.",
        hood: `A scheduled job runs every 10 minutes and completes deliveries left unconfirmed for ${site.autoConfirmHours} hours. An open dispute stops that and keeps the money in escrow.`,
      },
      {
        title: "The carrier is paid",
        text: "The carrier receives 100% of the accepted bid through Stripe.",
        hood: "The transfer goes to the carrier's connected Stripe account with its own idempotency key. If their payouts aren't set up yet, it waits and retries instead of failing.",
      },
      {
        title: "You review the carrier",
        text: "Rate the trip and leave a note. The carrier can reply.",
        hood: "Only the shipper on a completed load can review it, once, so every rating comes from a real trip.",
      },
    ],
  },
];

export const homeMoney = {
  eyebrow: "Your money",
  title: "Your money waits in escrow until the job is done",
  description: `You pay when you accept a bid: the carrier's price plus a ${site.platformFeePercent}% service fee. Stripe holds it during the trip and releases it to the carrier after you confirm delivery, or automatically ${site.autoConfirmHours} hours after delivery proof if you don't respond and haven't opened a dispute.`,
  cases: [
    { title: "The payment doesn't go through", text: "Nothing is charged. After 30 minutes the load reopens to bids." },
    { title: "You change your mind before accepting", text: "Cancel the load. There is nothing to refund, because nothing was charged." },
    { title: "Something is wrong at delivery", text: "Open a dispute. The payout pauses until our team decides: release to the carrier, refund to you, or a split." },
    { title: "You get a refund", text: "It goes back to the card you paid with, through Stripe." },
    { title: "You need to cancel after booking", text: "Contact support, so the refund follows the cancellation policy in our terms." },
  ],
  never: [
    "See or store your card number. Stripe handles card details.",
    "Pay the carrier before delivery is confirmed or the confirmation window passes without a dispute.",
    "Take a cut of the carrier's bid. Our fee is added on top and shown before you pay.",
    "Let the AI assistant accept, pay or post anything for you.",
  ],
};

export type CompareCell = { text: string; yes?: boolean };
export const homeCompare = {
  columns: ["AllShip AI", "Typical broker", "Lead site", "Calling movers yourself"],
  rows: [
    { label: "Competing prices for the same job", cells: [{ text: "Bids side by side", yes: true }, { text: "One quote, margin not shown" }, { text: "Several companies call you" }, { text: "One call at a time" }] },
    { label: "Carrier checked against FMCSA first", cells: [{ text: "Before it can bid", yes: true }, { text: "The broker picks the carrier" }, { text: "Varies by site" }, { text: "Up to you to look up" }] },
    { label: "Money held until delivery", cells: [{ text: "Stripe escrow", yes: true }, { text: "Varies; deposits are common" }, { text: "Paid on the mover's terms" }, { text: "Paid on the mover's terms" }] },
    { label: "Fee shown before you pay", cells: [{ text: `${site.platformFeePercent}% of the bid, at checkout`, yes: true }, { text: "Built into the quote" }, { text: "Free to you; movers pay for leads" }, { text: "No platform fee" }] },
    { label: "Tracking and delivery proof in one place", cells: [{ text: "Live GPS, photos, signature", yes: true }, { text: "Depends on the carrier" }, { text: "Depends on the mover" }, { text: "Depends on the mover" }] },
    { label: "Dispute before the carrier is paid", cells: [{ text: "Payout pauses", yes: true }, { text: "Depends on the broker" }, { text: "Usually a card chargeback" }, { text: "Usually a card chargeback" }] },
  ] satisfies { label: string; cells: CompareCell[] }[],
};
