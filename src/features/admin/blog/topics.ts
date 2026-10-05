export type TopicProposal = { pillar: string; title: string; route: string; category: string };

const pillars: Array<{ pillar: string; route: string; category: string; titles: string[] }> = [
  {
    pillar: "Car shipping",
    route: "/vehicle-load",
    category: "car-shipping",
    titles: [
      "How much does it cost to ship a car across the country?",
      "Open vs enclosed auto transport: which one is worth it",
      "How to prepare your car for transport: a 12-point checklist",
      "Shipping a car to another state: timeline, documents and insurance",
      "Motorcycle shipping: crates, pallets and enclosed carriers explained",
      "Boat transport guide: trailer, cradle, height limits and permits",
      "RV transport vs driving it yourself: cost and risk comparison",
    ],
  },
  {
    pillar: "Moving",
    route: "/moving",
    category: "moving",
    titles: [
      "Moving cost by home size: studio to 5-bedroom",
      "Long-distance moving timeline: an 8-week plan",
      "How to verify a moving company's USDOT and MC numbers",
      "Moving scams: 9 red flags and how escrow payment protects you",
      "Released value vs full value protection: moving insurance explained",
      "Military PCS move checklist: DPS, personally procured moves and what to track",
      "Student moving on a budget: dorm to apartment",
      "Office relocation checklist for small businesses",
      "Best and worst times of the year to move",
    ],
  },
  {
    pillar: "Freight and heavy",
    route: "/freight-load",
    category: "freight",
    titles: [
      "LTL vs FTL: how to choose and what it costs",
      "Freight class (NMFC) explained with a density calculator",
      "Bill of lading explained: fields, types, mistakes",
      "Shipping pallets: dimensions, weight limits and packaging rules",
      "Heavy equipment transport: oversize permits by state, escorts, trailers",
      "Hotshot trucking vs full truckload: when each makes sense",
    ],
  },
  {
    pillar: "Carriers",
    route: "/partners",
    category: "carriers",
    titles: [
      "How to win more loads on a load board: bid strategy that works",
      "How carriers price per mile in 2026: building a rate table",
      "Owner-operator authority: getting USDOT and MC numbers",
      "Getting paid faster: escrow, quick pay and factoring compared",
      "Truck dispatch service: what it covers and what it costs",
    ],
  },
  {
    pillar: "AI and product",
    route: "/how-it-works",
    category: "",
    titles: [
      "How AllShip AI estimates a shipping price",
      "Comparing carrier bids: price, ETA, rating and authority status",
      "Escrow payments for shipping: how your money is protected step by step",
    ],
  },
];

export const topicProposals: TopicProposal[] = pillars.flatMap((p) => p.titles.map((title) => ({ pillar: p.pillar, title, route: p.route, category: p.category })));

export type LinkTarget = { href: string; label: string; group: "Pages" | "Tools" | "Guides" | "Topics"; keywords: string[] };

export const siteLinkTargets: LinkTarget[] = [
  { href: "/how-it-works", label: "How it works", group: "Pages", keywords: ["how it works", "bids", "escrow", "post a load"] },
  { href: "/ship", label: "Ship anything", group: "Pages", keywords: ["ship", "shipping"] },
  { href: "/quote", label: "Get a quote", group: "Pages", keywords: ["quote", "estimate", "price"] },
  { href: "/pricing", label: "Pricing", group: "Pages", keywords: ["pricing", "fee", "cost"] },
  { href: "/moving", label: "Moving", group: "Pages", keywords: ["moving", "movers", "household", "relocation", "move"] },
  { href: "/vehicle-load", label: "Vehicle transport", group: "Pages", keywords: ["car shipping", "auto transport", "vehicle", "car"] },
  { href: "/freight-load", label: "Freight shipping", group: "Pages", keywords: ["freight", "ltl", "ftl", "pallet", "truckload"] },
  { href: "/heavy-load", label: "Heavy equipment transport", group: "Pages", keywords: ["heavy equipment", "oversize", "excavator", "tractor"] },
  { href: "/rent-truck", label: "Truck rental", group: "Pages", keywords: ["truck rental", "rent a truck"] },
  { href: "/truck-with-driver", label: "Truck with driver", group: "Pages", keywords: ["truck with driver", "driver"] },
  { href: "/safety", label: "Safety and verification", group: "Pages", keywords: ["safety", "verified", "fmcsa", "scam", "insurance"] },
  { href: "/partners", label: "For carriers", group: "Pages", keywords: ["carrier", "owner-operator", "load board", "bid"] },
  { href: "/partners#requirements", label: "Carrier requirements", group: "Pages", keywords: ["usdot", "mc number", "authority", "requirements"] },
  { href: "/partners#dispatch", label: "Dispatch for carriers", group: "Pages", keywords: ["dispatch", "dispatcher"] },
  { href: "/ai", label: "AllShip AI assistant", group: "Pages", keywords: ["ai", "assistant", "estimate"] },
  { href: "/faq", label: "FAQ", group: "Pages", keywords: ["faq", "questions"] },
  { href: "/loads", label: "Open loads", group: "Pages", keywords: ["open loads", "load board"] },
  { href: "/tools/moving-cost-calculator", label: "Moving cost calculator", group: "Tools", keywords: ["moving cost", "cost to move", "moving estimate"] },
  { href: "/tools/car-shipping-cost-calculator", label: "Car shipping cost calculator", group: "Tools", keywords: ["car shipping cost", "cost to ship a car", "auto transport cost"] },
  { href: "/tools/cubic-feet-calculator", label: "Cubic feet calculator", group: "Tools", keywords: ["cubic feet", "volume", "home size"] },
  { href: "/tools/freight-class-calculator", label: "Freight class calculator", group: "Tools", keywords: ["freight class", "nmfc", "density"] },
];
