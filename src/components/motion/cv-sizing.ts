const SELECTOR = ".marketing-main > section, .marketing-footer";

function skipped(el: HTMLElement) {
  if (typeof el.checkVisibility !== "function") return false;
  return !el.checkVisibility({ contentVisibilityAuto: true });
}

export function sizeDeferredSections() {
  const targets = Array.from(document.querySelectorAll<HTMLElement>(SELECTOR)).filter(
    (el) => getComputedStyle(el).contentVisibility === "auto",
  );
  let index = 0;
  let id = 0;
  const step = (deadline: IdleDeadline) => {
    while (index < targets.length && deadline.timeRemaining() > 10) {
      const el = targets[index++];
      if (!el || !skipped(el)) continue;
      el.style.contentVisibility = "visible";
      const height = Math.round(el.getBoundingClientRect().height);
      el.style.containIntrinsicSize = `auto ${height}px`;
      el.style.removeProperty("content-visibility");
    }
    if (index < targets.length) id = window.requestIdleCallback(step, { timeout: 2000 });
  };
  if (typeof window.requestIdleCallback !== "function") return () => {};
  id = window.requestIdleCallback(step, { timeout: 2000 });
  return () => window.cancelIdleCallback(id);
}
