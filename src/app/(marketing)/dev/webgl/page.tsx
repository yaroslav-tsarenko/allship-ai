import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/marketing/section";
import { PinnedRow, ScrubWords, SectionProgress } from "@/components/motion/scroll";
import { RouteField } from "@/components/webgl/route-field";
import { RouteFieldPoster } from "@/components/webgl/poster";

export const metadata: Metadata = { title: "RouteField gallery", robots: { index: false, follow: false } };

const variants = [
  { variant: "hero", note: "Hero backdrop. Camera tilts from perspective toward plan view as the section scrolls away." },
  { variant: "section", note: "Quieter band for CTA or statement sections. Tilt follows the section through the viewport." },
  { variant: "plan", note: "Top-down route map with a slight drift while in view." },
] as const;

export default function WebglGallery() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <>
      <Container className="py-10">
        <h1 className="text-display-sm">RouteField</h1>
        <p className="mt-3 max-w-[70ch] text-body-lg text-on-surface-variant">
          Append <code className="font-mono">?webgl=force</code> to skip the software-renderer and save-data bail-outs, <code className="font-mono">?webgl=off</code> to see only the static poster,{" "}
          <code className="font-mono">?webgl-t=12</code> to freeze a frame.
        </p>
      </Container>
      {variants.map(({ variant, note }) => (
        <section key={variant} className="border-t border-outline-variant">
          <Container className="py-6">
            <p className="inline-flex rounded-xs bg-tertiary-container px-2 py-1 font-mono text-body-sm text-on-tertiary-container">variant=&quot;{variant}&quot;</p>
            <p className="mt-2 text-body-md text-on-surface-variant">{note}</p>
          </Container>
          <div className="relative h-[80svh] min-h-[480px]">
            <RouteField variant={variant} />
          </div>
        </section>
      ))}
      <section className="border-t border-outline-variant">
        <Container className="py-6">
          <p className="inline-flex rounded-xs bg-tertiary-container px-2 py-1 font-mono text-body-sm text-on-tertiary-container">Static posters (no-WebGL fallback)</p>
        </Container>
        <div className="grid gap-px bg-outline-variant medium:grid-cols-3">
          {variants.map(({ variant }) => (
            <div key={variant} className="relative aspect-video bg-surface">
              <RouteFieldPoster variant={variant} />
            </div>
          ))}
        </div>
      </section>
      <section data-scrub-scope="" className="relative h-[220svh] border-t border-outline-variant">
        <div className="sticky top-16 flex h-[calc(100svh-4rem)] items-center">
          <Container>
            <p className="font-mono text-body-sm text-on-surface-variant">ScrubWords inside data-scrub-scope</p>
            <ScrubWords
              className="mt-4 max-w-[22ch] text-display-sm tracking-tight medium:text-display-lg"
              text="Carriers bid on your load, you pick one, and the payment waits in escrow until delivery."
              accent={["bid", "escrow"]}
            />
          </Container>
        </div>
      </section>
      <section className="border-t border-outline-variant py-16">
        <Container>
          <p className="font-mono text-body-sm text-on-surface-variant">PinnedRow + SectionProgress + data-speed</p>
          <SectionProgress className="mt-4" />
        </Container>
        <PinnedRow className="mt-8" label="Example row">
          {Array.from({ length: 7 }, (_, i) => (
            <div key={i} className="flex h-72 w-[min(80vw,420px)] shrink-0 flex-col justify-end rounded-lg border border-outline-variant bg-surface-container-low p-6">
              <span className="text-display-sm text-primary" data-speed={i % 2 ? "0.15" : "-0.1"}>
                0{i + 1}
              </span>
              <span className="text-body-md text-on-surface-variant">Card {i + 1}</span>
            </div>
          ))}
        </PinnedRow>
      </section>
      <div className="h-[60svh]" />
    </>
  );
}
