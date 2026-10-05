import type { LoadCategory } from "@/server/db/schema/enums";

export type CategoryGroup = "moving" | "vehicles" | "freight" | "trucks";

export type Category = {
  key: LoadCategory;
  slug: string;
  name: string;
  shortName: string;
  group: CategoryGroup;
  summary: string;
  image: { src: string; alt: string; width: number; height: number; cutout?: boolean };
};

const photo = (src: string, alt: string, width = 960, height = 1280) => ({ src: `/images/${src}.jpg`, alt, width, height });
const cutout = (src: string, alt: string, width: number) => ({ src: `/images/categories/${src}.webp`, alt, width, height: 187, cutout: true });

export const categoryGroups: Record<CategoryGroup, { label: string; href: string }> = {
  moving: { label: "Moving", href: "/moving" },
  vehicles: { label: "Vehicles", href: "/vehicle-load" },
  freight: { label: "Freight and equipment", href: "/freight-load" },
  trucks: { label: "Trucks", href: "/rent-truck" },
};

export const categories: Category[] = [
  { key: "local_moving", slug: "local-moving", name: "Local moving", shortName: "Local move", group: "moving", summary: "Moves within the same metro area, usually under 50 miles, priced by crew time and truck size.", image: photo("movers-ramp", "Movers rolling boxes up a ramp into a truck", 661, 455) },
  { key: "long_distance_moving", slug: "long-distance-moving", name: "Long-distance moving", shortName: "Long-distance move", group: "moving", summary: "Interstate and cross-country household moves, priced by volume and distance.", image: photo("household-load-strapped", "Household goods wrapped and strapped inside a moving truck", 842, 1280) },
  { key: "household_items", slug: "household-items", name: "Household items", shortName: "Household items", group: "moving", summary: "A few pieces of furniture or appliances, without moving a whole home.", image: photo("sofa-wrapped", "Sofa wrapped in moving blankets in a living room", 639, 441) },
  { key: "office_moving", slug: "office-moving", name: "Office moving", shortName: "Office move", group: "moving", summary: "Workstations, files and office equipment, often after hours to avoid downtime.", image: photo("warehouse-staging", "Wrapped office furniture staged for loading", 960, 1280) },
  { key: "business_moving", slug: "business-moving", name: "Business moving", shortName: "Business move", group: "moving", summary: "Retail, restaurant and small-business relocations with inventory and fixtures.", image: photo("boxes-sorting", "Boxes being sorted for a business relocation", 960, 1280) },
  { key: "corporate_relocation", slug: "corporate-relocation", name: "Corporate relocation", shortName: "Corporate relocation", group: "moving", summary: "Employee relocations and multi-site company moves coordinated on one schedule.", image: photo("wrapped-cabinet-dock", "Wrapped cabinet on a loading dock", 960, 1280) },
  { key: "student_moving", slug: "student-moving", name: "Student moving", shortName: "Student move", group: "moving", summary: "Dorm and apartment moves with a small load and a tight move-in window.", image: photo("blanket-wrapped-items", "Small load of blanket-wrapped items in a truck", 960, 1280) },
  { key: "military_moving", slug: "military-moving", name: "Military moving", shortName: "Military move", group: "moving", summary: "PCS and personally procured moves with the paperwork and weight records the move requires.", image: photo("truck-interior-tiers", "Truck loaded in tiers with blankets and straps", 850, 1280) },
  { key: "heavy_lifting", slug: "heavy-lifting", name: "Heavy lifting only", shortName: "Heavy lifting", group: "moving", summary: "A crew to load, unload or carry heavy items, without transport.", image: photo("stair-protection", "Stairway padded to protect it while moving heavy items", 960, 1280) },
  { key: "car_or_light_truck", slug: "car-or-light-truck", name: "Car or light truck", shortName: "Car", group: "vehicles", summary: "Sedans, SUVs and pickups on open or enclosed trailers.", image: cutout("car", "White SUV", 281) },
  { key: "motorcycle", slug: "motorcycle", name: "Motorcycle", shortName: "Motorcycle", group: "vehicles", summary: "Street bikes, cruisers and dirt bikes, crated or strapped in an enclosed trailer.", image: cutout("moto", "Motorcycle", 212) },
  { key: "powerboat", slug: "powerboat", name: "Powerboat", shortName: "Powerboat", group: "vehicles", summary: "Powerboats on their own trailer or a carrier's hydraulic boat trailer.", image: cutout("powerboats", "Powerboat", 218) },
  { key: "sailboat", slug: "sailboat", name: "Sailboat", shortName: "Sailboat", group: "vehicles", summary: "Sailboats with the mast stepped down and transported on a cradle.", image: cutout("sailboat", "Sailboat", 218) },
  { key: "personal_watercraft", slug: "personal-watercraft", name: "Personal watercraft", shortName: "Jet ski", group: "vehicles", summary: "Jet skis and other personal watercraft, single or in pairs on a trailer.", image: cutout("personal-watercrafts", "Personal watercraft", 218) },
  { key: "atv_powersports", slug: "atv-powersports", name: "ATVs and powersports", shortName: "ATV", group: "vehicles", summary: "ATVs, UTVs, side-by-sides and snowmobiles.", image: cutout("atv", "ATV", 243) },
  { key: "commercial_truck", slug: "commercial-truck", name: "Commercial truck", shortName: "Commercial truck", group: "vehicles", summary: "Box trucks, tractors and work vans, towed, hauled or driven away.", image: cutout("commercial-truck", "Commercial truck", 218) },
  { key: "rv", slug: "rv", name: "RV", shortName: "RV", group: "vehicles", summary: "Motorhomes, travel trailers and fifth wheels.", image: cutout("rv", "RV motorhome", 243) },
  { key: "trailer", slug: "trailer", name: "Trailer", shortName: "Trailer", group: "vehicles", summary: "Utility, cargo, horse and car trailers.", image: cutout("trailer", "Cargo trailer", 218) },
  { key: "vehicle_parts", slug: "vehicle-parts", name: "Vehicle parts", shortName: "Parts", group: "vehicles", summary: "Engines, transmissions and palletized parts.", image: cutout("parts", "Engine and vehicle parts", 218) },
  { key: "freight", slug: "freight", name: "Freight", shortName: "Freight", group: "freight", summary: "Palletized and crated freight, LTL or full truckload.", image: photo("pallets-in-trailer", "Wrapped pallets loaded in a trailer", 960, 1280) },
  { key: "heavy_equipment", slug: "heavy-equipment", name: "Heavy equipment", shortName: "Heavy equipment", group: "freight", summary: "Construction, farm and industrial machinery, including oversize loads.", image: photo("mower-ramp-load", "Riding mower driven up a ramp into a box truck", 960, 1280) },
  { key: "truck_rental", slug: "truck-rental", name: "Truck rental", shortName: "Truck rental", group: "trucks", summary: "A box truck or cargo van with the carrier's driver, booked for a full day or longer.", image: photo("box-truck-yard", "Box truck parked in a yard", 960, 1280) },
  { key: "truck_with_driver", slug: "truck-with-driver", name: "Truck with driver", shortName: "Truck with driver", group: "trucks", summary: "A truck and a driver by the hour for pickups, deliveries and small moves.", image: photo("box-truck-side", "Box truck seen from the side at a loading dock", 960, 1280) },
];

export const hubCanonical: Partial<Record<LoadCategory, string>> = {
  freight: "/freight-load",
  heavy_equipment: "/heavy-load",
  truck_rental: "/rent-truck",
  truck_with_driver: "/truck-with-driver",
};

export const categoryBySlug = (slug: string) => categories.find((c) => c.slug === slug);
export const categoriesInGroup = (group: CategoryGroup) => categories.filter((c) => c.group === group);
