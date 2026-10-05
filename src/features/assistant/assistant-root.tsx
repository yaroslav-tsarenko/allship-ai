"use client";

import dynamic from "next/dynamic";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
  type RefObject,
} from "react";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/cn";
import type { ViewerRole } from "@/server/viewer/viewer";
import type { PanelMode } from "./assistant-panel";
import { SparkIcon } from "./spark-icon";

const loadPanel = () => import("./assistant-panel");

const AssistantPanel = dynamic(loadPanel, {
  ssr: false,
  loading: () => (
    <div className="text-primary flex h-full items-center justify-center">
      <Spinner />
    </div>
  ),
});

type AssistantState = {
  open: boolean;
  used: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
  role: ViewerRole;
  firstName: string;
  buttonRef: RefObject<HTMLButtonElement | null>;
};

const AssistantContext = createContext<AssistantState | null>(null);

function useAssistant() {
  const ctx = useContext(AssistantContext);
  if (!ctx) throw new Error("useAssistant must be used inside AssistantProvider");
  return ctx;
}

const noopSubscribe = () => () => {};

export const openAssistantEvent = "allship:open-assistant";

export function AssistantProvider({
  role,
  firstName,
  children,
}: {
  role: ViewerRole;
  firstName: string;
  children: ReactNode;
}) {
  const [open, setOpenState] = useState(false);
  const [used, setUsed] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const setOpen = useCallback((next: boolean) => {
    if (next) setUsed(true);
    setOpenState((prev) => {
      if (prev && !next) requestAnimationFrame(() => buttonRef.current?.focus({ preventScroll: true }));
      return next;
    });
  }, []);
  const toggle = useCallback(() => setOpen(!open), [open, setOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === "j") {
        e.preventDefault();
        toggle();
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener(openAssistantEvent, onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(openAssistantEvent, onOpen);
    };
  }, [toggle, setOpen]);

  const value = useMemo(
    () => ({ open, used, setOpen, toggle, role, firstName, buttonRef }),
    [open, used, setOpen, toggle, role, firstName],
  );
  return <AssistantContext.Provider value={value}>{children}</AssistantContext.Provider>;
}

export function AssistantButton() {
  const { open, toggle, buttonRef } = useAssistant();
  const mac = useSyncExternalStore(
    noopSubscribe,
    () => /Mac|iPhone|iPad/.test(navigator.platform),
    () => false,
  );
  const shortcut = mac ? "⌘J" : "Ctrl+J";
  return (
    <button
      ref={buttonRef}
      type="button"
      data-tour="assistant-button"
      aria-label="Ask AI"
      aria-expanded={open}
      aria-controls="assistant-panel"
      aria-keyshortcuts="Meta+J Control+J"
      title={`Ask AI (${shortcut})`}
      onClick={toggle}
      onPointerEnter={() => void loadPanel()}
      onFocus={() => void loadPanel()}
      className={cn(
        "state-layer text-label-lg ease-standard inline-flex h-10 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-[20px] font-medium transition-[background-color,color,border-radius] duration-(--duration-short4) active:rounded-[12px]",
        "medium:w-auto medium:pr-5 medium:pl-4 w-10",
        open ? "bg-primary text-on-primary" : "bg-primary-container text-on-primary-container",
      )}
    >
      <SparkIcon size={20} />
      <span className="medium:inline hidden">Ask AI</span>
    </button>
  );
}

const compactQuery = "(max-width: 599.98px)";
const dockedQuery = "(min-width: 1600px)";

function subscribe(cb: () => void) {
  const a = window.matchMedia(compactQuery);
  const b = window.matchMedia(dockedQuery);
  a.addEventListener("change", cb);
  b.addEventListener("change", cb);
  return () => {
    a.removeEventListener("change", cb);
    b.removeEventListener("change", cb);
  };
}

function currentMode(): PanelMode {
  if (window.matchMedia(compactQuery).matches) return "compact";
  if (window.matchMedia(dockedQuery).matches) return "docked";
  return "overlay";
}

export function AssistantDock() {
  const { open, used, setOpen, role, firstName } = useAssistant();
  const mode = useSyncExternalStore<PanelMode>(subscribe, currentMode, () => "docked");

  useEffect(() => {
    if (!open || mode !== "compact") return;
    const root = document.documentElement;
    const prev = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = prev;
    };
  }, [open, mode]);

  if (!used) return null;

  return (
    <aside
      id="assistant-panel"
      data-tour="assistant-panel"
      aria-labelledby="assistant-title"
      role={mode === "compact" ? "dialog" : "complementary"}
      aria-modal={mode === "compact" && open ? true : undefined}
      hidden={!open}
      className={cn(
        "animate-drawer-in bg-surface text-on-surface fixed inset-0 z-50 flex flex-col motion-reduce:animate-none",
        "medium:inset-auto medium:top-[72px] medium:right-2 medium:bottom-2 medium:z-30 medium:w-[400px] medium:overflow-hidden medium:rounded-xl medium:bg-surface-container-low medium:shadow-elevation-3",
        "xlarge:sticky xlarge:top-16 xlarge:right-auto xlarge:bottom-auto xlarge:z-20 xlarge:mr-2 xlarge:mb-2 xlarge:h-[calc(100dvh-4.5rem)] xlarge:w-[420px] xlarge:shrink-0 xlarge:self-start xlarge:shadow-none",
        !open && "hidden",
      )}
    >
      <AssistantPanel
        role={role}
        firstName={firstName}
        open={open}
        mode={mode}
        onClose={() => setOpen(false)}
      />
    </aside>
  );
}
