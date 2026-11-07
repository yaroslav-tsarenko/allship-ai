import Link from "next/link";
import { Container } from "@/components/marketing/section";
import { RouteCompare } from "@/components/theater/illustrations";
import { Icon } from "@/components/ui/icon";
import { arrowForwardIcon, checkCircleIcon } from "@/components/ui/icons.generated";
import { cn } from "@/lib/cn";
import { homeCompare } from "./content";
import { eyebrow, sectionTitle } from "./shared";

export function HomeCompare() {
  return (
    <section aria-labelledby="home-compare" className="border-t border-outline-variant py-16 medium:py-24">
      <Container>
        <div className="grid grid-cols-[minmax(0,1fr)] gap-x-16 gap-y-10 large:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]">
          <div className="large:sticky large:top-24 large:self-start">
            <p className={eyebrow}>Why choose us</p>
            <h2 id="home-compare" className={`mt-3 ${sectionTitle}`}>
              How we compare with the other ways to book
            </h2>
            <p className="mt-4 text-body-lg text-pretty text-on-surface-variant">
              A check means it is built into AllShip AI and works on every load. The other columns describe how these options usually work, not any specific company.
            </p>
            <figure className="mt-8">
              <RouteCompare className="w-full max-w-[360px]" />
              <figcaption className="mt-3 text-body-sm text-pretty text-on-surface-variant">
                Four routes to the same delivery. Ours is the straight one, with verification, escrow and tracking on the way.
              </figcaption>
            </figure>
          </div>
          <div className="min-w-0">
            <div className="-mx-4 overflow-x-auto px-4 medium:mx-0 medium:px-0" tabIndex={0} role="region" aria-labelledby="home-compare">
              <table className="w-full min-w-[720px] border-separate border-spacing-0 text-left">
                <thead>
                  <tr>
                    <th scope="col" className="sticky left-0 z-[1] border-b border-outline-variant bg-surface py-3 pr-4 text-label-lg font-normal text-on-surface-variant">
                      <span className="sr-only">What matters</span>
                    </th>
                    {homeCompare.columns.map((c, i) => (
                      <th
                        key={c}
                        scope="col"
                        className={cn(
                          "border-b px-4 py-3 text-title-sm",
                          i === 0 ? "rounded-t-md border-primary bg-primary text-on-primary" : "border-outline-variant text-on-surface-variant",
                        )}
                      >
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {homeCompare.rows.map((row) => (
                    <tr key={row.label}>
                      <th scope="row" className="sticky left-0 z-[1] max-w-[13rem] border-b border-outline-variant bg-surface py-4 pr-4 text-body-lg font-medium text-pretty text-on-surface">
                        {row.label}
                      </th>
                      {row.cells.map((cell, ci) => (
                        <td
                          key={ci}
                          className={cn(
                            "border-b px-4 py-4 align-top text-body-md text-pretty",
                            ci === 0 ? "border-primary/20 bg-primary/8 text-on-surface" : "border-outline-variant text-on-surface-variant",
                          )}
                        >
                          {cell.yes ? (
                            <span className="flex gap-2 font-medium">
                              <Icon icon={checkCircleIcon} filled size={20} className="shrink-0 text-primary" />
                              <span>
                                <span className="sr-only">Yes: </span>
                                {cell.text}
                              </span>
                            </span>
                          ) : (
                            cell.text
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-body-md text-pretty text-on-surface-variant">
              Calling movers yourself costs no platform fee. What you pay for here is verification, escrow and one place for the whole trip.{" "}
              <Link href="/why-choose-us" className="inline-flex items-center gap-1 font-medium text-primary underline-offset-4 hover:underline">
                Why choose AllShip AI
                <Icon icon={arrowForwardIcon} size={16} />
              </Link>
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
