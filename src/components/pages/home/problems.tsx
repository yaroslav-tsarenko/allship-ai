import { Container } from "@/components/marketing/section";
import { ProblemsSplit } from "@/components/theater/illustrations";
import { Icon } from "@/components/ui/icon";
import { arrowForwardIcon } from "@/components/ui/icons.generated";
import { cn } from "@/lib/cn";
import { homeProblems } from "./content";
import { eyebrow, sectionTitle } from "./shared";

export function HomeProblems() {
  return (
    <section aria-labelledby="home-problems" className="bg-surface-container-low py-16 medium:py-24">
      <Container>
        <div className="grid grid-cols-[minmax(0,1fr)] gap-x-16 gap-y-8 large:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] large:items-end">
          <div>
            <p className={eyebrow}>Problems we solve</p>
            <h2 id="home-problems" className={`mt-3 ${sectionTitle}`}>
              What usually goes wrong, and what we built instead
            </h2>
            <p className="mt-4 max-w-[52ch] text-body-lg text-pretty text-on-surface-variant">
              Most shipping trouble comes from not knowing who you are dealing with or where your money is. Each fix below is something the product does today.
            </p>
          </div>
          <figure className="min-w-0">
            <ProblemsSplit
              className="w-full rounded-lg bg-surface p-3 medium:p-5"
              title="Left: a person calling several companies and getting different prices, a deposit request and a company with no USDOT number. Right: one posted load with three bids side by side and a verified check."
            />
            <figcaption className="mt-3 text-body-sm text-on-surface-variant">The usual way versus one posted load. Amounts are examples.</figcaption>
          </figure>
        </div>
        <div className="mt-12 hidden grid-cols-[7rem_minmax(0,5fr)_2rem_minmax(0,6fr)] gap-x-6 border-b border-outline-variant pb-3 text-label-lg text-on-surface-variant large:grid" aria-hidden="true">
          <span>Who</span>
          <span>The problem</span>
          <span />
          <span>What AllShip AI does</span>
        </div>
        <ol className="mt-8 large:mt-0">
          {homeProblems.map((p, i) => (
            <li
              key={p.problem}
              className={cn(
                "grid grid-cols-[minmax(0,1fr)] gap-x-6 gap-y-2 border-b border-outline-variant py-6 large:grid-cols-[7rem_minmax(0,5fr)_2rem_minmax(0,6fr)]",
                i === 0 && "border-t large:border-t-0",
              )}
            >
              <span className={cn("self-start text-label-lg font-medium", p.who === "Carrier" ? "text-tertiary" : "text-primary")}>{p.who}</span>
              <div>
                <h3 className="text-title-lg text-on-surface">{p.problem}</h3>
                <p className="mt-1 text-body-md text-pretty text-on-surface-variant">{p.detail}</p>
              </div>
              <Icon icon={arrowForwardIcon} size={20} className="mt-1 hidden text-on-surface-variant large:block" />
              <p className="mt-2 border-l-2 border-primary pl-3 text-body-lg text-pretty text-on-surface large:mt-0 large:border-l-0 large:pl-0">
                <span className="block text-label-lg text-primary large:sr-only">What AllShip AI does </span>
                {p.fix}
              </p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
