import type { ReactNode } from "react";
import { enter as enterProps } from "@/components/motion/enter";
import { RevealText } from "@/components/motion/reveal-text";
import { cn } from "@/lib/cn";

type Tone = "surface" | "low" | "container" | "inverse" | "primary";
type Spacing = "none" | "sm" | "md" | "lg" | "xl";

const tones: Record<Tone, string> = {
  surface: "bg-surface text-on-surface",
  low: "bg-surface-container-low text-on-surface",
  container: "bg-surface-container text-on-surface",
  inverse: "bg-inverse-surface text-inverse-on-surface",
  primary: "bg-primary text-on-primary",
};

const spacings: Record<Spacing, string> = {
  none: "",
  sm: "py-10 medium:py-12",
  md: "py-14 medium:py-20",
  lg: "py-16 medium:py-24 large:py-28",
  xl: "py-20 medium:py-28 large:py-36",
};

export function Container({ children, className, width = "default" }: { children: ReactNode; className?: string; width?: "default" | "narrow" | "wide" | "prose" }) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 medium:px-8",
        width === "default" && "max-w-[1280px]",
        width === "wide" && "max-w-[1440px]",
        width === "narrow" && "max-w-[960px]",
        width === "prose" && "max-w-[760px]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Section({
  children,
  tone = "surface",
  spacing = "lg",
  className,
  id,
  labelledBy,
  container = true,
  width,
}: {
  children: ReactNode;
  tone?: Tone;
  spacing?: Spacing;
  className?: string;
  id?: string;
  labelledBy?: string;
  container?: boolean;
  width?: "default" | "narrow" | "wide" | "prose";
}) {
  return (
    <section id={id} aria-labelledby={labelledBy} className={cn(tones[tone], spacings[spacing], className)}>
      {container ? <Container width={width}>{children}</Container> : children}
    </section>
  );
}

export function Eyebrow({ children, className, enter }: { children: ReactNode; className?: string; enter?: number }) {
  return (
    <p className={cn("text-title-sm font-medium text-primary", className)} {...(enter === undefined ? {} : enterProps(enter))}>
      {children}
    </p>
  );
}

export function DisplayHeading({ children, className, as: Tag = "h1", id, enter }: { children: ReactNode; className?: string; as?: "h1" | "h2"; id?: string; enter?: number }) {
  return (
    <Tag id={id} className={cn("text-display-sm font-normal tracking-tight text-balance medium:text-display-md large:text-display-xl", className)}>
      {enter === undefined ? children : <RevealText delay={enter * 70}>{children}</RevealText>}
    </Tag>
  );
}

export function SectionHeading({ children, className, id, as: Tag = "h2" }: { children: ReactNode; className?: string; id?: string; as?: "h2" | "h3" }) {
  return (
    <Tag id={id} className={cn("text-headline-lg font-normal text-balance medium:text-display-sm", className)}>
      {children}
    </Tag>
  );
}

export function Lead({ children, className, enter }: { children: ReactNode; className?: string; enter?: number }) {
  return (
    <p className={cn("text-body-lg text-pretty text-on-surface-variant medium:text-title-lg medium:font-normal", className)} {...(enter === undefined ? {} : enterProps(enter))}>
      {children}
    </p>
  );
}
