import { ogSize, renderOgImage } from "@/lib/og/render";

export const alt = "AllShip AI — Ship, move and haul with verified carriers";
export const size = ogSize;
export const contentType = "image/png";

export default function Image() {
  return renderOgImage({ eyebrow: "Moves, vehicles, freight, heavy equipment", title: "Verified carriers bid. You pay when it's delivered." });
}
