import Link from "next/link";
import { AttributionCapture } from "@/components/marketing/attribution-capture";
import { CookieBanner } from "@/components/marketing/consent";
import { MotionRoot } from "@/components/motion/motion-root";
import { SiteHeader } from "@/components/marketing/site-header";
import { legalNav, site } from "@/content/site";
import { JsonLd, jsonLd } from "@/lib/seo";

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={jsonLd.organization()} />
      <a
        href="#main"
        className="bg-primary text-on-primary sr-only z-50 rounded-full px-4 py-2 focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Skip to content
      </a>
      <SiteHeader minimal />
      <main id="main">{children}</main>
      <footer className="border-outline-variant bg-surface-container-low expanded:pb-0 border-t pb-24">
        <div className="medium:px-8 large:flex-row large:items-center large:justify-between mx-auto flex max-w-[1280px] flex-col gap-4 px-4 py-8">
          <p className="text-body-sm text-on-surface-variant">
            © {new Date().getFullYear()} {site.legalName} · {site.address.street}, {site.address.city},{" "}
            {site.address.region} {site.address.postalCode} ·{" "}
            <a
              href={site.phone.href}
              className="hover:text-on-surface hover:underline"
              data-track="click_to_call"
            >
              {site.phone.display}
            </a>
          </p>
          <ul className="text-body-sm flex flex-wrap gap-x-5 gap-y-2">
            {legalNav.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-on-surface-variant hover:text-on-surface hover:underline"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </footer>
      <CookieBanner />
      <AttributionCapture />
      <MotionRoot />
    </>
  );
}
