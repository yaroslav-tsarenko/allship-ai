import { NextTimeline, TrustStrip } from "@/components/marketing/funnel";
import { Container } from "@/components/marketing/section";
import { categoryBySlug } from "@/content/categories";
import { QuoteFlow } from "@/features/quote/quote-flow";
import { buildMetadata } from "@/lib/seo";
import { enter } from "@/components/motion/enter";

export const metadata = buildMetadata({
  title: "Get a shipping quote from verified carriers",
  description:
    "Tell us what you're moving, from where to where. FMCSA-verified carriers bid on your load and you pay only after you pick one. Free, no obligation.",
  path: "/quote",
});

type Search = { from?: string; to?: string; category?: string; src?: string };

const clean = (v: string | undefined, max = 120) => (v ? v.slice(0, max) : "");

export default async function QuotePage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const category = sp.category && categoryBySlug(sp.category) ? sp.category : "";
  return (
    <>
      <div className="medium:py-14 py-10" {...enter(0)}>
        <Container>
          <QuoteFlow
            initial={{ category, from: clean(sp.from), to: clean(sp.to) }}
            source={clean(sp.src, 60) || "quote-page"}
          />
          <TrustStrip className="mt-14" reviews={false} />
        </Container>
      </div>
      <NextTimeline tone="low" lead="Free and no obligation. Nothing is charged until you accept a bid." />
    </>
  );
}
