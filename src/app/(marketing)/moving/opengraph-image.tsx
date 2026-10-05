import { ogSize, renderOgImage } from "@/lib/og/render";

export const alt = "Moving quotes from verified movers on AllShip AI";
export const size = ogSize;
export const contentType = "image/png";

export default function Image() {
  return renderOgImage({ eyebrow: "Moving", title: "Instant moving prices from verified movers' own rates." });
}
