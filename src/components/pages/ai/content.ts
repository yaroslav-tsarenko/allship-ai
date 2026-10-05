import type { DescriptionBlock, FaqEntry } from "@/components/sections";
import { site } from "@/content/site";

export const aiHero = {
  title: "AI revolutionizing logistics",
  description:
    "Experience the future of logistics with an AI-assisted shipping platform. AllShip AI turns a plain description into a load, estimates a fair price from distance, size and market rates, and compares carrier bids for you. Create a free account and see how it can simplify your shipping, save you time and give your business an edge in a fast-changing market.",
};

export const aiWorld = {
  title: "AI transforming the world",
  description:
    "Artificial intelligence is changing industries around the world, bringing new levels of speed, accuracy and convenience. From healthcare to finance, AI is reshaping how we live and work. AllShip AI uses it where it helps most in logistics: describing shipments, estimating prices, matching loads with carriers and keeping both sides informed. The result is less time on the phone, fewer mistakes in load details and better-informed decisions on price.",
  sections: [
    {
      title: "AI in logistics: enhancing efficiency and reliability",
      content:
        "In logistics, where time and accuracy are critical, AI handles the routine work that slows people down. The AllShip AI assistant turns a message like \"move my 2-bedroom apartment from Austin to Denver in early November\" into a complete load draft that you review and publish. It gives a price estimate based on the route distance, the size of the shipment and market rates, always labeled as an estimate, so you know what a fair bid looks like before carriers respond.",
    },
    {
      title: "Real-time tracking and automation",
      content:
        "Once a load is booked, AllShip AI keeps you up to date. Status changes, messages from your carrier and the driver's latest location appear in your dashboard as they happen, and you can simply ask the assistant where your shipment is. Routine steps are automated: bids are collected in one place, payment is held in escrow, and delivery is confirmed automatically after " +
        `${site.autoConfirmHours} hours if you don't respond, so the carrier is paid without chasing invoices.`,
    },
    {
      title: "Sustainability and scalability through AI",
      content:
        "For carriers, the assistant searches open loads that match their lanes, equipment and categories, and helps write specific bid messages. Finding loads along routes they already drive helps carriers fill trucks that would otherwise run empty. The same tools work whether you post one load a year or many loads a week, so the platform grows with your business without extra setup.",
    },
    {
      title: "Driving innovation in logistics with AI",
      content:
        "At AllShip AI, we keep improving the assistant based on how shippers, carriers and drivers actually use it. It answers questions about fees, escrow, verification and bidding from our help articles, guides new users through the product step by step, and only acts within the permissions you have in the app. It never publishes a load, places a bid or pays on your behalf.",
    },
    {
      title: "Shaping the future of logistics",
      content:
        "As we continue to build, AllShip AI is committed to a logistics industry that is more efficient, transparent and fair. Our vision is a marketplace where shippers can find a verified carrier in minutes, carriers get paid reliably after delivery, and AI takes care of the busywork in between. Join us and see what AI can do for your shipping.",
    },
  ] satisfies DescriptionBlock[],
};

export const aiHelp = {
  title: "AI help in logistics",
  description:
    "AI helps in logistics by drafting loads, estimating prices, comparing bids and keeping everyone informed. The AllShip AI assistant is built for the real needs of shippers, carriers and drivers, whether you are moving a home or running a fleet. Ask it a question in plain words and it works with your own loads, bids and trips.",
};

export const aiIntro = {
  title: "AI-powered logistics",
  description: "AI is transforming the logistics industry, cutting the time it takes to post a load, price it and choose a carrier. Experience the future of shipping with AllShip AI.",
};

export const aiFaq: FaqEntry[] = [
  {
    question: "How secure is the AllShip AI platform?",
    answer:
      "Payments are processed by Stripe, so card details never touch our servers. Accounts support two-factor authentication and passkeys, the assistant can only read the loads and bids your account already has access to, and you can download or delete your data at any time.",
  },
  {
    question: "What information does AllShip AI give me about my shipments?",
    answer:
      "For each load you see every bid with the carrier's rating and history, the payment status, messages and the latest tracking position. The assistant can summarize this for you and compare bids by price, dates, reviews and FMCSA authority status.",
  },
  {
    question: "Does the assistant post loads or accept bids for me?",
    answer:
      "No. The assistant prepares a load draft or a bid, and you review it and press the button yourself. Nothing is published, booked or paid without your confirmation.",
  },
  {
    question: "How can I switch my shipping to AllShip AI?",
    answer:
      "Create a free account and post your first load. The assistant can walk you through the product with an interactive tour, and our team is available by phone and email if you need help getting started.",
  },
  {
    question: "What kind of shippers and carriers use AllShip AI?",
    answer:
      "Households moving homes, small businesses shipping furniture, freight or equipment, and individuals transporting cars, boats or RVs post loads. Moving companies, auto haulers, owner-operators and box truck crews bid on them.",
  },
];

export type AiRole = "shipper" | "owner" | "dispatcher" | "driver";

export const aiRoles: { key: AiRole; label: string }[] = [
  { key: "shipper", label: "Shipper" },
  { key: "owner", label: "Carrier owner" },
  { key: "dispatcher", label: "Dispatcher" },
  { key: "driver", label: "Driver" },
];

export const aiCapabilities: { group: string; rows: { label: string; detail: string; roles: AiRole[] }[] }[] = [
  {
    group: "Everyone",
    rows: [
      { label: "Answer questions about fees, escrow, verification and cancellations", detail: "From AllShip help articles, not from memory", roles: ["shipper", "owner", "dispatcher", "driver"] },
      { label: "Give a ballpark price range", detail: "Uses the same public calculators as /tools, always labeled as an estimate", roles: ["shipper", "owner", "dispatcher", "driver"] },
      { label: "Start a guided tour", detail: "10 tours, each shown only to the roles it fits", roles: ["shipper", "owner", "dispatcher", "driver"] },
      { label: "Open the right page", detail: "Offers a button. You press it", roles: ["shipper", "owner", "dispatcher", "driver"] },
      { label: "Summarize your latest notifications", detail: "Unread first", roles: ["shipper", "owner", "dispatcher", "driver"] },
    ],
  },
  {
    group: "Shipping",
    rows: [
      { label: "Draft a load from a sentence", detail: "Picks one of 23 categories and pre-fills the form for you to review", roles: ["shipper"] },
      { label: "Read your loads and compare the bids", detail: "Price, dates, rating, history and FMCSA status side by side", roles: ["shipper"] },
    ],
  },
  {
    group: "Hauling",
    rows: [
      { label: "Search open loads on the board", detail: "By category, pickup and delivery state", roles: ["owner", "dispatcher"] },
      { label: "Draft a bid", detail: "Amount plus a message written for that load. You edit and place it", roles: ["owner", "dispatcher"] },
      { label: "List your company's bids", detail: "Active, won or closed", roles: ["owner", "dispatcher"] },
      { label: "List trips and the next step on each", detail: "Upcoming, on the road or done", roles: ["owner", "dispatcher", "driver"] },
      { label: "Check payout setup and recent payouts", detail: "Stripe Connect status for the company", roles: ["owner"] },
    ],
  },
];

export const aiNever = ["Post a load", "Place or accept a bid", "Pay, refund or release money", "Message a carrier or shipper for you", "See loads or bids your account can't see"];
