import { ogSize, renderOgImage } from "@/lib/og/render";

export const alt = "About AllShip AI";
export const size = ogSize;
export const contentType = "image/png";

export default function Image() {
  return renderOgImage({ eyebrow: "About us", title: "A shipping marketplace with verified carriers and escrow." });
}
