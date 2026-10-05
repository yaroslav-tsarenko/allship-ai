import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ConsentHost } from "./consent-host";

export { ConsentSettingsLink } from "./consent-host";

export function CookieBanner() {
  return (
    <ConsentHost>
      <p className="text-title-md text-on-surface">Cookies on AllShip AI</p>
      <p className="mt-1 text-body-md text-on-surface-variant">
        We use essential cookies to keep you signed in and secure. With your OK we also use analytics and advertising cookies to measure our ads and improve the site.{" "}
        <Link href="/cookie-policy" className="font-medium text-primary hover:underline">
          Cookie policy
        </Link>
      </p>
      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <Button variant="text" data-consent="manage">
          Manage
        </Button>
        <Button variant="outlined" data-consent="reject">
          Reject non-essential
        </Button>
        <Button data-consent="accept">Accept all</Button>
      </div>
    </ConsentHost>
  );
}
