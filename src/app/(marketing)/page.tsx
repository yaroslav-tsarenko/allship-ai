import { ClientReviews, FAQSection, TrustCompanies } from "@/components/sections";
import { StickyFunnelCta } from "@/components/marketing/funnel";
import { HomeCategories } from "@/components/pages/home/categories";
import { homeFaq } from "@/components/pages/home/content";
import { HomeHero } from "@/components/pages/home/hero";
import { HeroProof } from "@/components/pages/home/hero-proof";
import { HomeAbout } from "@/components/pages/home/about";
import { HomeCompare } from "@/components/pages/home/compare";
import { HomeFlow } from "@/components/pages/home/flow";
import { HomeMoney } from "@/components/pages/home/money";
import { HomeProblems } from "@/components/pages/home/problems";
import { HomeAi, HomeFinalCta, HomeMinis, HomeRoles, HomeStatement } from "@/components/pages/home/sections";
import { HomeServices } from "@/components/pages/home/services";
import { buildMetadata } from "@/lib/seo";
import { getReviewSummary } from "@/server/showcase/queries";

export const revalidate = 300;

export const metadata = buildMetadata({
  title: "AllShip AI · Ship Anything with Verified Carriers and Escrow",
  description:
    "Post a move, vehicle, freight or heavy equipment load for free. FMCSA-verified carriers bid, you choose, and your payment stays in escrow until delivery.",
  path: "/",
  absoluteTitle: true,
});

export default async function HomePage() {
  const summary = await getReviewSummary();
  return (
    <>
      <HomeHero proof={summary.count >= 3 && summary.average ? <HeroProof summary={summary} /> : undefined} />
      <HomeCategories />
      <TrustCompanies />
      <HomeAbout />
      <HomeProblems />
      <HomeServices />
      <HomeFlow />
      <HomeStatement />
      <HomeMoney />
      <HomeCompare />
      <HomeRoles />
      <HomeAi />
      <HomeMinis />
      <ClientReviews placement="home" title="What shippers say" />
      <FAQSection items={homeFaq} tone="low" title="Questions people ask before they book" description="About the company, carriers, payments, disputes and the AI assistant." />
      <HomeFinalCta />
      <StickyFunnelCta href="#hero-quote" label="Get prices" note="Free to post. Pay only when you book." hideWhileVisible="home-hero" track="home_sticky_quote" />
    </>
  );
}
