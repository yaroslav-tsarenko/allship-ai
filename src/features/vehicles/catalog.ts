export type VpicCatalog = "car" | "motorcycle" | "truck";
export type StaticCatalog = "powerboat" | "sailboat" | "watercraft" | "powersports" | "trailer" | "rv" | "equipment";
export type MakeCatalog = VpicCatalog | StaticCatalog;

export const vpicCatalogs: readonly VpicCatalog[] = ["car", "motorcycle", "truck"];

export function isVpicCatalog(c: string): c is VpicCatalog {
  return (vpicCatalogs as readonly string[]).includes(c);
}

export const vpicTypes: Record<VpicCatalog, readonly string[]> = {
  car: ["car", "multipurpose passenger vehicle (mpv)", "truck"],
  motorcycle: ["motorcycle"],
  truck: ["truck", "bus"],
};

export const VPIC_FIRST_YEAR = 1981;

export function modelYears(now = new Date(), first = VPIC_FIRST_YEAR) {
  const last = now.getFullYear() + 1;
  return Array.from({ length: last - first + 1 }, (_, i) => last - i);
}

export const popularMakes: Record<MakeCatalog, readonly string[]> = {
  car: [
    "Acura", "Alfa Romeo", "Aston Martin", "Audi", "Bentley", "BMW", "Buick", "Cadillac", "Chevrolet", "Chrysler", "Dodge", "Ferrari", "Fiat", "Ford", "Genesis", "GMC", "Honda",
    "Hyundai", "Infiniti", "Jaguar", "Jeep", "Kia", "Lamborghini", "Land Rover", "Lexus", "Lincoln", "Lucid", "Maserati", "Mazda", "McLaren", "Mercedes-Benz", "Mercury", "MINI",
    "Mitsubishi", "Nissan", "Polestar", "Pontiac", "Porsche", "Ram", "Rivian", "Rolls-Royce", "Saab", "Saturn", "Scion", "Subaru", "Suzuki", "Tesla", "Toyota", "Volkswagen", "Volvo",
  ],
  motorcycle: [
    "Aprilia", "BMW", "Can-Am", "Ducati", "Harley-Davidson", "Honda", "Husqvarna", "Indian", "Kawasaki", "KTM", "Moto Guzzi", "MV Agusta", "Royal Enfield", "Suzuki", "Triumph",
    "Vespa", "Victory", "Yamaha", "Zero",
  ],
  truck: [
    "Blue Bird", "Chevrolet", "Ford", "Freightliner", "GMC", "Hino", "International", "Isuzu", "Kenworth", "Mack", "Mitsubishi Fuso", "Peterbilt", "Ram", "Thomas Built Buses",
    "UD Trucks", "Volvo", "Western Star",
  ],
  powerboat: [
    "Bayliner", "Boston Whaler", "Chaparral", "Cobalt", "Crestliner", "Grady-White", "Lowe", "Lund", "MasterCraft", "Malibu", "Nautique", "Regal", "Robalo", "Sea Ray", "Sea Hunt",
    "Scout", "Starcraft", "Sun Tracker", "Tracker", "Yamaha", "Bennington", "Godfrey", "Tige", "Chris-Craft", "Formula", "Wellcraft", "Key West", "Mako", "Tahoe", "Alumacraft",
  ],
  sailboat: ["Beneteau", "Catalina", "Hunter", "Jeanneau", "Hanse", "Bavaria", "Dufour", "Lagoon", "Leopard", "Hobie", "Laser", "Sunfish", "J/Boats", "Island Packet", "Tartan", "O'Day", "Pearson", "Com-Pac", "MacGregor"],
  watercraft: ["Sea-Doo", "Yamaha", "Kawasaki", "Krash", "Belassi", "Taiga"],
  powersports: ["Polaris", "Can-Am", "Honda", "Yamaha", "Kawasaki", "Suzuki", "Arctic Cat", "Ski-Doo", "CFMOTO", "Kubota", "John Deere", "Club Car", "E-Z-GO", "Yamaha Golf-Car", "Segway"],
  trailer: ["Big Tex", "Carry-On", "Featherlite", "Haulmark", "Interstate", "Look", "PJ Trailers", "Sure-Trac", "Load Trail", "Lamar", "Diamond C", "Wells Cargo", "Continental Cargo", "Karavan", "Load Rite", "EZ Loader", "Sundowner", "Exiss"],
  rv: ["Airstream", "Coachmen", "Fleetwood", "Forest River", "Grand Design", "Heartland", "Jayco", "Keystone", "Newmar", "Thor", "Tiffin", "Winnebago", "Entegra", "Dutchmen", "Palomino", "Lance", "Northwood", "Starcraft", "Highland Ridge", "Alliance"],
  equipment: ["Caterpillar", "John Deere", "Komatsu", "Bobcat", "Case", "Kubota", "Volvo CE", "Hitachi", "JCB", "Doosan", "Takeuchi", "New Holland", "Liebherr", "Hyundai", "Kobelco", "Terex", "Genie", "JLG", "Toyota", "Hyster", "Yale", "Manitou", "Gehl", "Wacker Neuson", "Vermeer", "Ditch Witch", "Generac", "Grove"],
};

export const bodyTypes = ["Sedan", "Coupe", "Convertible", "Hatchback", "Wagon", "SUV or crossover", "Pickup truck", "Minivan", "Van", "Other"] as const;

export function bodyTypeFromVpic(bodyClass: string): (typeof bodyTypes)[number] | null {
  const b = bodyClass.toLowerCase();
  if (!b) return null;
  if (b.includes("convertible") || b.includes("cabriolet") || b.includes("roadster")) return "Convertible";
  if (b.includes("pickup")) return "Pickup truck";
  if (b.includes("minivan")) return "Minivan";
  if (b.includes("sport utility") || b.includes("crossover") || b.includes("suv")) return "SUV or crossover";
  if (b.includes("wagon")) return "Wagon";
  if (b.includes("hatchback")) return "Hatchback";
  if (b.includes("coupe")) return "Coupe";
  if (b.includes("sedan")) return "Sedan";
  if (b.includes("van")) return "Van";
  return "Other";
}

const acronyms = new Set(["BMW", "GMC", "MINI", "KTM", "CFMOTO", "JCB", "JLG", "MV", "UD", "AMC", "SRT", "BYD"]);

export function displayMake(raw: string, known: readonly string[] = []) {
  const name = raw.trim();
  const hit = known.find((k) => k.toLowerCase() === name.toLowerCase());
  if (hit) return hit;
  if (name !== name.toUpperCase()) return name;
  return name
    .toLowerCase()
    .split(/(\s|-|\/)/)
    .map((w) => (acronyms.has(w.toUpperCase()) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
    .join("");
}
