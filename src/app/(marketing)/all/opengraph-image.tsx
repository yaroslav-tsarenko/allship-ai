import { ogSize, renderOgImage } from "@/lib/og/render";

export const alt = "All AllShip AI services";
export const size = ogSize;
export const contentType = "image/png";

export default function Image() {
  return renderOgImage({ eyebrow: "All services", title: "Moving, vehicles, freight, heavy equipment and trucks." });
}
