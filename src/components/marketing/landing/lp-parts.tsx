import Link from "next/link";
import type { ReactNode } from "react";
import { Faq, type FaqItem } from "@/components/marketing/faq";
import { Container } from "@/components/marketing/section";
import { Theater, type SceneId } from "@/components/theater";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import {
  lockClockIcon,
  receiptLongIcon,
  verifiedUserIcon,
  type IconData,
} from "@/components/ui/icons.generated";
import { site } from "@/content/site";
import { cn } from "@/lib/cn";

const trust: Array<{ icon: IconData; title: string; text: string }> = [
  {
    icon: lockClockIcon,
    title: "Escrow through Stripe",
    text: "Your payment is released to the carrier only after delivery.",
  },
  {
    icon: verifiedUserIcon,
    title: "FMCSA-verified carriers",
    text: "USDOT and operating authority checked before anyone can bid.",
  },
  {
    icon: receiptLongIcon,
    title: `${site.platformFeePercent}% fee, shown upfront`,
    text: "You see the carrier price and our fee before you pay.",
  },
];

export function TrustRow({ className, items = trust }: { className?: string; items?: typeof trust }) {
  return (
    <ul className={cn("medium:grid-cols-3 medium:gap-8 grid gap-6", className)}>
      {items.map((t) => (
        <li key={t.title} className="flex gap-4">
          <Icon icon={t.icon} size={24} className="text-primary mt-0.5 shrink-0" />
          <div>
            <p className="text-title-md text-on-surface">{t.title}</p>
            <p className="text-body-md text-on-surface-variant mt-1">{t.text}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function StickyCta({ href, label, note }: { href: string; label: string; note?: string }) {
  return (
    <div className="border-outline-variant bg-surface shadow-elevation-2 expanded:hidden fixed inset-x-0 bottom-0 z-40 border-t px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="flex items-center gap-3">
        {note && <p className="text-body-sm text-on-surface-variant min-w-0 flex-1">{note}</p>}
        <Button asChild size="lg" className={cn(note ? "shrink-0" : "w-full")}>
          <Link href={href}>{label}</Link>
        </Button>
      </div>
    </div>
  );
}

export function LpFaq({ items, title = "Common questions" }: { items: FaqItem[]; title?: string }) {
  return (
    <section aria-labelledby="lp-faq" className="medium:py-20 py-14">
      <Container width="narrow">
        <h2 id="lp-faq" className="text-headline-md medium:text-headline-lg mb-6 font-normal">
          {title}
        </h2>
        <Faq items={items} schema={false} />
      </Container>
    </section>
  );
}

export function Steps({
  steps,
  className,
}: {
  steps: Array<{ title: string; text: ReactNode }>;
  className?: string;
}) {
  return (
    <ol className={cn("flex flex-col", className)}>
      {steps.map((s, i) => (
        <li
          key={s.title}
          className="border-outline-variant grid grid-cols-[40px_minmax(0,1fr)] gap-4 border-t py-5 first:border-t-0 first:pt-0"
        >
          <span
            className="bg-secondary-container text-title-md text-on-secondary-container flex size-10 items-center justify-center rounded-full font-mono"
            aria-hidden="true"
          >
            {i + 1}
          </span>
          <div>
            <h3 className="text-title-lg text-on-surface">{s.title}</h3>
            <p className="text-body-lg text-on-surface-variant mt-1">{s.text}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function CallLine({ className }: { className?: string }) {
  return (
    <p className={cn("text-body-md text-on-surface-variant", className)}>
      Prefer to talk?{" "}
      <a
        href={site.phone.href}
        className="text-primary font-medium hover:underline"
        data-track="click_to_call"
      >
        Call {site.phone.display}
      </a>
    </p>
  );
}

const shipperSteps = [
  { title: "Post it free", text: "Route, dates and the details carriers price on. Takes a few minutes." },
  {
    title: "Compare bids",
    text: "Each bid shows the carrier's price, dates, FMCSA status and reviews from completed loads.",
  },
  {
    title: "Book and pay into escrow",
    text: `You pay the bid plus our ${site.platformFeePercent}% fee. The carrier is paid after delivery.`,
  },
];

export function LpTheater({
  id = "lp-how",
  scene = "bidsCompare",
  title = "How it works",
  lead,
  steps = shipperSteps,
}: {
  id?: string;
  scene?: SceneId;
  title?: string;
  lead?: ReactNode;
  steps?: Array<{ title: string; text: ReactNode }>;
}) {
  return (
    <section aria-labelledby={id} className="medium:py-20 py-14">
      <Container className="large:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] large:items-center large:gap-16 grid gap-10">
        <div>
          <h2 id={id} className="text-headline-md medium:text-headline-lg font-normal text-balance">
            {title}
          </h2>
          {lead && <p className="text-body-lg text-on-surface-variant mt-3">{lead}</p>}
          <Steps steps={steps} className="mt-8" />
        </div>
        <div className="min-w-0">
          <Theater scene={scene} caption="Product demo with illustrative data." />
        </div>
      </Container>
    </section>
  );
}
