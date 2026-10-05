const TARGETS = [
  "[data-reveal]",
  ".prose-article",
  "h2",
  "h3",
  "h4",
  "p",
  "li",
  "dt",
  "dd",
  "figure",
  "table",
  "form",
  "blockquote",
  "details",
  "pre",
  "[class*='rounded-']",
  "a[class*='inline-flex']",
  "button",
].join(",");

const SKIP = "[data-enter],[data-motion-skip],[data-motion-reveal],nav[aria-label='Breadcrumb'],[role='dialog'],[aria-hidden='true']";
const EASE = "cubic-bezier(0.05, 0.7, 0.1, 1)";
const PENDING = "data-rv";

type SplitModule = typeof import("./split-heading");

let splitModule: Promise<SplitModule> | null = null;

function loadSplit() {
  splitModule ??= import("./split-heading");
  return splitModule;
}

function idle(fn: (deadline: { timeRemaining: () => number }) => void) {
  if ("requestIdleCallback" in window) return window.requestIdleCallback(fn, { timeout: 1000 });
  return globalThis.setTimeout(() => fn({ timeRemaining: () => 8 }), 16) as unknown as number;
}

function cancelIdle(id: number) {
  if ("cancelIdleCallback" in window) window.cancelIdleCallback(id);
  else globalThis.clearTimeout(id);
}

function deferredByContentVisibility(el: HTMLElement) {
  if (typeof el.checkVisibility !== "function") return false;
  return el.checkVisibility() && !el.checkVisibility({ contentVisibilityAuto: true });
}

function candidates(block: HTMLElement) {
  const out: HTMLElement[] = [];
  if (block.matches(SKIP)) return out;
  const walker = document.createTreeWalker(block, NodeFilter.SHOW_ELEMENT, {
    acceptNode(node) {
      const el = node as HTMLElement;
      if (el.matches(SKIP)) return NodeFilter.FILTER_REJECT;
      if (el.matches(TARGETS)) {
        out.push(el);
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_SKIP;
    },
  });
  while (walker.nextNode());
  return out;
}

function reveal(el: HTMLElement, index: number) {
  el.removeAttribute(PENDING);
  if (el.tagName === "H2" && !el.querySelector("a,button")) {
    if (splitModule) {
      el.style.opacity = "0";
      void splitModule.then((m) => {
        el.style.opacity = "";
        m.splitHeading(el, index * 0.06);
      });
      return;
    }
  }
  el.animate(
    [
      { opacity: 0, transform: "translateY(24px)" },
      { opacity: 1, transform: "none" },
    ],
    { duration: 500, delay: index * 60, easing: EASE, fill: "backwards" },
  );
}

function countUp(el: HTMLElement) {
  const node = Array.from(el.childNodes).find((n) => n.nodeType === Node.TEXT_NODE && n.nodeValue?.trim());
  if (!node?.nodeValue) return;
  const original = node.nodeValue;
  const match = original.match(/^(\D*?)(\d[\d,]*(?:\.\d+)?)(.*)$/s);
  if (!match) return;
  const [, prefix = "", digits = "", suffix = ""] = match;
  const target = Number(digits.replace(/,/g, ""));
  if (!Number.isFinite(target) || target === 0) return;
  const decimals = digits.split(".")[1]?.length ?? 0;
  const fmt = new Intl.NumberFormat("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals, useGrouping: digits.includes(",") });
  const start = performance.now();
  const total = 1200;
  el.style.minWidth = `${el.offsetWidth}px`;
  if (getComputedStyle(el).display === "inline") el.style.display = "inline-block";
  const tick = (now: number) => {
    const t = Math.min((now - start) / total, 1);
    const eased = 1 - Math.pow(1 - t, 4);
    node.nodeValue = t >= 1 ? original : `${prefix}${fmt.format(target * eased)}${suffix}`;
    if (t < 1) requestAnimationFrame(tick);
    else el.style.minWidth = "";
  };
  node.nodeValue = `${prefix}${fmt.format(0)}${suffix}`;
  requestAnimationFrame(tick);
}

export function startMotion(main: HTMLElement) {
  const blocks = Array.from(main.children).filter((el): el is HTMLElement => el instanceof HTMLElement && !["SCRIPT", "STYLE", "TEMPLATE"].includes(el.tagName));
  const seen = new WeakSet<Element>();
  let batch = 0;
  let batchFrame = 0;

  const io = new IntersectionObserver(
    (entries) => {
      const fresh: HTMLElement[] = [];
      const show: HTMLElement[] = [];
      for (const entry of entries) {
        const el = entry.target as HTMLElement;
        if (!seen.has(el)) {
          seen.add(el);
          const r = entry.boundingClientRect;
          if (entry.isIntersecting || r.top < 0 || (r.width === 0 && !deferredByContentVisibility(el))) {
            io.unobserve(el);
            continue;
          }
          if (!el.hasAttribute("data-count")) fresh.push(el);
          continue;
        }
        if (!entry.isIntersecting) continue;
        io.unobserve(el);
        show.push(el);
      }
      for (const el of fresh) el.setAttribute(PENDING, "");
      for (const el of show) {
        if (el.hasAttribute("data-count")) countUp(el);
        else reveal(el, Math.min(batch++, 7));
      }
      if (!batchFrame) {
        batchFrame = requestAnimationFrame(() => {
          batch = 0;
          batchFrame = 0;
        });
      }
    },
    { rootMargin: "0px 0px -12% 0px" },
  );

  const pre = new IntersectionObserver(
    (entries) => {
      const fresh: HTMLElement[] = [];
      const fold = window.innerHeight * 0.88;
      for (const entry of entries) {
        const el = entry.target as HTMLElement;
        const r = entry.boundingClientRect;
        const first = !seen.has(el);
        seen.add(el);
        if (!entry.isIntersecting) {
          if (first && (r.top < 0 || (r.width === 0 && !deferredByContentVisibility(el)))) pre.unobserve(el);
          continue;
        }
        pre.unobserve(el);
        if (r.top < fold) continue;
        fresh.push(el);
      }
      for (const el of fresh) {
        if (!el.hasAttribute("data-count")) el.setAttribute(PENDING, "");
        io.observe(el);
      }
    },
    { rootMargin: "0px 0px 100% 0px" },
  );

  const queue = blocks.slice(1);
  let idleId = 0;
  const work = (deadline: { timeRemaining: () => number }) => {
    while (queue.length && deadline.timeRemaining() > 4) {
      const block = queue.shift();
      if (!block) break;
      for (const el of candidates(block)) pre.observe(el);
    }
    if (queue.length) idleId = idle(work);
    else main.querySelectorAll<HTMLElement>("[data-count]").forEach((el) => {
        if (!seen.has(el)) io.observe(el);
      });
  };
  idleId = idle(work);

  const warm = () => {
    void loadSplit();
    removeWarm();
  };
  const events = ["scroll", "pointerdown", "keydown", "touchstart", "wheel"] as const;
  const removeWarm = () => events.forEach((e) => window.removeEventListener(e, warm));
  events.forEach((e) => window.addEventListener(e, warm, { passive: true, once: true }));

  return () => {
    cancelIdle(idleId);
    cancelAnimationFrame(batchFrame);
    removeWarm();
    pre.disconnect();
    io.disconnect();
    main.querySelectorAll(`[${PENDING}]`).forEach((el) => el.removeAttribute(PENDING));
  };
}
