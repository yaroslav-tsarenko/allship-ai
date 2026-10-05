export type ReviewProfile = { name: string; href: string; badge: "bbb" | "angi" | "homeAdvisor" | "thumbtack" | "trustpilot" | "yelp" | "yellowPages" | "google" };

export const site = {
  name: "AllShip AI",
  legalName: "ALLSHIP AI INC",
  url: "https://allship.ai",
  description:
    "Post your move, vehicle, freight or heavy equipment. FMCSA-verified carriers bid, you choose, and your payment stays in escrow until delivery.",
  phone: { display: "+1 (866) 228-2364", href: "tel:+18662282364", e164: "+18662282364" },
  email: "support@allship.ai",
  address: {
    street: "254 Chapman Rd, Ste 209",
    city: "Newark",
    region: "DE",
    postalCode: "19702",
    country: "US",
  },
  socials: [
    { name: "YouTube", href: "https://www.youtube.com/@allship-m3h" },
    { name: "Instagram", href: "https://www.instagram.com/allshipai" },
    { name: "TikTok", href: "https://www.tiktok.com/@allship.ai2" },
    { name: "Facebook", href: "https://www.facebook.com/people/allShip-AI/61575131679103/" },
  ],
  reviewProfiles: [] as ReviewProfile[],
  platformFeePercent: 10,
  autoConfirmHours: 72,
} as const;

export type NavLink = { label: string; href: string; description?: string };
export type NavGroup = { label: string; links: NavLink[] };

export const authLinks = {
  signIn: { label: "Sign in", href: "/sign-in" },
  signUp: { label: "Sign up", href: "/sign-up" },
  carrierSignUp: { label: "Become a carrier", href: "/sign-up?type=carrier" },
} as const;

export const headerNav: NavLink[] = [
  { label: "All", href: "/all", description: "Every service on AllShip AI" },
  { label: "Ship", href: "/ship", description: "How shipping with AllShip AI works" },
  { label: "AI", href: "/ai", description: "The AI tools behind the platform" },
  { label: "Safety", href: "/safety", description: "Carrier checks, escrow and compliance" },
  { label: "Partners", href: "/partners", description: "Carrier partnership and dispatch" },
  { label: "Blog", href: "/blog", description: "Shipping and moving guides" },
  { label: "About", href: "/about", description: "Who we are" },
];

export const mainNav: NavLink[] = headerNav;

export const loadCategoryNav: NavLink[] = [
  { label: "Vehicles & Boats", href: "/vehicle-load", description: "Cars, boats, motorcycles, RVs, trailers, parts" },
  { label: "Moving", href: "/moving-load", description: "Furniture, appliances" },
  { label: "Heavy Equipment", href: "/heavy-load", description: "Farm, construction" },
  { label: "Freight", href: "/freight-load", description: "LTL, FTL" },
];

export const shipNav: NavGroup[] = [
  { label: "Post a load", links: loadCategoryNav },
  {
    label: "Moving and trucks",
    links: [
      { label: "Moving", href: "/moving", description: "Local and long-distance household moves" },
      { label: "Rent a truck", href: "/rent-truck" },
      { label: "Truck with driver", href: "/truck-with-driver" },
      { label: "Get a quote", href: "/quote" },
    ],
  },
  {
    label: "More services",
    links: [
      { label: "All services", href: "/all" },
      { label: "Office and business moves", href: "/services/office-moving" },
      { label: "Car shipping", href: "/services/car-or-light-truck" },
      { label: "Boat transport", href: "/services/powerboat" },
    ],
  },
];

export type NavIcon =
  | "house" | "route" | "chair" | "office" | "school" | "military" | "store" | "groups" | "weight"
  | "car" | "moto" | "boat" | "sail" | "rv" | "atv" | "truck" | "parts"
  | "pallet" | "heavy" | "rental" | "driver" | "bolt" | "steps"
  | "partners" | "board" | "payments" | "shield" | "dispatch" | "leads" | "calc" | "volume" | "scale" | "schedule"
  | "info" | "ai" | "article" | "contact" | "help" | "compare" | "quote";

export type MegaLink = NavLink & { icon?: NavIcon };
export type MegaGroup = { label: string; href?: string; links: MegaLink[]; more?: NavLink };
export type MegaFeature = { label: string; href: string; description: string; icon?: NavIcon };
export type MegaSection = { id: string; label: string; href: string; groups: MegaGroup[]; features?: MegaFeature[]; guides?: MegaGroup };

export const megaNav: MegaSection[] = [
  {
    id: "ship",
    label: "Ship",
    href: "/ship",
    groups: [
      {
        label: "Moving",
        href: "/moving-load",
        links: [
          { label: "Local move", href: "/moving-load?type=local_moving", description: "Same metro, priced by crew time", icon: "house" },
          { label: "Long-distance move", href: "/moving-load?type=long_distance_moving", description: "Interstate, priced by volume", icon: "route" },
          { label: "Household items", href: "/moving-load?type=household_items", description: "A few pieces, not a whole home", icon: "chair" },
          { label: "Office move", href: "/moving-load?type=office_moving", description: "Workstations, files, after hours", icon: "office" },
          { label: "Student move", href: "/moving-load?type=student_moving", description: "Dorms and small apartments", icon: "school" },
          { label: "Military move", href: "/moving-load?type=military_moving", description: "PCS and PPM paperwork ready", icon: "military" },
        ],
        more: { label: "Business, corporate, labor only", href: "/moving-load" },
      },
      {
        label: "Vehicles",
        href: "/vehicle-load",
        links: [
          { label: "Car or light truck", href: "/vehicle-load?type=car_or_light_truck", description: "Open or enclosed trailer", icon: "car" },
          { label: "Motorcycle", href: "/vehicle-load?type=motorcycle", description: "Crated or strapped, enclosed", icon: "moto" },
          { label: "Powerboat", href: "/vehicle-load?type=powerboat", description: "On your trailer or the carrier's", icon: "boat" },
          { label: "Sailboat", href: "/vehicle-load?type=sailboat", description: "Mast down, on a cradle", icon: "sail" },
          { label: "RV or trailer", href: "/vehicle-load?type=rv", description: "Motorhomes, fifth wheels", icon: "rv" },
          { label: "ATV and powersports", href: "/vehicle-load?type=atv_powersports", description: "ATVs, UTVs, snowmobiles", icon: "atv" },
        ],
        more: { label: "Jet skis, commercial trucks, parts", href: "/vehicle-load" },
      },
      {
        label: "Freight and trucks",
        links: [
          { label: "Freight", href: "/freight-load", description: "Pallets and crates, LTL or FTL", icon: "pallet" },
          { label: "Heavy equipment", href: "/heavy-load", description: "Construction and farm machinery", icon: "heavy" },
          { label: "Truck rental", href: "/rent-truck", description: "Truck and driver for the day", icon: "rental" },
          { label: "Truck with driver", href: "/truck-with-driver", description: "By the hour, local jobs", icon: "driver" },
          { label: "Get a quote", href: "/quote", description: "Not sure which form? Start here", icon: "quote" },
        ],
        more: { label: "Every service", href: "/all" },
      },
    ],
    features: [
      { label: "Get instant moving prices", href: "/moving", description: "Movers' published rates for your route, no sign-up to see them.", icon: "bolt" },
      { label: "How it works", href: "/how-it-works", description: "Post free, compare verified bids, pay into escrow on booking.", icon: "steps" },
    ],
    guides: {
      label: "Service guides",
      href: "/all",
      links: [
        { label: "Local moving", href: "/services/local-moving" },
        { label: "Long-distance", href: "/services/long-distance-moving" },
        { label: "Office moving", href: "/services/office-moving" },
        { label: "Car shipping", href: "/services/car-or-light-truck" },
        { label: "Motorcycle", href: "/services/motorcycle" },
        { label: "Boat transport", href: "/services/powerboat" },
        { label: "RV transport", href: "/services/rv" },
        { label: "Vehicle parts", href: "/services/vehicle-parts" },
      ],
    },
  },
  {
    id: "carriers",
    label: "Carriers",
    href: "/partners",
    groups: [
      {
        label: "For carriers",
        links: [
          { label: "Partners and registration", href: "/partners", description: "Join, get verified, start bidding", icon: "partners" },
          { label: "Find loads", href: "/loads", description: "Open loads on the public board", icon: "board" },
          { label: "Drivers", href: "/drivers", description: "Trips, pickup photos, proof of delivery", icon: "driver" },
          { label: "Pricing for carriers", href: "/pricing#fee", description: "You keep 100% of your bid", icon: "payments" },
          { label: "Safety and verification", href: "/safety", description: "USDOT, authority and insurance checks", icon: "shield" },
          { label: "Dispatch service", href: "/partners#dispatch", description: "Optional: we find and book loads for you", icon: "dispatch" },
          { label: "Lead generation", href: "/lead-generate", description: "How carriers and movers find paid loads", icon: "leads" },
          { label: "Carrier requirements", href: "/partners#requirements", description: "What you need before your first bid", icon: "steps" },
        ],
      },
    ],
    features: [{ label: "Become a carrier", href: "/sign-up?type=carrier", description: "Create a carrier account. Bidding opens after FMCSA verification." }],
  },
  {
    id: "tools",
    label: "Tools",
    href: "/tools",
    groups: [
      {
        label: "Free calculators",
        links: [
          { label: "Moving cost calculator", href: "/tools/moving-cost-calculator", description: "Estimate by home size and distance", icon: "calc" },
          { label: "Car shipping calculator", href: "/tools/car-shipping-cost-calculator", description: "Open vs. enclosed, by route", icon: "car" },
          { label: "Freight class calculator", href: "/tools/freight-class-calculator", description: "NMFC class from density", icon: "scale" },
          { label: "Cubic feet calculator", href: "/tools/cubic-feet-calculator", description: "Volume of your move, room by room", icon: "volume" },
          { label: "Time schedule", href: "/time-schedule", description: "How pickup and delivery dates work", icon: "schedule" },
        ],
      },
    ],
    features: [{ label: "Instant moving prices", href: "/moving", description: "Skip the estimate: see movers' real rates for your route.", icon: "bolt" }],
  },
  {
    id: "company",
    label: "Company",
    href: "/about",
    groups: [
      {
        label: "Company",
        links: [
          { label: "About us", href: "/about", description: "Who we are and how we work", icon: "info" },
          { label: "AI tools", href: "/ai", description: "Load drafting, estimates, bid comparison", icon: "ai" },
          { label: "Safety", href: "/safety", description: "Carrier checks, escrow and compliance", icon: "shield" },
          { label: "Blog", href: "/blog", description: "Shipping and moving guides", icon: "article" },
          { label: "Contact us", href: "/contact-us", description: "Phone, email and support hours", icon: "contact" },
          { label: "FAQ", href: "/faq", description: "Fees, escrow, bidding, cancellations", icon: "help" },
          { label: "Why choose us", href: "/why-choose-us", description: "Escrow, verified carriers, one dashboard", icon: "steps" },
          { label: "AllShip AI vs. uShip", href: "/compare/uship-alternative", description: "Fees, escrow and verification side by side", icon: "compare" },
        ],
      },
    ],
  },
];

export const headerLinks: NavLink[] = [{ label: "Pricing", href: "/pricing" }];

export const footerNav: NavGroup[] = [
  {
    label: "Company",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Why Choose Us", href: "/why-choose-us" },
      { label: "Pricing", href: "/pricing" },
      { label: "How it works", href: "/how-it-works" },
      { label: "Safety", href: "/safety" },
      { label: "AI tools", href: "/ai" },
    ],
  },
  {
    label: "Resources",
    links: [
      { label: "Blog", href: "/blog" },
      { label: "FAQ", href: "/faq" },
      { label: "Contact Us", href: "/contact-us" },
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Terms and Conditions", href: "/terms-and-conditions" },
      { label: "Cookie Policy", href: "/cookie-policy" },
    ],
  },
  {
    label: "Product",
    links: [
      { label: "All services", href: "/all" },
      { label: "Ship", href: "/ship" },
      { label: "Moving", href: "/moving" },
      { label: "Rent a truck", href: "/rent-truck" },
      { label: "Truck with driver", href: "/truck-with-driver" },
      { label: "Time Schedule", href: "/time-schedule" },
      { label: "Lead Generation", href: "/lead-generate" },
      { label: "Get a quote", href: "/quote" },
    ],
  },
  {
    label: "Carriers",
    links: [
      { label: "Partners", href: "/partners" },
      { label: "Requirements", href: "/partners#requirements" },
      { label: "Dispatch service", href: "/partners#dispatch" },
      { label: "For drivers", href: "/drivers" },
      { label: "Load board", href: "/loads" },
      { label: "Moving cost calculator", href: "/tools/moving-cost-calculator" },
      { label: "Car shipping calculator", href: "/tools/car-shipping-cost-calculator" },
      { label: "Freight class calculator", href: "/tools/freight-class-calculator" },
    ],
  },
];

export const legalNav: NavLink[] = [
  { label: "Terms and Conditions", href: "/terms-and-conditions" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Cookie Policy", href: "/cookie-policy" },
  { label: "Cancellation and refunds", href: "/legal/cancellation-refunds" },
  { label: "Carrier agreement", href: "/legal/carrier-agreement" },
  { label: "Do not sell or share my info", href: "/legal/do-not-sell" },
];
