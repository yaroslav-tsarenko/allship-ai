import { ogSize, renderOgImage } from "@/lib/og/render";

export const alt = "AllShip AI assistant for shipping and moving";
export const size = ogSize;
export const contentType = "image/png";

export default function Image() {
  return renderOgImage({ eyebrow: "AI tools", title: "Describe a load, estimate a price and compare bids with AI." });
}
