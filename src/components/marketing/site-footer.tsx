import { Logo } from "@/components/ui/logo";
import { footerNav, legalNav, site } from "@/content/site";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { callIcon, checkIcon, locationOnIcon, mailIcon } from "@/components/ui/icons.generated";
import { NewsletterSlot } from "./newsletter-slot";
import { ConsentSettingsLink } from "./consent";
import { LinkScope } from "./link-scope";

const linkClass = "text-body-md text-on-surface-variant hover:text-on-surface hover:underline underline-offset-4";

export function SiteFooter() {
  const address = `${site.address.street}, ${site.address.city}, ${site.address.region} ${site.address.postalCode}`;
  return (
    <footer className="marketing-footer border-outline-variant bg-surface-container-low border-t">
      <LinkScope>
        <div className="medium:px-8 mx-auto max-w-[1440px] px-4 pt-14 pb-8">
          <div className="large:grid-cols-[minmax(0,3fr)_minmax(0,1.25fr)] grid gap-12">
            <nav aria-label="Footer" className="medium:grid-cols-4 grid grid-cols-2 gap-x-6 gap-y-10">
              {footerNav.map((group) => (
                <div key={group.label}>
                  <h2 className="text-title-sm text-on-surface mb-4">{group.label}</h2>
                  <ul className="flex flex-col gap-1">
                    {group.links.map((link) => (
                      <li key={link.href}>
                        <a href={link.href} className={`${linkClass} inline-flex min-h-6 items-center`}>
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
            <div className="large:border-l large:border-outline-variant large:pl-10 flex flex-col gap-6">
              <Logo height={26} />
              <div>
                <h2 className="text-title-sm text-on-surface mb-3">Contact Us</h2>
                <address className="text-body-md text-on-surface-variant flex flex-col gap-2 not-italic">
                  <span className="text-on-surface font-medium">{site.legalName}</span>
                  <a href={site.phone.href} className={`${linkClass} inline-flex items-center gap-2`} data-track="click_to_call">
                    <Icon icon={callIcon} size={18} />
                    {site.phone.display}
                  </a>
                  <a href={`mailto:${site.email}`} className={`${linkClass} inline-flex items-center gap-2`}>
                    <Icon icon={mailIcon} size={18} />
                    {site.email}
                  </a>
                  <span className="inline-flex items-start gap-2">
                    <Icon icon={locationOnIcon} size={18} className="mt-0.5 shrink-0" />
                    {address}
                  </span>
                </address>
              </div>
              <NewsletterSlot doneIcon={<Icon icon={checkIcon} size={16} />}>
                <form className="flex flex-col gap-2">
                  <label htmlFor="newsletter-email" className="text-title-sm text-on-surface">
                    Subscribe to our newsletter
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="newsletter-email"
                      type="email"
                      required
                      placeholder="Enter your email"
                      autoComplete="email"
                      className="border-outline bg-surface text-body-md text-on-surface ease-standard hover:border-on-surface focus:border-primary h-10 min-w-0 flex-1 rounded-full border px-4 transition-[border-color,box-shadow] duration-(--duration-short4) outline-none focus:shadow-[inset_0_0_0_1px_var(--md-primary)]"
                    />
                    <Button type="submit" variant="tonal">
                      Subscribe
                    </Button>
                  </div>
                </form>
              </NewsletterSlot>
              <ul className="flex flex-wrap gap-2" aria-label="Follow us">
                {site.socials.map((s) => (
                  <li key={s.name}>
                    <a
                      href={s.href}
                      rel="noopener noreferrer"
                      target="_blank"
                      className="state-layer border-outline-variant text-label-lg text-on-surface-variant inline-flex h-8 items-center rounded-sm border px-3 font-medium"
                    >
                      {s.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-outline-variant large:flex-row large:items-center large:justify-between mt-12 flex flex-col gap-4 border-t pt-6">
            <p className="text-body-sm text-on-surface-variant">
              © {new Date().getFullYear()} {site.legalName}. All rights reserved. Payments are processed by Stripe.
            </p>
            <ul className="text-body-sm flex flex-wrap gap-x-5 gap-y-1">
              {legalNav.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="text-on-surface-variant hover:text-on-surface inline-flex min-h-6 items-center hover:underline">
                    {link.label}
                  </a>
                </li>
              ))}
              <li>
                <ConsentSettingsLink />
              </li>
            </ul>
          </div>
        </div>
      </LinkScope>
    </footer>
  );
}
