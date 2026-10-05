import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

function parallax(el: HTMLElement, small: boolean) {
  const speed = (Number(el.dataset.speed) || 0) * (small ? 0.5 : 1);
  if (!speed) return;
  gsap.fromTo(
    el,
    { y: () => speed * 120 },
    { y: () => -speed * 120, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true, invalidateOnRefresh: true } },
  );
}

function heroOut(el: HTMLElement) {
  const amount = Number(el.dataset.out) || 0.4;
  gsap.to(el, {
    y: () => -amount * window.innerHeight * 0.5,
    scale: 1 - amount * 0.08,
    opacity: 0.1,
    ease: "none",
    scrollTrigger: { trigger: el.closest("section") ?? el, start: "top top", end: "bottom top", scrub: true, invalidateOnRefresh: true },
  });
}

function scrubWords(el: HTMLElement) {
  const words = el.querySelectorAll<HTMLElement>("[data-w]");
  if (!words.length) return;
  const scope = el.closest<HTMLElement>("[data-scrub-scope]");
  gsap.fromTo(
    words,
    { opacity: 0.22 },
    {
      opacity: 1,
      ease: "none",
      stagger: 0.1,
      scrollTrigger: scope ? { trigger: scope, start: "top top", end: "bottom bottom", scrub: 0.6 } : { trigger: el, start: "top 78%", end: "bottom 45%", scrub: 0.6 },
    },
  );
}

function pinRow(el: HTMLElement, mm: gsap.MatchMedia) {
  const track = el.querySelector<HTMLElement>("[data-pin-track]");
  if (!track) return;
  mm.add("(min-width: 840px)", () => {
    const distance = () => Math.max(0, track.scrollWidth - el.clientWidth);
    if (distance() < 40) return;
    const contained: HTMLElement[] = [];
    for (let a = el.parentElement; a; a = a.parentElement) {
      if (getComputedStyle(a).contentVisibility === "auto") {
        a.style.contentVisibility = "visible";
        contained.push(a);
      }
    }
    el.dataset.pinned = "";
    gsap.to(track, {
      x: () => -distance(),
      ease: "none",
      scrollTrigger: { trigger: el, start: "center center", end: () => `+=${distance()}`, pin: true, scrub: 0.5, invalidateOnRefresh: true, anticipatePin: 1 },
    });
    return () => {
      delete el.dataset.pinned;
      contained.forEach((a) => a.style.removeProperty("content-visibility"));
    };
  });
}

function progress(el: HTMLElement) {
  const target = el.dataset.progress ? document.querySelector<HTMLElement>(el.dataset.progress) : null;
  const scope = target ?? el.closest<HTMLElement>("[data-progress-scope]") ?? el.closest("section") ?? el;
  gsap.fromTo(el, { scaleX: 0 }, { scaleX: 1, ease: "none", transformOrigin: "left center", scrollTrigger: { trigger: scope, start: "top 70%", end: "bottom 70%", scrub: true } });
}

export function startScrollEffects(root: HTMLElement, native: boolean) {
  const small = window.innerWidth < 768;
  const ctx = gsap.context(() => {}, root);
  const mm = gsap.matchMedia();
  ctx.add(() => {
    if (!native) {
      root.querySelectorAll<HTMLElement>("[data-speed]").forEach((el) => parallax(el, small));
      root.querySelectorAll<HTMLElement>("[data-out]").forEach(heroOut);
    }
    root.querySelectorAll<HTMLElement>("[data-scrub='words']").forEach(scrubWords);
    root.querySelectorAll<HTMLElement>("[data-pin='x']").forEach((el) => pinRow(el, mm));
    root.querySelectorAll<HTMLElement>("[data-progress]").forEach(progress);
  });
  document.documentElement.dataset.scrollFx = "";
  let timer = 0;
  const refresh = () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => ScrollTrigger.refresh(), 250);
  };
  const ro = new ResizeObserver(refresh);
  ro.observe(root);
  void document.fonts?.ready.then(refresh);
  refresh();
  return () => {
    window.clearTimeout(timer);
    ro.disconnect();
    mm.revert();
    ctx.revert();
    delete document.documentElement.dataset.scrollFx;
  };
}
