import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const typeScale = ["display", "headline", "title", "body", "label"].flatMap((role) =>
  ["lg", "md", "sm"].map((size) => `${role}-${size}`),
).concat(["display-xl", "display-xxl", "body-xl"]);

const merge = extendTailwindMerge({
  extend: {
    theme: {
      text: typeScale,
      radius: ["xs", "sm", "md", "lg", "xl"],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return merge(clsx(inputs));
}
