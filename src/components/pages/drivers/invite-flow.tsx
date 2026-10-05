import type { ReactNode } from "react";
import { Icon } from "@/components/ui/icon";
import { eastIcon, mailIcon, navigationIcon } from "@/components/ui/icons.generated";
import { StatusChip } from "@/components/ui/status-chip";
import { roleMeta } from "@/features/team/roles";
import { cn } from "@/lib/cn";

function Frame({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div aria-hidden="true" className={cn("overflow-hidden rounded-md border border-outline-variant bg-surface shadow-elevation-1", className)}>
      <div className="flex items-center gap-2 border-b border-outline-variant bg-surface-container-low px-4 py-2 font-mono text-label-md text-on-surface-variant">{label}</div>
      <div className="p-5">{children}</div>
    </div>
  );
}

const fakeButton = "inline-flex h-10 items-center justify-center gap-2 rounded-full px-5 text-label-lg font-medium";

const steps = [
  {
    title: "Your carrier invites you",
    body: "The owner or a dispatcher adds your email on their Team page. You get an email from AllShip AI with a link to accept.",
    ui: (
      <Frame label="Inbox">
        <p className="flex items-center gap-2 text-label-lg text-on-surface-variant">
          <Icon icon={mailIcon} size={18} />
          AllShip AI
        </p>
        <p className="mt-3 text-title-md text-on-surface">Rita M. invited you to join Lone Star Auto Haul</p>
        <p className="mt-1 text-body-md text-on-surface-variant">You&rsquo;ll see the trips they assign to you and update them from your phone.</p>
        <span className={cn(fakeButton, "mt-4 bg-primary text-on-primary")}>Accept invitation</span>
      </Frame>
    ),
  },
  {
    title: "You set up your sign-in",
    body: "Create your account with the invited email, or sign in if you already have one. Google, a one-time email code and passkeys all work.",
    ui: (
      <Frame label="allship.ai/invite">
        <p className="text-title-lg text-on-surface">Join Lone Star Auto Haul</p>
        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-5 gap-y-1 border-t border-outline-variant pt-3 text-body-md">
          <dt className="text-on-surface-variant">Role</dt>
          <dd className="text-on-surface">{roleMeta.driver.label}</dd>
          <dt className="text-on-surface-variant">Access</dt>
          <dd className="text-on-surface">{roleMeta.driver.blurb}</dd>
        </dl>
        <span className={cn(fakeButton, "mt-4 w-full bg-secondary-container text-on-secondary-container")}>Sign in to accept</span>
      </Frame>
    ),
  },
  {
    title: "Your trips are waiting",
    body: "Booked loads your carrier assigns to you show up on the Trips page, with the pickup, delivery, time window and load details.",
    ui: (
      <Frame label="allship.ai/app/trips">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-label-md text-on-surface-variant">AS-7K2P9Q</p>
            <p className="mt-1 text-title-md text-on-surface">2021 Toyota RAV4</p>
            <p className="mt-1 flex items-center gap-1 text-body-md text-on-surface-variant">
              Dallas, TX
              <Icon icon={eastIcon} size={16} />
              Denver, CO
            </p>
          </div>
          <StatusChip tone="success" size="sm" dot>
            Driver assigned
          </StatusChip>
        </div>
        <span className={cn(fakeButton, "mt-4 w-full bg-primary text-on-primary")}>
          <Icon icon={navigationIcon} size={18} />
          Start trip
        </span>
      </Frame>
    ),
  },
];

export function InviteFlow() {
  return (
    <ol className="grid gap-12 large:grid-cols-3 large:gap-8">
      {steps.map((s, i) => (
        <li key={s.title} className="flex flex-col gap-5">
          <div className="flex items-baseline gap-3 border-t-2 border-primary pt-4">
            <span className="font-mono text-title-md text-primary tabular-nums">{String(i + 1).padStart(2, "0")}</span>
            <h3 className="text-title-lg text-on-surface">{s.title}</h3>
          </div>
          <p className="text-body-lg text-pretty text-on-surface-variant">{s.body}</p>
          <div className="mt-auto">{s.ui}</div>
        </li>
      ))}
    </ol>
  );
}
