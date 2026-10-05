import { z } from "zod";
import type { LoadCategory } from "@/server/db/schema/enums";

type Base = { name: string; label: string; help?: string; required?: boolean };

export type FieldSpec =
  | (Base & { kind: "text"; placeholder?: string; maxLength?: number })
  | (Base & { kind: "number"; unit?: string; min?: number; max?: number; integer?: boolean; placeholder?: string })
  | (Base & { kind: "year" })
  | (Base & { kind: "select"; options: readonly string[] })
  | (Base & { kind: "multiselect"; options: readonly string[] })
  | (Base & { kind: "switch" });

export type SectionSpec = { title: string; description?: string; fields: FieldSpec[] };

const floors = ["Ground floor", "2nd floor", "3rd floor or higher, elevator", "3rd floor or higher, no elevator"] as const;
const trailerTypes = ["Open trailer", "Enclosed trailer", "Either"] as const;
const trailerPrefs = ["Flatbed", "Step deck", "Lowboy", "Removable gooseneck", "Dry van", "Reefer", "Auto carrier", "Power only", "Other"] as const;
const unitTypes = ["Pallets", "Crates", "Boxes", "Drums", "Bundles", "Rolls", "Loose", "Other"] as const;

const dims = (unit: "in" | "ft", required = true): FieldSpec[] => [
  { name: "length", label: "Length", kind: "number", unit, min: 1, max: unit === "in" ? 1200 : 200, required },
  { name: "width", label: "Width", kind: "number", unit, min: 1, max: unit === "in" ? 240 : 30, required },
  { name: "height", label: "Height", kind: "number", unit, min: 1, max: unit === "in" ? 240 : 30, required },
];
const weight = (required = true, max = 200_000): FieldSpec => ({ name: "weight", label: "Weight", kind: "number", unit: "lb", min: 1, max, required, integer: true });
const quantity = (label = "How many", required = true): FieldSpec => ({ name: "quantity", label, kind: "number", min: 1, max: 100, integer: true, required });
const vehicleId = (required = true): FieldSpec[] => [
  { name: "year", label: "Year", kind: "year", required },
  { name: "make", label: "Make", kind: "text", required, maxLength: 60 },
  { name: "model", label: "Model", kind: "text", required, maxLength: 60 },
];
const onTrailer: FieldSpec = { name: "onOwnTrailer", label: "It's already on its own trailer", kind: "switch" };
const movingServices = (extra: string[] = []): FieldSpec => ({
  name: "services",
  label: "Services you want",
  kind: "multiselect",
  options: ["Packing and unpacking", "Furniture disassembly and reassembly", "Storage", "Moving supplies", ...extra],
});

export const loadSpecs: Record<LoadCategory, SectionSpec[]> = {
  car_or_light_truck: [
    { title: "Vehicle", fields: [...vehicleId(), { name: "condition", label: "Condition", kind: "select", options: ["Runs and drives", "Does not run"], required: true }] },
    { title: "Transport", fields: [{ name: "trailer", label: "Trailer", kind: "select", options: trailerTypes, required: true }, { name: "modified", label: "Lifted, lowered or otherwise modified", kind: "switch" }, { name: "convertible", label: "Convertible", kind: "switch" }] },
  ],
  motorcycle: [
    { title: "Motorcycle", fields: [...vehicleId(), { name: "condition", label: "Condition", kind: "select", options: ["Runs and drives", "Does not run"], required: true }] },
    { title: "Details", fields: [{ name: "style", label: "Type", kind: "select", options: ["Standard", "Sidecar", "Trike", "Dirt bike", "Scooter"], required: true }, { name: "modified", label: "Custom parts or changes from stock", kind: "switch" }, { name: "crated", label: "Already crated", kind: "switch" }] },
  ],
  powerboat: [
    { title: "Boat", fields: [{ name: "make", label: "Make and model", kind: "text", required: true, maxLength: 80 }, ...dims("ft"), weight(true, 80_000)] },
    { title: "Transport", fields: [onTrailer, { name: "marina", label: "Picked up from a marina or yard", kind: "switch" }] },
  ],
  sailboat: [
    { title: "Boat", fields: [{ name: "make", label: "Make and model", kind: "text", required: true, maxLength: 80 }, { name: "length", label: "Length overall", kind: "number", unit: "ft", min: 6, max: 120, required: true }, { name: "beam", label: "Beam", kind: "number", unit: "ft", min: 2, max: 30, required: true }, { name: "height", label: "Height with mast down, keel to highest point", kind: "number", unit: "ft", min: 2, max: 30, required: true }, weight(true, 80_000)] },
    { title: "Rigging and trailer", fields: [{ name: "keel", label: "Keel", kind: "select", options: ["Fin keel", "Full keel", "Swing or centerboard", "Catamaran", "Not sure"], required: true }, { name: "mastStepped", label: "Mast is already stepped down", kind: "switch" }, onTrailer] },
  ],
  personal_watercraft: [
    { title: "Watercraft", fields: [quantity("Number of watercraft"), { name: "make", label: "Make and model", kind: "text", maxLength: 80 }, weight(true, 5_000)] },
    { title: "Transport", fields: [onTrailer] },
  ],
  atv_powersports: [
    { title: "Vehicles", fields: [quantity("Number of vehicles"), { name: "type", label: "Type", kind: "select", options: ["ATV", "UTV or side-by-side", "Snowmobile", "Golf cart", "Other"], required: true }, { name: "make", label: "Make and model", kind: "text", maxLength: 80 }, weight(true, 5_000)] },
    { title: "Transport", fields: [{ name: "condition", label: "Condition", kind: "select", options: ["Runs and drives", "Does not run"], required: true }, onTrailer] },
  ],
  commercial_truck: [
    { title: "Truck", fields: [quantity("Number of trucks"), ...vehicleId(), { name: "class", label: "Truck type", kind: "select", options: ["Box truck", "Tractor", "Dump truck", "Work van", "Bus", "Other"], required: true }] },
    { title: "Transport", fields: [{ name: "method", label: "How it should move", kind: "select", options: ["Hauled on a trailer", "Towed", "Driven away", "Carrier's choice"], required: true }, { name: "condition", label: "Condition", kind: "select", options: ["Runs and drives", "Does not run"], required: true }] },
  ],
  vehicle_parts: [
    { title: "Parts", fields: [{ name: "description", label: "What the parts are", kind: "text", required: true, maxLength: 120, placeholder: "Engine block, transmission" }, quantity("Number of pieces"), weight(), ...dims("in")] },
    { title: "Handling", fields: [{ name: "packaging", label: "Packaging", kind: "multiselect", options: unitTypes }, { name: "stackable", label: "Can be stacked", kind: "switch" }, { name: "hazardous", label: "Hazardous materials (fluids, batteries)", kind: "switch" }] },
  ],
  trailer: [
    { title: "Trailer", fields: [{ name: "type", label: "Trailer type", kind: "select", options: ["Utility", "Enclosed cargo", "Car hauler", "Horse or livestock", "Boat trailer", "Other"], required: true }, ...dims("ft"), weight(true, 30_000)] },
    { title: "Transport", fields: [{ name: "method", label: "How it should move", kind: "select", options: ["Towed", "Hauled on another trailer", "Carrier's choice"], required: true }, { name: "brakesLights", label: "Brakes and lights work", kind: "switch" }] },
  ],
  rv: [
    { title: "RV", fields: [{ name: "rvType", label: "RV type", kind: "select", options: ["Class A motorhome", "Class B motorhome", "Class C motorhome", "Travel trailer", "Fifth wheel", "Folding camper", "Truck camper", "Other"], required: true }, { name: "make", label: "Make and model", kind: "text", maxLength: 80 }, ...dims("ft"), weight(true, 40_000)] },
    { title: "Transport", fields: [{ name: "method", label: "How it should move", kind: "select", options: ["Driven away", "Towed", "Hauled", "Carrier's choice"], required: true }, { name: "condition", label: "Condition", kind: "select", options: ["Runs and drives", "Does not run"], required: true }] },
  ],
  local_moving: [
    { title: "Home", fields: [{ name: "residence", label: "Type of home", kind: "select", options: ["House", "Apartment", "Condo", "Townhouse", "Other"], required: true }, { name: "bedrooms", label: "Bedrooms", kind: "select", options: ["Studio", "1", "2", "3", "4", "5+"], required: true }, { name: "pickupFloor", label: "Pickup floor", kind: "select", options: floors, required: true }, { name: "deliveryFloor", label: "Delivery floor", kind: "select", options: floors, required: true }] },
    { title: "Help", fields: [movingServices(["Piano or safe"])] },
  ],
  long_distance_moving: [
    { title: "Home", fields: [{ name: "residence", label: "Type of home", kind: "select", options: ["House", "Apartment", "Condo", "Townhouse", "Other"], required: true }, { name: "bedrooms", label: "Bedrooms", kind: "select", options: ["Studio", "1", "2", "3", "4", "5", "6", "7+"], required: true }, { name: "pickupFloor", label: "Pickup floor", kind: "select", options: floors, required: true }, { name: "deliveryFloor", label: "Delivery floor", kind: "select", options: floors, required: true }] },
    { title: "Help", fields: [{ name: "packing", label: "Packing", kind: "select", options: ["I'll pack", "Fragile items only", "Partial packing", "Full packing"], required: true }, movingServices(["Piano or safe", "Vehicle on the same truck"]), { name: "storageMonths", label: "Storage", kind: "number", unit: "months", min: 0, max: 24, integer: true }] },
  ],
  household_items: [
    { title: "Items", fields: [{ name: "furniture", label: "Large furniture", kind: "multiselect", options: ["Bed", "Sofa", "Dresser", "Wardrobe", "Dining table", "TV stand", "Desk", "Other"] }, { name: "appliances", label: "Appliances", kind: "multiselect", options: ["Refrigerator", "Washer or dryer", "Dishwasher", "Oven", "Other"] }, { name: "itemCount", label: "Total items", kind: "number", min: 1, max: 200, integer: true, required: true }] },
    { title: "Handling", fields: [{ name: "special", label: "Needs special care", kind: "multiselect", options: ["Antiques", "Glass", "Electronics", "Musical instruments"] }, { name: "pickupFloor", label: "Pickup floor", kind: "select", options: floors, required: true }, { name: "deliveryFloor", label: "Delivery floor", kind: "select", options: floors, required: true }, movingServices()] },
  ],
  office_moving: [
    { title: "Office", fields: [{ name: "space", label: "Type of space", kind: "select", options: ["Small office", "Corporate office", "Co-working space", "Retail store", "Warehouse", "Other"], required: true }, { name: "squareFeet", label: "Size", kind: "select", options: ["Under 500 sq ft", "500–1,000 sq ft", "1,000–5,000 sq ft", "5,000+ sq ft"], required: true }, { name: "workstations", label: "Workstations", kind: "select", options: ["1–5", "6–10", "11–20", "21–50", "50+"], required: true }, { name: "largeFurniture", label: "Large furniture pieces", kind: "select", options: ["1–5", "6–10", "11–20", "20+"], required: true }] },
    { title: "Equipment and timing", fields: [{ name: "equipment", label: "Equipment", kind: "multiselect", options: ["Computers", "Printers or copiers", "Servers or racks", "Glass partitions", "Phones", "Other"] }, { name: "pickupFloor", label: "Pickup floor", kind: "select", options: floors, required: true }, { name: "deliveryFloor", label: "Delivery floor", kind: "select", options: floors, required: true }, { name: "afterHours", label: "After hours or on a weekend", kind: "switch" }, movingServices()] },
  ],
  business_moving: [
    { title: "Business", fields: [{ name: "location", label: "Type of location", kind: "select", options: ["Office", "Retail store", "Warehouse", "Restaurant", "Other"], required: true }, { name: "squareFeet", label: "Size", kind: "select", options: ["Under 500 sq ft", "500–1,000 sq ft", "1,000–5,000 sq ft", "5,000+ sq ft"], required: true }, { name: "workstations", label: "Workstations", kind: "select", options: ["1–5", "6–10", "11–20", "21–50", "50+"], required: true }, { name: "largeEquipment", label: "Large equipment pieces", kind: "select", options: ["0–2", "3–5", "6–10", "11+"], required: true }] },
    { title: "Special handling", fields: [{ name: "special", label: "Includes", kind: "multiselect", options: ["IT equipment", "Server racks", "Filing cabinets", "Fragile items", "Heavy machinery", "Inventory"] }, { name: "pickupFloor", label: "Pickup floor", kind: "select", options: floors, required: true }, { name: "deliveryFloor", label: "Delivery floor", kind: "select", options: floors, required: true }, { name: "afterHours", label: "After hours or on a weekend", kind: "switch" }] },
  ],
  corporate_relocation: [
    { title: "Company", fields: [{ name: "space", label: "Type of space", kind: "select", options: ["Office building", "Tech hub", "Call center", "Retail chain", "Manufacturing facility", "Other"], required: true }, { name: "squareFeet", label: "Size", kind: "select", options: ["Under 1,000 sq ft", "1,000–5,000 sq ft", "5,000–10,000 sq ft", "10,000+ sq ft"], required: true }, { name: "workstations", label: "Workstations", kind: "select", options: ["1–10", "11–50", "51–100", "100+"], required: true }, { name: "meetingRooms", label: "Meeting rooms", kind: "select", options: ["1–2", "3–5", "6–10", "10+"], required: true }, { name: "cubicles", label: "Partitions or cubicles", kind: "select", options: ["None", "1–5", "6–10", "11–20", "20+"], required: true }] },
    { title: "Requirements", fields: [{ name: "equipment", label: "Specialized equipment", kind: "multiselect", options: ["IT racks", "Large servers", "Heavy machinery", "High-security equipment"] }, { name: "security", label: "Crew security clearance needed", kind: "select", options: ["Yes", "No", "Not sure"], required: true }, { name: "afterHours", label: "After hours or on a weekend", kind: "switch" }, movingServices(["IT and network setup", "Specialized packing for high-value items"])] },
  ],
  student_moving: [
    { title: "Room", fields: [{ name: "residence", label: "Type of home", kind: "select", options: ["Dormitory", "Shared apartment", "Studio", "Other"], required: true }, { name: "boxes", label: "Boxes", kind: "select", options: ["1–5", "6–10", "11–20", "20+"], required: true }, { name: "items", label: "Larger items", kind: "multiselect", options: ["Bed", "Desk", "Chair", "Dresser", "Bookshelf", "Mini fridge", "TV", "Bike"] }] },
    { title: "Help", fields: [{ name: "pickupFloor", label: "Pickup floor", kind: "select", options: floors, required: true }, { name: "deliveryFloor", label: "Delivery floor", kind: "select", options: floors, required: true }, movingServices(["Help with heavy lifting"])] },
  ],
  military_moving: [
    { title: "Move", fields: [{ name: "moveType", label: "Type of move", kind: "select", options: ["PCS", "TDY", "Deployment", "Retirement", "Other"], required: true }, { name: "household", label: "Household", kind: "select", options: ["Single", "Couple", "Family with 1–2 children", "Family with 3+ children"], required: true }, { name: "bedrooms", label: "Bedrooms", kind: "select", options: ["Studio", "1", "2", "3", "4+"], required: true }, { name: "boxes", label: "Boxes", kind: "select", options: ["1–10", "11–30", "31–60", "60+"], required: true }] },
    { title: "Items and paperwork", fields: [{ name: "special", label: "Includes", kind: "multiselect", options: ["Uniforms and gear", "Firearms, documented", "Safe", "Storage containers", "Pro-gear to weigh separately"] }, { name: "weightTickets", label: "Certified weight tickets needed", kind: "switch", help: "Common for personally procured moves" }, movingServices(["Help with move paperwork"])] },
  ],
  heavy_lifting: [
    { title: "Items", fields: [{ name: "items", label: "What needs lifting", kind: "multiselect", options: ["Furniture", "Appliances", "Safe", "Piano", "Gym equipment", "Industrial machinery", "Other"], required: true }, { name: "itemWeight", label: "Heaviest item", kind: "select", options: ["Under 100 lb", "100–250 lb", "250–500 lb", "500+ lb"], required: true }, { name: "count", label: "Number of heavy items", kind: "select", options: ["1–2", "3–5", "6–10", "10+"], required: true }] },
    { title: "Where", fields: [{ name: "distance", label: "Moving them", kind: "select", options: ["Within one room or floor", "Between floors", "Loading or unloading a truck", "Between buildings"], required: true }, { name: "pickupFloor", label: "Floor", kind: "select", options: floors, required: true }, { name: "extras", label: "Also need", kind: "multiselect", options: ["Disassembly and reassembly", "Dollies, straps or hoist", "Extra crew", "Same-day help"] }] },
  ],
  freight: [
    { title: "Freight", fields: [{ name: "description", label: "Commodity", kind: "text", required: true, maxLength: 120, placeholder: "Packaged auto parts" }, quantity("Handling units", true), weight(), ...dims("in")] },
    { title: "Handling", fields: [{ name: "units", label: "Packaging", kind: "multiselect", options: unitTypes, required: true }, { name: "freightClass", label: "Freight class, if known", kind: "select", options: ["Not sure", "50", "55", "60", "65", "70", "77.5", "85", "92.5", "100", "110", "125", "150", "175", "200", "250", "300", "400", "500"] }, { name: "trailerPrefs", label: "Trailer preference", kind: "multiselect", options: trailerPrefs }, { name: "stackable", label: "Can be stacked", kind: "switch" }, { name: "hazardous", label: "Hazardous materials", kind: "switch" }, { name: "liftgate", label: "Liftgate needed at pickup or delivery", kind: "switch" }] },
  ],
  heavy_equipment: [
    { title: "Equipment", fields: [{ name: "equipmentType", label: "Type", kind: "select", options: ["Excavator", "Bulldozer", "Backhoe", "Loader", "Skid steer", "Forklift", "Crane", "Tractor", "Generator", "Other"], required: true }, ...vehicleId(false), quantity("Number of units"), weight(true, 300_000), ...dims("ft")] },
    { title: "Loading", fields: [{ name: "loading", label: "Loading", kind: "select", options: ["Drives on and off", "Needs a crane or forklift", "Not sure"], required: true }, { name: "trailerPrefs", label: "Trailer preference", kind: "multiselect", options: ["Flatbed", "Step deck", "Lowboy", "Removable gooseneck", "Carrier's choice"] }, { name: "attachments", label: "Ships with attachments or buckets", kind: "switch" }] },
  ],
  truck_rental: [
    { title: "Truck", fields: [{ name: "truckType", label: "Truck", kind: "select", options: ["Cargo van", "Sprinter van", "Pickup truck", "Flatbed truck", "Box truck, 10–12 ft", "Box truck, 14–16 ft", "Box truck, 20–22 ft", "Box truck, 24–26 ft"], required: true }, { name: "days", label: "Days needed", kind: "number", min: 1, max: 30, integer: true, required: true }, { name: "cargo", label: "What you're moving", kind: "text", required: true, maxLength: 120 }] },
    { title: "Equipment", fields: [{ name: "equipment", label: "Equipment", kind: "multiselect", options: ["Liftgate", "Pallet jack", "Moving ramp", "Moving blankets", "Dolly"] }, { name: "helpers", label: "Helpers besides the driver", kind: "select", options: ["None", "1", "2", "3+"], required: true }, { name: "callBeforeArrival", label: "Driver calls before arriving", kind: "switch" }] },
  ],
  truck_with_driver: [
    { title: "Job", fields: [{ name: "truckType", label: "Truck", kind: "select", options: ["Cargo van", "Pickup truck", "Box truck, 10–16 ft", "Box truck, 20–26 ft", "Flatbed truck"], required: true }, { name: "hours", label: "Estimated hours", kind: "number", min: 1, max: 24, integer: true, required: true }, { name: "cargo", label: "What you're moving", kind: "text", required: true, maxLength: 120 }, { name: "stops", label: "Stops including pickup and delivery", kind: "number", min: 2, max: 20, integer: true }] },
    { title: "Help", fields: [{ name: "helpers", label: "Helpers besides the driver", kind: "select", options: ["None", "1", "2", "3+"], required: true }, { name: "equipment", label: "Equipment", kind: "multiselect", options: ["Liftgate", "Pallet jack", "Moving blankets", "Dolly"] }] },
  ],
};

export function fieldsOf(category: LoadCategory) {
  return loadSpecs[category].flatMap((s) => s.fields);
}

function fieldSchema(f: FieldSpec) {
  switch (f.kind) {
    case "text": {
      const s = z.string().trim().max(f.maxLength ?? 200);
      return f.required ? s.min(1, `Enter ${f.label.toLowerCase()}`) : s.optional();
    }
    case "number": {
      let s = z.coerce.number({ error: `Enter ${f.label.toLowerCase()}` });
      if (f.integer) s = s.int("Use a whole number");
      if (f.min !== undefined) s = s.min(f.min, `Must be at least ${f.min}`);
      if (f.max !== undefined) s = s.max(f.max, `Must be ${f.max} or less`);
      return f.required ? s : s.optional();
    }
    case "year": {
      const s = z.coerce.number().int().min(1900, "Enter a 4-digit year").max(new Date().getFullYear() + 1, "Enter a valid year");
      return f.required ? s : s.optional();
    }
    case "select": {
      const s = z.enum(f.options as [string, ...string[]], { error: `Choose ${f.label.toLowerCase()}` });
      return f.required ? s : s.optional();
    }
    case "multiselect": {
      const s = z.array(z.enum(f.options as [string, ...string[]])).max(f.options.length);
      return f.required ? s.min(1, `Choose at least one`) : s.default([]);
    }
    case "switch":
      return z.boolean().default(false);
  }
}

export function detailsSchema(category: LoadCategory) {
  const shape: Record<string, z.ZodType> = {};
  for (const f of fieldsOf(category)) shape[f.name] = fieldSchema(f);
  return z.object(shape).strip();
}

export function emptyDetails(category: LoadCategory) {
  const out: Record<string, unknown> = {};
  for (const f of fieldsOf(category)) out[f.name] = f.kind === "multiselect" ? [] : f.kind === "switch" ? false : "";
  return out;
}

export function describeDetail(f: FieldSpec, value: unknown): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (f.kind === "switch") return value ? "Yes" : null;
  if (Array.isArray(value)) return value.length ? value.join(", ") : null;
  if (f.kind === "number") return `${Number(value).toLocaleString("en-US")}${f.unit ? ` ${f.unit}` : ""}`;
  return String(value);
}

export const LOAD_DETAILS_VERSION = 1;
