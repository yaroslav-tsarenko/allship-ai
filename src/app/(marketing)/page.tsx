import { ClientReviews, FAQSection, TrustCompanies } from "@/components/sections";
import { StickyFunnelCta } from "@/components/marketing/funnel";
import { HomeCategories } from "@/components/pages/home/categories";
import { homeFaq } from "@/components/pages/home/content";
import { HomeHero } from "@/components/pages/home/hero";
import { HeroProof } from "@/components/pages/home/hero-proof";
import { HomeAi, HomeEscrow, HomeFinalCta, HomeMinis, HomeRoles, HomeStatement, HomeTour } from "@/components/pages/home/sections";
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
      <HomeTour />
      <HomeEscrow />
      <HomeStatement />
      <HomeAi />
      <HomeRoles />
      <HomeMinis />
      <ClientReviews placement="home" title="What shippers say" />
      <FAQSection items={homeFaq} tone="low" />
      <HomeFinalCta />
      <StickyFunnelCta href="#hero-quote" label="Get prices" note="Free to post. Pay only when you book." hideWhileVisible="home-hero" track="home_sticky_quote" />
    </>
  );
}
