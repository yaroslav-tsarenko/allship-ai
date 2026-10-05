import type { CategoryGroup } from "@/content/categories";

export type QuoteField =
  | { name: string; label: string; kind: "text" | "number"; required?: boolean; placeholder?: string; suffix?: string; min?: number; max?: number }
  | { name: string; label: string; kind: "select"; required?: boolean; options: string[] };

export const quoteFields: Record<CategoryGroup, QuoteField[]> = {
  moving: [
    { name: "homeSize", label: "Size of the move", kind: "select", required: true, options: ["Studio", "1 bedroom", "2 bedrooms", "3 bedrooms", "4 bedrooms", "5+ bedrooms", "A few items", "Office or business"] },
    { name: "packing", label: "Packing help", kind: "select", required: true, options: ["No packing, I'll pack", "Fragile items only", "Partial packing", "Full packing"] },
    { name: "pickupFloor", label: "Pickup floor", kind: "select", options: ["Ground floor", "2nd floor", "3rd floor or higher, elevator", "3rd floor or higher, stairs only"] },
    { name: "deliveryFloor", label: "Delivery floor", kind: "select", options: ["Ground floor", "2nd floor", "3rd floor or higher, elevator", "3rd floor or higher, stairs only"] },
  ],
  vehicles: [
    { name: "year", label: "Year", kind: "number", required: true, placeholder: "2019", min: 1900, max: 2030 },
    { name: "make", label: "Make", kind: "text", required: true, placeholder: "Toyota" },
    { name: "model", label: "Model", kind: "text", required: true, placeholder: "RAV4" },
    { name: "condition", label: "Does it run?", kind: "select", required: true, options: ["Runs and drives", "Does not run"] },
    { name: "trailer", label: "Trailer", kind: "select", options: ["No preference", "Open", "Enclosed"] },
    { name: "length", label: "Length, for boats, RVs and trailers", kind: "number", suffix: "ft", min: 1, max: 120 },
  ],
  freight: [
    { name: "pieces", label: "Number of pieces", kind: "number", required: true, placeholder: "4", min: 1, max: 500 },
    { name: "packaging", label: "Packaging", kind: "select", required: true, options: ["Pallets", "Crates", "Boxes", "Loose", "Machinery or equipment"] },
    { name: "weight", label: "Total weight", kind: "number", required: true, suffix: "lb", min: 1, max: 200000 },
    { name: "dimensions", label: "Largest piece, L × W × H", kind: "text", placeholder: "48 × 40 × 60 in" },
  ],
  trucks: [
    { name: "truckSize", label: "Truck size", kind: "select", required: true, options: ["Cargo van", "16 ft box truck", "20 ft box truck", "26 ft box truck", "Not sure"] },
    { name: "duration", label: "How long", kind: "select", required: true, options: ["2–4 hours", "Half day", "Full day", "More than a day"] },
    { name: "helpers", label: "Extra helpers", kind: "select", options: ["Driver only", "Driver + 1 helper", "Driver + 2 helpers"] },
  ],
};

export const heavyEquipmentFields: QuoteField[] = [
  { name: "equipment", label: "Equipment", kind: "text", required: true, placeholder: "CAT 308 mini excavator" },
  { name: "weight", label: "Operating weight", kind: "number", required: true, suffix: "lb", min: 1, max: 300000 },
  { name: "dimensions", label: "L × W × H", kind: "text", placeholder: "24 × 8 × 9 ft" },
  { name: "loading", label: "Loading", kind: "select", options: ["Drives on and off", "Needs a crane or forklift", "Not sure"] },
];
