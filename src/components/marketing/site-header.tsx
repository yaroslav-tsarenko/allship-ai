import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { arrowForwardIcon, brightnessAutoIcon, callIcon, closeIcon, darkModeIcon, keyboardArrowDownIcon, lightModeIcon, menuIcon } from "@/components/ui/icons.generated";
import { Logo } from "@/components/ui/logo";
import { authLinks, site } from "@/content/site";
import { DesktopNav } from "./desktop-nav";
import { MobileNav } from "./mobile-nav";
import { ThemeToggle } from "./theme-toggle";

const themeIcons = {
  system: <Icon icon={brightnessAutoIcon} size={24} />,
  light: <Icon icon={lightModeIcon} size={24} />,
  dark: <Icon icon={darkModeIcon} size={24} />,
};

const drawerIcons = {
  close: <Icon icon={closeIcon} size={24} />,
  chevron: <Icon icon={keyboardArrowDownIcon} size={24} />,
  arrow: <Icon icon={arrowForwardIcon} size={16} />,
  call: <Icon icon={callIcon} size={22} />,
};

export function SiteHeader({ minimal = false }: { minimal?: boolean }) {
  return (
    <header className="m3-elevate-on-scroll sticky top-0 z-40 border-b border-transparent bg-surface/95 supports-[backdrop-filter]:bg-surface/90">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-4 px-4 medium:px-8">
        <Logo height={26} />
        {!minimal && <DesktopNav />}
        <div className="ml-auto flex items-center gap-1">
          <a
            href={site.phone.href}
            className={`state-layer hidden h-10 items-center rounded-full px-3 text-label-lg font-medium text-on-surface-variant ${minimal ? "" : "xlarge:inline-flex"}`}
            data-track="click_to_call"
          >
            {site.phone.display}
          </a>
          <ThemeToggle icons={themeIcons} />
          {minimal ? (
            <Button asChild variant="tonal">
              <a href={site.phone.href} data-track="click_to_call">
                Call {site.phone.display}
              </a>
            </Button>
          ) : (
            <>
              <Button variant="text" asChild className="hidden medium:inline-flex">
                <Link href={authLinks.signIn.href}>{authLinks.signIn.label}</Link>
              </Button>
              <Button asChild className="hidden min-[360px]:inline-flex">
                <Link href={authLinks.signUp.href}>{authLinks.signUp.label}</Link>
              </Button>
              <MobileNav menuIcon={<Icon icon={menuIcon} size={24} />} icons={drawerIcons} />
            </>
          )}
        </div>
      </div>
    </header>
  );
}
