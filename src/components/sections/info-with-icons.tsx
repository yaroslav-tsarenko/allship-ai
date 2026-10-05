import { Container } from "@/components/marketing/section";
import { Icon } from "@/components/ui/icon";
import { checkCircleIcon } from "@/components/ui/icons.generated";
import { cn } from "@/lib/cn";
import { SectionHeader } from "./section-header";
import { sectionId, type IconItem } from "./types";

export function InfoWithIcons({ title, description, items, columns = 3, id, tone = "surface" }: { title: string; description?: string; items: IconItem[]; columns?: 2 | 3 | 4; id?: string; tone?: "surface" | "low" }) {
  const headingId = id ?? sectionId("info", title);
  return (
    <section aria-labelledby={headingId} className={cn("py-14 medium:py-20", tone === "low" && "bg-surface-container-low")}>
      <Container>
        <SectionHeader id={headingId} title={title} description={description} className="mb-10" />
        <ul className={cn("grid gap-x-8 gap-y-8 medium:grid-cols-2", columns === 3 && "large:grid-cols-3", columns === 4 && "large:grid-cols-4")}>
          {items.map((item) => (
            <li key={item.title} className="flex gap-4 border-t border-outline-variant pt-5">
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-md bg-secondary-container text-on-secondary-container">{item.icon ?? <Icon icon={checkCircleIcon} size={22} />}</span>
              <div>
                <h3 className="text-title-md text-on-surface">{item.title}</h3>
                {item.subtitle && <p className="mt-1 text-body-md text-pretty text-on-surface-variant">{item.subtitle}</p>}
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
