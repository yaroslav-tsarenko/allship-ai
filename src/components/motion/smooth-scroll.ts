import Lenis from "lenis";

let instance: Lenis | null = null;
let teardown: (() => void) | null = null;

function headerOffset() {
  const header = document.querySelector<HTMLElement>("header.sticky, header[data-sticky]");
  return -((header?.offsetHeight ?? 64) + 12);
}

export function getLenis() {
  return instance;
}

export function scrollToTarget(target: string | HTMLElement | number, immediate = false) {
  if (!instance) return false;
  instance.scrollTo(target, { offset: typeof target === "number" ? 0 : headerOffset(), immediate, duration: 1.1 });
  return true;
}

export function startSmoothScroll() {
  if (instance) return;
  const lenis = new Lenis({
    autoRaf: true,
    lerp: 0.12,
    smoothWheel: true,
    syncTouch: false,
    allowNestedScroll: true,
    anchors: { offset: headerOffset(), duration: 1.1 },
    stopInertiaOnNavigate: true,
    prevent: (node) => Boolean(node.closest("[role='dialog'],[data-lenis-prevent],[data-radix-popper-content-wrapper]")),
  });
  instance = lenis;

  const body = document.body;
  const sync = () => {
    if (body.hasAttribute("data-scroll-locked")) lenis.stop();
    else lenis.start();
  };
  const mo = new MutationObserver(sync);
  mo.observe(body, { attributes: true, attributeFilter: ["data-scroll-locked"] });

  teardown = () => {
    mo.disconnect();
    lenis.destroy();
    instance = null;
  };
}

export function stopSmoothScroll() {
  teardown?.();
  teardown = null;
}
