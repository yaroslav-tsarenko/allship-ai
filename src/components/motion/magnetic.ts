const MAX = 8;

export function startMagnetic(root: HTMLElement) {
  let active: HTMLElement | null = null;
  let frame = 0;
  let point = { x: 0, y: 0 };

  const release = (el: HTMLElement) => {
    el.style.translate = "";
  };

  const apply = () => {
    frame = 0;
    if (!active) return;
    const r = active.getBoundingClientRect();
    const dx = (point.x - (r.left + r.width / 2)) / (r.width / 2);
    const dy = (point.y - (r.top + r.height / 2)) / (r.height / 2);
    active.style.translate = `${(Math.max(-1, Math.min(1, dx)) * MAX).toFixed(2)}px ${(Math.max(-1, Math.min(1, dy)) * MAX * 0.6).toFixed(2)}px`;
  };

  const onMove = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    const el = (e.target as Element | null)?.closest?.<HTMLElement>("[data-magnetic]") ?? null;
    if (el !== active) {
      if (active) release(active);
      active = el;
      if (el && !el.hasAttribute("data-magnetic-ready")) {
        el.setAttribute("data-magnetic-ready", "");
        el.style.transition = `${getComputedStyle(el).transition}, translate 260ms cubic-bezier(0.2, 0, 0, 1)`;
      }
    }
    if (!active) return;
    point = { x: e.clientX, y: e.clientY };
    if (!frame) frame = requestAnimationFrame(apply);
  };

  const onLeave = () => {
    if (active) release(active);
    active = null;
  };

  root.addEventListener("pointermove", onMove, { passive: true });
  root.addEventListener("pointerleave", onLeave);
  return () => {
    cancelAnimationFrame(frame);
    root.removeEventListener("pointermove", onMove);
    root.removeEventListener("pointerleave", onLeave);
    if (active) release(active);
  };
}
