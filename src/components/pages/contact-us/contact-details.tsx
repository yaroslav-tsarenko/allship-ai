import Image from "next/image";
import { Icon } from "@/components/ui/icon";
import { callIcon, directionsIcon, locationOnIcon, mailIcon } from "@/components/ui/icons.generated";
import { site } from "@/content/site";
import { publicEnv } from "@/lib/public-env";

const fullAddress = `${site.address.street}, ${site.address.city}, ${site.address.region} ${site.address.postalCode}`;
const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${site.legalName}, ${fullAddress}`)}`;

function staticMapUrl(key: string) {
  const url = new URL("https://maps.googleapis.com/maps/api/staticmap");
  url.searchParams.set("center", fullAddress);
  url.searchParams.set("zoom", "15");
  url.searchParams.set("size", "640x400");
  url.searchParams.set("scale", "2");
  url.searchParams.set("markers", `color:0x0b57d0|${fullAddress}`);
  url.searchParams.set("key", key);
  return url.toString();
}

export function ContactDetails({ mailOnly = false }: { mailOnly?: boolean }) {
  const key = publicEnv.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
  const rows = [
    {
      icon: callIcon,
      label: "Phone",
      note: "Active loads and bookings",
      value: (
        <a href={site.phone.href} className="text-primary underline-offset-4 hover:underline">
          {site.phone.display}
        </a>
      ),
    },
    {
      icon: mailIcon,
      label: "Email",
      note: "Documents, screenshots, anything you want in writing",
      value: (
        <a href={`mailto:${site.email}`} className="break-all text-primary underline-offset-4 hover:underline">
          {site.email}
        </a>
      ),
    },
    {
      icon: locationOnIcon,
      label: "Mailing address",
      note: "Letters and legal notices",
      value: (
        <address className="not-italic text-on-surface">
          <span className="block">{site.legalName}</span>
          <span className="block">{site.address.street}</span>
          <span className="block">
            {site.address.city}, {site.address.region} {site.address.postalCode}
          </span>
        </address>
      ),
    },
  ];

  const shown = mailOnly ? rows.filter((r) => r.icon === locationOnIcon) : rows;
  return (
    <div>
      <h2 id="contact-details" className="text-title-lg text-on-surface">
        {mailOnly ? "By mail" : "Other ways to reach us"}
      </h2>
      <dl className="mt-4 border-t border-outline-variant">
        {shown.map((r) => (
          <div key={r.label} className="border-b border-outline-variant py-5">
            <dt className="flex items-center gap-3 text-label-lg font-medium text-on-surface-variant">
              <Icon icon={r.icon} className="shrink-0 text-primary" />
              {r.label}
            </dt>
            <dd className="mt-1 pl-9 text-body-lg">{r.value}</dd>
            <dd className="mt-1 pl-9 text-body-md text-pretty text-on-surface-variant">{r.note}</dd>
          </div>
        ))}
      </dl>
      <figure className="mt-8">
        {key && (
          <a href={mapsLink} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-md border border-outline-variant">
            <Image src={staticMapUrl(key)} alt={`Map showing ${fullAddress}`} width={640} height={400} unoptimized className="block h-auto w-full" />
          </a>
        )}
        <figcaption className={key ? "mt-3" : ""}>
          <a href={mapsLink} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center gap-2 rounded-xs text-title-sm font-medium text-primary underline-offset-4 hover:underline">
            <Icon icon={directionsIcon} size={20} />
            Open in Google Maps
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        </figcaption>
      </figure>
    </div>
  );
}
