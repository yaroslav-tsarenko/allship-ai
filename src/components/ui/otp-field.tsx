"use client";

import { OTPInput, REGEXP_ONLY_DIGITS, type SlotProps } from "input-otp";
import { cn } from "@/lib/cn";

function Slot({ char, isActive, hasFakeCaret }: SlotProps) {
  return (
    <div
      className={cn(
        "relative flex h-14 w-12 items-center justify-center rounded-xs border font-mono text-headline-sm text-on-surface transition-[border-color,box-shadow] duration-(--duration-short4) ease-standard",
        isActive ? "border-primary shadow-[inset_0_0_0_1px_var(--md-primary)]" : "border-outline",
      )}
    >
      {char && <span key={char} className="animate-pop-in">{char}</span>}
      {hasFakeCaret && <span className="absolute h-6 w-px animate-pulse bg-on-surface" />}
    </div>
  );
}

export function OtpField({ value, onChange, onComplete, length = 6, label }: { value: string; onChange: (v: string) => void; onComplete?: (v: string) => void; length?: number; label: string }) {
  return (
    <OTPInput
      value={value}
      onChange={onChange}
      onComplete={onComplete}
      maxLength={length}
      pattern={REGEXP_ONLY_DIGITS}
      inputMode="numeric"
      autoComplete="one-time-code"
      aria-label={label}
      autoFocus
      containerClassName="flex gap-2"
      render={({ slots }) => (
        <>
          {slots.map((slot, i) => (
            <Slot key={i} {...slot} />
          ))}
        </>
      )}
    />
  );
}
