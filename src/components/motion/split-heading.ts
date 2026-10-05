import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { ease, registerEases } from "./eases";

registerEases();
gsap.registerPlugin(SplitText);

export function splitHeading(el: HTMLElement, delay = 0) {
  SplitText.create(el, {
    type: "lines",
    mask: "lines",
    autoSplit: true,
    onSplit: (self) => gsap.from(self.lines, { yPercent: 100, duration: 0.6, delay, stagger: 0.08, ease: ease.decelerate }),
  });
}
