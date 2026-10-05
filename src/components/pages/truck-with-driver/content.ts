import { boxTruck16Ft, boxTruck6Ft, legacyAlt, sprinterVan } from "@/assets/legacy";
import type { FaqEntry, SectionImage, StepItem } from "@/components/sections";
import { site } from "@/content/site";

const fee = `${site.platformFeePercent}%`;
const hours = site.autoConfirmHours;

export const quoteHref = "/quote?category=truck-with-driver&src=truck_with_driver";

export const heroDescription =
  "Experience hassle-free truck hire with a professional driver, prices set by competing bids and payment held in escrow until the job is done. Perfect for pickups, deliveries and small moves.";

export const compareColumns = ["AllShip AI", "Self-drive rental", "Moving company"];

export const compareRows = [
  { label: "Pricing", cells: ["Carriers bid hourly or flat, you choose", "Daily rate plus mileage and fuel", "Crew rate, often with a minimum"] },
  { label: "Driver", cells: ["Professional driver included", "You drive", "Crew drives"] },
  { label: "Time", cells: ["Post once, compare bids", "Collect and return the truck", "Call around for quotes"] },
  { label: "Carrier checks", cells: ["USDOT, MC and insurance checked", "Not applicable", "Up to you to check"] },
  { label: "Trip status", cells: ["Live status during the job", "Not applicable", "Varies by company"] },
  { label: "Payment", cells: ["Held in escrow until done", "Paid upfront with a deposit", "Often a deposit upfront"] },
];

export type TruckType = { title: string; subtitle: string; fits: string[]; image: SectionImage };

export const trucks: TruckType[] = [
  {
    title: "Sprinter van",
    subtitle: "Ideal for small loads, quick deliveries and city runs.",
    fits: ["A few pieces of furniture or appliances", "Store and marketplace pickups", "Tight streets and parking garages"],
    image: { src: sprinterVan, alt: legacyAlt.sprinterVan },
  },
  {
    title: "Small box truck",
    subtitle: "Perfect for medium-sized loads and regional trips.",
    fits: ["Studio and dorm moves", "Storage unit runs", "Small business deliveries"],
    image: { src: boxTruck6Ft, alt: legacyAlt.boxTruck6Ft },
  },
  {
    title: "16-foot box truck",
    subtitle: "Best for large loads, longer moves and commercial use.",
    fits: ["One- and two-bedroom moves", "Event and trade show equipment", "Restocking a store or warehouse"],
    image: { src: boxTruck16Ft, alt: legacyAlt.boxTruck16Ft },
  },
];

export const steps: StepItem[] = [
  { title: "Find your truck", description: "Post the hours, stops and truck size you need. Licensed, FMCSA-checked carriers who serve your area see your job." },
  { title: "Get bids", description: "Compare quotes from verified carriers, hourly or flat, and ask questions in chat before you choose the best option for your budget and schedule." },
  { title: "Choose and enjoy", description: "Accept a bid and pay into escrow. Follow the job as the driver updates its status, and confirm when it is done." },
];

export const routes = [
  { origin: "New York, NY", destination: "Boston, MA", distance: "About 215 mi" },
  { origin: "Los Angeles, CA", destination: "Phoenix, AZ", distance: "About 370 mi" },
  { origin: "Los Angeles, CA", destination: "Portland, OR", distance: "About 965 mi" },
  { origin: "Boston, MA", destination: "Washington, DC", distance: "About 440 mi" },
];

export const truckFaq: FaqEntry[] = [
  {
    question: "How is the price set?",
    answer: `Carriers bid on your job, by the hour or at a flat price. You pay the bid you accept plus a ${fee} service fee, shown before you pay and held in escrow until the job is done.`,
  },
  {
    question: "How many hours should I book?",
    answer: "Add up drive time between stops, loading time at each one, and some margin for stairs and parking. If you're unsure, describe the job and ask carriers for their estimate in chat.",
  },
  {
    question: "Will the driver help me load?",
    answer: "Say whether you need help and how much. For heavy items or a lot of them, ask for a helper so the bid includes a second person.",
  },
  {
    question: "Can I follow the job while it is happening?",
    answer: "Yes. The driver updates the trip status from their phone, and you can see their location while the trip is in progress. Photos are taken at pickup and delivery.",
  },
  {
    question: "How is this different from hiring movers?",
    answer: "Movers handle a full home with a crew and moving supplies. A truck with driver is lighter: a vehicle, a driver and optionally a helper, for short jobs.",
  },
  {
    question: "When is the driver paid?",
    answer: `The carrier is paid after you confirm the job is done, or automatically ${hours} hours after delivery if you have not opened a dispute.`,
  },
];
