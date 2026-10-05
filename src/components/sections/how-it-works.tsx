import { legacyVideos } from "@/assets/legacy";
import { Container } from "@/components/marketing/section";
import { Icon } from "@/components/ui/icon";
import { keyboardArrowDownIcon } from "@/components/ui/icons.generated";
import { LazyVideo } from "./lazy-video";
import { SectionHeader } from "./section-header";
import { sectionId, type StepItem } from "./types";

type Video = { src: string; poster: string; width: number; height: number; label?: string };

export function HowItWorks({
  title = "How It Works",
  description,
  items,
  video = legacyVideos.howItWorksDemo,
  id,
  tone = "low",
}: {
  title?: string;
  description?: string;
  items: StepItem[];
  video?: Video | null;
  id?: string;
  tone?: "surface" | "low";
}) {
  const headingId = id ?? sectionId("how", title);
  const group = `${headingId}-steps`;
  return (
    <section aria-labelledby={headingId} className={tone === "low" ? "bg-surface-container-low py-16 medium:py-24" : "py-16 medium:py-24"}>
      <Container>
        <SectionHeader id={headingId} title={title} description={description} className="mb-12" />
        <div className={video ? "grid gap-10 large:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] large:items-start large:gap-14" : ""}>
          {video && <LazyVideo src={video.src} poster={video.poster} width={video.width} height={video.height} label={video.label ?? "AllShip AI product walkthrough"} className="aspect-video rounded-xl shadow-elevation-1" />}
          <ol className="border-t border-outline-variant">
            {items.map((item, i) => (
              <li key={item.title} className="border-b border-outline-variant">
                <details name={group} open={i === 0} className="m3-details group">
                  <summary className="flex cursor-pointer list-none items-center gap-5 py-5 marker:hidden [&::-webkit-details-marker]:hidden">
                    <span className="font-mono text-title-lg text-on-surface-variant group-open:text-primary">{String(i + 1).padStart(2, "0")}</span>
                    <span className="flex-1 text-title-lg text-on-surface">{item.title}</span>
                    <Icon icon={keyboardArrowDownIcon} className="shrink-0 text-on-surface-variant transition-transform duration-(--duration-medium2) ease-(--ease-emphasized) group-open:rotate-180" />
                  </summary>
                  <p className="pb-6 pl-[3.25rem] text-body-lg text-pretty text-on-surface-variant">{item.description}</p>
                </details>
              </li>
            ))}
          </ol>
        </div>
      </Container>
    </section>
  );
}
