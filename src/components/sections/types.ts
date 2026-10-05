import type { StaticImageData } from "next/image";
import type { ReactNode } from "react";

export type SectionImage = { src: StaticImageData | string; alt: string; width?: number; height?: number };

export type Cta = { label: string; href: string; variant?: "filled" | "tonal" | "outlined" | "text"; track?: string };

export type HeadingLevel = "h1" | "h2";

export type FaqEntry = { question: string; answer: string };

export type StepItem = { title: string; description: string };

export type IconItem = { icon?: ReactNode; title: string; subtitle?: string };

export function sectionId(prefix: string, text: string) {
  const slug = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return `${prefix}-${slug || "section"}`;
}

export function imageSize(image: SectionImage, fallback: { width: number; height: number }) {
  if (typeof image.src !== "string") return { width: image.width ?? image.src.width, height: image.height ?? image.src.height };
  return { width: image.width ?? fallback.width, height: image.height ?? fallback.height };
}
