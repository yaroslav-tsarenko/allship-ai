import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { chevronRightIcon } from "@/components/ui/icons.generated";

const destinations = [
  { href: "/app", label: "Dashboard", hint: "Your loads, trips and what needs attention" },
  { href: "/app/loads", label: "Loads", hint: "Everything you've posted or are hauling" },
  { href: "/app/messages", label: "Messages", hint: "Conversations with shippers and carriers" },
  { href: "/app/notifications", label: "Notifications", hint: "Bids, payments and status changes" },
  { href: "/app/settings", label: "Settings", hint: "Profile, security and your data" },
];

export default function AppNotFound() {
  return (
    <section aria-labelledby="nf-title" className="mx-auto flex w-full max-w-[640px] flex-col gap-5 py-12">
      <p className="font-mono text-label-lg tracking-wide text-on-surface-variant">404 · not found</p>
      <h1 id="nf-title" className="text-headline-lg">
        That load, trip or page isn&apos;t here
      </h1>
      <p className="text-body-lg text-on-surface-variant">
        It may have been cancelled, moved to another account, or the link is incomplete. If someone shared it with you, ask them to resend it from their dashboard.
      </p>
      <ul className="mt-2 divide-y divide-outline-variant border-y border-outline-variant">
        {destinations.map((d) => (
          <li key={d.href}>
            <Link href={d.href} className="state-layer flex items-center gap-4 px-2 py-4">
              <span className="flex-1">
                <span className="block text-body-lg text-on-surface">{d.label}</span>
                <span className="block text-body-md text-on-surface-variant">{d.hint}</span>
              </span>
              <Icon icon={chevronRightIcon} className="text-on-surface-variant" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
