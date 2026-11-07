import { z } from "zod";
import { policyText } from "@/lib/validation/text-policy";
import { bodyTypes, modelYears, type MakeCatalog } from "@/features/vehicles/catalog";
import { normalizeVin, vinIssue } from "@/features/vehicles/vin";
import type { LoadCategory } from "@/server/db/schema/enums";

type Base = { name: string; label: string; help?: string; required?: boolean };

export type FieldSpec =
  | (Base & { kind: "text"; placeholder?: string; maxLength?: number; minLength?: number })
  | (Base & { kind: "number"; unit?: string; min: number; max: number; integer?: boolean; placeholder?: string })
  | (Base & { kind: "year"; min?: number })
  | (Base & { kind: "select"; options: readonly string[]; other?: boolean })
  | (Base & { kind: "multiselect"; options: readonly string[]; other?: boolean })
  | (Base & { kind: "switch" })
  | (Base & { kind: "make"; catalog: MakeCatalog })
  | (Base & { kind: "model"; catalog: MakeCatalog })
  | (Base & { kind: "vin" });

export type SectionSpec = { title: string; description?: string; fields: FieldSpec[] };

export const OTHER = "Other";
export const otherKey = (name: string) => `${name}Other`;
export const hasOther = (f: FieldSpec): f is Extract<FieldSpec, { kind: "select" | "multiselect" }> => (f.kind === "select" || f.kind === "multiselect") && Boolean(f.other) && f.options.includes(OTHER);

const floors = ["Ground floor", "2nd floor", "3rd floor or higher, elevator", "3rd floor or higher, no elevator"] as const;
const trailerTypes = ["Open trailer", "Enclosed trailer", "Either"] as const;
const trailerPrefs = ["Flatbed", "Step deck", "Lowboy", "Removable gooseneck", "Dry van", "Reefer", "Auto carrier", "Power only", "Other"] as const;
const unitTypes = ["Pallets", "Crates", "Boxes", "Drums", "Bundles", "Rolls", "Loose", "Other"] as const;
const runCondition = ["Runs and drives", "Does not run", "Does not run or roll"] as const;
const homeTypes = ["House", "Apartment", "Condo", "Townhouse", "Other"] as const;

const ft = (name: string, label: string, min: number, max: number, required = true, help?: string): FieldSpec => ({ name, label, kind: "number", unit: "ft", min, max, required, help });
const inch = (name: string, label: string, min: number, max: number, required = true, help?: string): FieldSpec => ({ name, label, kind: "number", unit: "in", min, max, integer: true, required, help });
const lb = (name: string, label: string, min: number, max: number, required = true, help?: string): FieldSpec => ({ name, label, kind: "number", unit: "lb", min, max, integer: true, required, help });
const count = (name: string, label: string, min: number, max: number, required = true, help?: string): FieldSpec => ({ name, label, kind: "number", min, max, integer: true, required, help });

const vehicle = (catalog: MakeCatalog, required = true, vin = true): FieldSpec[] => [
  ...(vin ? [{ name: "vin", label: "VIN", kind: "vin", help: "Optional. 17 characters, fills in year, make and model." } as FieldSpec] : []),
  { name: "year", label: "Year", kind: "year", required },
  { name: "make", label: "Make", kind: "make", catalog, required },
  { name: "model", label: "Model", kind: "model", catalog, required },
];
const makeModel = (catalog: MakeCatalog, required = true): FieldSpec[] => [
  { name: "make", label: "Make", kind: "make", catalog, required },
  { name: "model", label: "Model", kind: "model", catalog },
];
const onTrailer: FieldSpec = { name: "onOwnTrailer", label: "It's already on its own trailer", kind: "switch" };
const movingServices = (extra: string[] = []): FieldSpec => ({
  name: "services",
  label: "Services you want",
  kind: "multiselect",
  options: ["Packing and unpacking", "Furniture disassembly and reassembly", "Storage", "Moving supplies", ...extra],
});
const floorFields = (pickupLabel = "Pickup floor"): FieldSpec[] => [
  { name: "pickupFloor", label: pickupLabel, kind: "select", options: floors, required: true },
  { name: "deliveryFloor", label: "Delivery floor", kind: "select", options: floors, required: true },
];
const residence = (options: readonly string[] = homeTypes): FieldSpec => ({ name: "residence", label: "Type of home", kind: "select", options, required: true, other: true });

export const loadSpecs: Record<LoadCategory, SectionSpec[]> = {
  car_or_light_truck: [
    {
      title: "Vehicle",
      fields: [
        ...vehicle("car"),
        { name: "bodyType", label: "Body type", kind: "select", options: bodyTypes, required: true },
        { name: "condition", label: "Condition", kind: "select", options: runCondition, required: true },
      ],
    },
    { title: "Transport", fields: [{ name: "trailer", label: "Trailer", kind: "select", options: trailerTypes, required: true }, { name: "modified", label: "Lifted, lowered or otherwise modified", kind: "switch" }] },
  ],
  motorcycle: [
    { title: "Motorcycle", fields: [...vehicle("motorcycle"), { name: "condition", label: "Condition", kind: "select", options: runCondition, required: true }] },
    { title: "Details", fields: [{ name: "style", label: "Type", kind: "select", options: ["Standard", "Sidecar", "Trike", "Dirt bike", "Scooter"], required: true }, { name: "modified", label: "Custom parts or changes from stock", kind: "switch" }, { name: "crated", label: "Already crated", kind: "switch" }] },
  ],
  powerboat: [
    { title: "Boat", fields: [...makeModel("powerboat"), { name: "year", label: "Year", kind: "year" }, ft("length", "Length overall", 8, 60), ft("width", "Beam (width)", 3, 16, true, "Over 8.5 ft needs wide-load permits."), ft("height", "Height on the trailer", 3, 16), lb("weight", "Weight with trailer", 200, 40_000)] },
    { title: "Transport", fields: [onTrailer, { name: "marina", label: "Picked up from a marina or yard", kind: "switch" }] },
  ],
  sailboat: [
    {
      title: "Boat",
      fields: [
        ...makeModel("sailboat"),
        { name: "year", label: "Year", kind: "year" },
        ft("length", "Length overall", 8, 60),
        ft("beam", "Beam", 3, 20),
        ft("height", "Height with mast down, keel to highest point", 3, 18),
        lb("weight", "Displacement", 100, 60_000),
      ],
    },
    { title: "Rigging and trailer", fields: [{ name: "keel", label: "Keel", kind: "select", options: ["Fin keel", "Full keel", "Swing or centerboard", "Catamaran", "Not sure"], required: true }, { name: "mastStepped", label: "Mast is already stepped down", kind: "switch" }, onTrailer] },
  ],
  personal_watercraft: [
    { title: "Watercraft", fields: [count("quantity", "Number of watercraft", 1, 6), ...makeModel("watercraft", false), lb("weight", "Total weight", 300, 6_000, true, "About 800 lb each, or 1,500 lb with a trailer.")] },
    { title: "Transport", fields: [onTrailer] },
  ],
  atv_powersports: [
    {
      title: "Vehicles",
      fields: [
        count("quantity", "Number of vehicles", 1, 10),
        { name: "type", label: "Type", kind: "select", options: ["ATV", "UTV or side-by-side", "Snowmobile", "Golf cart", "Dirt bike", "Other"], required: true, other: true },
        ...makeModel("powersports", false),
        lb("weight", "Total weight", 100, 15_000),
      ],
    },
    { title: "Transport", fields: [{ name: "condition", label: "Condition", kind: "select", options: runCondition, required: true }, onTrailer] },
  ],
  commercial_truck: [
    {
      title: "Truck",
      fields: [
        count("quantity", "Number of trucks", 1, 10),
        ...vehicle("truck"),
        { name: "class", label: "Truck type", kind: "select", options: ["Box truck", "Tractor", "Dump truck", "Work van", "Bus", "Other"], required: true, other: true },
        { name: "weightClass", label: "Weight class", kind: "select", options: ["Class 3–5, up to 19,500 lb", "Class 6–7, up to 33,000 lb", "Class 8, over 33,000 lb", "Not sure"], required: true },
      ],
    },
    { title: "Transport", fields: [{ name: "method", label: "How it should move", kind: "select", options: ["Hauled on a trailer", "Towed", "Driven away", "Carrier's choice"], required: true }, { name: "condition", label: "Condition", kind: "select", options: runCondition, required: true }] },
  ],
  vehicle_parts: [
    {
      title: "Parts",
      fields: [
        { name: "description", label: "What the parts are", kind: "text", required: true, minLength: 3, maxLength: 120, placeholder: "Engine block, transmission" },
        count("quantity", "Number of pieces", 1, 500),
        lb("weight", "Total weight", 1, 45_000),
      ],
    },
    { title: "Largest piece", description: "Carriers use this to plan space on the truck.", fields: [inch("length", "Length", 1, 636), inch("width", "Width", 1, 102), inch("height", "Height", 1, 110)] },
    { title: "Handling", fields: [{ name: "packaging", label: "Packaging", kind: "multiselect", options: unitTypes, other: true }, { name: "stackable", label: "Can be stacked", kind: "switch" }, { name: "hazardous", label: "Hazardous materials (fluids, batteries)", kind: "switch" }] },
  ],
  trailer: [
    {
      title: "Trailer",
      fields: [
        { name: "type", label: "Trailer type", kind: "select", options: ["Utility", "Enclosed cargo", "Car hauler", "Horse or livestock", "Boat trailer", "Camper", "Other"], required: true, other: true },
        { name: "hitch", label: "Hitch", kind: "select", options: ["Bumper pull", "Gooseneck", "Fifth wheel", "Not sure"], required: true },
        ...makeModel("trailer", false),
        ft("length", "Length including tongue", 4, 53),
        ft("width", "Width", 3, 10),
        ft("height", "Height", 2, 14),
        lb("weight", "Empty weight", 100, 30_000),
      ],
    },
    { title: "Transport", fields: [{ name: "method", label: "How it should move", kind: "select", options: ["Towed", "Hauled on another trailer", "Carrier's choice"], required: true }, { name: "brakesLights", label: "Brakes and lights work", kind: "switch" }] },
  ],
  rv: [
    {
      title: "RV",
      fields: [
        { name: "rvType", label: "RV type", kind: "select", options: ["Class A motorhome", "Class B motorhome", "Class C motorhome", "Travel trailer", "Fifth wheel", "Folding camper", "Truck camper", "Other"], required: true, other: true },
        { name: "year", label: "Year", kind: "year" },
        ...makeModel("rv", false),
        ft("length", "Length", 8, 45),
        ft("width", "Width", 5, 9),
        ft("height", "Height", 5, 14),
        lb("weight", "Weight", 500, 40_000),
      ],
    },
    { title: "Transport", fields: [{ name: "method", label: "How it should move", kind: "select", options: ["Driven away", "Towed", "Hauled", "Carrier's choice"], required: true }, { name: "condition", label: "Condition", kind: "select", options: runCondition, required: true }] },
  ],
  local_moving: [
    {
      title: "Home",
      fields: [
        residence(),
        { name: "bedrooms", label: "Bedrooms", kind: "select", options: ["Studio", "1", "2", "3", "4", "5+"], required: true },
        { name: "boxes", label: "About how many boxes", kind: "select", options: ["Under 10", "10–25", "26–50", "51–100", "Over 100"] },
        ...floorFields(),
      ],
    },
    { title: "Help", fields: [movingServices(["Piano or safe"])] },
  ],
  long_distance_moving: [
    {
      title: "Home",
      fields: [residence(), { name: "bedrooms", label: "Bedrooms", kind: "select", options: ["Studio", "1", "2", "3", "4", "5", "6", "7+"], required: true }, ...floorFields()],
    },
    {
      title: "Help",
      fields: [
        { name: "packing", label: "Packing", kind: "select", options: ["I'll pack", "Fragile items only", "Partial packing", "Full packing"], required: true },
        movingServices(["Piano or safe", "Vehicle on the same truck"]),
        { name: "storageMonths", label: "Storage", kind: "number", unit: "months", min: 0, max: 24, integer: true, help: "0 if you don't need storage." },
      ],
    },
  ],
  household_items: [
    {
      title: "Items",
      fields: [
        { name: "furniture", label: "Large furniture", kind: "multiselect", options: ["Bed", "Sofa", "Dresser", "Wardrobe", "Dining table", "TV stand", "Desk", "Other"], other: true },
        { name: "appliances", label: "Appliances", kind: "multiselect", options: ["Refrigerator", "Washer or dryer", "Dishwasher", "Oven", "Other"], other: true },
        count("itemCount", "Total items", 1, 200, true, "Count each piece of furniture, appliance and box."),
        lb("weight", "Heaviest item", 1, 1_500, false, "Optional. A guess is fine."),
      ],
    },
    { title: "Handling", fields: [{ name: "special", label: "Needs special care", kind: "multiselect", options: ["Antiques", "Glass", "Electronics", "Musical instruments"] }, ...floorFields(), movingServices()] },
  ],
  office_moving: [
    {
      title: "Office",
      fields: [
        { name: "space", label: "Type of space", kind: "select", options: ["Small office", "Corporate office", "Co-working space", "Retail store", "Warehouse", "Other"], required: true, other: true },
        { name: "squareFeet", label: "Size", kind: "select", options: ["Under 500 sq ft", "500–1,000 sq ft", "1,000–5,000 sq ft", "5,000+ sq ft"], required: true },
        { name: "workstations", label: "Workstations", kind: "select", options: ["1–5", "6–10", "11–20", "21–50", "50+"], required: true },
        { name: "largeFurniture", label: "Large furniture pieces", kind: "select", options: ["1–5", "6–10", "11–20", "20+"], required: true },
      ],
    },
    {
      title: "Equipment and timing",
      fields: [
        { name: "equipment", label: "Equipment", kind: "multiselect", options: ["Computers", "Printers or copiers", "Servers or racks", "Glass partitions", "Phones", "Other"], other: true },
        ...floorFields(),
        { name: "afterHours", label: "After hours or on a weekend", kind: "switch" },
        movingServices(),
      ],
    },
  ],
  business_moving: [
    {
      title: "Business",
      fields: [
        { name: "location", label: "Type of location", kind: "select", options: ["Office", "Retail store", "Warehouse", "Restaurant", "Other"], required: true, other: true },
        { name: "squareFeet", label: "Size", kind: "select", options: ["Under 500 sq ft", "500–1,000 sq ft", "1,000–5,000 sq ft", "5,000+ sq ft"], required: true },
        { name: "workstations", label: "Workstations", kind: "select", options: ["1–5", "6–10", "11–20", "21–50", "50+"], required: true },
        { name: "largeEquipment", label: "Large equipment pieces", kind: "select", options: ["0–2", "3–5", "6–10", "11+"], required: true },
      ],
    },
    {
      title: "Special handling",
      fields: [{ name: "special", label: "Includes", kind: "multiselect", options: ["IT equipment", "Server racks", "Filing cabinets", "Fragile items", "Heavy machinery", "Inventory"] }, ...floorFields(), { name: "afterHours", label: "After hours or on a weekend", kind: "switch" }],
    },
  ],
  corporate_relocation: [
    {
      title: "Company",
      fields: [
        { name: "space", label: "Type of space", kind: "select", options: ["Office building", "Tech hub", "Call center", "Retail chain", "Manufacturing facility", "Other"], required: true, other: true },
        { name: "squareFeet", label: "Size", kind: "select", options: ["Under 1,000 sq ft", "1,000–5,000 sq ft", "5,000–10,000 sq ft", "10,000+ sq ft"], required: true },
        { name: "workstations", label: "Workstations", kind: "select", options: ["1–10", "11–50", "51–100", "100+"], required: true },
        { name: "meetingRooms", label: "Meeting rooms", kind: "select", options: ["1–2", "3–5", "6–10", "10+"], required: true },
        { name: "cubicles", label: "Partitions or cubicles", kind: "select", options: ["None", "1–5", "6–10", "11–20", "20+"], required: true },
      ],
    },
    {
      title: "Requirements",
      fields: [
        { name: "equipment", label: "Specialized equipment", kind: "multiselect", options: ["IT racks", "Large servers", "Heavy machinery", "High-security equipment"] },
        { name: "security", label: "Crew security clearance needed", kind: "select", options: ["Yes", "No", "Not sure"], required: true },
        { name: "afterHours", label: "After hours or on a weekend", kind: "switch" },
        movingServices(["IT and network setup", "Specialized packing for high-value items"]),
      ],
    },
  ],
  student_moving: [
    {
      title: "Room",
      fields: [
        residence(["Dormitory", "Shared apartment", "Studio", "Other"]),
        { name: "boxes", label: "Boxes", kind: "select", options: ["1–5", "6–10", "11–20", "20+"], required: true },
        { name: "items", label: "Larger items", kind: "multiselect", options: ["Bed", "Desk", "Chair", "Dresser", "Bookshelf", "Mini fridge", "TV", "Bike"] },
      ],
    },
    { title: "Help", fields: [...floorFields(), movingServices(["Help with heavy lifting"])] },
  ],
  military_moving: [
    {
      title: "Move",
      fields: [
        { name: "moveType", label: "Type of move", kind: "select", options: ["PCS", "TDY", "Deployment", "Retirement", "Other"], required: true, other: true },
        { name: "household", label: "Household", kind: "select", options: ["Single", "Couple", "Family with 1–2 children", "Family with 3+ children"], required: true },
        { name: "bedrooms", label: "Bedrooms", kind: "select", options: ["Studio", "1", "2", "3", "4+"], required: true },
        { name: "boxes", label: "Boxes", kind: "select", options: ["1–10", "11–30", "31–60", "60+"], required: true },
      ],
    },
    {
      title: "Items and paperwork",
      fields: [
        { name: "special", label: "Includes", kind: "multiselect", options: ["Uniforms and gear", "Firearms, documented", "Safe", "Storage containers", "Pro-gear to weigh separately"] },
        { name: "weightTickets", label: "Certified weight tickets needed", kind: "switch", help: "Common for personally procured moves" },
        movingServices(["Help with move paperwork"]),
      ],
    },
  ],
  heavy_lifting: [
    {
      title: "Items",
      fields: [
        { name: "items", label: "What needs lifting", kind: "multiselect", options: ["Furniture", "Appliances", "Safe", "Piano", "Gym equipment", "Industrial machinery", "Other"], required: true, other: true },
        { name: "itemWeight", label: "Heaviest item", kind: "select", options: ["Under 100 lb", "100–250 lb", "250–500 lb", "500+ lb"], required: true },
        { name: "count", label: "Number of heavy items", kind: "select", options: ["1–2", "3–5", "6–10", "10+"], required: true },
      ],
    },
    {
      title: "Where",
      fields: [
        { name: "distance", label: "Moving them", kind: "select", options: ["Within one room or floor", "Between floors", "Loading or unloading a truck", "Between buildings"], required: true },
        { name: "pickupFloor", label: "Floor", kind: "select", options: floors, required: true },
        { name: "extras", label: "Also need", kind: "multiselect", options: ["Disassembly and reassembly", "Dollies, straps or hoist", "Extra crew", "Same-day help"] },
      ],
    },
  ],
  freight: [
    {
      title: "Freight",
      fields: [
        { name: "description", label: "Commodity", kind: "text", required: true, minLength: 3, maxLength: 120, placeholder: "Packaged auto parts" },
        count("quantity", "Handling units", 1, 300, true, "Pallets, crates or pieces. A full trailer holds 26 to 30 pallets."),
        lb("weight", "Total weight", 1, 45_000, true, "Over 45,000 lb usually needs a heavy haul permit."),
      ],
    },
    { title: "Each unit", description: "Size of one pallet or piece. Use the largest if they differ.", fields: [inch("length", "Length", 1, 636), inch("width", "Width", 1, 102), inch("height", "Height", 1, 110)] },
    {
      title: "Handling",
      fields: [
        { name: "units", label: "Packaging", kind: "multiselect", options: unitTypes, required: true, other: true },
        { name: "freightClass", label: "Freight class, if known", kind: "select", options: ["Not sure", "50", "55", "60", "65", "70", "77.5", "85", "92.5", "100", "110", "125", "150", "175", "200", "250", "300", "400", "500"] },
        { name: "trailerPrefs", label: "Trailer preference", kind: "multiselect", options: trailerPrefs, other: true },
        { name: "stackable", label: "Can be stacked", kind: "switch" },
        { name: "hazardous", label: "Hazardous materials", kind: "switch" },
        { name: "liftgate", label: "Liftgate needed at pickup or delivery", kind: "switch" },
      ],
    },
  ],
  heavy_equipment: [
    {
      title: "Equipment",
      fields: [
        { name: "equipmentType", label: "Type", kind: "select", options: ["Excavator", "Bulldozer", "Backhoe", "Loader", "Skid steer", "Forklift", "Crane", "Tractor", "Generator", "Other"], required: true, other: true },
        { name: "year", label: "Year", kind: "year" },
        ...makeModel("equipment", false),
        count("quantity", "Number of units", 1, 10),
        lb("weight", "Weight of the heaviest unit", 200, 200_000),
      ],
    },
    {
      title: "Dimensions",
      description: "Measure in transport position with the boom and attachments as they'll ship.",
      fields: [ft("length", "Length", 2, 120), ft("width", "Width", 2, 24), ft("height", "Height", 2, 20)],
    },
    {
      title: "Loading",
      fields: [
        { name: "loading", label: "Loading", kind: "select", options: ["Drives on and off", "Needs a crane or forklift", "Not sure"], required: true },
        { name: "trailerPrefs", label: "Trailer preference", kind: "multiselect", options: ["Flatbed", "Step deck", "Lowboy", "Removable gooseneck", "Carrier's choice"] },
        { name: "attachments", label: "Ships with attachments or buckets", kind: "switch" },
      ],
    },
  ],
  truck_rental: [
    {
      title: "Truck",
      fields: [
        { name: "truckType", label: "Truck", kind: "select", options: ["Cargo van", "Sprinter van", "Pickup truck", "Flatbed truck", "Box truck, 10–12 ft", "Box truck, 14–16 ft", "Box truck, 20–22 ft", "Box truck, 24–26 ft"], required: true },
        count("days", "Days needed", 1, 30),
        { name: "cargo", label: "What you're moving", kind: "text", required: true, minLength: 3, maxLength: 120, placeholder: "Furniture from a 2-bedroom apartment" },
      ],
    },
    {
      title: "Equipment",
      fields: [
        { name: "equipment", label: "Equipment", kind: "multiselect", options: ["Liftgate", "Pallet jack", "Moving ramp", "Moving blankets", "Dolly"] },
        { name: "helpers", label: "Helpers besides the driver", kind: "select", options: ["None", "1", "2", "3+"], required: true },
        { name: "callBeforeArrival", label: "Driver calls before arriving", kind: "switch" },
      ],
    },
  ],
  truck_with_driver: [
    {
      title: "Job",
      fields: [
        { name: "truckType", label: "Truck", kind: "select", options: ["Cargo van", "Pickup truck", "Box truck, 10–16 ft", "Box truck, 20–26 ft", "Flatbed truck"], required: true },
        { name: "hours", label: "Estimated hours", kind: "number", unit: "hours", min: 1, max: 14, required: true, help: "Drivers can work up to 14 hours a day." },
        { name: "cargo", label: "What you're moving", kind: "text", required: true, minLength: 3, maxLength: 120, placeholder: "Retail shelving and 40 boxes" },
        count("stops", "Stops including pickup and delivery", 2, 20, false),
      ],
    },
    { title: "Help", fields: [{ name: "helpers", label: "Helpers besides the driver", kind: "select", options: ["None", "1", "2", "3+"], required: true }, { name: "equipment", label: "Equipment", kind: "multiselect", options: ["Liftgate", "Pallet jack", "Moving blankets", "Dolly"] }] },
  ],
};

export const legacyFields: Partial<Record<LoadCategory, FieldSpec[]>> = {
  car_or_light_truck: [{ name: "convertible", label: "Convertible", kind: "switch" }],
};

export function fieldsOf(category: LoadCategory) {
  return loadSpecs[category].flatMap((s) => s.fields);
}

export function numberHelp(f: Extract<FieldSpec, { kind: "number" }>) {
  const fmt = (n: number) => n.toLocaleString("en-US");
  const range = `${fmt(f.min)}–${fmt(f.max)}${f.unit ? ` ${f.unit}` : ""}`;
  return f.help ? `${f.help} ${range}.` : `${range}.`;
}

function yearSchema(f: Extract<FieldSpec, { kind: "year" }>) {
  const years = modelYears(new Date(), f.min ?? 1900);
  const max = years[0]!;
  const min = years[years.length - 1]!;
  const s = z.coerce.number({ error: "Choose the year" }).int("Choose the year").min(min, `Choose ${min} or later`).max(max, `Choose ${max} or earlier`);
  return f.required ? s : s.optional();
}

function fieldSchema(f: FieldSpec): z.ZodType {
  const lower = f.label.toLowerCase();
  switch (f.kind) {
    case "text": {
      const s = policyText({ label: lower, min: f.minLength, max: f.maxLength ?? 200, required: f.required });
      return f.required ? s : s.optional();
    }
    case "make":
    case "model": {
      const s = policyText({ label: lower, max: 60, required: f.required });
      return f.required ? s : s.optional();
    }
    case "vin":
      return z
        .string()
        .overwrite(normalizeVin)
        .superRefine((v, ctx) => {
          const issue = v ? vinIssue(v) : null;
          if (issue) ctx.addIssue({ code: "custom", message: issue });
        })
        .optional();
    case "number": {
      const unit = f.unit ? ` ${f.unit}` : "";
      const fmt = (n: number) => n.toLocaleString("en-US");
      let s = z.coerce.number({ error: `Enter ${lower}` }).refine(Number.isFinite, `Enter ${lower}`);
      s = s.refine((v) => v >= f.min, `Enter at least ${fmt(f.min)}${unit}`).refine((v) => v <= f.max, `Enter ${fmt(f.max)}${unit} or less`);
      if (f.integer) s = s.refine(Number.isInteger, "Use a whole number");
      return f.required ? s : s.optional();
    }
    case "year":
      return yearSchema(f);
    case "select": {
      const s = z.enum(f.options as [string, ...string[]], { error: `Choose ${lower}` });
      return f.required ? s : s.optional();
    }
    case "multiselect": {
      const s = z.array(z.enum(f.options as [string, ...string[]])).max(f.options.length);
      return f.required ? s.min(1, "Choose at least one") : s.default([]);
    }
    case "switch":
      return z.boolean().default(false);
  }
}

type Issue = { field: string; message: string };

const num = (d: Record<string, unknown>, k: string) => (typeof d[k] === "number" ? (d[k] as number) : undefined);
const list = (d: Record<string, unknown>, k: string) => (Array.isArray(d[k]) ? (d[k] as string[]) : []);

const rules: Partial<Record<LoadCategory, (d: Record<string, unknown>) => Issue[]>> = {
  freight: (d) => {
    const weight = num(d, "weight");
    const units = num(d, "quantity");
    const out: Issue[] = [];
    if (weight && units && list(d, "units").includes("Pallets") && weight / units > 4_600) out.push({ field: "weight", message: `That's over 4,600 lb per pallet. Check the total weight or the number of units.` });
    if (weight && units && weight / units < 1) out.push({ field: "weight", message: "That's under 1 lb per unit. Check the total weight." });
    return out;
  },
  vehicle_parts: (d) => {
    const weight = num(d, "weight");
    const pieces = num(d, "quantity");
    return weight && pieces && weight / pieces > 5_000 ? [{ field: "weight", message: "That's over 5,000 lb per piece. Post it as heavy equipment or freight." }] : [];
  },
  personal_watercraft: (d) => {
    const weight = num(d, "weight");
    const n = num(d, "quantity");
    return weight && n && weight / n > 2_000 ? [{ field: "weight", message: "That's over 2,000 lb per watercraft. Check the total weight." }] : [];
  },
};

export function detailsSchema(category: LoadCategory) {
  const shape: Record<string, z.ZodType> = {};
  const fields = fieldsOf(category);
  for (const f of fields) {
    shape[f.name] = fieldSchema(f);
    if (hasOther(f)) shape[otherKey(f.name)] = policyText({ label: "what it is", max: 80 }).optional();
  }
  return z
    .object(shape)
    .strip()
    .superRefine((d: Record<string, unknown>, ctx) => {
      for (const f of fields) {
        if (!hasOther(f)) continue;
        const picked = f.kind === "select" ? d[f.name] === OTHER : list(d, f.name).includes(OTHER);
        const text = d[otherKey(f.name)];
        if (picked && (typeof text !== "string" || text.trim().length < 2)) ctx.addIssue({ code: "custom", path: [otherKey(f.name)], message: "Tell carriers what it is" });
      }
      for (const issue of rules[category]?.(d) ?? []) ctx.addIssue({ code: "custom", path: [issue.field], message: issue.message });
    });
}

export function detailHints(category: LoadCategory, details: Record<string, unknown>): string[] {
  const n = (k: string) => {
    const v = Number(details[k]);
    return Number.isFinite(v) && details[k] !== "" && details[k] !== undefined ? v : undefined;
  };
  const fields = fieldsOf(category);
  const unit = (fields.find((f) => f.name === "width") as Extract<FieldSpec, { kind: "number" }> | undefined)?.unit;
  const toFt = (v: number | undefined) => (v === undefined ? undefined : unit === "in" ? v / 12 : v);
  const width = toFt(n("width") ?? n("beam"));
  const height = toFt(n("height"));
  const length = toFt(n("length"));
  const weight = n("weight");
  const hints: string[] = [];
  const over: string[] = [];
  if (width !== undefined && width > 8.5) over.push("wider than 8.5 ft");
  if (height !== undefined && height > (category === "heavy_equipment" ? 10 : 13.5)) over.push(category === "heavy_equipment" ? "taller than 10 ft on a trailer" : "taller than 13.5 ft");
  if (length !== undefined && length > 53) over.push("longer than 53 ft");
  if (over.length) hints.push(`This load is ${over.join(", ")}, so it's oversize. Carriers add permit and escort costs to their bids.`);
  if (weight !== undefined && weight > 46_000 && (category === "heavy_equipment" || category === "freight")) hints.push("Over 46,000 lb usually needs an overweight permit and a lowboy or multi-axle trailer.");
  if (category === "freight" && (n("quantity") ?? 0) > 30 && list(details, "units").includes("Pallets")) hints.push("More than 30 pallets won't fit one 53 ft trailer. Carriers may quote more than one truck.");
  return hints;
}

export function emptyDetails(category: LoadCategory) {
  const out: Record<string, unknown> = {};
  for (const f of fieldsOf(category)) {
    out[f.name] = f.kind === "multiselect" ? [] : f.kind === "switch" ? false : "";
    if (hasOther(f)) out[otherKey(f.name)] = "";
  }
  return out;
}

export function describeDetail(f: FieldSpec, value: unknown, details?: Record<string, unknown>): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (f.kind === "switch") return value ? "Yes" : null;
  const other = details && hasOther(f) && typeof details[otherKey(f.name)] === "string" ? (details[otherKey(f.name)] as string).trim() : "";
  if (Array.isArray(value)) {
    if (!value.length) return null;
    return value.map((v) => (v === OTHER && other ? other : String(v))).join(", ");
  }
  if (value === OTHER && other) return other;
  if (f.kind === "number") return `${Number(value).toLocaleString("en-US")}${f.unit ? ` ${f.unit}` : ""}`;
  if (f.kind === "vin") return String(value).toUpperCase();
  return String(value);
}

export function describeDetails(category: LoadCategory, details: Record<string, unknown>) {
  const rows: { label: string; value: string }[] = [];
  for (const f of [...fieldsOf(category), ...(legacyFields[category] ?? [])]) {
    const value = describeDetail(f, details[f.name], details);
    if (value) rows.push({ label: f.label, value });
  }
  return rows;
}

export function detailSections(category: LoadCategory, details: Record<string, unknown>) {
  const sections = loadSpecs[category].map((s) => ({ title: s.title, rows: s.fields.map((f) => ({ label: f.label, value: describeDetail(f, details[f.name], details) })).filter((r): r is { label: string; value: string } => Boolean(r.value)) }));
  const legacy = (legacyFields[category] ?? []).map((f) => ({ label: f.label, value: describeDetail(f, details[f.name], details) })).filter((r): r is { label: string; value: string } => Boolean(r.value));
  if (legacy.length && sections.length) sections[sections.length - 1]!.rows.push(...legacy);
  return sections;
}

export const LOAD_DETAILS_VERSION = 2;
