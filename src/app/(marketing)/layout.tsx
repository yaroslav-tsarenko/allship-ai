import { AttributionCapture } from "@/components/marketing/attribution-capture";
import { CookieBanner } from "@/components/marketing/consent";
import { MotionRoot } from "@/components/motion/motion-root";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { JsonLd, jsonLd } from "@/lib/seo";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={[jsonLd.organization(), jsonLd.website()]} />
      <a href="#main" className="sr-only z-50 rounded-full bg-primary px-4 py-2 text-on-primary focus:not-sr-only focus:fixed focus:top-2 focus:left-2">
        Skip to content
      </a>
      <SiteHeader />
      <main id="main" className="marketing-main">
        {children}
      </main>
      <SiteFooter />
      <CookieBanner />
      <AttributionCapture />
      <MotionRoot />
    </>
  );
}
