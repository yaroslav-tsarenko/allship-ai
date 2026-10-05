import { Container } from "@/components/marketing/section";
import { authLinks } from "@/content/site";
import { CtaButtons } from "./cta-buttons";
import { sectionId, type Cta } from "./types";

export const defaultReadyCtas: Cta[] = [
  { label: "Become Shipper", href: authLinks.signUp.href, variant: "filled" },
  { label: "Rent Truck", href: "/rent-truck", variant: "outlined" },
];

export function ReadyToGetStarted({
  title = "Ready to get started?",
  description = "Create a free account, post your load and compare bids from verified carriers.",
  ctas = defaultReadyCtas,
  id,
}: {
  title?: string;
  description?: string;
  ctas?: Cta[];
  id?: string;
}) {
  const headingId = id ?? sectionId("cta", title);
  return (
    <section aria-labelledby={headingId} className="py-12 medium:py-16">
      <Container>
        <div className="flex flex-col gap-8 rounded-xl bg-primary px-6 py-10 text-on-primary medium:px-12 medium:py-14 large:flex-row large:items-center large:justify-between">
          <div className="max-w-[640px]">
            <h2 id={headingId} className="text-headline-lg font-normal text-balance medium:text-display-sm">
              {title}
            </h2>
            {description && <p className="mt-4 text-body-lg text-pretty text-on-primary/90 medium:text-title-lg medium:font-normal">{description}</p>}
          </div>
          <CtaButtons ctas={ctas} onDark className="shrink-0" />
        </div>
      </Container>
    </section>
  );
}
