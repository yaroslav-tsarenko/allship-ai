import Link from "next/link";
import { Container } from "@/components/marketing/section";
import { UsMap } from "@/components/theater/illustrations";
import { Icon } from "@/components/ui/icon";
import { arrowForwardIcon } from "@/components/ui/icons.generated";
import { categories } from "@/content/categories";
import { site } from "@/content/site";
import { homeAbout } from "./content";
import { getLiveBoardStats } from "./live-stats";
import { eyebrow, sectionTitle } from "./shared";

const link = "font-medium text-primary underline-offset-4 hover:underline";

export async function HomeAbout() {
  const { carrierStates } = await getLiveBoardStats();
  const { address } = site;
  const facts = [
    { term: "Company", value: <>{site.legalName}</> },
    {
      term: "Office",
      value: (
        <address className="not-italic">
          {address.street}, {address.city}, {address.region} {address.postalCode}
        </address>
      ),
    },
    {
      term: "Phone",
      value: (
        <a href={site.phone.href} className={link} data-track="click_to_call">
          {site.phone.display}
        </a>
      ),
    },
    {
      term: "Email",
      value: (
        <a href={`mailto:${site.email}`} className={link}>
          {site.email}
        </a>
      ),
    },
    { term: "What moves", value: <>{categories.length} load categories, from a single sofa to an excavator</> },
    {
      term: "Elsewhere",
      value: (
        <span className="flex flex-wrap gap-x-3">
          {site.socials.map((s) => (
            <a key={s.name} href={s.href} target="_blank" rel="noopener noreferrer" className={link}>
              {s.name}
            </a>
          ))}
        </span>
      ),
    },
  ];
  return (
    <section aria-labelledby="home-about" className="border-t border-outline-variant py-16 medium:py-24">
      <Container className="grid grid-cols-[minmax(0,1fr)] gap-x-16 gap-y-10 large:grid-cols-[minmax(0,6fr)_minmax(0,6fr)] large:items-center">
        <div>
          <p className={eyebrow}>{homeAbout.eyebrow}</p>
          <h2 id="home-about" className={`mt-3 ${sectionTitle}`}>
            {homeAbout.title}
          </h2>
          {homeAbout.paragraphs.map((p) => (
            <p key={p} className="mt-4 max-w-[60ch] text-body-lg text-pretty text-on-surface-variant">
              {p}
            </p>
          ))}
          <dl className="mt-8 grid grid-cols-[minmax(0,1fr)] border-t border-outline-variant medium:grid-cols-[9rem_minmax(0,1fr)]">
            {facts.map((f) => (
              <div key={f.term} className="contents">
                <dt className="pt-3 text-label-lg text-on-surface-variant medium:border-b medium:border-outline-variant medium:py-3">{f.term}</dt>
                <dd className="border-b border-outline-variant pb-3 text-body-lg text-on-surface medium:py-3">{f.value}</dd>
              </div>
            ))}
          </dl>
          <Link href="/about" className="mt-6 inline-flex items-center gap-1 rounded-xs text-label-lg font-medium text-primary underline-offset-4 hover:underline">
            More about AllShip AI
            <Icon icon={arrowForwardIcon} size={16} />
          </Link>
        </div>
        <figure className="min-w-0">
          <UsMap
            className="w-full"
            title={`Map of the United States with the AllShip AI office marked in ${address.city}, Delaware, and example freight lanes between cities`}
          />
          <figcaption className="mt-4 border-l-2 border-primary pl-3 text-body-md text-pretty text-on-surface-variant">
            Office in {address.city}, Delaware. Loads can be posted anywhere in the US; the lanes on the map are examples.
            {carrierStates > 0 && (
              <>
                {" "}
                Verified carriers on the platform currently serve <span className="font-medium text-on-surface tabular-nums">{carrierStates}</span>{" "}
                {carrierStates === 1 ? "state" : "states"}.
              </>
            )}
          </figcaption>
        </figure>
      </Container>
    </section>
  );
}
