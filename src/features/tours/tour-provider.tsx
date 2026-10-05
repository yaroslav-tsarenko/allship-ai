"use client";

import "driver.js/dist/driver.css";
import "./tour.css";
import { driver, type DriveStep, type Driver } from "driver.js";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { completeTourAction, tourTargetAction } from "@/server/actions/tours";
import { resolveAnchor, waitForAnchor } from "./anchors";
import { tourDefinitions, type TourStep } from "./definitions";
import { isTourId, tourMeta, welcomeTourFor, type TourId, type TourRole } from "./ids";

export const START_TOUR_EVENT = "allship:start-tour";
export const OPEN_ASSISTANT_EVENT = "allship:open-assistant";
const PENDING_KEY = "allship:pending-tour";
const AUTO_KEY = "allship:tour-auto";

type Pending = { tourId: TourId; path: string; fallback: boolean; auto: boolean; at: number };
type LaunchOptions = { fallback?: boolean; auto?: boolean };

type ToursContext = {
  start: (tourId: TourId) => void;
  isCompleted: (tourId: TourId) => boolean;
  completed: TourId[];
  welcomeTourId: TourId | null;
};

const Context = createContext<ToursContext | null>(null);

const fallbackContext: ToursContext = {
  start: (tourId) => window.dispatchEvent(new CustomEvent(START_TOUR_EVENT, { detail: { tourId } })),
  isCompleted: () => false,
  completed: [],
  welcomeTourId: null,
};

export function useTours() {
  return useContext(Context) ?? fallbackContext;
}

function readPending(): Pending | null {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Pending;
    return isTourId(value.tourId) && typeof value.path === "string" ? value : null;
  } catch {
    return null;
  }
}

function writePending(value: Pending | null) {
  try {
    if (value) sessionStorage.setItem(PENDING_KEY, JSON.stringify(value));
    else sessionStorage.removeItem(PENDING_KEY);
  } catch {}
}

function reducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function firstAnchor(steps: TourStep[]) {
  return steps.find((s) => s.anchor)?.anchor;
}

export function TourProvider({ role, initialCompleted, autoStart, children }: { role: TourRole; initialCompleted: TourId[]; autoStart: boolean; children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [completed, setCompleted] = useState<TourId[]>(initialCompleted);
  const active = useRef<{ id: TourId; driver: Driver; path: string } | null>(null);
  const launching = useRef(false);
  const pathRef = useRef(pathname);
  const welcomeTourId = welcomeTourFor(role);

  useEffect(() => {
    pathRef.current = pathname;
  }, [pathname]);

  const markCompleted = useCallback((tourId: TourId) => {
    setCompleted((prev) => (prev.includes(tourId) ? prev : [...prev, tourId]));
    void completeTourAction({ tourId });
  }, []);

  const launch = useCallback(
    async (tourId: TourId, options: LaunchOptions = {}) => {
      if (launching.current) return;
      launching.current = true;
      const definition = tourDefinitions[tourId];
      const reduced = reducedMotion();
      let source: TourStep[];
      if (options.fallback && definition.fallback) {
        source = [{ title: definition.fallback.title, body: definition.fallback.body }];
      } else {
        const roleSteps = definition.steps.filter((s) => !s.roles || s.roles.includes(role));
        const ready = definition.readyAnchor ?? firstAnchor(roleSteps);
        if (ready) await waitForAnchor(ready, 6000);
        await wait(reduced ? 80 : 450);
        source = roleSteps.filter((s) => !s.anchor || resolveAnchor(s.anchor));
      }
      launching.current = false;
      if (source.length === 0) return;

      active.current?.driver.destroy();
      let finished = false;
      const single = source.length === 1;
      const steps: DriveStep[] = source.map((s, i) => ({
        element: s.anchor ? () => resolveAnchor(s.anchor!) as Element : undefined,
        data: { assistant: i === 0 && !single },
        popover: { title: s.title, description: s.body, side: s.anchor ? s.side : undefined, align: s.anchor ? s.align : undefined },
      }));

      const instance = driver({
        steps,
        animate: !reduced,
        smoothScroll: !reduced,
        allowClose: true,
        allowKeyboardControl: true,
        overlayColor: "var(--md-scrim)",
        overlayOpacity: 0.32,
        stagePadding: 6,
        stageRadius: 12,
        popoverOffset: 12,
        popoverClass: "allship-tour",
        showProgress: !single,
        progressText: "{{current}} of {{total}}",
        showButtons: single ? ["next", "close"] : ["next", "previous", "close"],
        nextBtnText: "Next",
        prevBtnText: "Back",
        doneBtnText: single ? "Got it" : "Done",
        closeBtnLabel: "Close tour",
        onPopoverRender: (popover, { state }) => {
          const index = state.activeIndex ?? 0;
          const wrapper = popover.wrapper;
          wrapper.setAttribute("role", "dialog");
          wrapper.setAttribute("aria-modal", "false");
          popover.title.id = "allship-tour-title";
          popover.description.id = "allship-tour-body";
          wrapper.setAttribute("aria-labelledby", popover.title.id);
          wrapper.setAttribute("aria-describedby", popover.description.id);
          popover.closeButton.innerHTML =
            '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M6.4 19 5 17.6 10.6 12 5 6.4 6.4 5 12 10.6 17.6 5 19 6.4 13.4 12 19 17.6 17.6 19 12 13.4Z"/></svg>';
          if (steps[index]?.data?.assistant) {
            const overline = document.createElement("p");
            overline.className = "allship-tour-overline";
            overline.textContent = "AllShip AI";
            popover.title.before(overline);
          }
          popover.previousButton.hidden = index === 0;
          window.requestAnimationFrame(() => popover.nextButton.focus({ preventScroll: true }));
        },
        onDoneClick: (_el, _step, { driver: d }) => {
          finished = true;
          d.destroy();
        },
        onDestroyed: () => {
          if (active.current?.driver === instance) active.current = null;
          if (options.fallback) return;
          if (finished || tourId === welcomeTourId) markCompleted(tourId);
          if (finished && definition.finish === "open-assistant") window.dispatchEvent(new CustomEvent(OPEN_ASSISTANT_EVENT));
        },
      });
      active.current = { id: tourId, driver: instance, path: pathRef.current };
      instance.drive();
    },
    [markCompleted, role, welcomeTourId],
  );

  const start = useCallback(
    async (tourId: TourId, auto = false) => {
      const meta = tourMeta[tourId];
      if (!meta.roles.includes(role)) return;
      const definition = tourDefinitions[tourId];
      const current = pathRef.current;
      let path = meta.path;
      let fallback = false;
      if (definition.target) {
        const here = definition.target.test(current) && (!definition.readyAnchor || resolveAnchor(definition.readyAnchor));
        if (here) path = current;
        else {
          const result = await tourTargetAction({ tourId });
          if (result?.data?.path) path = result.data.path;
          else fallback = true;
        }
      }
      active.current?.driver.destroy();
      if (path === current) return void launch(tourId, { fallback, auto });
      writePending({ tourId, path, fallback, auto, at: Date.now() });
      router.push(path);
    },
    [launch, role, router],
  );

  useEffect(() => {
    const running = active.current;
    if (running && running.path !== pathname) running.driver.destroy();
    const pending = readPending();
    if (!pending) return;
    if (Date.now() - pending.at > 20000) return void writePending(null);
    if (pending.path !== pathname) return;
    writePending(null);
    void launch(pending.tourId, { fallback: pending.fallback, auto: pending.auto });
  }, [launch, pathname]);

  useEffect(() => {
    const onStart = (event: Event) => {
      const tourId = (event as CustomEvent<{ tourId?: unknown }>).detail?.tourId;
      if (isTourId(tourId)) void start(tourId);
    };
    window.addEventListener(START_TOUR_EVENT, onStart);
    return () => window.removeEventListener(START_TOUR_EVENT, onStart);
  }, [start]);

  useEffect(() => {
    if (!autoStart || pathname !== "/app" || completed.includes(welcomeTourId)) return;
    if (window.innerWidth < 360 || readPending()) return;
    try {
      if (sessionStorage.getItem(AUTO_KEY)) return;
    } catch {
      return;
    }
    const timer = window.setTimeout(() => {
      try {
        sessionStorage.setItem(AUTO_KEY, "1");
      } catch {}
      void start(welcomeTourId, true);
    }, 600);
    return () => window.clearTimeout(timer);
  }, [autoStart, completed, pathname, start, welcomeTourId]);

  useEffect(() => () => active.current?.driver.destroy(), []);

  const value = useMemo<ToursContext>(
    () => ({
      start: (tourId) => void start(tourId),
      isCompleted: (tourId) => completed.includes(tourId),
      completed,
      welcomeTourId,
    }),
    [completed, start, welcomeTourId],
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}
