const EVENTS = ["scroll", "wheel", "pointerdown", "pointermove", "keydown", "touchstart"] as const;

let fired = false;
let bound = false;
const subscribers = new Set<() => void>();

function fire() {
  if (fired) return;
  fired = true;
  EVENTS.forEach((e) => window.removeEventListener(e, fire));
  const list = [...subscribers];
  subscribers.clear();
  list.forEach((fn) => fn());
}

export function onFirstInteraction(fn: () => void) {
  if (fired) {
    fn();
    return () => {};
  }
  if (!bound) {
    bound = true;
    EVENTS.forEach((e) => window.addEventListener(e, fire, { passive: true }));
  }
  subscribers.add(fn);
  return () => {
    subscribers.delete(fn);
  };
}
