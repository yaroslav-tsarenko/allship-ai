import {
  legacyAlt,
  movingGallery1,
  movingGallery2,
  movingGallery3,
  movingGallery4,
  movingGallery5,
  movingGallery6,
  movingGallery7,
  movingGallery8,
  movingGallery9,
} from "@/assets/legacy";
import { site } from "@/content/site";
import { calendarMonthIcon, inventoryIcon, publicIcon, receiptLongIcon, routeIcon, shieldLockIcon, smartToyIcon, supportAgentIcon, verifiedUserIcon, type IconData } from "@/components/ui/icons.generated";

export type MovingBenefit = { title: string; description: string; more: string; icon: IconData };

export const movingBenefits: MovingBenefit[] = [
  {
    title: "AI-powered efficiency",
    description: "AllShip AI prices your move from each mover's own rates for your distance and home size, so you compare real numbers in seconds instead of waiting for callbacks.",
    more: "Our assistant helps you describe the move and compare offers. When no mover has published rates for your route, post the move and verified movers bid on it.",
    icon: smartToyIcon,
  },
  {
    title: "Trusted and licensed carriers",
    description: "Move with confidence. Every mover shows its FMCSA authority status, and only verified movers can bid on posted moves.",
    more: "We check each mover's USDOT and MC numbers, insurance and payout account. Interstate household goods movers must be registered with FMCSA.",
    icon: verifiedUserIcon,
  },
  {
    title: "Support and tracking",
    description: "Follow your move on the load page, with live location when the driver shares it, and reach our team by phone or email.",
    more: `Message your mover from the load page and get updates at pickup and delivery. Call ${site.phone.display} or write to ${site.email}.`,
    icon: supportAgentIcon,
  },
  {
    title: "Transparent pricing",
    description: `No hidden fees. Every price shows the mover's charge and AllShip's ${site.platformFeePercent}% service fee before you book.`,
    more: "Instant prices are itemized into transport, packing, unpacking and storage, so you can budget with confidence.",
    icon: receiptLongIcon,
  },
  {
    title: "Nationwide coverage",
    description: "Whether you're moving across town or across the country, AllShip connects you with movers across the US.",
    more: "Each mover sets the distances and states it serves. If no instant price covers your route, post your move and movers who serve it can bid.",
    icon: publicIcon,
  },
  {
    title: "Easy online booking",
    description: "Book your move in minutes online, any time of day.",
    more: "Pick a mover, confirm your email and pay only when you accept. Your payment waits in escrow until the move is delivered.",
    icon: calendarMonthIcon,
  },
  {
    title: "Customizable moving solutions",
    description: "Tailor your move with options for packing, unpacking and storage.",
    more: "Choose only the services you need, from quarter packing for fragile items to full packing and storage by the month.",
    icon: inventoryIcon,
  },
  {
    title: "Insurance and protection",
    description: "Ask for the protection you need. Interstate movers must offer released value protection and full value protection.",
    more: "Tick full value protection in the form and the mover sees it as a requirement of your booking. AllShip doesn't sell insurance, and your payment stays in escrow until delivery.",
    icon: shieldLockIcon,
  },
  {
    title: "Greener moves",
    description: "Ask your mover about reusable bins and blanket wrapping instead of single-use packing.",
    more: "Mention it when the mover calls to confirm your inventory. Booking one truck for the whole move also avoids extra trips.",
    icon: routeIcon,
  },
];

export const movingAdvantages = [
  "Prices for your home size",
  "Real-time move tracking",
  "FMCSA status on every mover",
  "Flexible pickup and delivery dates",
  "Itemized, upfront pricing",
  "Payment held in escrow until delivery",
  "Packing, unpacking and storage",
  "Support by phone and email",
];

export const movingGallery = [movingGallery1, movingGallery2, movingGallery3, movingGallery4, movingGallery5, movingGallery6, movingGallery7, movingGallery8, movingGallery9].map((src, i) => ({
  src,
  alt: legacyAlt[`movingGallery${i + 1}` as keyof typeof legacyAlt],
}));

export const movingFaq = [
  {
    question: "What is AllShip AI?",
    answer: `AllShip AI is an online marketplace for moving and shipping. You describe your move, movers price it from their published rates or bid on it, and your payment is held in escrow until delivery. You pay the mover's price plus a ${site.platformFeePercent}% service fee.`,
  },
  {
    question: "How are the instant prices calculated?",
    answer:
      "Each mover publishes a rate per cubic foot for distance ranges, plus rates for packing, unpacking and storage. We turn your bedrooms into a volume (300 ft³ for one bedroom up to 2,600 ft³ for eight), estimate the distance between your two places, and multiply. Movers without a rate for your distance or a service you picked aren't shown. Insurance, climate control and long-term storage are passed to the mover as requirements and aren't in the price.",
  },
  {
    question: "Is AllShip AI suitable for small moves?",
    answer: "Yes. Instant prices start at a one-bedroom move. For a few items or a single room, post your move and movers bid on exactly what you need.",
  },
  {
    question: "What happens after I choose a mover?",
    answer:
      "We create your account and email you a confirmation link. When you confirm, your move is posted and the mover you chose places a bid at the quoted price. Other verified movers can also bid. You accept the bid you want and pay; the money stays in escrow until delivery. The mover can withdraw within 24 hours if they can't take the move.",
  },
  {
    question: "What if no instant price shows for my route?",
    answer: "Leave your name, email and phone under the search results. We create your account and, once you confirm your email, post the move with the details you already entered. Verified movers who serve your route send bids, usually within a few hours, and you choose. It's free until you accept a bid.",
  },
  {
    question: "Can I schedule pickup and delivery?",
    answer: "Yes. Choose a pickup date and, if you need one, a delivery date. The mover confirms timing, access and your inventory with you before pickup.",
  },
  {
    question: "What kind of customer support does AllShip AI provide?",
    answer: `Call ${site.phone.display} or email ${site.email}. After booking, you can message your mover and driver from your load page.`,
  },
  {
    question: "Is my data secure with AllShip AI?",
    answer: "Card payments are processed by Stripe and AllShip never stores card numbers. Our privacy policy explains what we keep and how to download or delete your data.",
  },
  {
    question: "When is the mover paid?",
    answer: `After you confirm delivery, or automatically ${site.autoConfirmHours} hours after delivery if you haven't opened a dispute. Until then the payment stays in escrow.`,
  },
  {
    question: "How do I get started?",
    answer: "Enter where you're moving from and to, your home size and dates at the top of this page. You see prices right away, without signing up.",
  },
];
