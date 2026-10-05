import { ogSize, renderOgImage } from "@/lib/og/render";

export const alt = "Shipping with verified carriers on AllShip AI";
export const size = ogSize;
export const contentType = "image/png";

export default function Image() {
  return renderOgImage({ eyebrow: "Ship", title: "Compare bids from verified carriers. Pay after delivery." });
}
