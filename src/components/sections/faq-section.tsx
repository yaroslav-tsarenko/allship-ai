import { Faq } from "@/components/marketing/faq";
import { Container } from "@/components/marketing/section";
import { SectionHeader } from "./section-header";
import { sectionId, type FaqEntry } from "./types";

export function FAQSection({
  title = "Frequently Asked Questions",
  description,
  items,
  schema = true,
  id,
  tone = "surface",
}: {
  title?: string;
  description?: string;
  items: FaqEntry[];
  schema?: boolean;
  id?: string;
  tone?: "surface" | "low";
}) {
  if (!items.length) return null;
  const headingId = id ?? sectionId("faq", title);
  return (
    <section aria-labelledby={headingId} className={tone === "low" ? "bg-surface-container-low py-16 medium:py-24" : "py-16 medium:py-24"}>
      <Container>
        <div className="grid gap-10 large:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] large:gap-16">
          <SectionHeader id={headingId} title={title} description={description} className="large:sticky large:top-24 large:self-start" />
          <Faq items={items} schema={schema} />
        </div>
      </Container>
    </section>
  );
}
