export type ToolKey = "moving" | "car" | "freight" | "cubic";

export type ToolEntry = {
  key: ToolKey;
  href: string;
  name: string;
  question: string;
  description: string;
  inputs: string[];
  output: string;
  next: { label: string; href: string };
};

export const toolCatalog: ToolEntry[] = [
  {
    key: "moving",
    href: "/tools/moving-cost-calculator",
    name: "Moving cost calculator",
    question: "What will my move cost?",
    description: "A price range for a household move from home size and distance, with packing, storage and unpacking as add-ons.",
    inputs: ["Home size or cubic feet", "Distance", "Packing, storage, unpacking"],
    output: "Price range with the 10% fee shown",
    next: { label: "Instant prices from movers", href: "/moving" },
  },
  {
    key: "car",
    href: "/tools/car-shipping-cost-calculator",
    name: "Car shipping cost calculator",
    question: "How much to ship my car?",
    description: "A range for auto transport by distance, vehicle size, open or enclosed trailer and whether the car runs.",
    inputs: ["Distance", "Vehicle size", "Open or enclosed", "Runs or not"],
    output: "Price range with the 10% fee shown",
    next: { label: "Get bids for your vehicle", href: "/vehicle-load" },
  },
  {
    key: "freight",
    href: "/tools/freight-class-calculator",
    name: "Freight class calculator",
    question: "Which NMFC class is my freight?",
    description: "Density in pounds per cubic foot and the matching class on the 13-tier density scale carriers use for LTL pricing.",
    inputs: ["Length, width, height", "Weight", "Pieces"],
    output: "Density and freight class",
    next: { label: "Post a freight load", href: "/freight-load" },
  },
  {
    key: "cubic",
    href: "/tools/cubic-feet-calculator",
    name: "Cubic feet calculator",
    question: "How big a truck do I need?",
    description: "Room-by-room inventory of furniture and boxes, added up to total volume, an estimated weight and the truck size that fits.",
    inputs: ["Furniture by room", "Boxes"],
    output: "Cubic feet, weight, truck size",
    next: { label: "Use it in the moving calculator", href: "/tools/moving-cost-calculator" },
  },
];
