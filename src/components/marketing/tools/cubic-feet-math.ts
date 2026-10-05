export type InventoryItem = { id: string; name: string; cubicFeet: number };
export type Room = { id: string; name: string; items: InventoryItem[] };

export const rooms: Room[] = [
  {
    id: "living",
    name: "Living room",
    items: [
      { id: "sofa-3", name: "Sofa, 3-seat", cubicFeet: 50 },
      { id: "loveseat", name: "Loveseat", cubicFeet: 35 },
      { id: "sectional", name: "Sectional, per piece", cubicFeet: 30 },
      { id: "armchair", name: "Armchair", cubicFeet: 20 },
      { id: "recliner", name: "Recliner", cubicFeet: 25 },
      { id: "coffee-table", name: "Coffee table", cubicFeet: 5 },
      { id: "end-table", name: "End table", cubicFeet: 5 },
      { id: "tv-stand", name: "TV stand", cubicFeet: 10 },
      { id: "tv", name: "Flat-screen TV", cubicFeet: 10 },
      { id: "bookcase", name: "Bookcase", cubicFeet: 20 },
      { id: "floor-lamp", name: "Floor lamp", cubicFeet: 3 },
      { id: "piano-upright", name: "Upright piano", cubicFeet: 25 },
    ],
  },
  {
    id: "bedroom",
    name: "Bedrooms",
    items: [
      { id: "bed-king", name: "King bed with mattress", cubicFeet: 70 },
      { id: "bed-queen", name: "Queen bed with mattress", cubicFeet: 65 },
      { id: "bed-full", name: "Full bed with mattress", cubicFeet: 60 },
      { id: "bed-twin", name: "Twin bed with mattress", cubicFeet: 40 },
      { id: "crib", name: "Crib", cubicFeet: 10 },
      { id: "dresser", name: "Dresser", cubicFeet: 30 },
      { id: "chest", name: "Chest of drawers", cubicFeet: 20 },
      { id: "nightstand", name: "Nightstand", cubicFeet: 5 },
      { id: "wardrobe", name: "Wardrobe or armoire", cubicFeet: 40 },
    ],
  },
  {
    id: "dining",
    name: "Dining room",
    items: [
      { id: "dining-table", name: "Dining table", cubicFeet: 30 },
      { id: "dining-chair", name: "Dining chair", cubicFeet: 5 },
      { id: "china-cabinet", name: "China cabinet or hutch", cubicFeet: 25 },
      { id: "buffet", name: "Buffet or sideboard", cubicFeet: 30 },
    ],
  },
  {
    id: "kitchen",
    name: "Kitchen and laundry",
    items: [
      { id: "fridge", name: "Refrigerator", cubicFeet: 45 },
      { id: "washer", name: "Washing machine", cubicFeet: 25 },
      { id: "dryer", name: "Dryer", cubicFeet: 25 },
      { id: "dishwasher", name: "Dishwasher", cubicFeet: 20 },
      { id: "microwave", name: "Microwave", cubicFeet: 3 },
      { id: "kitchen-table", name: "Kitchen table", cubicFeet: 10 },
      { id: "kitchen-chair", name: "Kitchen chair or stool", cubicFeet: 5 },
    ],
  },
  {
    id: "office",
    name: "Home office",
    items: [
      { id: "desk", name: "Desk", cubicFeet: 25 },
      { id: "office-chair", name: "Office chair", cubicFeet: 5 },
      { id: "file-cabinet", name: "File cabinet, 4-drawer", cubicFeet: 10 },
      { id: "computer", name: "Computer and monitor", cubicFeet: 5 },
    ],
  },
  {
    id: "garage",
    name: "Garage and outdoor",
    items: [
      { id: "mower", name: "Lawn mower", cubicFeet: 15 },
      { id: "bicycle", name: "Bicycle", cubicFeet: 10 },
      { id: "grill", name: "Grill", cubicFeet: 10 },
      { id: "tool-chest", name: "Tool chest", cubicFeet: 10 },
      { id: "patio-table", name: "Patio table", cubicFeet: 10 },
      { id: "patio-chair", name: "Patio chair", cubicFeet: 5 },
    ],
  },
  {
    id: "boxes",
    name: "Boxes",
    items: [
      { id: "box-small", name: "Small box, 1.5 ft³", cubicFeet: 1.5 },
      { id: "box-medium", name: "Medium box, 3 ft³", cubicFeet: 3 },
      { id: "box-large", name: "Large box, 4.5 ft³", cubicFeet: 4.5 },
      { id: "box-wardrobe", name: "Wardrobe box", cubicFeet: 10 },
    ],
  },
];

export const trucks = [
  { size: "10 ft", cubicFeet: 400 },
  { size: "16 ft", cubicFeet: 800 },
  { size: "20 ft", cubicFeet: 1000 },
  { size: "26 ft", cubicFeet: 1700 },
] as const;

export const cubicFeetAssumptions = {
  usableShare: 0.85,
  poundsPerCubicFoot: 7,
} as const;

export type Quantities = Record<string, number>;

const itemIndex = new Map(rooms.flatMap((r) => r.items.map((i) => [i.id, i] as const)));

export function totalCubicFeet(quantities: Quantities) {
  let total = 0;
  for (const [id, qty] of Object.entries(quantities)) {
    const item = itemIndex.get(id);
    if (!item || !Number.isFinite(qty) || qty <= 0) continue;
    total += item.cubicFeet * Math.floor(qty);
  }
  return total;
}

export function roomCubicFeet(room: Room, quantities: Quantities) {
  return room.items.reduce((sum, i) => sum + i.cubicFeet * Math.max(0, Math.floor(quantities[i.id] ?? 0)), 0);
}

export type TruckSuggestion = { size: string; count: number; capacity: number; fillShare: number };

export function suggestTruck(cubicFeet: number, usableShare: number = cubicFeetAssumptions.usableShare): TruckSuggestion | null {
  if (!Number.isFinite(cubicFeet) || cubicFeet <= 0) return null;
  for (const t of trucks) {
    const usable = t.cubicFeet * usableShare;
    if (cubicFeet <= usable) return { size: t.size, count: 1, capacity: t.cubicFeet, fillShare: cubicFeet / t.cubicFeet };
  }
  const largest = trucks[trucks.length - 1] ?? trucks[0];
  const count = Math.ceil(cubicFeet / (largest.cubicFeet * usableShare));
  return { size: largest.size, count, capacity: largest.cubicFeet * count, fillShare: cubicFeet / (largest.cubicFeet * count) };
}

export const estimatedWeight = (cubicFeet: number) => cubicFeet * cubicFeetAssumptions.poundsPerCubicFoot;
