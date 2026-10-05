export function anchorSelector(anchor: string) {
  return /[\s[\]#.:>="']/.test(anchor) ? anchor : `[data-tour="${anchor}"]`;
}

function isVisible(el: Element) {
  const node = el as HTMLElement;
  if (typeof node.checkVisibility === "function" && !node.checkVisibility()) return false;
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

export function resolveAnchor(anchor: string | string[]): Element | null {
  for (const a of [anchor].flat()) {
    for (const el of document.querySelectorAll(anchorSelector(a))) {
      if (isVisible(el)) return el;
    }
  }
  return null;
}

export function waitForAnchor(anchor: string | string[], timeout: number): Promise<boolean> {
  return new Promise((resolve) => {
    if (resolveAnchor(anchor)) return resolve(true);
    let settled = false;
    const finish = (found: boolean) => {
      if (settled) return;
      settled = true;
      observer.disconnect();
      window.clearTimeout(timer);
      resolve(found);
    };
    const observer = new MutationObserver(() => {
      if (resolveAnchor(anchor)) finish(true);
    });
    const timer = window.setTimeout(() => finish(Boolean(resolveAnchor(anchor))), timeout);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "style", "hidden", "data-tour"] });
  });
}
