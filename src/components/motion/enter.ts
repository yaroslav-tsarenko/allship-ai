import type { CSSProperties } from "react";

export function enter(index = 0) {
  return { "data-enter": "", style: { "--enter-i": index } as CSSProperties };
}

export const motionBootScript = `document.documentElement.classList.add("js-motion")`;
