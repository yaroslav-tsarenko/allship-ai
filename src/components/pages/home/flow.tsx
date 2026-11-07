import { Container } from "@/components/marketing/section";
import { TheaterTabs } from "@/components/theater";
import { FlowBook, FlowPaid, FlowPost, FlowRoad } from "@/components/theater/illustrations";
import { site } from "@/content/site";
import { feeExample, homeFlow, type FlowStage } from "./content";
import { eyebrow, sectionTitle } from "./shared";

const amounts = { bid: feeExample.bid, fee: feeExample.fee, total: feeExample.total, percent: feeExample.percent };

const figureClass = "mx-auto w-full max-w-[480px]";

function StageFigure({ stage }: { stage: FlowStage["key"] }) {
  if (stage === "post") return <FlowPost className={figureClass} />;
  if (stage === "book") return <FlowBook amounts={amounts} className={figureClass} />;
  if (stage === "road") return <FlowRoad className={figureClass} />;
  return <FlowPaid payout={feeExample.bid} hours={site.autoConfirmHours} className={figureClass} />;
}

const starts = homeFlow.map((_, i) => homeFlow.slice(0, i).reduce((sum, s) => sum + s.steps.length, 0));
const total = homeFlow.reduce((sum, s) => sum + s.steps.length, 0);
const words = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen"];

export function HomeFlow() {
  return (
    <section aria-labelledby="home-flow" className="border-t border-outline-variant bg-surface-container-lowest py-16 medium:py-24">
      <Container>
        <div className="grid grid-cols-[minmax(0,1fr)] gap-x-16 gap-y-6 large:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] large:items-end">
          <div>
            <p className={eyebrow}>How it works</p>
            <h2 id="home-flow" className={`mt-3 ${sectionTitle}`}>
              From posting to payout in {words[total] ?? total} steps
            </h2>
          </div>
          <p className="max-w-[60ch] text-body-lg text-pretty text-on-surface-variant medium:text-body-xl">
            Here is everything that happens to a load, in order. Each step says what you see, and under the hood, what AllShip AI does in the background and why.
          </p>
        </div>
        <div className="mt-12 flex flex-col">
          {homeFlow.map((stage, si) => {
            return (
              <div key={stage.key} className="grid grid-cols-[minmax(0,1fr)] gap-x-16 gap-y-8 border-t border-outline-variant py-10 large:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] large:py-14">
                <div className="large:sticky large:top-24 large:self-start">
                  <p className="font-mono text-label-lg text-on-surface-variant">
                    Stage {si + 1} of {homeFlow.length} · {stage.label}
                  </p>
                  <h3 className="mt-2 text-headline-sm text-balance text-on-surface">{stage.title}</h3>
                  <figure className="mt-6 min-w-0">
                    <div className="rounded-lg bg-surface-container-low p-2 medium:p-6">
                      <StageFigure stage={stage.key} />
                    </div>
                    <figcaption className="sr-only">{stage.figure}</figcaption>
                  </figure>
                </div>
                <ol className="flex flex-col">
                  {stage.steps.map((step, i) => {
                    const n = (starts[si] ?? 0) + i + 1;
                    return (
                      <li key={step.title} value={n} className="grid grid-cols-[3rem_minmax(0,1fr)] gap-x-2 border-b border-outline-variant py-6 first:pt-0 last:border-b-0">
                        <span aria-hidden="true" className="font-mono text-title-lg text-primary tabular-nums">
                          {String(n).padStart(2, "0")}
                        </span>
                        <div className="min-w-0">
                          <h4 className="text-title-lg text-on-surface">{step.title}</h4>
                          <p className="mt-1 max-w-[62ch] text-body-lg text-pretty text-on-surface-variant">{step.text}</p>
                          <div className="mt-4 border-l-2 border-outline pl-4">
                            <p className="font-mono text-label-md tracking-wide text-on-surface-variant uppercase">Under the hood</p>
                            <p className="mt-1 max-w-[62ch] text-body-md text-pretty text-on-surface">{step.hood}</p>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>
            );
          })}
        </div>
        <div className="border-t border-outline-variant pt-10">
          <h3 className="text-title-lg text-on-surface">Watch it in the product</h3>
          <p className="mt-1 max-w-[60ch] text-body-md text-pretty text-on-surface-variant">The same flow in the real AllShip AI screens, with sample data. Pick a step.</p>
          <TheaterTabs
            className="mt-6"
            label="How AllShip AI works"
            tabs={[
              { scene: "postLoad", label: "Post" },
              { scene: "bidsCompare", label: "Compare" },
              { scene: "liveTracking", label: "Track" },
            ]}
          />
        </div>
      </Container>
    </section>
  );
}
