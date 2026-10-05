import type { CSSProperties, ReactNode, Ref } from "react";
import { Icon } from "@/components/ui/icon";
import { chevronLeftIcon, chevronRightIcon, lockIcon, refreshIcon } from "@/components/ui/icons.generated";
import { frameStyle, presetFor, type FrameVars } from "./engine/geometry";
import type { DeviceKind } from "./types";

function BrowserBar({ url }: { url: string }) {
  return (
    <div className="text-on-surface-variant flex h-full items-center gap-3 px-4">
      <span className="flex gap-2" aria-hidden="true">
        <span className="size-3 rounded-full bg-[#f2625a] dark:bg-[#e0605a]" />
        <span className="size-3 rounded-full bg-[#f4bb3d] dark:bg-[#d9a93f]" />
        <span className="size-3 rounded-full bg-[#3fc456] dark:bg-[#43a956]" />
      </span>
      <span className="ml-2 flex items-center gap-1">
        <Icon icon={chevronLeftIcon} size={20} />
        <Icon icon={chevronRightIcon} size={20} className="opacity-40" />
        <Icon icon={refreshIcon} size={18} className="ml-1" />
      </span>
      <span className="bg-surface-container-lowest text-on-surface-variant mx-auto flex h-7 w-full max-w-[560px] min-w-0 items-center justify-center gap-1.5 rounded-full px-4 text-[13px]">
        <Icon icon={lockIcon} size={13} className="shrink-0" />
        <span className="truncate">
          <span className="text-on-surface">allship.ai</span>
          {url}
        </span>
      </span>
      <span className="w-[108px] shrink-0" />
    </div>
  );
}

function StatusBar() {
  return (
    <div className="text-on-surface flex h-full items-center justify-between px-8 pt-1 text-[15px] font-medium tabular-nums">
      <span>9:41</span>
      <span className="flex items-center gap-1.5" aria-hidden="true">
        <svg width="18" height="11" viewBox="0 0 18 11" fill="currentColor">
          <rect x="0" y="7" width="3" height="4" rx="1" />
          <rect x="5" y="5" width="3" height="6" rx="1" />
          <rect x="10" y="2.5" width="3" height="8.5" rx="1" />
          <rect x="15" y="0" width="3" height="11" rx="1" />
        </svg>
        <svg width="25" height="12" viewBox="0 0 25 12" fill="none">
          <rect x="0.5" y="0.5" width="21" height="11" rx="3" stroke="currentColor" opacity="0.45" />
          <rect x="2" y="2" width="16" height="8" rx="1.8" fill="currentColor" />
          <rect x="23" y="4" width="1.6" height="4" rx="0.8" fill="currentColor" opacity="0.45" />
        </svg>
      </span>
    </div>
  );
}

export type FrameProps = {
  device: DeviceKind | "auto";
  bare?: boolean;
  url: string;
  vars?: FrameVars;
  frameRef?: Ref<HTMLDivElement>;
  contentRef?: Ref<HTMLDivElement>;
  overlay?: ReactNode;
  children: ReactNode;
};

export function Frame({
  device,
  bare = false,
  url,
  vars,
  frameRef,
  contentRef,
  overlay,
  children,
}: FrameProps) {
  const auto = device === "auto" && !vars;
  const style = auto
    ? undefined
    : (frameStyle(vars ?? presetFor(device === "auto" ? "desktop" : device, bare)) as CSSProperties);
  return (
    <div
      ref={frameRef}
      className="th-frame"
      data-auto={auto ? (bare ? "bare-auto" : "auto") : undefined}
      data-bare={bare || undefined}
      style={style}
    >
      {!bare && (
        <>
          <div className="th-shell" />
          <div className="th-bezel" />
          <div className="th-bar">
            <BrowserBar url={url} />
          </div>
        </>
      )}
      <div className="th-screen">
        {!bare && (
          <div className="th-status">
            <StatusBar />
          </div>
        )}
        <div ref={contentRef} className="th-content">
          {children}
          {overlay}
        </div>
        {!bare && <div className="th-safe" />}
        {!bare && (
          <div className="pointer-events-none absolute inset-0 z-[60]" aria-hidden="true">
            <span className="th-island absolute top-3 left-1/2 h-[30px] w-[110px] -translate-x-1/2 rounded-full bg-[#15171a]" />
            <span className="th-home bg-on-surface/60 absolute bottom-2 left-1/2 h-[5px] w-[132px] -translate-x-1/2 rounded-full" />
          </div>
        )}
      </div>
    </div>
  );
}
