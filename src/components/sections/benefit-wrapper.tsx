import Image from "next/image";
import Link from "next/link";
import {
  benefitAutomatedDispatchDetail,
  benefitRateComparison,
  benefitRateComparisonDetail,
  benefitRealtimeData,
  benefitRealtimeDataDetail,
  benefitRouteOptimization,
  benefitRouteOptimizationDetail,
  legacyAlt,
} from "@/assets/legacy";
import { Container } from "@/components/marketing/section";
import { Icon } from "@/components/ui/icon";
import { addIcon, arrowForwardIcon } from "@/components/ui/icons.generated";
import { authLinks } from "@/content/site";
import { cn } from "@/lib/cn";
import { FlipPanel } from "./flip-panel";
import { SectionHeader } from "./section-header";
import { sectionId, type Cta, type SectionImage } from "./types";

export type BenefitTone = "primary" | "surface" | "container" | "inverse";

export type BenefitItem = {
  label: string;
  title: string;
  description: string;
  image: SectionImage;
  more?: { text: string; image: SectionImage };
  cta?: Cta;
  tone?: BenefitTone;
};

const startFree: Cta = { label: "Start for free", href: authLinks.signUp.href };

export const defaultBenefits: BenefitItem[] = [
  {
    label: "Efficiency boost",
    title: "AI-optimized supply chain",
    description: "Maximize efficiency with AI insights that suggest the best routes automatically.",
    image: { src: benefitRouteOptimization, alt: legacyAlt.benefitRouteOptimization },
    more: { text: "AI tracks shipments and vehicle availability in real time, optimizing routes and reducing idle time to boost your supply chain's performance.", image: { src: benefitRouteOptimizationDetail, alt: legacyAlt.benefitRouteOptimizationDetail } },
    cta: startFree,
    tone: "primary",
  },
  {
    label: "Smart decisions",
    title: "Real-time data for smarter decisions",
    description: "AllShip AI delivers real-time data on market trends, vehicle availability and load capacity.",
    image: { src: benefitRealtimeData, alt: legacyAlt.benefitRealtimeData },
    more: { text: "AI-powered dashboards give you actionable insight into market conditions, carrier availability and shipment status.", image: { src: benefitRealtimeDataDetail, alt: legacyAlt.benefitRealtimeDataDetail } },
    tone: "surface",
  },
  {
    label: "Automated dispatch",
    title: "Faster dispatch with AI",
    description: "AI matches each load with carriers based on location and load needs, for faster and more reliable shipping.",
    image: { src: benefitRealtimeDataDetail, alt: legacyAlt.benefitRealtimeDataDetail },
    more: { text: "AI keeps assessing carriers and drivers for the best match, so dispatch is quick, delays are reduced and shipments stay reliable.", image: { src: benefitAutomatedDispatchDetail, alt: legacyAlt.benefitAutomatedDispatchDetail } },
    tone: "container",
  },
  {
    label: "Cost savings",
    title: "Compare shipping rates",
    description: "Compare carrier bids side by side and choose the price and service that suit you.",
    image: { src: benefitRateComparison, alt: legacyAlt.benefitRateComparison },
    more: { text: "Carriers compete for your load with their own bids, so you see real prices and pick the best fit for your budget and schedule.", image: { src: benefitRateComparisonDetail, alt: legacyAlt.benefitRateComparisonDetail } },
    cta: startFree,
    tone: "inverse",
  },
];

const tones: Record<BenefitTone, { card: string; label: string; muted: string; button: string }> = {
  primary: { card: "bg-primary text-on-primary", label: "text-on-primary", muted: "text-on-primary/85", button: "bg-on-primary text-primary" },
  surface: { card: "bg-surface-container-lowest text-on-surface ring-1 ring-inset ring-outline-variant", label: "text-primary", muted: "text-on-surface-variant", button: "bg-primary text-on-primary" },
  container: { card: "bg-secondary-container text-on-secondary-container", label: "text-on-secondary-container", muted: "text-on-secondary-container/85", button: "bg-on-secondary-container text-secondary-container" },
  inverse: { card: "bg-inverse-surface text-inverse-on-surface", label: "text-inverse-primary", muted: "text-inverse-on-surface/80", button: "bg-inverse-primary text-inverse-surface" },
};

function BenefitImage({ image }: { image: SectionImage }) {
  return (
    <div className="mt-6 overflow-hidden rounded-md">
      <Image
        src={image.src}
        alt={image.alt}
        width={typeof image.src === "string" ? (image.width ?? 1200) : undefined}
        height={typeof image.src === "string" ? (image.height ?? 800) : undefined}
        sizes="(min-width: 1200px) 560px, 90vw"
        className="h-[220px] w-full object-cover object-top medium:h-[260px]"
      />
    </div>
  );
}

function BenefitCard({ item }: { item: BenefitItem }) {
  const tone = tones[item.tone ?? "surface"];
  const front = (
    <>
      <p className={cn("text-label-lg font-medium tracking-wide uppercase", tone.label)}>{item.label}</p>
      <h3 className="mt-3 text-headline-sm text-balance medium:text-headline-md">{item.title}</h3>
      <p className={cn("mt-3 max-w-[520px] text-body-lg text-pretty", tone.muted)}>{item.description}</p>
      <BenefitImage image={item.image} />
    </>
  );
  const back = item.more && (
    <>
      <p className={cn("text-label-lg font-medium tracking-wide uppercase", tone.label)}>{item.label}</p>
      <p className="mt-3 text-title-lg text-pretty">{item.more.text}</p>
      <BenefitImage image={item.more.image} />
    </>
  );
  return (
    <li className={cn("flex flex-col rounded-xl p-6 medium:p-8", tone.card)}>
      {back && !item.cta ? (
        <FlipPanel
          front={front}
          back={back}
          openLabel={`More about ${item.title}`}
          closeLabel="Show less"
          icon={<Icon icon={addIcon} size={24} className="transition-transform duration-(--duration-medium2) ease-(--ease-emphasized) group-data-[open]:rotate-45" />}
          buttonClassName={cn("group state-layer mt-6 inline-flex size-12 cursor-pointer items-center justify-center self-end rounded-[24px] transition-[border-radius] duration-(--duration-short4) active:rounded-[14px]", tone.button)}
        />
      ) : (
        <div className="flex flex-1 flex-col">
          {front}
          {item.cta && (
            <Link
              href={item.cta.href}
              className={cn("state-layer mt-6 inline-flex h-12 items-center gap-2 self-start rounded-[24px] px-6 text-label-lg font-medium transition-[border-radius] duration-(--duration-short4) active:rounded-[14px]", tone.button)}
            >
              {item.cta.label}
              <Icon icon={arrowForwardIcon} size={18} />
            </Link>
          )}
        </div>
      )}
    </li>
  );
}

export function BenefitWrapper({ title = "Why choose our AI", description, items = defaultBenefits, id }: { title?: string; description?: string; items?: BenefitItem[]; id?: string }) {
  const headingId = id ?? sectionId("benefits", title);
  return (
    <section aria-labelledby={headingId} className="py-16 medium:py-24">
      <Container>
        <SectionHeader id={headingId} title={title} description={description} align="center" className="mb-12" />
        <ul className="grid gap-4 large:grid-cols-2">
          {items.map((item) => (
            <BenefitCard key={item.title} item={item} />
          ))}
        </ul>
      </Container>
    </section>
  );
}
