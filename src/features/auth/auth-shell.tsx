import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/ui/logo";
import { RevealText } from "@/components/motion/reveal-text";
import { enter } from "@/components/motion/enter";

export function AuthShell({ title, description, children, aside }: { title: string; description?: ReactNode; children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-surface-container-low px-4 py-6 medium:py-12">
      <main className="mx-auto grid w-full max-w-[1040px] flex-1 content-start medium:content-center">
        <div className="grid animate-enter gap-8 rounded-xl bg-surface p-6 medium:p-10 expanded:grid-cols-[1fr_1.1fr] expanded:gap-12">
          <div className="flex flex-col gap-4">
            <Logo height={28} />
            <h1 className="mt-4 text-headline-lg text-on-surface expanded:text-display-sm">
              <RevealText delay={120}>{title}</RevealText>
            </h1>
            {description && (
              <div className="text-body-lg text-on-surface-variant" {...enter(2)}>
                {description}
              </div>
            )}
            {aside && <div {...enter(3)}>{aside}</div>}
          </div>
          <div className="flex flex-col gap-5" {...enter(3)}>
            {children}
          </div>
        </div>
      </main>
      <footer {...enter(5)} className="mx-auto mt-4 flex w-full max-w-[1040px] flex-wrap justify-between gap-2 px-2 text-body-sm text-on-surface-variant">
        <span>English (United States)</span>
        <nav aria-label="Legal" className="flex gap-1">
          <Link href={"/contact-us"} className="rounded-xs px-3 py-2 transition-colors duration-(--duration-short3) hover:bg-on-surface/8">Help</Link>
          <Link href={"/privacy-policy"} className="rounded-xs px-3 py-2 transition-colors duration-(--duration-short3) hover:bg-on-surface/8">Privacy</Link>
          <Link href={"/terms-and-conditions"} className="rounded-xs px-3 py-2 transition-colors duration-(--duration-short3) hover:bg-on-surface/8">Terms</Link>
        </nav>
      </footer>
    </div>
  );
}
