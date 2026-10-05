export function afterLoadIdle(fn: () => void, timeout = 3000) {
  let idleId = 0;
  let timerId = 0;
  let cancelled = false;
  const schedule = () => {
    if (cancelled) return;
    if (typeof window.requestIdleCallback === "function") idleId = window.requestIdleCallback(() => fn(), { timeout });
    else timerId = window.setTimeout(fn, 300);
  };
  if (document.readyState === "complete") schedule();
  else window.addEventListener("load", schedule, { once: true });
  return () => {
    cancelled = true;
    window.removeEventListener("load", schedule);
    if (idleId) window.cancelIdleCallback(idleId);
    if (timerId) window.clearTimeout(timerId);
  };
}
