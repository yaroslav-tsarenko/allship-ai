export const demoLoad = {
  publicId: "AS-7K2P9Q",
  title: "2021 Toyota RAV4",
  category: "Car or light truck",
  from: "Dallas, TX",
  to: "Denver, CO",
  fromZip: "752",
  toZip: "802",
  miles: 790,
  pickup: "Oct 14 – Oct 16",
  shipper: "Emily C.",
};

export type DemoBid = {
  id: string;
  carrier: string;
  cents: number;
  rating: number;
  reviews: number;
  loads: number;
  usdot: string;
  pickup: string;
  delivery: string;
  message: string;
};

export const demoBids: DemoBid[] = [
  {
    id: "front-range",
    carrier: "Front Range Carriers",
    cents: 89_000,
    rating: 4.7,
    reviews: 86,
    loads: 140,
    usdot: "2210458",
    pickup: "Oct 15",
    delivery: "Oct 18",
    message: "Open 9-car hauler, door-to-door if the street allows. Insured to $250k per vehicle.",
  },
  {
    id: "lone-star",
    carrier: "Lone Star Auto Haul",
    cents: 94_000,
    rating: 4.9,
    reviews: 212,
    loads: 318,
    usdot: "3141592",
    pickup: "Oct 14",
    delivery: "Oct 17",
    message: "Driver is in Dallas on the 14th. Enclosed spot available for the same price.",
  },
  {
    id: "mesa",
    carrier: "Mesa Auto Logistics",
    cents: 86_500,
    rating: 4.5,
    reviews: 23,
    loads: 41,
    usdot: "3870021",
    pickup: "Oct 16",
    delivery: "Oct 19",
    message: "Can pick up on the 16th. Open carrier, photos at pickup and delivery.",
  },
  {
    id: "red-river",
    carrier: "Red River Transport",
    cents: 101_000,
    rating: 4.8,
    reviews: 140,
    loads: 205,
    usdot: "1988734",
    pickup: "Oct 14",
    delivery: "Oct 16",
    message: "Express lane, two drivers. Delivered in two days.",
  },
];

export const FEE_BPS = 1000;

export function split(cents: number) {
  const fee = Math.round((cents * FEE_BPS) / 10_000);
  return { carrier: cents, fee, total: cents + fee };
}

export const demoDrivers = [
  {
    id: "marcus",
    name: "Marcus T.",
    status: "On trip · In transit",
    tone: "primary" as const,
    trip: "AS-7K2P9Q",
    from: "Dallas, TX",
    to: "Denver, CO",
    speed: "62 mph",
    heading: "NW",
  },
  {
    id: "ana",
    name: "Ana R.",
    status: "Heading to pickup",
    tone: "secondary" as const,
    trip: "AS-3HV8LC",
    from: "Houston, TX",
    to: "Memphis, TN",
    speed: "48 mph",
    heading: "N",
  },
  {
    id: "dwayne",
    name: "Dwayne P.",
    status: "Idle",
    tone: "neutral" as const,
    trip: null,
    from: "Oklahoma City, OK",
    to: null,
    speed: "Stopped",
    heading: null,
  },
];
