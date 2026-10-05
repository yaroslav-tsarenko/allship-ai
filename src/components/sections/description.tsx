import type { ReactNode } from "react";
import { Container } from "@/components/marketing/section";
import { cn } from "@/lib/cn";
import { sectionId, type HeadingLevel } from "./types";

export type DescriptionBlock = {
  title: string;
  id?: string;
  content?: ReactNode;
  paragraphs?: ReactNode[];
  list?: { ordered?: boolean; items: ReactNode[] };
};

function Paragraphs({ content }: { content: ReactNode }) {
  if (typeof content === "string") {
    return content
      .split(/\n{2,}/)
      .filter(Boolean)
      .map((p, i) => <p key={i}>{p}</p>);
  }
  return <>{content}</>;
}

export function Description({
  title,
  as: Tag = "h2",
  eyebrow,
  description,
  sections = [],
  toc,
  aside,
  children,
  id,
  tone = "surface",
  className,
}: {
  title: string;
  as?: HeadingLevel;
  eyebrow?: string;
  description?: ReactNode;
  sections?: DescriptionBlock[];
  toc?: boolean;
  aside?: ReactNode;
  children?: ReactNode;
  id?: string;
  tone?: "surface" | "low";
  className?: string;
}) {
  const headingId = id ?? sectionId("desc", title);
  const blocks = sections.map((s) => ({ ...s, id: s.id ?? sectionId(headingId, s.title) }));
  const showToc = (toc ?? blocks.length >= 5) && blocks.length > 1;
  const SubTag = Tag === "h1" ? "h2" : "h3";
  return (
    <section aria-labelledby={headingId} className={cn(tone === "low" ? "bg-surface-container-low" : "", Tag === "h1" ? "pt-10 pb-14 medium:pt-16 medium:pb-20" : "py-14 medium:py-20", className)}>
      <Container>
        <div className={cn("grid grid-cols-1 gap-10", (showToc || aside) && "large:grid-cols-[260px_minmax(0,1fr)] large:gap-16")}>
          {(showToc || aside) && (
            <div className="order-2 large:order-1">
              <div className="large:sticky large:top-24">
                {showToc && (
                  <nav aria-label={`${title}: contents`} className="hidden large:block">
                    <p className="mb-3 text-title-sm text-on-surface-variant">On this page</p>
                    <ol className="flex flex-col gap-1 border-l border-outline-variant">
                      {blocks.map((b) => (
                        <li key={b.id}>
                          <a href={`#${b.id}`} className="-ml-px block border-l-2 border-transparent py-1.5 pl-4 text-body-md text-on-surface-variant hover:border-primary hover:text-on-surface">
                            {b.title}
                          </a>
                        </li>
                      ))}
                    </ol>
                  </nav>
                )}
                {aside && <div className={showToc ? "mt-8" : ""}>{aside}</div>}
              </div>
            </div>
          )}
          <div className={cn("max-w-[760px]", (showToc || aside) && "order-1 large:order-2")}>
            {eyebrow && <p className="mb-3 text-title-sm font-medium text-primary">{eyebrow}</p>}
            <Tag
              id={headingId}
              className={cn("font-normal text-balance text-on-surface", Tag === "h1" ? "text-display-sm tracking-tight medium:text-display-md" : "text-headline-lg medium:text-display-sm")}
            >
              {title}
            </Tag>
            {description && (
              <div className="mt-6 flex flex-col gap-4 text-body-xl text-pretty text-on-surface-variant">
                <Paragraphs content={description} />
              </div>
            )}
            {blocks.map((b) => (
              <div key={b.id} className="mt-12 scroll-mt-24 border-t border-outline-variant pt-8" id={b.id}>
                <SubTag className="text-headline-sm text-balance text-on-surface">{b.title}</SubTag>
                <div className="mt-4 flex flex-col gap-4 text-body-lg text-pretty text-on-surface-variant">
                  {b.content && <Paragraphs content={b.content} />}
                  {b.paragraphs?.map((p, i) => <p key={i}>{p}</p>)}
                  {b.list &&
                    (b.list.ordered ? (
                      <ol className="flex list-decimal flex-col gap-2 pl-6 marker:text-primary">
                        {b.list.items.map((item, i) => (
                          <li key={i} className="pl-1">
                            {item}
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <ul className="flex list-disc flex-col gap-2 pl-6 marker:text-primary">
                        {b.list.items.map((item, i) => (
                          <li key={i} className="pl-1">
                            {item}
                          </li>
                        ))}
                      </ul>
                    ))}
                </div>
              </div>
            ))}
            {children && <div className="mt-12">{children}</div>}
          </div>
        </div>
      </Container>
    </section>
  );
}
