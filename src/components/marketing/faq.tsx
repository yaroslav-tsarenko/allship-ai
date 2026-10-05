import { Icon } from "@/components/ui/icon";
import { keyboardArrowDownIcon } from "@/components/ui/icons.generated";
import { cn } from "@/lib/cn";
import { JsonLd, jsonLd } from "@/lib/seo";

export type FaqItem = { question: string; answer: string };

export function Faq({ items, className, schema = true }: { items: FaqItem[]; className?: string; schema?: boolean }) {
  return (
    <div className={cn("border-t border-outline-variant", className)}>
      {schema && <JsonLd data={jsonLd.faq(items)} />}
      {items.map((item) => (
        <details key={item.question} className="m3-details group border-b border-outline-variant">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-title-md text-on-surface transition-colors duration-(--duration-short4) marker:hidden hover:text-primary [&::-webkit-details-marker]:hidden">
            <span className="text-pretty">{item.question}</span>
            <Icon icon={keyboardArrowDownIcon} className="shrink-0 text-on-surface-variant transition-transform duration-(--duration-medium2) ease-(--ease-emphasized) group-open:rotate-180" />
          </summary>
          <p className="pr-10 pb-6 text-body-lg text-pretty whitespace-pre-line text-on-surface-variant">{item.answer}</p>
        </details>
      ))}
    </div>
  );
}
